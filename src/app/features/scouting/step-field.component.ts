import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { ScoutingWizard } from './scouting-wizard.service';

@Component({
  selector: 'app-scouting-step-field',
  imports: [FormsModule, Select, Message, TranslatePipe],
  template: `
    <div class="step">
      <h2>{{ 'scouting.field.title' | translate }}</h2>
      <div class="status" aria-live="polite">
        @if (wizard.loading()) {
          <p-message severity="secondary" size="small" icon="pi pi-spin pi-spinner">
            {{ 'scouting.field.locating' | translate }}
          </p-message>
        } @else if (wizard.fieldLinkMethod() === 'gps') {
          <p-message severity="success" size="small" icon="pi pi-map-marker">
            {{ 'scouting.field.suggested' | translate: { accuracy: accuracy() } }}
          </p-message>
        } @else if (wizard.fix()) {
          <p-message severity="info" size="small" icon="pi pi-map-marker">
            {{ 'scouting.field.gpsFix' | translate: { accuracy: accuracy() } }}
          </p-message>
        } @else {
          <p-message severity="warn" size="small">{{ 'scouting.field.noGps' | translate }}</p-message>
        }
      </div>
      <label for="scout-field">{{ 'scouting.field.field' | translate }}</label>
      <p-select
        inputId="scout-field" [options]="wizard.fieldOptions()" optionLabel="label" optionValue="value"
        [ngModel]="wizard.fieldId()" (ngModelChange)="wizard.selectField($event)" [showClear]="true"
        [filter]="true" [placeholder]="'scouting.field.pick' | translate" [loading]="wizard.loading()"
        [emptyMessage]="'scouting.field.noFields' | translate" appendTo="body" fluid
      />
      <label for="scout-crop">{{ 'scouting.field.crop' | translate }}</label>
      <p-select
        inputId="scout-crop" [options]="wizard.cropOptions()" optionLabel="label" optionValue="value"
        [ngModel]="wizard.cropId()" (ngModelChange)="wizard.selectCrop($event)" [showClear]="true"
        [placeholder]="'scouting.field.pickCrop' | translate" appendTo="body" fluid
      />
      <label for="scout-bbch">{{ 'scouting.field.bbch' | translate }}</label>
      <p-select
        inputId="scout-bbch" [options]="wizard.bbchOptions()" optionLabel="label" optionValue="value"
        [ngModel]="wizard.bbchStage()" (ngModelChange)="wizard.bbchStage.set($event ?? undefined)" [showClear]="true"
        [placeholder]="'scouting.field.pickBbch' | translate" appendTo="body" fluid
      />
      <p class="optional">{{ 'scouting.field.optional' | translate }}</p>
    </div>
  `,
  styles: `
    .step { display: grid; gap: 0.5rem; }
    .step h2 { margin: 0; }
    .status { margin-bottom: 0.5rem; }
    label { margin-top: 0.5rem; font-weight: 600; }
    .optional { margin: 0.25rem 0 0; color: var(--ap-text-sec); font-size: 0.9rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepFieldComponent {
  protected readonly wizard = inject(ScoutingWizard);

  protected accuracy(): string {
    return this.wizard.fix()?.accuracyM.toFixed(0) ?? '';
  }
}
