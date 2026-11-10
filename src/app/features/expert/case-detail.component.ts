import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthSession } from '../../core/auth/auth-session.service';
import { CatalogDiagnosisDto, CreateLabelRequest, CropDto, ExpertCaseDto } from '../../core/api/models';
import { diagnosisName } from './diagnosis-name';
import { EXPERT_CONFIG } from './expert.config';
import { ExpertService } from './expert.service';
import { LabelFormComponent } from './label-form.component';
import { labelConsensus } from './label-consensus';
import { PolygonCanvasComponent } from './polygon-canvas.component';
import { NormalizedPoint, toAffectedRegion } from './polygon-geometry';

@Component({
  selector: 'app-case-detail',
  imports: [RouterLink, TranslatePipe, ButtonModule, TagModule, PolygonCanvasComponent, LabelFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .grid { display: grid; gap: 1rem; }
    @media (min-width: 64rem) { .grid { grid-template-columns: 3fr 2fr; } }
    .card { padding: 1rem; background: var(--ap-surface); border: 1px solid var(--ap-border); border-radius: var(--ap-radius); }
    .card h2 { margin: 0 0 0.5rem; font-size: 1.05rem; }
    .meta { color: var(--ap-text-sec); font-size: 0.875rem; }
    .thumbs { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
    ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
    .state.error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <a routerLink="/expert">{{ 'common.back' | translate }}</a>
      @if (failed()) {
        <p class="state error">{{ 'common.error' | translate }}</p>
      }
      @if (current(); as c) {
        <div class="scout-page-header">
          <h1>{{ 'expert.detail.title' | translate }}</h1>
          <p-tag [severity]="severity(c)" [value]="'expert.reason.' + c.reason | translate" />
        </div>
        <div class="grid">
          <div class="card">
            @if (c.observation.photos.length > 1) {
              <div class="thumbs">
                @for (photo of c.observation.photos; track photo.id) {
                  <p-button [label]="'' + photo.seq" [severity]="photo.seq === seq() ? 'primary' : 'secondary'"
                    (onClick)="selectPhoto(photo.seq)" />
                }
              </div>
            }
            @if (photoSrc(); as src) {
              <app-polygon-canvas [src]="src" [editable]="canLabel()" [(points)]="points" />
            } @else {
              <p class="meta">{{ 'common.loading' | translate }}</p>
            }
          </div>
          <div class="grid">
            <div class="card">
              <h2>{{ 'expert.detail.model' | translate }}</h2>
              <ul>
                @for (h of c.diagnosis.hypotheses; track h.rank) {
                  <li>{{ h.rank }}. {{ lang() === 'en' ? h.nameEn : h.nameUk }} · {{ percent(h.probability) }}%</li>
                }
              </ul>
              @if (c.userCorrection; as fix) {
                <p class="meta">{{ 'expert.detail.userCorrection' | translate }}:
                  {{ name(fix.fromDiagnosisId) }} → {{ name(fix.toDiagnosisId) }}</p>
              }
            </div>
            <div class="card">
              <h2>{{ 'expert.detail.labels' | translate }}</h2>
              @if (c.labels.length === 0) {
                <p class="meta">{{ 'expert.detail.noLabels' | translate }}</p>
              }
              <ul>
                @for (l of c.labels; track l.id) {
                  <li>{{ l.labelerName }} ({{ 'expert.role.' + l.labelerRole | translate }}):
                    {{ 'expert.label.actions.' + l.action | translate }} {{ name(l.diagnosisId) }}
                    <span class="meta">· {{ 'expert.trust.weight' | translate }} {{ l.weight.toFixed(weightDecimals) }}</span></li>
                }
              </ul>
              @if (consensus().length > 0) {
                <h2>{{ 'expert.detail.consensus' | translate }}</h2>
                <ul>
                  @for (e of consensus(); track e.diagnosisId) {
                    <li>{{ name(e.diagnosisId) }} · {{ percent(e.share) }}% ({{ e.weight.toFixed(weightDecimals) }})</li>
                  }
                </ul>
                @if (canLabel() && c.status !== 'resolved') {
                  <p-button icon="pi pi-flag" [label]="'expert.detail.resolve' | translate" [loading]="busy()"
                    (onClick)="resolve(c.id, consensus()[0].diagnosisId)" />
                }
              }
            </div>
            @if (canLabel() && c.status !== 'resolved') {
              <div class="card">
                <h2>{{ 'expert.detail.label' | translate }}</h2>
                <p class="meta">{{ 'expert.trust.yours' | translate }}: {{ myWeightText() }}</p>
                @if (c.status === 'open') {
                  <p-button icon="pi pi-user" severity="secondary" [label]="'expert.detail.claim' | translate"
                    [loading]="busy()" (onClick)="claim(c.id)" />
                }
                @if (c.status === 'in_review') {
                  <app-label-form [diagnoses]="diagnoses()" [crops]="crops()" [busy]="busy()"
                    [modelTopDiagnosisId]="c.diagnosis.hypotheses[0]?.diagnosisId" [region]="region()"
                    (submitted)="addLabel(c.id, $event)" />
                }
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class CaseDetailComponent implements OnInit, OnDestroy {
  private readonly service = inject(ExpertService);
  private readonly translate = inject(TranslateService);
  private readonly session = inject(AuthSession);

  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') as string;

  protected readonly weightDecimals = EXPERT_CONFIG.weightDecimals;
  protected readonly current = signal<ExpertCaseDto | null>(null);
  protected readonly diagnoses = signal<CatalogDiagnosisDto[]>([]);
  protected readonly crops = signal<CropDto[]>([]);
  protected readonly myWeight = signal<number | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly seq = signal(1);
  protected readonly points = signal<NormalizedPoint[]>([]);
  protected readonly photoSrc = signal<string | null>(null);

  protected readonly canLabel = computed(() => this.session.hasAnyRole(['expert']));
  protected readonly consensus = computed(() => labelConsensus(this.current()?.labels ?? []));
  protected readonly region = computed(() => toAffectedRegion(this.points(), this.seq()));
  protected readonly myWeightText = computed(() => this.myWeight()?.toFixed(this.weightDecimals) ?? '');

  private objectUrls: string[] = [];

  async ngOnInit(): Promise<void> {
    try {
      const [loaded, diagnoses, crops, me] = await Promise.all([
        this.service.getCase(this.id), this.service.diagnoses(), this.service.crops(), this.service.me(),
      ]);
      this.diagnoses.set(diagnoses);
      this.crops.set(crops);
      this.myWeight.set(me.trustWeight);
      this.current.set(loaded);
      await this.selectPhoto(loaded.observation.photos[0]?.seq ?? 1);
    } catch {
      this.failed.set(true);
    }
  }

  ngOnDestroy(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  protected lang(): string {
    return this.translate.currentLang;
  }

  protected name(id: string | undefined): string {
    return diagnosisName(this.diagnoses(), id, this.lang());
  }

  protected percent(fraction: number): number {
    return Math.round(fraction * EXPERT_CONFIG.percentScale);
  }

  protected severity(c: ExpertCaseDto): 'warn' | 'danger' | 'info' {
    return EXPERT_CONFIG.reasonSeverity[c.reason];
  }

  protected async selectPhoto(seq: number): Promise<void> {
    const photo = this.current()?.observation.photos.find((p) => p.seq === seq);
    if (!photo) return;
    this.seq.set(seq);
    this.points.set([]);
    this.photoSrc.set(null);
    const url = await this.service.photoObjectUrl(photo.url);
    this.objectUrls.push(url);
    this.photoSrc.set(url);
  }

  protected claim(id: string): Promise<void> {
    return this.run(async () => this.current.set(await this.service.claim(id)));
  }

  protected addLabel(id: string, request: CreateLabelRequest): Promise<void> {
    return this.run(async () => {
      await this.service.addLabel(id, request);
      this.points.set([]);
      this.current.set(await this.service.getCase(id));
    });
  }

  protected resolve(id: string, finalDiagnosisId: string): Promise<void> {
    return this.run(async () => this.current.set(await this.service.resolve(id, finalDiagnosisId)));
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.failed.set(false);
    try {
      await action();
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
