import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AuthSession } from '../../core/auth/auth-session.service';
import { AnalyticsSummaryDto, ExportFormat, HeatmapDto } from '../../core/api/models';
import { downloadBlob } from './file-download';
import { EMPTY_HEATMAP_FILTER, HeatmapFilterForm, isDateRangeValid, seasonYears, toAnalyticsFilter } from './heatmap-filter';
import { HeatmapMapComponent } from './heatmap-map.component';
import { HeatmapLookups, HeatmapService } from './heatmap.service';
import { HEATMAP_CONFIG } from './heatmap.config';

@Component({
  selector: 'app-heatmap',
  imports: [FormsModule, ButtonModule, SelectModule, TranslatePipe, HeatmapMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .heatmap__filters { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin-bottom: 1rem; }
    .heatmap__field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: var(--ap-text-sec); }
    .heatmap__date { min-height: var(--ap-touch-min); padding: 0 0.75rem; border-radius: var(--ap-radius-sm); border: 1px solid var(--ap-border); background: var(--ap-surface); color: var(--ap-text); }
    .heatmap__toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .heatmap__error { color: var(--ap-danger); }
    .heatmap__summary { margin-top: 1rem; display: grid; gap: 0.5rem; }
    .heatmap__summary ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.25rem; }
    .heatmap__summary li { display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--ap-muted-bg); border-radius: var(--ap-radius-sm); }
  `,
  template: `
    <section class="scout-page">
      <h1>{{ 'heatmap.title' | translate }}</h1>

      <div class="heatmap__filters">
        <label class="heatmap__field">{{ 'heatmap.filters.field' | translate }}
          <p-select [options]="lookups().fields" optionLabel="name" optionValue="id" [showClear]="true" appendTo="body"
            [ngModel]="form().fieldId" (ngModelChange)="setFilter('fieldId', $event)"
            [placeholder]="'heatmap.filters.any' | translate" />
        </label>
        <label class="heatmap__field">{{ 'heatmap.filters.crop' | translate }}
          <p-select [options]="lookups().crops" [optionLabel]="nameKey()" optionValue="id" [showClear]="true" appendTo="body"
            [ngModel]="form().cropId" (ngModelChange)="setFilter('cropId', $event)"
            [placeholder]="'heatmap.filters.any' | translate" />
        </label>
        <label class="heatmap__field">{{ 'heatmap.filters.diagnosis' | translate }}
          <p-select [options]="lookups().diagnoses" [optionLabel]="nameKey()" optionValue="id" [showClear]="true"
            [filter]="true" appendTo="body"
            [ngModel]="form().diagnosisId" (ngModelChange)="setFilter('diagnosisId', $event)"
            [placeholder]="'heatmap.filters.any' | translate" />
        </label>
        <label class="heatmap__field">{{ 'heatmap.filters.season' | translate }}
          <p-select [options]="seasons" [showClear]="true" appendTo="body"
            [ngModel]="form().season" (ngModelChange)="setFilter('season', $event)"
            [placeholder]="'heatmap.filters.any' | translate" />
        </label>
        <label class="heatmap__field">{{ 'heatmap.filters.from' | translate }}
          <input class="heatmap__date" type="date" [ngModel]="form().from" (ngModelChange)="setFilter('from', $event)" />
        </label>
        <label class="heatmap__field">{{ 'heatmap.filters.to' | translate }}
          <input class="heatmap__date" type="date" [ngModel]="form().to" (ngModelChange)="setFilter('to', $event)" />
        </label>
      </div>

      <div class="heatmap__toolbar">
        <p-button severity="secondary" icon="pi pi-filter-slash" [label]="'heatmap.reset' | translate" (onClick)="reset()" />
        @if (canExport()) {
        <p-button icon="pi pi-download" [label]="'heatmap.export.csv' | translate" [loading]="exporting()" (onClick)="export('csv')" />
        <p-button icon="pi pi-map" [label]="'heatmap.export.geojson' | translate" [loading]="exporting()" (onClick)="export('geojson')" />
        }
      </div>

      @if (lookupsFailed()) {
        <p class="heatmap__error" role="alert">{{ 'heatmap.error.lookups' | translate }}</p>
      }
      @if (error(); as errorKey) {
        <p class="heatmap__error" role="alert">{{ errorKey | translate }}</p>
      }
      <app-heatmap-map [data]="heatmap()" />

      @if (summary(); as s) {
        <div class="heatmap__summary">
          <strong>{{ 'heatmap.summary.total' | translate }}: {{ s.total }}</strong>
          @if (s.total === 0) {
            <span>{{ 'heatmap.summary.empty' | translate }}</span>
          }
          <ul>
            @for (row of topDiagnoses(); track row.code) {
              <li><span>{{ row.name }}</span><strong>{{ row.count }}</strong></li>
            }
          </ul>
          @if (recentWeeks().length) {
            <strong>{{ 'heatmap.summary.byWeek' | translate }}</strong>
            <ul class="heatmap__weeks">
              @for (row of recentWeeks(); track row.week) {
                <li><span>{{ row.week }}</span><strong>{{ row.count }}</strong></li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
})
export class HeatmapComponent {
  private readonly service = inject(HeatmapService);
  private readonly translate = inject(TranslateService);
  private readonly session = inject(AuthSession);
  private loadSequence = 0;

  protected readonly seasons = seasonYears(new Date().getFullYear(), HEATMAP_CONFIG.seasonCount);
  protected readonly form = signal<HeatmapFilterForm>(EMPTY_HEATMAP_FILTER);
  protected readonly lookups = signal<HeatmapLookups>({ crops: [], diagnoses: [], fields: [] });
  protected readonly heatmap = signal<HeatmapDto | null>(null);
  protected readonly summary = signal<AnalyticsSummaryDto | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly lookupsFailed = signal(false);
  protected readonly exporting = signal(false);
  protected readonly canExport = computed(() => this.session.hasAnyRole(HEATMAP_CONFIG.exportRoles));
  protected readonly recentWeeks = computed(() => (this.summary()?.byWeek ?? []).slice(-HEATMAP_CONFIG.weeksShown));
  protected readonly topDiagnoses = computed(() => (this.summary()?.byDiagnosis ?? []).slice(0, HEATMAP_CONFIG.topDiagnosesShown));

  private readonly lang = toSignal(this.translate.onLangChange.pipe(map((e) => e.lang)), {
    initialValue: this.translate.currentLang,
  });
  protected readonly nameKey = computed(() => HEATMAP_CONFIG.nameKeyByLang[this.lang()] ?? HEATMAP_CONFIG.defaultNameKey);

  constructor() {
    void this.init();
  }

  protected setFilter(key: keyof HeatmapFilterForm, value: string | null): void {
    const next = { ...this.form(), [key]: value || null };
    this.form.set(next);
    if (!isDateRangeValid(next)) {
      this.error.set('heatmap.error.range');
      return;
    }
    void this.load();
  }

  protected reset(): void {
    this.form.set(EMPTY_HEATMAP_FILTER);
    void this.load();
  }

  protected async export(format: ExportFormat): Promise<void> {
    this.exporting.set(true);
    try {
      const blob = await this.service.exportObservations(format, toAnalyticsFilter(this.form()));
      downloadBlob(blob, `${HEATMAP_CONFIG.exportFileBase}.${format}`);
    } catch {
      this.error.set('heatmap.error.export');
    } finally {
      this.exporting.set(false);
    }
  }

  private async init(): Promise<void> {
    try {
      this.lookups.set(await this.service.lookups());
    } catch {
      this.lookupsFailed.set(true);
    }
    await this.load();
  }

  private async load(): Promise<void> {
    const sequence = ++this.loadSequence;
    try {
      const { heatmap, summary } = await this.service.load(toAnalyticsFilter(this.form()));
      if (sequence !== this.loadSequence) return;
      this.heatmap.set(heatmap);
      this.summary.set(summary);
      this.error.set(null);
    } catch {
      if (sequence === this.loadSequence) this.error.set('heatmap.error.load');
    }
  }
}
