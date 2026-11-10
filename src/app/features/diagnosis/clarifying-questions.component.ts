import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { QuestionDto } from '../../core/api/models';
import { UiLang } from './current-lang';
import { answerOptions, pick } from './diagnosis-view';

@Component({
  selector: 'app-clarifying-questions',
  imports: [TranslatePipe, ButtonModule],
  template: `
    @for (q of questions(); track q.id) {
      <fieldset class="q">
        <legend>{{ text(q) }}</legend>
        <div class="q__options">
          @for (o of options(q); track o.value) {
            <button type="button" class="q__option" [class.q__option--on]="chosen()[q.id] === o.value"
              [attr.aria-pressed]="chosen()[q.id] === o.value" (click)="choose(q.id, o.value)">
              {{ o.label ?? (o.labelKey! | translate) }}
            </button>
          }
        </div>
      </fieldset>
    }
    <p-button [label]="'diagnosis.applyAnswers' | translate" [disabled]="busy() || !hasAnswers()" [loading]="busy()"
      (onClick)="submitted.emit(chosen())" />`,
  styles: `
    .q { border: 0; padding: 0; margin: 0 0 16px; }
    legend { font-weight: 600; color: var(--ap-text); margin-bottom: 8px; }
    .q__options { display: flex; flex-wrap: wrap; gap: 8px; }
    .q__option { min-height: var(--ap-touch-min); min-width: var(--ap-touch-min); padding: 0 16px; border-radius: var(--ap-radius);
      border: 1px solid var(--ap-border); background: var(--ap-surface); color: var(--ap-text); cursor: pointer; }
    .q__option--on { border-color: var(--ap-accent); background: var(--ap-accent-dim); font-weight: 600; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClarifyingQuestionsComponent {
  readonly questions = input.required<QuestionDto[]>();
  readonly answers = input<Record<string, string>>({});
  readonly lang = input<UiLang>('uk');
  readonly busy = input(false);
  readonly submitted = output<Record<string, string>>();
  protected readonly chosen = linkedSignal<Record<string, string>>(() => ({ ...this.answers() }));

  protected text(question: QuestionDto): string {
    return pick(question.textUk, question.textEn, this.lang());
  }

  protected options(question: QuestionDto) {
    return answerOptions(question, this.lang());
  }

  protected choose(questionId: string, value: string): void {
    this.chosen.update((current) => ({ ...current, [questionId]: value }));
  }

  protected hasAnswers(): boolean {
    return Object.keys(this.chosen()).length > 0;
  }
}
