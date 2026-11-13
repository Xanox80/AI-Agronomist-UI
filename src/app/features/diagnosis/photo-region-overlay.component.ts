import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AuthImageComponent } from '../../core/api/auth-image.component';
import { DiagnosisRegion } from '../../core/api/models';
import { regionStyle } from './diagnosis-view';

@Component({
  selector: 'app-photo-region-overlay',
  imports: [AuthImageComponent],
  template: `
    <div class="overlay">
      <app-auth-image [src]="photoUrl()" [alt]="alt()" />
      @if (boxStyle(); as style) {
        <div class="overlay__box" [style]="style" data-testid="region-box"></div>
      }
    </div>`,
  styles: `
    :host { --photo-max-height: min(420px, 55vh); display: flex; justify-content: center; }
    .overlay { position: relative; display: block; width: fit-content; max-width: 100%; border-radius: var(--ap-radius); overflow: hidden; }
    /* The wrapper hugs the image so the region box (percent of the wrapper) stays on the photo. */
    .overlay ::ng-deep img { width: auto; max-width: 100%; max-height: var(--photo-max-height); }
    .overlay__box { position: absolute; border: 3px solid var(--ap-danger); background: var(--ap-danger-dim); box-sizing: border-box; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoRegionOverlayComponent {
  readonly photoUrl = input.required<string>();
  readonly region = input<DiagnosisRegion>();
  readonly alt = input('');
  protected readonly boxStyle = computed(() => {
    const region = this.region();
    return region ? regionStyle(region) : undefined;
  });
}
