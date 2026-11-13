import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProgressBarModule } from 'primeng/progressbar';
import { HypothesisDto, ReferenceImageDto } from '../../core/api/models';
import { UiLang } from './current-lang';
import { pick, probabilityLevel, toPercent } from './diagnosis-view';
import { ReferenceGalleryComponent } from './reference-gallery.component';

@Component({
  selector: 'app-hypothesis-card',
  imports: [TranslatePipe, ProgressBarModule, ReferenceGalleryComponent],
  template: `
    <article class="card" [class.card--selected]="selected()" [attr.data-level]="level()">
      <button type="button" class="card__head" (click)="picked.emit(hypothesis().rank)" [attr.aria-pressed]="selected()">
        <span class="card__rank" aria-hidden="true">{{ hypothesis().rank }}</span>
        <span class="card__title">
          <span class="card__name">{{ name() }}</span>
          <span class="card__level" data-testid="level">{{ 'diagnosis.level.' + level() | translate }}</span>
        </span>
        <span class="card__pct">{{ percent() }}%</span>
      </button>
      <p-progressbar [value]="percent()" [showValue]="false" [attr.aria-label]="name()" />
      @if (showEvidence() && hypothesis().evidence) {
        <p class="card__evidence">{{ hypothesis().evidence }}</p>
      }
      <app-reference-gallery [references]="references()" [comparePhotoUrl]="comparePhotoUrl()" />
    </article>`,
  styles: `
    .card { border: 2px solid var(--ap-border); border-radius: var(--ap-radius); background: var(--ap-surface); padding: 12px; }
    .card--selected { border-color: var(--ap-accent); }
    .card__head { all: unset; display: flex; gap: 12px; align-items: center; width: 100%; min-height: var(--ap-touch-min);
      cursor: pointer; box-sizing: border-box; border-radius: var(--ap-radius-sm); }
    .card__head:focus-visible { outline: 3px solid var(--ap-accent); outline-offset: 2px; }
    .card__rank { display: inline-grid; place-items: center; min-width: 28px; height: 28px; border-radius: 50%;
      background: var(--ap-muted-bg); font-weight: 700; color: var(--ap-text-sec); }
    .card__title { flex: 1; display: flex; flex-direction: column; }
    .card__name { font-weight: 600; color: var(--ap-text); }
    .card__level { font-size: 0.85rem; color: var(--ap-text-sec); }
    .card__pct { font-size: 1.25rem; font-weight: 700; color: var(--ap-text); }
    .card__evidence { color: var(--ap-text-sec); margin: 8px 0 0; }
    p-progressbar { display: block; margin-top: 8px; }
    .card[data-level='high'] { --p-progressbar-value-background: var(--ap-ok); }
    .card[data-level='medium'] { --p-progressbar-value-background: var(--ap-warn); }
    .card[data-level='low'] { --p-progressbar-value-background: var(--ap-danger); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HypothesisCardComponent {
  readonly hypothesis = input.required<HypothesisDto>();
  readonly references = input<ReferenceImageDto[]>([]);
  /** The scout's photo, shown next to an opened reference photo for comparison. */
  readonly comparePhotoUrl = input<string>();
  readonly selected = input(false);
  readonly lang = input<UiLang>('uk');
  /** Off when the screen already shows an evidence line shared by all hypotheses. */
  readonly showEvidence = input(true);
  readonly picked = output<number>();
  protected readonly percent = computed(() => toPercent(this.hypothesis().probability));
  protected readonly level = computed(() => probabilityLevel(this.hypothesis().probability));
  protected readonly name = computed(() => pick(this.hypothesis().nameUk, this.hypothesis().nameEn, this.lang()));
}
