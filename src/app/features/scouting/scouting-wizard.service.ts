import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AuthSession } from '../../core/auth/auth-session.service';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { BbchStageDto, CropDto, FieldDto, FieldLinkMethod } from '../../core/api/models';
import { PrivacyService } from '../settings/privacy.service';
import { GeolocationService } from './geolocation.service';
import { PhotoCaptureService } from './photo-capture.service';
import { ScoutingContextService } from './scouting-context.service';
import { ScoutingSubmitService } from './scouting-submit.service';
import { SCOUTING_CONFIG } from './scouting.config';
import { SCOUTING_STEPS, ScoutingStep } from './scouting-steps';
import { CapturedPhoto, GeoFix, ScoutingOrgan, VoiceNote } from './scouting.types';
import { VoiceRecorderService } from './voice-recorder.service';

const OBSERVATION_QUERY_PARAM = 'observationId';

export interface SelectOption<T> {
  value: T;
  label: string;
}

/** State and flow of the scouting wizard; provided per wizard visit by ScoutingComponent. */
@Injectable()
export class ScoutingWizard implements OnDestroy {
  private readonly context = inject(ScoutingContextService);
  private readonly geolocation = inject(GeolocationService);
  private readonly photoCapture = inject(PhotoCaptureService);
  private readonly submitter = inject(ScoutingSubmitService);
  private readonly voiceRecorder = inject(VoiceRecorderService);
  private readonly privacy = inject(PrivacyService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly auth = inject(AuthSession);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly lang = toSignal(this.translate.onLangChange.pipe(map((event) => event.lang)), {
    initialValue: this.translate.currentLang,
  });

  readonly step = signal(0);
  readonly currentStep = computed<ScoutingStep>(() => SCOUTING_STEPS[this.step()]);
  readonly fields = signal<FieldDto[]>([]);
  readonly fieldId = signal<string | undefined>(undefined);
  readonly suggestedFieldId = signal<string | undefined>(undefined);
  readonly fix = signal<GeoFix | null>(null);
  readonly crops = signal<CropDto[]>([]);
  readonly cropId = signal<string | undefined>(undefined);
  readonly bbchStages = signal<BbchStageDto[]>([]);
  readonly bbchStage = signal<number | undefined>(undefined);
  readonly organ = signal<ScoutingOrgan | null>(null);
  readonly photos = signal<CapturedPhoto[]>([]);
  readonly scaleMarkerUsed = signal(false);
  readonly textNote = signal('');
  readonly voiceNote = signal<VoiceNote | null>(null);
  readonly voiceError = signal(false);
  readonly submitting = signal(false);
  readonly submitFailed = signal(false);
  /** Set when the scout came from an unsure diagnosis to add photos to that observation (FR-8). */
  readonly extendedObservationId = signal<string | undefined>(undefined);
  private readonly storedPhotoCount = signal(0);
  private readonly photoLimit = computed(() => SCOUTING_CONFIG.maxPhotos - this.storedPhotoCount());

  readonly recording = this.voiceRecorder.recording;
  readonly voiceSupported = this.voiceRecorder.isSupported();
  readonly isQuickCapture = computed(() => this.auth.role() === 'mechanic');
  readonly isLastStep = computed(() => this.step() === SCOUTING_CONFIG.stepCount - 1);
  private readonly stepGuards: Record<ScoutingStep, () => boolean> = {
    field: () => true,
    object: () => this.organ() !== null,
    photos: () => this.photos().length >= SCOUTING_CONFIG.minPhotos,
    note: () => true,
  };
  readonly canAdvance = computed(() => this.stepGuards[this.currentStep()]());
  readonly canAddPhoto = computed(() => this.photos().length < this.photoLimit());
  readonly fieldLinkMethod = computed<FieldLinkMethod>(() => {
    const id = this.fieldId();
    if (!id) return 'none';
    return id === this.suggestedFieldId() ? 'gps' : 'manual';
  });
  readonly fieldOptions = computed(() => this.fields().map((field) => ({ value: field.id, label: field.name })));
  readonly cropOptions = computed(() =>
    this.crops().map((crop) => ({ value: crop.id, label: this.lang() === 'en' ? crop.nameEn : crop.nameUk })),
  );
  readonly bbchOptions = computed(() =>
    this.bbchStages().map((stage) => ({
      value: stage.bbchFrom,
      label: `${stage.bbchFrom}-${stage.bbchTo} ${this.lang() === 'en' ? stage.nameEn : stage.nameUk}`,
    })),
  );

  private photoSlot: string | null = null;
  private capturing = 0;

  async start(): Promise<void> {
    const extended = new URLSearchParams(window.location.search).get(OBSERVATION_QUERY_PARAM);
    if (extended) return this.startExtension(extended);
    const [fields, crops, fix] = await Promise.all([
      this.context.loadFields(), this.context.loadCrops(), this.locateIfAllowed(),
    ]);
    this.fields.set(fields);
    this.crops.set(crops);
    this.fix.set(fix);
    const suggested = fix ? await this.context.suggestFieldId(fix, fields) : undefined;
    this.suggestedFieldId.set(suggested);
    await this.selectField(suggested);
  }

  private async startExtension(observationId: string): Promise<void> {
    this.storedPhotoCount.set(await this.context.loadPhotoCount(observationId).catch(() => 0));
    this.extendedObservationId.set(observationId);
    this.step.set(SCOUTING_STEPS.indexOf('photos'));
  }

  async selectField(fieldId: string | undefined): Promise<void> {
    this.fieldId.set(fieldId);
    const field = this.fields().find((candidate) => candidate.id === fieldId);
    if (field) await this.selectCrop(await this.context.rememberedCropId(field));
  }

  async selectCrop(cropId: string | undefined): Promise<void> {
    this.cropId.set(cropId);
    this.bbchStage.set(undefined);
    this.bbchStages.set(cropId ? await this.context.loadBbchStages(cropId) : []);
  }

  /** The next file from the camera input replaces this photo, or is added when no id is given. */
  beginPhotoCapture(retakeId: string | null = null): void {
    this.photoSlot = retakeId;
  }

  receivePhoto(file: Blob): Promise<void> {
    return this.photoSlot ? this.retakePhoto(this.photoSlot, file) : this.addPhoto(file);
  }

  async addPhoto(file: Blob): Promise<void> {
    if (this.photos().length + this.capturing >= this.photoLimit()) return;
    this.capturing++;
    try {
      const photo = await this.photoCapture.capture(file);
      this.photos.update((photos) => [...photos, photo]);
    } finally {
      this.capturing--;
    }
  }

  async retakePhoto(clientId: string, file: Blob): Promise<void> {
    const photo = await this.photoCapture.capture(file);
    this.releaseById(clientId);
    this.photos.update((photos) => photos.map((existing) => (existing.clientId === clientId ? photo : existing)));
  }

  removePhoto(clientId: string): void {
    this.releaseById(clientId);
    this.photos.update((photos) => photos.filter((photo) => photo.clientId !== clientId));
  }

  async recordVoice(): Promise<void> {
    this.voiceError.set(false);
    try {
      await this.voiceRecorder.start((note) => this.voiceNote.set(note));
    } catch {
      this.voiceError.set(true);
    }
  }

  stopVoice(): void {
    this.voiceRecorder.stop();
  }

  next(): void {
    if (this.canAdvance()) this.step.update((step) => Math.min(step + 1, SCOUTING_CONFIG.stepCount - 1));
  }

  back(): void {
    this.step.update((step) => Math.max(step - 1, 0));
  }

  async submit(): Promise<void> {
    const organ = this.organ();
    const extended = this.extendedObservationId();
    if ((!organ && !extended) || this.submitting()) return;
    this.submitting.set(true);
    this.submitFailed.set(false);
    try {
      if (extended) {
        await this.submitter.addPhotos(extended, this.storedPhotoCount(), this.photos());
        await this.router.navigate(['/diagnosis', extended]);
        return;
      }
      const observationId = await this.submitter.submit({
        fieldId: this.fieldId(),
        fieldLinkMethod: this.fieldLinkMethod(),
        cropId: this.cropId(),
        bbchStage: this.bbchStage(),
        organ: organ!,
        photos: this.photos(),
        scaleMarkerUsed: this.scaleMarkerUsed(),
        textNote: this.textNote(),
        voiceNote: this.voiceNote(),
        fix: this.fix(),
        isQuickCapture: this.isQuickCapture(),
      });
      await this.router.navigate(this.opensDiagnosis() ? ['/diagnosis', observationId] : ['/home']);
    } catch {
      this.submitFailed.set(true);
    } finally {
      this.submitting.set(false);
    }
  }

  /** Offline the observation is only in the outbox, so there is no diagnosis to open yet. */
  private opensDiagnosis(): boolean {
    return !this.isQuickCapture() && this.connectivity.online();
  }

  private async locateIfAllowed(): Promise<GeoFix | null> {
    await this.privacy.load().catch(() => undefined);
    return this.privacy.geoCollectionEnabled() ? this.geolocation.locate() : null;
  }

  ngOnDestroy(): void {
    this.voiceRecorder.stop();
    this.photos().forEach((photo) => this.photoCapture.release(photo));
  }

  private releaseById(clientId: string): void {
    const photo = this.photos().find((candidate) => candidate.clientId === clientId);
    if (photo) this.photoCapture.release(photo);
  }
}
