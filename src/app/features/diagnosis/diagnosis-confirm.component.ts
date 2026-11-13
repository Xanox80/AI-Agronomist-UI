import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector, input, linkedSignal, output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CatalogDiagnosisDto, HypothesisDto } from '../../core/api/models';
import { UiLang } from './current-lang';
import { DiagnosisChoiceComponent } from './diagnosis-choice.component';
import { diagnosisChoices, pick } from './diagnosis-view';
import { DIAGNOSIS_CONFIG } from './diagnosis.config';

/** A fresh object per server answer, so re-confirming the same diagnosis still closes the edit state. */
export interface ConfirmedDiagnosis { diagnosisId: string }

/**
 * "Yes, it is X" / "Not this" under the result. Every confirmation feeds the model's training base,
 * so accepting or correcting the diagnosis takes one or two taps.
 */
@Component({
  selector: 'app-diagnosis-confirm',
  imports: [TranslatePipe, ButtonModule, DiagnosisChoiceComponent],
  template: `
    <div role="status" aria-live="polite">
      @if (showDone()) {
        <div class="done" data-testid="confirmed">
          <p class="done__title"><i [class]="confirmedIcon" aria-hidden="true"></i>
            @if (confirmedName(); as name) {
              {{ 'diagnosis.confirmedAs' | translate: { name } }}
            } @else {
              {{ 'diagnosis.confirmed' | translate }}
            }
          </p>
          <p class="done__note" data-testid="training-note">{{ 'diagnosis.trainingNote' | translate }}</p>
        </div>
      }
    </div>
    @if (showDone()) {
      <p-button data-testid="change-answer" [label]="'diagnosis.changeAnswer' | translate" [icon]="changeAnswerIcon"
        severity="secondary" [text]="true" (onClick)="startEditing()" />
    } @else if (askFirst() && !correcting()) {
      <div class="actions">
        <p-button data-testid="confirm-top" [label]="'diagnosis.confirmTop' | translate: { name: topName() }"
          [icon]="confirmTopIcon" size="large" fluid [disabled]="busy()" [loading]="busy()" (onClick)="confirmed.emit(topId()!)" />
        <p-button data-testid="not-this" [label]="'diagnosis.notThis' | translate" [icon]="notThisIcon" severity="secondary"
          [outlined]="true" size="large" fluid [disabled]="busy()" [ariaLabel]="'diagnosis.notThisAria' | translate"
          (onClick)="correcting.set(true)" />
      </div>
    } @else {
      <app-diagnosis-choice [choices]="choices()" [catalogue]="catalogue()" [lang]="lang()" [busy]="busy()"
        [titleKey]="askFirst() ? 'diagnosis.correctionTitle' : 'diagnosis.pickTitle'"
        [cancellable]="askFirst() || editing()" [focusOnOpen]="correcting() || editing()"
        (chosen)="confirmed.emit($event)" (cancelled)="cancel()" />
    }`,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; }
    .actions { display: flex; flex-direction: column; gap: 8px; }
    .actions ::ng-deep .p-button { min-height: var(--ap-touch-min); }
    .done { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border-radius: var(--ap-radius);
      border: 2px solid var(--ap-ok); background: var(--ap-ok-dim); }
    .done p { margin: 0; }
    .done__title { display: flex; gap: 8px; align-items: center; color: var(--ap-text); font-weight: 600; }
    .done__title i { color: var(--ap-ok); }
    .done__note { color: var(--ap-text-sec); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisConfirmComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  readonly hypotheses = input.required<HypothesisDto[]>();
  readonly catalogue = input<CatalogDiagnosisDto[]>([]);
  readonly lang = input<UiLang>('uk');
  /** Off in the "not sure" mode: the app must not guess, the scout picks a diagnosis or waits for the expert. */
  readonly allowTopConfirm = input(true);
  readonly busy = input(false);
  readonly confirmation = input<ConfirmedDiagnosis>();
  readonly confirmed = output<string>();

  protected readonly confirmedIcon = DIAGNOSIS_CONFIG.confirmedIcon;
  protected readonly confirmTopIcon = DIAGNOSIS_CONFIG.confirmTopIcon;
  protected readonly notThisIcon = DIAGNOSIS_CONFIG.notThisIcon;
  protected readonly changeAnswerIcon = DIAGNOSIS_CONFIG.changeAnswerIcon;
  protected readonly editing = linkedSignal(() => (this.confirmation(), false));
  protected readonly correcting = linkedSignal(() => (this.confirmation(), this.hypotheses(), false));
  protected readonly showDone = computed(() => !!this.confirmation() && !this.editing());
  protected readonly topId = computed(() => this.hypotheses()[0]?.diagnosisId);
  protected readonly askFirst = computed(() => this.allowTopConfirm() && !!this.topId());
  protected readonly topName = computed(() => {
    const top = this.hypotheses()[0];
    return top ? pick(top.nameUk, top.nameEn, this.lang()) : '';
  });
  protected readonly choices = computed(() => diagnosisChoices(this.hypotheses(), this.lang(), this.askFirst()));
  protected readonly confirmedName = computed(() => {
    const id = this.confirmation()?.diagnosisId;
    const named = this.hypotheses().find((h) => h.diagnosisId === id) ?? this.catalogue().find((d) => d.id === id);
    return named && pick(named.nameUk, named.nameEn, this.lang());
  });

  protected startEditing(): void {
    this.editing.set(true);
    if (this.askFirst()) this.focusAfterRender('[data-testid=confirm-top] button');
  }

  protected cancel(): void {
    if (this.correcting()) {
      this.correcting.set(false);
      this.focusAfterRender('[data-testid=not-this] button');
    } else {
      this.editing.set(false);
      this.focusAfterRender('[data-testid=change-answer] button');
    }
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(() => this.host.querySelector<HTMLElement>(selector)?.focus(), { injector: this.injector });
  }
}
