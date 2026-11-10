import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CatalogDiagnosisDto, HypothesisDto } from '../../core/api/models';
import { UiLang } from './current-lang';
import { pick } from './diagnosis-view';

@Component({
  selector: 'app-diagnosis-confirm',
  imports: [FormsModule, TranslatePipe, ButtonModule, SelectModule],
  template: `
    @if (confirmedId()) {
      <p class="ok" data-testid="confirmed">{{ 'diagnosis.confirmed' | translate }}</p>
    }
    @if (allowTopConfirm() && topId(); as id) {
      <p-button [label]="'diagnosis.confirmTop' | translate" [disabled]="busy()" (onClick)="confirmed.emit(id)" />
    }
    <label class="field">{{ 'diagnosis.correctLabel' | translate }}
      <p-select [options]="options()" optionLabel="label" optionValue="id" [filter]="true" [ngModel]="choice()"
        (ngModelChange)="choice.set($event)" [placeholder]="'diagnosis.pickFromCatalogue' | translate" appendTo="body" />
    </label>
    <p-button [label]="'diagnosis.confirmCorrection' | translate" severity="secondary"
      [disabled]="busy() || !choice()" (onClick)="confirmed.emit(choice()!)" />`,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 6px; color: var(--ap-text-sec); }
    .ok { color: var(--ap-ok); font-weight: 600; margin: 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisConfirmComponent {
  readonly hypotheses = input.required<HypothesisDto[]>();
  readonly catalogue = input<CatalogDiagnosisDto[]>([]);
  readonly lang = input<UiLang>('uk');
  /** Off in the "not sure" mode: the app must not guess, the scout picks from the catalogue or waits for the expert. */
  readonly allowTopConfirm = input(true);
  readonly busy = input(false);
  readonly confirmedId = input<string>();
  readonly confirmed = output<string>();
  protected readonly choice = linkedSignal<string | null>(() => (this.hypotheses(), null));
  protected readonly topId = computed(() => this.hypotheses()[0]?.diagnosisId);
  protected readonly options = computed(() =>
    this.catalogue().map((d) => ({ id: d.id, label: pick(d.nameUk, d.nameEn, this.lang()) })));
}
