import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CatalogDiagnosisDto, CropDto, DiagnosisResultDto, ObservationDto } from '../../core/api/models';
import { RefinementNotifier } from '../../core/offline/refinement-notifier';
import { ClarifyingQuestionsComponent } from './clarifying-questions.component';
import { currentLang } from './current-lang';
import { DiagnosisConfirmComponent } from './diagnosis-confirm.component';
import { isCorrection, isKnown, photoFor, pick, referencesFor, sharedEvidence, uncertainReason } from './diagnosis-view';
import { DIAGNOSIS_CONFIG } from './diagnosis.config';
import { DiagnosisService } from './diagnosis.service';
import { HypothesisCardComponent } from './hypothesis-card.component';
import { PhotoRegionOverlayComponent } from './photo-region-overlay.component';

interface HierarchyStep { key?: string; text?: string }

@Component({
  selector: 'app-diagnosis',
  imports: [
    DecimalPipe, RouterLink, TranslatePipe, ButtonModule, MessageModule, ProgressSpinnerModule, ClarifyingQuestionsComponent,
    DiagnosisConfirmComponent, HypothesisCardComponent, PhotoRegionOverlayComponent,
  ],
  template: `
    <section class="scout-page diag">
      <h1>{{ 'diagnosis.title' | translate }}</h1>

      @if (loading()) {
        <div class="diag__loading" role="status" aria-live="polite" data-testid="loading">
          <p-progress-spinner [ariaLabel]="'diagnosis.loading' | translate" />
          <p>{{ 'diagnosis.loading' | translate }}</p>
        </div>
      } @else if (failed() || !diagnosis()) {
        @if (failed()) {
          <p-message severity="error" data-testid="failed">{{ 'diagnosis.loadFailed' | translate }}</p-message>
        } @else {
          <p-message severity="info" data-testid="pending">{{ 'diagnosis.pendingServer' | translate }}</p-message>
        }
        <p-button class="diag__retry" [label]="'diagnosis.retry' | translate" [icon]="retryIcon" severity="secondary"
          (onClick)="retry()" />
      } @else {
        @if (refinedNotice()) {
          <p-message severity="success" data-testid="refined">{{ 'diagnosis.refinedArrived' | translate }}</p-message>
        }
        @if (uncertain(); as reason) {
          <p-message severity="warn" data-testid="uncertain">
            <div class="diag__uncertain">
              <strong>{{ 'diagnosis.uncertain.title' | translate }}</strong>
              <p data-testid="uncertain-reason">{{ 'diagnosis.uncertain.reason.' + reason | translate }}</p>
              <p>{{ 'diagnosis.uncertain.nextTitle' | translate }}</p>
              <ol>
                <li>{{ 'diagnosis.uncertain.stepPhotos' | translate }}</li>
                <li>{{ 'diagnosis.uncertain.stepCatalogue' | translate }}</li>
                <li>{{ 'diagnosis.uncertain.stepExpert' | translate }}</li>
              </ol>
              <a class="diag__action" [routerLink]="scoutingRoute" [queryParams]="{ observationId: observation()?.id }">
                <i [class]="addPhotosIcon" aria-hidden="true"></i>{{ 'diagnosis.uncertain.addPhotos' | translate }}
              </a>
            </div>
          </p-message>
        }

        @if (hierarchy().length) {
          <ol class="diag__path" [attr.aria-label]="'diagnosis.hierarchyLabel' | translate" data-testid="hierarchy">
            @for (step of hierarchy(); track $index) {
              <li>{{ step.key ? (step.key | translate) : step.text }}</li>
            }
          </ol>
        }

        @if (!uncertain() && photo(); as p) {
          <figure class="diag__photo">
            <app-photo-region-overlay [photoUrl]="p.url" [region]="selected()?.region"
              [alt]="(selected()?.region ? 'diagnosis.photoAlt' : 'diagnosis.photoAltPlain') | translate" />
            @if (selected()?.region) {
              <figcaption class="diag__hint" data-testid="region-hint">{{ 'diagnosis.regionHint' | translate }}</figcaption>
            }
          </figure>
        }

        @if (!uncertain() && diagnosis()!.hypotheses.length) {
          <h2>{{ 'diagnosis.topHypotheses' | translate }}</h2>
          <p class="diag__hint" data-testid="confidence-hint">{{ 'diagnosis.confidenceHint' | translate }}</p>
          @if (evidence(); as text) {
            <p class="diag__evidence" data-testid="shared-evidence">{{ text }}</p>
          }
          @for (h of diagnosis()!.hypotheses; track h.diagnosisCode) {
            <app-hypothesis-card [hypothesis]="h" [lang]="lang()" [selected]="h.rank === selectedRank()" [showEvidence]="!evidence()"
              [references]="referencesOf(h.diagnosisCode)" [comparePhotoUrl]="photo()?.url" (picked)="selectedRank.set($event)" />
          }
        }

        @if (diagnosis()!.pest; as pest) {
          <section class="diag__pest" data-testid="pest">
            <h2>{{ 'diagnosis.pest.title' | translate }}</h2>
            <dl>
              @if (pest.species) { <dt>{{ 'diagnosis.pest.species' | translate }}</dt><dd>{{ pest.species }}</dd> }
              @if (pest.stage) { <dt>{{ 'diagnosis.pest.stage' | translate }}</dt><dd>{{ 'diagnosis.pestStage.' + pest.stage | translate }}</dd> }
              @if (pest.densityPerPlant != null) {
                <dt>{{ 'diagnosis.pest.perPlant' | translate }}</dt><dd>{{ pest.densityPerPlant | number: densityFormat }}</dd>
              }
              @if (pest.densityPerM2 != null) {
                <dt>{{ 'diagnosis.pest.perM2' | translate }}</dt><dd>{{ pest.densityPerM2 | number: densityFormat }}</dd>
              }
            </dl>
          </section>
        }

        @if (diagnosis()!.clarifyingQuestions.length) {
          <h2>{{ 'diagnosis.questions' | translate }}</h2>
          <app-clarifying-questions [questions]="diagnosis()!.clarifyingQuestions" [answers]="diagnosis()!.answers"
            [lang]="lang()" [busy]="busy()" (submitted)="applyAnswers($event)" />
        }

        @if (actionFailed()) {
          <p-message severity="error" role="alert">{{ 'diagnosis.actionFailed' | translate }}</p-message>
        }

        <h2>{{ 'diagnosis.confirmTitle' | translate }}</h2>
        <app-diagnosis-confirm [hypotheses]="diagnosis()!.hypotheses" [catalogue]="catalogue()" [lang]="lang()"
          [allowTopConfirm]="!uncertain()" [busy]="busy()" [confirmation]="confirmation()" (confirmed)="confirm($event)" />

        <p-button class="diag__task" [label]="'diagnosis.createTask' | translate" [icon]="createTaskIcon"
          [disabled]="!observation()?.confirmedDiagnosisId" (onClick)="createTask()" />
        @if (!observation()?.confirmedDiagnosisId) {
          <p class="diag__hint" data-testid="task-hint">{{ 'diagnosis.createTaskHint' | translate }}</p>
        }
      }
    </section>`,
  styles: `
    .diag { display: flex; flex-direction: column; gap: 12px; }
    .diag h2 { margin: 12px 0 0; }
    .diag__loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 0; color: var(--ap-text-sec); }
    .diag__loading p-progress-spinner { width: var(--ap-touch-min); height: var(--ap-touch-min); }
    .diag__uncertain p { margin: 4px 0; }
    .diag__uncertain ol { margin: 4px 0 12px; padding-left: 20px; }
    .diag__action { display: inline-flex; align-items: center; gap: 8px; min-height: var(--ap-touch-min); padding: 0 16px;
      border: 2px solid currentColor; border-radius: var(--ap-radius); font-weight: 600; color: inherit; text-decoration: none; }
    .diag__action:focus-visible { outline: 3px solid var(--ap-accent); outline-offset: 2px; }
    .diag__path { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 0; padding: 0; color: var(--ap-text-sec); font-weight: 600; }
    .diag__path li:not(:last-child)::after { content: ' \\203A'; margin-left: 8px; color: var(--ap-text-muted); }
    .diag__photo { margin: 0; }
    .diag__hint { margin: 0; font-size: 0.9rem; color: var(--ap-text-sec); }
    .diag__photo .diag__hint { margin-top: 4px; }
    .diag__evidence { margin: 0; color: var(--ap-text-sec); font-style: italic; }
    .diag__pest dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; margin: 0; }
    .diag__pest dt { color: var(--ap-text-sec); } .diag__pest dd { margin: 0; color: var(--ap-text); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisComponent implements OnInit {
  private readonly service = inject(DiagnosisService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refinement = inject(RefinementNotifier);
  protected readonly lang = currentLang();
  protected readonly scoutingRoute = DIAGNOSIS_CONFIG.scoutingRoute;
  protected readonly createTaskIcon = DIAGNOSIS_CONFIG.createTaskIcon;
  protected readonly retryIcon = DIAGNOSIS_CONFIG.retryIcon;
  protected readonly addPhotosIcon = DIAGNOSIS_CONFIG.addPhotosIcon;
  protected readonly densityFormat = `1.0-${DIAGNOSIS_CONFIG.densityDecimals}`;

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly refinedNotice = signal(false);
  protected readonly actionFailed = signal(false);
  protected readonly observation = signal<ObservationDto | undefined>(undefined);
  protected readonly diagnosis = signal<DiagnosisResultDto | undefined>(undefined);
  protected readonly catalogue = signal<CatalogDiagnosisDto[]>([]);
  protected readonly crops = signal<CropDto[]>([]);
  protected readonly selectedRank = signal<number>(DIAGNOSIS_CONFIG.topRank);

  protected readonly selected = computed(() =>
    this.diagnosis()?.hypotheses.find((h) => h.rank === this.selectedRank()));
  protected readonly photo = computed(() => photoFor(this.observation()?.photos ?? [], this.selected()));
  protected readonly confirmation = computed(() => {
    const diagnosisId = this.observation()?.confirmedDiagnosisId;
    return diagnosisId ? { diagnosisId } : undefined;
  });
  protected readonly evidence = computed(() => sharedEvidence(this.diagnosis()?.hypotheses ?? []));
  /** Why the system is not sure, or undefined when the result can be ranked and confirmed in one tap. */
  protected readonly uncertain = computed(() => {
    const result = this.diagnosis();
    return result && (result.unsure || result.outOfDistribution || result.needsMorePhotos) ? uncertainReason(result) : undefined;
  });
  protected readonly hierarchy = computed(() => {
    const result = this.diagnosis();
    if (!result) return [];
    const crop = this.crops().find((c) => c.code === result.cropCode);
    const top = result.hypotheses[0];
    const steps: HierarchyStep[] = [
      { text: crop ? pick(crop.nameUk, crop.nameEn, this.lang()) : undefined },
      { key: isKnown(result.organ) ? `diagnosis.organ.${result.organ}` : undefined },
      { key: isKnown(result.problemCategory) ? `diagnosis.category.${result.problemCategory}` : undefined },
      { text: top && !this.uncertain() ? pick(top.nameUk, top.nameEn, this.lang()) : undefined },
    ];
    return steps.filter((step) => step.key || step.text);
  });

  constructor() {
    effect(() => {
      const refined = this.refinement.refinedDiagnosis();
      if (refined && refined.observationId === this.observationId() && refined.id !== this.diagnosis()?.id) void this.reload();
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const snapshot = await this.service.load(this.observationId());
      this.observation.set(snapshot.observation);
      this.diagnosis.set(snapshot.diagnosis);
      if (snapshot.diagnosis) await this.loadReferenceData(snapshot.observation?.cropId);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected retry(): void {
    this.failed.set(false);
    this.loading.set(true);
    void this.ngOnInit();
  }

  private observationId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  /** A server refinement arrived: re-read the observation online and tell the user the result changed. */
  private async reload(): Promise<void> {
    const snapshot = await this.service.load(this.observationId()).catch(() => undefined);
    if (!snapshot?.diagnosis) return;
    this.observation.set(snapshot.observation);
    this.diagnosis.set(snapshot.diagnosis);
    await this.loadReferenceData(snapshot.observation?.cropId);
    this.refinedNotice.set(true);
  }

  protected referencesOf(code: string) {
    return referencesFor(this.diagnosis()?.referenceImages ?? [], code);
  }

  protected async applyAnswers(answers: Record<string, string>): Promise<void> {
    const result = this.diagnosis();
    if (!result) return;
    await this.run(async () => {
      this.diagnosis.set(await this.service.answer(result.id, answers));
      this.selectedRank.set(DIAGNOSIS_CONFIG.topRank);
    });
  }

  protected async confirm(diagnosisId: string): Promise<void> {
    const observation = this.observation();
    const result = this.diagnosis();
    if (!observation || !result) return;
    await this.run(async () => {
      this.observation.set(
        await this.service.confirm(observation.id, diagnosisId, isCorrection(diagnosisId, result.hypotheses)),
      );
    });
  }

  protected createTask(): void {
    void this.router.navigate([DIAGNOSIS_CONFIG.recommendationRoute, this.observation()?.id]);
  }

  private async loadReferenceData(cropId?: string): Promise<void> {
    const data = await this.service.referenceData(cropId);
    this.catalogue.set(data.catalogue);
    this.crops.set(data.crops);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.actionFailed.set(false);
    try {
      await action();
    } catch {
      this.actionFailed.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
