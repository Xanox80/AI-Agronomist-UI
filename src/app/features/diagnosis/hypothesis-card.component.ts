import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthImageComponent } from '../../core/api/auth-image.component';
import { HypothesisDto, ReferenceImageDto } from '../../core/api/models';
import { UiLang } from './current-lang';
import { pick, probabilityLevel, toPercent } from './diagnosis-view';

@Component({
  selector: 'app-hypothesis-card',
  imports: [TranslatePipe, ProgressBarModule, AuthImageComponent],
  template: `
    <article class="card" [class.card--selected]="selected()" [attr.data-level]="level()">
      <button type="button" class="card__head" (click)="picked.emit(hypothesis().rank)" [attr.aria-pressed]="selected()">
        <span class="card__rank">{{ hypothesis().rank }}</span>
        <span class="card__name">{{ name() }}</span>
        <span class="card__pct">{{ percent() }}%</span>
      </button>
      <p-progressbar [value]="percent()" [showValue]="false" [attr.aria-label]="name()" />
      @if (hypothesis().evidence) {
        <p class="card__evidence">{{ hypothesis().evidence }}</p>
      }
      @if (references().length) {
        <h4>{{ 'diagnosis.references' | translate }}</h4>
        <div class="card__refs">
          @for (ref of references(); track ref.id) {
            <figure><app-auth-image [src]="ref.url" [cacheId]="ref.id" [alt]="ref.caption" loading="lazy" /><figcaption>{{ ref.caption }}</figcaption></figure>
          }
        </div>
      }
    </article>`,
  styles: `
    .card { border: 1px solid var(--ap-border); border-radius: var(--ap-radius); background: var(--ap-surface); padding: 12px; }
    .card--selected { border-color: var(--ap-accent); }
    .card__head { all: unset; display: flex; gap: 12px; align-items: center; width: 100%; min-height: var(--ap-touch-min); cursor: pointer; box-sizing: border-box; }
    .card__rank { font-weight: 700; color: var(--ap-text-sec); }
    .card__name { flex: 1; font-weight: 600; color: var(--ap-text); }
    .card__pct { font-weight: 700; color: var(--ap-text); }
    .card__evidence { color: var(--ap-text-sec); margin: 8px 0; }
    .card__refs { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
    figure { margin: 0; } figure app-auth-image { border-radius: var(--ap-radius-sm); overflow: hidden; }
    figcaption { font-size: 0.8rem; color: var(--ap-text-muted); }
    .card[data-level='high'] { --p-progressbar-value-background: var(--ap-ok); }
    .card[data-level='medium'] { --p-progressbar-value-background: var(--ap-warn); }
    .card[data-level='low'] { --p-progressbar-value-background: var(--ap-danger); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HypothesisCardComponent {
  readonly hypothesis = input.required<HypothesisDto>();
  readonly references = input<ReferenceImageDto[]>([]);
  readonly selected = input(false);
  readonly lang = input<UiLang>('uk');
  readonly picked = output<number>();
  protected readonly percent = computed(() => toPercent(this.hypothesis().probability));
  protected readonly level = computed(() => probabilityLevel(this.hypothesis().probability));
  protected readonly name = computed(() => pick(this.hypothesis().nameUk, this.hypothesis().nameEn, this.lang()));
}
