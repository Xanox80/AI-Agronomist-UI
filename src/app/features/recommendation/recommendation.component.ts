import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { RecommendationDto } from '../../core/api/models';
import { AuthSession } from '../../core/auth/auth-session.service';
import { ProductListComponent } from './product-list.component';
import { taskQueryParams, taskTypeFor } from './recommendation-task';
import { actionSeverity, isReasonMissing, statusSeverity } from './recommendation-display';
import { RecommendationService } from './recommendation.service';
import { SafetyWarningsComponent } from './safety-warnings.component';
import { TreatmentPlanComponent } from './treatment-plan.component';
import { WeatherWindowComponent } from './weather-window.component';

@Component({
  selector: 'app-recommendation',
  imports: [
    FormsModule, DatePipe, TranslatePipe, ButtonModule, InputTextModule, TagModule,
    ProductListComponent, SafetyWarningsComponent, WeatherWindowComponent, TreatmentPlanComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    section.block {
      margin-top: 1rem; padding: 1rem; background: var(--ap-surface);
      border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
    }
    h2 { font-size: 1.05rem; margin: 0 0 0.5rem; }
    .badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 0.75rem; }
    .actions input { flex: 1 1 12rem; min-height: var(--ap-touch-min); }
    section.stale { color: var(--ap-warn); background: var(--ap-warn-dim); }
    section.disclaimer { color: var(--ap-text-sec); background: var(--ap-info-dim); }
    .state { color: var(--ap-text-sec); margin-top: 1rem; }
    .state.error { color: var(--ap-danger); }
    ul.sources { margin: 0; padding-left: 1.25rem; color: var(--ap-text-sec); }
  `,
  template: `
    <section class="scout-page">
      <div class="scout-page-header"><h1>{{ 'recommendation.title' | translate }}</h1></div>
      @if (loading()) {
        <p class="state">{{ 'common.loading' | translate }}</p>
      } @else if (failed()) {
        <p class="state error">{{ 'common.error' | translate }}
          <p-button severity="secondary" [label]="'common.retry' | translate" (onClick)="load()" />
        </p>
      }
      @if (recommendation(); as rec) {
        <section class="block">
          <div class="badges">
            <p-tag [severity]="statusSeverity(rec.status)" [value]="'recommendation.status.' + rec.status | translate" />
            <p-tag [severity]="actionSeverity(rec.actionLevel)" [value]="'recommendation.action.' + rec.actionLevel | translate" />
            @if (rec.autoApproved) { <p-tag severity="info" [value]="'recommendation.autoApproved' | translate" /> }
          </div>
          <p>{{ rec.explanation }}</p>
          @if (rec.approvedAt) {
            <p>{{ 'recommendation.approvedAt' | translate }}: {{ rec.approvedAt | date: 'medium' }}</p>
          }
          @if (canCreateTask()) {
            <div class="actions">
              <p-button icon="pi pi-plus" [label]="'recommendation.createTask' | translate" [loading]="busy()" (onClick)="createTask()" />
            </div>
          }
          @if (canDecide()) {
            <div class="actions">
              <p-button icon="pi pi-check" [label]="'recommendation.approve' | translate" [loading]="busy()" (onClick)="approve()" />
              <input pInputText [ngModel]="reason()" (ngModelChange)="reason.set($event)"
                [placeholder]="'recommendation.rejectReason' | translate" />
              <p-button icon="pi pi-times" severity="danger" [label]="'recommendation.reject' | translate"
                [disabled]="rejectDisabled()" (onClick)="reject()" />
            </div>
          }
        </section>
        @if (rec.catalogStale) {
          <section class="block stale" role="alert">{{ 'recommendation.stale' | translate }}</section>
        }
        @if (rec.status === 'draft') {
          <section class="block">
            <label for="damage">{{ 'recommendation.damage.label' | translate }}</label>
            <div class="actions">
              <input id="damage" pInputText type="number" min="0" max="100" [ngModel]="damagePercent()"
                (ngModelChange)="damagePercent.set($event)" />
              <p-button icon="pi pi-refresh" severity="secondary" [label]="'recommendation.recompute' | translate"
                [loading]="busy()" (onClick)="recompute()" />
            </div>
            <p class="state">{{ 'recommendation.damage.hint' | translate }}</p>
          </section>
        }
        <section class="block">
          <h2>{{ 'recommendation.products.title' | translate }}</h2>
          @if (rec.items.length === 0) { <p>{{ 'recommendation.products.empty' | translate }}</p> }
          <app-recommendation-product-list [items]="rec.items" />
          @if (rec.excludedItems.length > 0) {
            <h2>{{ 'recommendation.products.excludedTitle' | translate }}</h2>
            <app-recommendation-product-list [items]="rec.excludedItems" [excluded]="true" />
          }
        </section>
        @if (rec.items.length > 0) {
          <section class="block">
            <h2>{{ 'recommendation.plan.title' | translate }}</h2>
            <app-recommendation-treatment-plan [recommendationId]="rec.id" />
          </section>
        }
        <section class="block">
          <h2>{{ 'recommendation.weather.title' | translate }}</h2>
          <app-recommendation-weather-window [weather]="rec.weather" />
        </section>
        @if (rec.safetyWarnings.length > 0) {
          <section class="block">
            <h2>{{ 'recommendation.safety.title' | translate }}</h2>
            <app-recommendation-safety-warnings [warnings]="rec.safetyWarnings" />
          </section>
        }
        <section class="block">
          <h2>{{ 'recommendation.sources.title' | translate }}</h2>
          <ul class="sources">
            @for (source of rec.sources; track source.kind + source.ref) {
              <li>{{ source.kind }}: {{ source.ref }}
                @if (source.verifiedAt) { · {{ source.verifiedAt | date: 'mediumDate' }} }</li>
            }
          </ul>
          <p>{{ 'recommendation.sources.catalogVersion' | translate }}: {{ rec.catalogVersion }}</p>
        </section>
        <section class="block disclaimer">{{ disclaimerKey(rec.disclaimerCode) | translate }}</section>
      }
    </section>
  `,
})
export class RecommendationComponent {
  private readonly service = inject(RecommendationService);
  private readonly session = inject(AuthSession);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly observationId = inject(ActivatedRoute).snapshot.paramMap.get('observationId') ?? '';

  protected readonly recommendation = signal<RecommendationDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly reason = signal('');
  protected readonly canDecide = computed(
    () => this.recommendation()?.status === 'draft' && this.session.hasAnyRole(['chief_agronomist']),
  );
  protected readonly damagePercent = signal<number | null>(null);
  protected readonly canCreateTask = computed(
    () => this.recommendation()?.status === 'approved' && this.session.hasAnyRole(['scout', 'chief_agronomist']),
  );
  protected readonly rejectDisabled = computed(() => this.busy() || isReasonMissing(this.reason()));
  protected readonly actionSeverity = actionSeverity;
  protected readonly statusSeverity = statusSeverity;

  constructor() {
    void this.load();
  }

  protected disclaimerKey(code: string): string {
    const key = `recommendation.disclaimers.${code}`;
    return this.translate.instant(key) === key ? 'recommendation.disclaimer' : key;
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      this.recommendation.set(await this.service.loadOrCreate(this.observationId));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected approve(): Promise<void> {
    return this.change((id) => this.service.approve(id));
  }

  protected reject(): Promise<void> {
    return this.change((id) => this.service.reject(id, this.reason()));
  }

  protected recompute(): Promise<void> {
    return this.change((id) => this.service.recompute(id, this.damagePercent() ?? undefined));
  }

  protected async createTask(): Promise<void> {
    const recommendation = this.recommendation();
    if (!recommendation) return;
    this.busy.set(true);
    try {
      const observation = await this.service.observation(recommendation.observationId);
      const title = this.translate.instant(`recommendation.taskTitle.${taskTypeFor(recommendation)}`);
      await this.router.navigate(['/tasks/new'], { queryParams: taskQueryParams(recommendation, observation, title) });
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  private async change(action: (id: string) => Promise<RecommendationDto>): Promise<void> {
    const id = this.recommendation()?.id;
    if (!id) return;
    this.busy.set(true);
    this.failed.set(false);
    try {
      this.recommendation.set(await action(id));
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
