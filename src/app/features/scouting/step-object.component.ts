import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { hintKeysFor, OBJECT_TYPES } from './object-types';
import { ScoutingWizard } from './scouting-wizard.service';

@Component({
  selector: 'app-scouting-step-object',
  imports: [TranslatePipe],
  template: `
    <div class="step">
      <h2>{{ 'scouting.object.title' | translate }}</h2>
      <div class="object-grid" role="radiogroup" [attr.aria-label]="'scouting.object.title' | translate">
        @for (organ of objectTypes; track organ) {
          <button
            type="button" role="radio" class="object-option" [class.selected]="wizard.organ() === organ"
            [attr.aria-checked]="wizard.organ() === organ" (click)="wizard.organ.set(organ)"
          >
            {{ 'scouting.object.' + organ | translate }}
          </button>
        }
      </div>
      @if (hintKeys().length) {
        <section class="hints" aria-live="polite">
          <h3>{{ 'scouting.hints.title' | translate }}</h3>
          <ul>
            @for (key of hintKeys(); track key) {
              <li>{{ key | translate }}</li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: `
    .object-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .object-option {
      min-height: var(--ap-touch-min); padding: 0.75rem; font-size: 1rem; cursor: pointer;
      background: var(--ap-surface); color: var(--ap-text);
      border: 2px solid var(--ap-border); border-radius: var(--ap-radius);
    }
    .object-option.selected { border-color: var(--ap-accent); background: var(--ap-accent-dim); }
    .hints { margin-top: 1rem; padding: 0.75rem 1rem; background: var(--ap-info-dim); border-radius: var(--ap-radius); }
    .hints h3 { margin: 0 0 0.5rem; font-size: 1rem; }
    .hints ul { margin: 0; padding-left: 1.25rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepObjectComponent {
  protected readonly wizard = inject(ScoutingWizard);
  protected readonly objectTypes = OBJECT_TYPES;
  protected readonly hintKeys = computed(() => {
    const organ = this.wizard.organ();
    return organ ? hintKeysFor(organ) : [];
  });
}
