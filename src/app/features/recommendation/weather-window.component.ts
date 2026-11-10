import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { RecommendationDto } from '../../core/api/models';
import { toTimelineHours, verdictSeverity } from './recommendation-display';

@Component({
  selector: 'app-recommendation-weather-window',
  imports: [TranslatePipe, TagModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .timeline { display: flex; gap: 2px; overflow-x: auto; padding: 0.5rem 0; }
    .hour {
      flex: 0 0 auto; width: 1.5rem; min-height: var(--ap-touch-min); border-radius: var(--ap-radius-sm);
      display: flex; align-items: flex-end; justify-content: center; font-size: 0.65rem; color: var(--ap-text);
    }
    .hour.go { background: var(--ap-ok-dim); border-bottom: 3px solid var(--ap-ok); }
    .hour.wait { background: var(--ap-warn-dim); border-bottom: 3px solid var(--ap-warn); }
    .hour.no_go { background: var(--ap-danger-dim); border-bottom: 3px solid var(--ap-danger); }
    .legend { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; }
    .reason { color: var(--ap-text-sec); }
  `,
  template: `
    @if (weather(); as w) {
    <div>
      <p-tag [severity]="severity()" [value]="'recommendation.weather.verdict.' + w.verdict | translate" />
      <p class="reason">{{ 'recommendation.' + w.reason
        | translate: w.reasonParams }}@if (reasonCauses(w.reasonParams); as causes) { ({{ causes }})}</p>
      @if (hours().length > 0) {
        <div class="timeline" role="list" [attr.aria-label]="'recommendation.weather.timeline' | translate">
          @for (hour of hours(); track hour.time) {
            <div role="listitem" [class]="'hour ' + hour.verdict" [title]="(hour.time | date: 'short') + ' ' + causesText(hour.causes)">
              {{ hour.time | date: 'HH' }}
            </div>
          }
        </div>
      }
      <div class="legend">
        @for (v of verdicts; track v) {
          <p-tag [severity]="severityOf(v)" [value]="'recommendation.weather.verdict.' + v | translate" />
        }
      </div>
    </div>
    }
  `,
})
export class WeatherWindowComponent {
  private readonly translate = inject(TranslateService);
  readonly weather = input.required<RecommendationDto['weather'] | null>();
  protected readonly verdicts = ['go', 'wait', 'no_go'] as const;
  protected readonly hours = computed(() => toTimelineHours(this.weather()?.forecastSummary));
  protected readonly severity = computed(() => this.weather() ? verdictSeverity(this.weather()!.verdict) : 'secondary');
  protected readonly severityOf = verdictSeverity;

  protected reasonCauses(params: Record<string, unknown>): string {
    return Array.isArray(params['causes']) ? this.causesText(params['causes'] as string[]) : '';
  }

  protected causesText(causes: readonly string[]): string {
    return causes.map((c) => this.translate.instant('recommendation.' + c)).join(', ');
  }
}
