import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { angleKeyFor, hintKeysFor } from './object-types';
import { ScoutingWizard } from './scouting-wizard.service';
import { SCOUTING_CONFIG } from './scouting.config';

@Component({
  selector: 'app-scouting-step-photos',
  imports: [FormsModule, Button, Message, ToggleSwitch, TranslatePipe],
  template: `
    <div class="step">
      <h2>{{ 'scouting.photos.title' | translate: { max: maxPhotos } }}</h2>
      <div aria-live="polite">
        @if (wizard.photoLimitReached()) {
          <p-message severity="success" size="small" icon="pi pi-check">
            {{ 'scouting.photos.limitReached' | translate }}
          </p-message>
        } @else {
          <p-message severity="info" size="small" icon="pi pi-camera">{{ nextAngleKey() | translate }}</p-message>
        }
      </div>

      <input #camera type="file" accept="image/*" capture="environment" hidden (change)="onFile($event)" />
      <p-button
        [label]="takeLabelKey() | translate" icon="pi pi-camera" size="large" fluid
        [loading]="wizard.checkingPhoto()" [disabled]="!wizard.canAddPhoto() || wizard.checkingPhoto()"
        (onClick)="takePhoto(camera)"
      />
      @if (wizard.checkingPhoto()) {
        <p class="checking" role="status">{{ 'scouting.photos.checking' | translate }}</p>
      }

      <ul class="photo-list">
        @for (photo of wizard.photos(); track photo.clientId; let index = $index) {
          <li class="photo-card" [class.needs-retake]="photo.issues.length">
            <img [src]="photo.previewUrl" [alt]="'scouting.photos.alt' | translate: { n: index + 1 }" />
            <div class="photo-body">
              <strong>{{ 'scouting.photos.alt' | translate: { n: index + 1 } }}</strong>
              @if (photo.issues.length) {
                @for (issue of photo.issues; track issue) {
                  <p class="issue"><i class="pi pi-exclamation-triangle" aria-hidden="true"></i> {{ issue | translate }}</p>
                }
                <p class="retake-prompt">{{ 'scouting.quality.retake' | translate }}</p>
              } @else {
                <p class="quality-ok"><i class="pi pi-check-circle" aria-hidden="true"></i> {{ 'scouting.quality.ok' | translate }}</p>
              }
              <div class="photo-actions">
                <p-button
                  [label]="'scouting.photos.retake' | translate" icon="pi pi-refresh"
                  [severity]="photo.issues.length ? 'primary' : 'secondary'" [disabled]="wizard.checkingPhoto()"
                  (onClick)="retake(photo.clientId, camera)"
                />
                <p-button
                  icon="pi pi-trash" severity="danger" text
                  [ariaLabel]="'scouting.photos.remove' | translate: { n: index + 1 }"
                  (onClick)="wizard.removePhoto(photo.clientId)"
                />
              </div>
            </div>
          </li>
        }
      </ul>

      @if (hintKeys().length) {
        <details class="hints" [open]="wizard.photos().length === 0">
          <summary>{{ 'scouting.hints.title' | translate }}</summary>
          <ul>
            @for (key of hintKeys(); track key) {
              <li>{{ key | translate }}</li>
            }
          </ul>
        </details>
      }

      <div class="scale-toggle">
        <p-toggleswitch
          inputId="scout-scale" [ngModel]="wizard.scaleMarkerUsed()" (ngModelChange)="wizard.scaleMarkerUsed.set($event)"
        />
        <label for="scout-scale">{{ 'scouting.photos.scaleMarker' | translate }}</label>
      </div>
    </div>
  `,
  styles: `
    .step { display: grid; gap: 0.75rem; }
    .step h2 { margin: 0; }
    .checking { margin: 0; color: var(--ap-text-sec); text-align: center; }
    .photo-list { display: grid; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
    .photo-card {
      display: grid; grid-template-columns: 6.5rem 1fr; gap: 0.75rem; padding: 0.75rem;
      background: var(--ap-surface); border: 2px solid var(--ap-border); border-radius: var(--ap-radius);
    }
    .photo-card.needs-retake { border-color: var(--ap-warn); }
    .photo-card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--ap-radius-sm); }
    .photo-body { display: grid; gap: 0.375rem; align-content: start; min-width: 0; }
    .photo-body p { margin: 0; }
    .issue { color: var(--ap-text); }
    .issue .pi { color: var(--ap-warn); }
    .retake-prompt { color: var(--ap-text-sec); font-size: 0.9rem; }
    .quality-ok { color: var(--ap-accent); font-weight: 600; }
    .photo-actions { display: flex; gap: 0.5rem; justify-content: space-between; }
    .hints { padding: 0.75rem 1rem; background: var(--ap-info-dim); border-radius: var(--ap-radius); }
    .hints summary {
      display: flex; align-items: center; min-height: var(--ap-touch-min); font-weight: 600; cursor: pointer;
    }
    .hints ul { margin: 0; padding-left: 1.25rem; display: grid; gap: 0.375rem; }
    .scale-toggle { display: flex; align-items: center; gap: 0.75rem; min-height: var(--ap-touch-min); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepPhotosComponent {
  protected readonly wizard = inject(ScoutingWizard);
  protected readonly maxPhotos = SCOUTING_CONFIG.maxPhotos;
  protected readonly hintKeys = computed(() => {
    const organ = this.wizard.organ();
    return organ ? hintKeysFor(organ) : [];
  });
  protected readonly nextAngleKey = computed(() =>
    angleKeyFor(Math.min(this.wizard.photos().length + 1, SCOUTING_CONFIG.maxPhotos)),
  );
  protected readonly takeLabelKey = computed(() =>
    this.wizard.photos().length ? 'scouting.photos.takeMore' : 'scouting.photos.take',
  );

  protected takePhoto(input: HTMLInputElement): void {
    this.wizard.beginPhotoCapture();
    input.click();
  }

  protected retake(clientId: string, input: HTMLInputElement): void {
    this.wizard.beginPhotoCapture(clientId);
    input.click();
  }

  protected async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await this.wizard.receivePhoto(file);
  }
}
