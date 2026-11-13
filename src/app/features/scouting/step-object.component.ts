import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OBJECT_TYPES } from './object-types';
import { ScoutingWizard } from './scouting-wizard.service';

@Component({
  selector: 'app-scouting-step-object',
  imports: [TranslatePipe],
  template: `
    <div class="step">
      <h2 id="scout-object-title">{{ 'scouting.object.title' | translate }}</h2>
      <p class="lead">{{ 'scouting.object.lead' | translate }}</p>
      <div class="object-grid" role="radiogroup" aria-labelledby="scout-object-title">
        @for (organ of objectTypes; track organ) {
          <button
            type="button" role="radio" class="object-option" [class.selected]="wizard.organ() === organ"
            [attr.aria-checked]="wizard.organ() === organ" (click)="wizard.chooseOrgan(organ)"
          >
            @if (wizard.organ() === organ) {
              <i class="pi pi-check" aria-hidden="true"></i>
            }
            {{ 'scouting.object.' + organ | translate }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .lead { margin: 0 0 1rem; color: var(--ap-text-sec); }
    .object-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .object-option {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      min-height: calc(var(--ap-touch-min) * 1.5); padding: 0.75rem; font-size: 1.05rem; font-weight: 600;
      cursor: pointer; background: var(--ap-surface); color: var(--ap-text);
      border: 2px solid var(--ap-border); border-radius: var(--ap-radius);
    }
    .object-option.selected { border-color: var(--ap-accent); background: var(--ap-accent-dim); }
    .object-option:focus-visible { outline: 3px solid var(--ap-accent); outline-offset: 2px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepObjectComponent {
  protected readonly wizard = inject(ScoutingWizard);
  protected readonly objectTypes = OBJECT_TYPES;
}
