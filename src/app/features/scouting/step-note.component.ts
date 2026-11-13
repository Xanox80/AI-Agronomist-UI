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
      <p class="lead">{{ 'scouting.note.optional' | translate }}</p>

      @if (wizard.voiceSupported) {
        <div class="voice">
          @if (wizard.recording()) {
            <p-button
              [label]="'scouting.note.stop' | translate" icon="pi pi-stop-circle" severity="danger" size="large" fluid
              (onClick)="wizard.stopVoice()"
            />
          } @else {
            <p-button
              [label]="'scouting.note.record' | translate" icon="pi pi-microphone" severity="secondary" size="large" fluid
              (onClick)="wizard.recordVoice()"
            />
          }
          @if (wizard.voiceNote(); as note) {
            <div class="voice-note" role="status">
              <span><i class="pi pi-check" aria-hidden="true"></i>
                {{ 'scouting.note.recorded' | translate: { sec: note.durationSec.toFixed(0) } }}</span>
              <p-button
                icon="pi pi-trash" severity="danger" text [ariaLabel]="'scouting.note.discard' | translate"
                (onClick)="wizard.voiceNote.set(null)"
              />
            </div>
          }
        </div>
        @if (wizard.voiceError()) {
          <p-message severity="error" size="small">{{ 'scouting.note.micDenied' | translate }}</p-message>
        }
      }

      <label for="scout-note">{{ 'scouting.note.text' | translate }}</label>
      <textarea
        id="scout-note" pTextarea rows="3" fluid [ngModel]="wizard.textNote()"
        (ngModelChange)="wizard.textNote.set($event)" [placeholder]="'scouting.note.placeholder' | translate"
      ></textarea>

      <div aria-live="polite">
        @if (!wizard.online()) {
          <p-message severity="warn" icon="pi pi-wifi">{{ 'scouting.offlineDraft' | translate }}</p-message>
        }
        @if (wizard.submitting()) {
          <p-message severity="secondary" icon="pi pi-spin pi-spinner">{{ 'scouting.sending' | translate }}</p-message>
        }
        @if (wizard.submitFailed()) {
          <p-message severity="error">{{ 'scouting.submitFailed' | translate }}</p-message>
        }
      </div>
    </div>
  `,
  styles: `
    .step { display: grid; gap: 0.75rem; }
    .step h2, .lead { margin: 0; }
    .lead { color: var(--ap-text-sec); }
    label { font-weight: 600; }
    .voice { display: grid; gap: 0.5rem; }
    .voice-note { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepNoteComponent {
  protected readonly wizard = inject(ScoutingWizard);
}
