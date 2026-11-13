import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, input, linkedSignal, output, signal, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CatalogDiagnosisDto } from '../../core/api/models';
import { UiLang } from './current-lang';
import { DiagnosisChoice, pick } from './diagnosis-view';
import { DIAGNOSIS_CONFIG } from './diagnosis.config';

/** Lets the user name the right diagnosis: the model's hypotheses as large options, then any catalogue entry. */
@Component({
  selector: 'app-diagnosis-choice',
  imports: [FormsModule, TranslatePipe, ButtonModule, SelectModule],
  template: `
    <h3 #heading class="choice__title" id="diagnosis-choice-title" tabindex="-1">{{ titleKey() | translate }}</h3>
    <div class="choice__options" role="group" aria-labelledby="diagnosis-choice-title">
      @for (c of choices(); track c.diagnosisId) {
        <button type="button" class="choice__option" data-testid="choice-option"
          [class.choice__option--on]="!catalogueOpen() && selected() === c.diagnosisId"
          [attr.aria-pressed]="!catalogueOpen() && selected() === c.diagnosisId" (click)="pickHypothesis(c.diagnosisId)">
          <span class="choice__name">{{ c.name }}</span>
          <span class="choice__pct">{{ c.percent }}%</span>
        </button>
      }
      <button type="button" class="choice__option" data-testid="choice-other" [class.choice__option--on]="catalogueOpen()"
        [attr.aria-pressed]="catalogueOpen()" [attr.aria-expanded]="catalogueOpen()" (click)="openCatalogue()">
        <span class="choice__name"><i [class]="otherIcon" aria-hidden="true"></i> {{ 'diagnosis.otherDiagnosis' | translate }}</span>
      </button>
    </div>
    @if (catalogueOpen()) {
      <label class="choice__field">{{ 'diagnosis.catalogueLabel' | translate }}
        <p-select [options]="catalogueOptions()" optionLabel="label" optionValue="id" [filter]="true" [ngModel]="selected()"
          (ngModelChange)="selected.set($event)" [placeholder]="'diagnosis.pickFromCatalogue' | translate"
          [ariaLabel]="'diagnosis.catalogueLabel' | translate" [emptyMessage]="'diagnosis.catalogueEmpty' | translate"
          [autofocus]="catalogueRequested()" appendTo="body" />
      </label>
    }
    <div class="choice__actions">
      <p-button data-testid="choice-confirm" [label]="'diagnosis.confirmChoice' | translate" size="large" fluid
        [disabled]="busy() || !selected()" [loading]="busy()" (onClick)="chosen.emit(selected()!)" />
      @if (cancellable()) {
        <p-button data-testid="choice-cancel" [label]="'diagnosis.cancel' | translate" severity="secondary" [text]="true"
          size="large" fluid [disabled]="busy()" (onClick)="cancelled.emit()" />
      }
    </div>`,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; }
    .choice__title { margin: 0; font-size: 1rem; font-weight: 600; color: var(--ap-text); }
    .choice__title:focus-visible { outline: var(--ap-focus-width) solid var(--ap-focus-ring); outline-offset: var(--ap-focus-offset); }
    .choice__options { display: flex; flex-direction: column; gap: 8px; }
    .choice__option { display: flex; align-items: center; gap: 12px; width: 100%; min-height: var(--ap-touch-min);
      padding: 8px 16px; box-sizing: border-box; border: 2px solid var(--ap-border); border-radius: var(--ap-radius);
      background: var(--ap-surface); color: var(--ap-text); font: inherit; text-align: left; cursor: pointer; }
    .choice__option:focus-visible { outline: var(--ap-focus-width) solid var(--ap-focus-ring); outline-offset: var(--ap-focus-offset); }
    .choice__option--on { border-color: var(--ap-accent); background: var(--ap-accent-dim); font-weight: 600; }
    .choice__name { flex: 1; }
    .choice__pct { font-weight: 700; color: var(--ap-text-sec); }
    .choice__field { display: flex; flex-direction: column; gap: 6px; color: var(--ap-text-sec); }
    .choice__actions { display: flex; flex-direction: column; gap: 8px; }
    .choice__actions ::ng-deep .p-button { min-height: var(--ap-touch-min); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisChoiceComponent {
  readonly choices = input.required<DiagnosisChoice[]>();
  readonly catalogue = input<CatalogDiagnosisDto[]>([]);
  readonly lang = input<UiLang>('uk');
  readonly busy = input(false);
  /** Off in the "not sure" mode, where this list is the only way to confirm. */
  readonly cancellable = input(false);
  /** Moves focus into the panel when the user opened it, but not when it is shown on page load. */
  readonly focusOnOpen = input(false);
  readonly titleKey = input('diagnosis.correctionTitle');
  readonly chosen = output<string>();
  readonly cancelled = output<void>();

  protected readonly otherIcon = DIAGNOSIS_CONFIG.otherDiagnosisIcon;
  protected readonly selected = linkedSignal<string | null>(() => (this.choices(), null));
  protected readonly catalogueOpen = linkedSignal(() => this.choices().length === 0);
  protected readonly catalogueRequested = signal(false);
  protected readonly catalogueOptions = computed(() =>
    this.catalogue().map((d) => ({ id: d.id, label: pick(d.nameUk, d.nameEn, this.lang()) })));
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => {
      if (this.focusOnOpen()) this.heading().nativeElement.focus();
    });
  }

  protected pickHypothesis(diagnosisId: string): void {
    this.catalogueOpen.set(false);
    this.selected.set(diagnosisId);
  }

  protected openCatalogue(): void {
    this.catalogueRequested.set(true);
    this.catalogueOpen.set(true);
    this.selected.set(null);
  }
}
