import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Textarea } from 'primeng/textarea';
import { ScoutingWizard } from './scouting-wizard.service';

@Component({
  selector: 'app-scouting-step-note',
  imports: [FormsModule, Button, Message, Textarea, TranslatePipe],
  template: `
    <div class="step">
      <h2>{{ 'scouting.note.title' | translate }}</h2>
      <label for="scout-note">{{ 'scouting.note.text' | translate }}</label>
      <textarea
        id="scout-note" pTextarea rows="4" fluid [ngModel]="wizard.textNote()"
        (ngModelChange)="wizard.textNote.set($event)" [placeholder]="'scouting.note.placeholder' | translate"
      ></textarea>

      @if (wizard.voiceSupported) {
        <div class="voice">
          @if (wizard.recording()) {
            <p-button
              [label]="'scouting.note.stop' | translate" icon="pi pi-stop-circle" severity="danger" size="large"
              (onClick)="wizard.stopVoice()"
            />
          } @else {
            <p-button
              [label]="'scouting.note.record' | translate" icon="pi pi-microphone" size="large"
              (onClick)="wizard.recordVoice()"
            />
          }
          @if (wizard.voiceNote(); as note) {
            <span>{{ 'scouting.note.recorded' | translate: { sec: note.durationSec.toFixed(0) } }}</span>
            <p-button
              icon="pi pi-trash" severity="danger" text [ariaLabel]="'scouting.note.discard' | translate"
              (onClick)="wizard.voiceNote.set(null)"
            />
          }
        </div>
        @if (wizard.voiceError()) {
          <p-message severity="error" size="small">{{ 'scouting.note.micDenied' | translate }}</p-message>
        }
      }

      @if (wizard.submitFailed()) {
        <p-message severity="error">{{ 'scouting.submitFailed' | translate }}</p-message>
      }
    </div>
  `,
  styles: `
    .voice { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepNoteComponent {
  protected readonly wizard = inject(ScoutingWizard);
}
