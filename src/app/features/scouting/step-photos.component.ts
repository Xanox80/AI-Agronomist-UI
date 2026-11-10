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
      <p-message severity="info" size="small">{{ nextAngleKey() | translate }}</p-message>
      <ul class="hints">
        @for (key of hintKeys(); track key) {
          <li>{{ key | translate }}</li>
        }
      </ul>

      <input #camera type="file" accept="image/*" capture="environment" hidden (change)="onFile($event)" />
      <p-button
        [label]="'scouting.photos.take' | translate" icon="pi pi-camera" size="large" fluid
        [disabled]="!wizard.canAddPhoto()" (onClick)="takePhoto(camera)"
      />

      <div class="photo-list">
        @for (photo of wizard.photos(); track photo.clientId; let index = $index) {
          <article class="photo-card">
            <img [src]="photo.previewUrl" [alt]="'scouting.photos.alt' | translate: { n: index + 1 }" />
            @for (issue of photo.issues; track issue) {
              <p-message severity="warn" size="small">{{ issue | translate }}</p-message>
            }
            @if (photo.issues.length) {
              <p class="retake-prompt">{{ 'scouting.quality.retake' | translate }}</p>
            }
            <div class="photo-actions">
              <p-button
                [label]="'scouting.photos.retake' | translate" icon="pi pi-refresh" severity="secondary"
                (onClick)="retake(photo.clientId, camera)"
              />
              <p-button
                [label]="'scouting.photos.remove' | translate" icon="pi pi-trash" severity="danger" text
                (onClick)="wizard.removePhoto(photo.clientId)"
              />
            </div>
          </article>
        }
      </div>

      <label class="scale-toggle">
        <p-toggleswitch [ngModel]="wizard.scaleMarkerUsed()" (ngModelChange)="wizard.scaleMarkerUsed.set($event)" />
        <span>{{ 'scouting.photos.scaleMarker' | translate }}</span>
      </label>
    </div>
  `,
  styles: `
    .hints { margin: 0.75rem 0; padding-left: 1.25rem; color: var(--ap-text-sec); }
    .photo-list { display: grid; gap: 0.75rem; margin: 1rem 0; }
    .photo-card {
      display: grid; gap: 0.5rem; padding: 0.75rem;
      background: var(--ap-surface); border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
    }
    .photo-card img { width: 100%; max-height: 16rem; object-fit: contain; border-radius: var(--ap-radius-sm); }
    .retake-prompt { margin: 0; color: var(--ap-warn); font-weight: 600; }
    .photo-actions { display: flex; gap: 0.5rem; }
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
