import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TreatmentPlanDto } from '../../core/api/models';
import { RecommendationService } from './recommendation.service';
import { TreatmentPlanFailure, treatmentPlanFailure } from './treatment-plan-display';

/** Treatment course drafted by the backend language model on request; proportions come computed from the backend. */
@Component({
  selector: 'app-recommendation-treatment-plan',
  imports: [FormsModule, DecimalPipe, TranslatePipe, ButtonModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .controls { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; margin-top: 0.75rem; }
    .controls label { display: flex; flex-direction: column; gap: 0.25rem; color: var(--ap-text-sec); font-size: 0.8rem; }
    .controls input { width: 9rem; min-height: var(--ap-touch-min); }
    .hint, .meta { color: var(--ap-text-sec); font-size: 0.875rem; }
    .card {
      padding: 1rem; margin-top: 0.75rem; background: var(--ap-surface);
      border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
    }
    .head { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: space-between; }
    dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 0.5rem 1rem; margin: 0.75rem 0 0; }
    dt { color: var(--ap-text-sec); font-size: 0.8rem; }
    dd { margin: 0; font-variant-numeric: tabular-nums; }
    .notice { margin-top: 0.75rem; color: var(--ap-warn); }
    .error { margin-top: 0.75rem; color: var(--ap-danger); }
    .disclaimer { margin-top: 0.75rem; padding: 0.75rem; color: var(--ap-text-sec); background: var(--ap-info-dim); border-radius: var(--ap-radius); }
    ul { margin: 0.25rem 0 0; padding-left: 1.25rem; }
  `,
  template: `
    <p class="hint">{{ 'recommendation.plan.intro' | translate }}</p>
    <div class="controls">
      <label>{{ 'recommendation.plan.tank' | translate }}
        <input pInputText type="number" min="50" max="20000" [ngModel]="tankVolumeL()" (ngModelChange)="tankVolumeL.set($event)" />
      </label>
      <p-button icon="pi pi-sparkles" [loading]="busy()" (onClick)="generate()"
        [label]="(plan() ? 'recommendation.plan.regenerate' : 'recommendation.plan.generate') | translate" />
    </div>
    @if (failure(); as failure) {
      <p class="error" role="alert">{{ (failure === 'unavailable' ? 'recommendation.plan.unavailable' : 'common.error') | translate }}</p>
    }
    @if (plan(); as plan) {
      @switch (plan.status) {
        @case ('no_treatment') { <p class="notice">{{ 'recommendation.plan.noTreatment' | translate }}</p> }
        @case ('rejected') { <p class="notice" role="alert">{{ 'recommendation.plan.rejected' | translate }}</p> }
        @default {
          <p>{{ plan.summary }}</p>
          @for (step of plan.applications; track $index) {
            <article class="card">
              <div class="head">
                <strong>{{ 'recommendation.plan.day' | translate: { day: step.dayOffset } }} · {{ step.productName }}</strong>
                <span class="meta">{{ step.timing }}</span>
              </div>
              <dl>
                <div><dt>{{ 'recommendation.plan.rate' | translate }}</dt><dd>{{ step.rateValue | number: '1.0-3' }} {{ step.rateUnit }}</dd></div>
                <div><dt>{{ 'recommendation.plan.water' | translate }}</dt>
                  <dd>{{ step.waterLPerHa | number: '1.0-0' }} {{ 'recommendation.plan.lPerHa' | translate }}</dd></div>
                <div><dt>{{ 'recommendation.plan.per100' | translate }}</dt>
                  <dd>{{ step.solution.productPer100L | number: '1.0-3' }} {{ step.solution.productUnit }}</dd></div>
                <div><dt>{{ 'recommendation.plan.perTank' | translate: { tank: step.solution.tankVolumeL } }}</dt>
                  <dd>{{ step.solution.productPerTank | number: '1.0-2' }} {{ step.solution.productUnit }}</dd></div>
                <div><dt>{{ 'recommendation.plan.haPerTank' | translate }}</dt>
                  <dd>{{ step.solution.hectaresPerTank | number: '1.0-2' }} {{ 'recommendation.plan.ha' | translate }}</dd></div>
                @if (step.solution.tanksForField != null) {
                  <div><dt>{{ 'recommendation.plan.tanks' | translate }}</dt><dd>{{ step.solution.tanksForField }}</dd></div>
                  <div><dt>{{ 'recommendation.plan.total' | translate }}</dt>
                    <dd>{{ step.solution.productForField | number: '1.0-2' }} {{ step.solution.productUnit }}</dd></div>
                }
              </dl>
              @if (step.note) { <p class="hint">{{ step.note }}</p> }
            </article>
          }
          @if (plan.precautions.length > 0) {
            <h3>{{ 'recommendation.plan.precautions' | translate }}</h3>
            <ul>@for (item of plan.precautions; track $index) { <li>{{ item }}</li> }</ul>
          }
          @if (plan.monitoring) {
            <h3>{{ 'recommendation.plan.monitoring' | translate }}</h3>
            <p>{{ plan.monitoring }}</p>
          }
          <p class="disclaimer">{{ 'recommendation.plan.disclaimer' | translate }}</p>
          @if (plan.model) { <p class="meta">{{ 'recommendation.plan.model' | translate: { model: plan.model } }}</p> }
        }
      }
    }
  `,
})
export class TreatmentPlanComponent {
  private readonly service = inject(RecommendationService);

  readonly recommendationId = input.required<string>();
  protected readonly tankVolumeL = signal<number | null>(null);
  protected readonly plan = signal<TreatmentPlanDto | null>(null);
  protected readonly failure = signal<TreatmentPlanFailure | null>(null);
  protected readonly busy = signal(false);

  protected async generate(): Promise<void> {
    this.busy.set(true);
    this.failure.set(null);
    try {
      this.plan.set(await this.service.treatmentPlan(this.recommendationId(), this.tankVolumeL() || undefined));
    } catch (error) {
      this.failure.set(treatmentPlanFailure(error));
    } finally {
      this.busy.set(false);
    }
  }
}
