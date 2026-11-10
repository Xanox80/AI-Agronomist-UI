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
      @if (wizard.fix(); as fix) {
        <p-message severity="info" size="small">
          {{ 'scouting.field.gpsFix' | translate: { accuracy: fix.accuracyM.toFixed(0) } }}
        </p-message>
      } @else {
        <p-message severity="warn" size="small">{{ 'scouting.field.noGps' | translate }}</p-message>
      }
      @if (wizard.fieldLinkMethod() === 'gps') {
        <p-message severity="success" size="small">{{ 'scouting.field.suggested' | translate }}</p-message>
      }
      <label for="scout-field">{{ 'scouting.field.field' | translate }}</label>
      <p-select
        inputId="scout-field" [options]="wizard.fieldOptions()" optionLabel="label" optionValue="value"
        [ngModel]="wizard.fieldId()" (ngModelChange)="wizard.selectField($event)" [showClear]="true"
        [filter]="true" [placeholder]="'scouting.field.pick' | translate" appendTo="body" fluid
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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepFieldComponent {
  protected readonly wizard = inject(ScoutingWizard);
}
