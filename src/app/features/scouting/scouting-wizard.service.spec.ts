import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthSession } from '../../core/auth/auth-session.service';
import { FieldDto } from '../../core/api/models';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { PrivacyService } from '../settings/privacy.service';
import { GeolocationService } from './geolocation.service';
import { PhotoCaptureService } from './photo-capture.service';
import { ScoutingContextService } from './scouting-context.service';
import { ScoutingSubmitService } from './scouting-submit.service';
import { SCOUTING_CONFIG } from './scouting.config';
import { SCOUTING_STEPS } from './scouting-steps';
import { ScoutingWizard } from './scouting-wizard.service';
import { CapturedPhoto } from './scouting.types';
import { VoiceRecorderService } from './voice-recorder.service';

const field = { id: 'f1', name: 'North', cropId: 'wheat' } as FieldDto;
const photo = (clientId: string): CapturedPhoto => ({
  clientId, blob: new Blob(['x']), previewUrl: `u-${clientId}`, issues: [],
  report: { sharpness: 1, exposure: 1, plantCoverage: 1, objectSize: 1, passed: true },
});

describe('ScoutingWizard', () => {
  const context = {
    loadFields: vi.fn(), loadCrops: vi.fn(), suggestFieldId: vi.fn(), rememberedCropId: vi.fn(), loadBbchStages: vi.fn(),
  };
  const geolocation = { locate: vi.fn() };
  const photoCapture = { capture: vi.fn(), release: vi.fn() };
  const submitter = { submit: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const role = signal<string | null>('scout');
  const voiceRecorder = { recording: signal(false), isSupported: () => false, stop: vi.fn() };
  const online = signal(true);
  const geoCollectionEnabled = signal(true);
  const privacy = { load: vi.fn(), geoCollectionEnabled };
  let wizard: ScoutingWizard;

  beforeEach(() => {
    vi.clearAllMocks();
    role.set('scout');
    online.set(true);
    geoCollectionEnabled.set(true);
    privacy.load.mockResolvedValue(undefined);
    context.loadFields.mockResolvedValue([field]);
    context.loadCrops.mockResolvedValue([]);
    context.rememberedCropId.mockResolvedValue('wheat');
    context.loadBbchStages.mockResolvedValue([]);
    geolocation.locate.mockResolvedValue({ lat: 1, lng: 2, accuracyM: 3 });
    context.suggestFieldId.mockResolvedValue('f1');
    submitter.submit.mockResolvedValue('obs-1');
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        ScoutingWizard,
        { provide: ScoutingContextService, useValue: context },
        { provide: GeolocationService, useValue: geolocation },
        { provide: PhotoCaptureService, useValue: photoCapture },
        { provide: ScoutingSubmitService, useValue: submitter },
        { provide: VoiceRecorderService, useValue: voiceRecorder },
        { provide: PrivacyService, useValue: privacy },
        { provide: ConnectivityService, useValue: { online } },
        { provide: AuthSession, useValue: { role } },
        { provide: Router, useValue: router },
      ],
    });
    wizard = TestBed.inject(ScoutingWizard);
  });

  it('suggests the field by GPS and prefills the remembered crop', async () => {
    await wizard.start();
    expect(wizard.fieldId()).toBe('f1');
    expect(wizard.fieldLinkMethod()).toBe('gps');
    expect(wizard.cropId()).toBe('wheat');
  });

  it('links a hand-picked field as manual and none when cleared', async () => {
    await wizard.start();
    wizard.suggestedFieldId.set(undefined);
    expect(wizard.fieldLinkMethod()).toBe('manual');
    await wizard.selectField(undefined);
    expect(wizard.fieldLinkMethod()).toBe('none');
  });

  it('blocks the object step without an object type and the photo step without a photo', () => {
    wizard.step.set(1);
    expect(wizard.canAdvance()).toBe(false);
    wizard.organ.set('leaf');
    expect(wizard.canAdvance()).toBe(true);
    wizard.step.set(2);
    expect(wizard.canAdvance()).toBe(false);
  });

  it('accepts at most the configured number of photos', async () => {
    photoCapture.capture.mockImplementation(async () => photo(crypto.randomUUID()));
    for (let i = 0; i < 5; i++) await wizard.addPhoto(new Blob(['x']));
    expect(wizard.photos()).toHaveLength(3);
    expect(wizard.canAddPhoto()).toBe(false);
  });

  it('replaces a photo on retake and releases the old preview', async () => {
    photoCapture.capture.mockResolvedValueOnce(photo('a')).mockResolvedValueOnce(photo('b'));
    await wizard.addPhoto(new Blob(['x']));
    await wizard.retakePhoto('a', new Blob(['y']));
    expect(wizard.photos().map((p) => p.clientId)).toEqual(['b']);
    expect(photoCapture.release).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'a' }));
  });

  it('navigates to the diagnosis page after submit', async () => {
    wizard.organ.set('leaf');
    await wizard.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/diagnosis', 'obs-1']);
  });

  it('stays off the diagnosis page after an offline submit because the observation is only queued', async () => {
    online.set(false);
    wizard.organ.set('leaf');
    await wizard.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('does not take a GPS fix when the account turned geolocation off', async () => {
    geoCollectionEnabled.set(false);
    await wizard.start();
    expect(geolocation.locate).not.toHaveBeenCalled();
    expect(wizard.fix()).toBeNull();
  });

  it('still starts when the privacy setting cannot be loaded offline', async () => {
    privacy.load.mockRejectedValue(new Error('offline'));
    await wizard.start();
    expect(geolocation.locate).toHaveBeenCalled();
  });

  it('does not exceed the photo cap when captures overlap', async () => {
    photoCapture.capture.mockImplementation(async () => photo(crypto.randomUUID()));
    await Promise.all(Array.from({ length: 5 }, () => wizard.addPhoto(new Blob(['x']))));
    expect(wizard.photos()).toHaveLength(3);
  });

  it('routes the next camera file to the retake target or adds it', async () => {
    photoCapture.capture.mockResolvedValueOnce(photo('a')).mockResolvedValueOnce(photo('b')).mockResolvedValueOnce(photo('c'));
    await wizard.receivePhoto(new Blob(['x']));
    wizard.beginPhotoCapture('a');
    await wizard.receivePhoto(new Blob(['y']));
    expect(wizard.photos().map((p) => p.clientId)).toEqual(['b']);
    wizard.beginPhotoCapture();
    await wizard.receivePhoto(new Blob(['z']));
    expect(wizard.photos().map((p) => p.clientId)).toEqual(['b', 'c']);
  });

  it('exposes one step name per configured step', () => {
    expect(SCOUTING_STEPS).toHaveLength(SCOUTING_CONFIG.stepCount);
    wizard.step.set(SCOUTING_STEPS.indexOf('photos'));
    expect(wizard.currentStep()).toBe('photos');
  });

  it('releases photo previews and stops the recorder when the wizard is destroyed', async () => {
    photoCapture.capture.mockResolvedValueOnce(photo('a'));
    await wizard.addPhoto(new Blob(['x']));
    wizard.ngOnDestroy();
    expect(photoCapture.release).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'a' }));
    expect(voiceRecorder.stop).toHaveBeenCalled();
  });

  it('skips the diagnosis step for the mechanic quick capture', async () => {
    role.set('mechanic');
    wizard.organ.set('pest');
    await wizard.submit();
    expect(submitter.submit).toHaveBeenCalledWith(expect.objectContaining({ isQuickCapture: true }));
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('reports a failed submit and stays on the page', async () => {
    submitter.submit.mockRejectedValue(new Error('disk full'));
    wizard.organ.set('leaf');
    await wizard.submit();
    expect(wizard.submitFailed()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
