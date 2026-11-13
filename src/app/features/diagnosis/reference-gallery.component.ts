import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { AuthImageComponent } from '../../core/api/auth-image.component';
import { ReferenceImageDto } from '../../core/api/models';
import { isPlaceholderReference } from './diagnosis-view';
import { DIAGNOSIS_CONFIG } from './diagnosis.config';

const REF_ID_ATTR = 'data-ref-id';

/**
 * Reference photos for comparison. A tile appears only once its image has loaded, so failed or offline images
 * leave no empty boxes; generated catalogue stand-ins are replaced by a short note instead of blank tiles.
 * Tapping a tile opens it larger next to the scout's photo.
 */
@Component({
  selector: 'app-reference-gallery',
  imports: [TranslatePipe, AuthImageComponent, DialogModule],
  template: `
    @if (photos().length) {
      <section class="refs" [hidden]="!anyLoaded()" data-testid="references">
        <h3 class="refs__title">{{ 'diagnosis.references' | translate }}</h3>
        <div class="refs__grid">
          @for (ref of photos(); track ref.id) {
            <figure [attr.data-ref-id]="ref.id" [class.refs__tile--ready]="loaded().has(ref.id)">
              <button type="button" class="refs__open" data-testid="reference-open" (click)="opened.set(ref)"
                [attr.aria-label]="'diagnosis.openReference' | translate: { caption: ref.caption }">
                <app-auth-image [src]="ref.url" [cacheId]="ref.id" [alt]="ref.caption" />
              </button>
              <figcaption>
                @if (ref.caption) { <span class="refs__caption">{{ ref.caption }}</span> }
                @if (ref.attribution) { <small class="refs__attr" data-testid="reference-attribution">{{ ref.attribution }}</small> }
              </figcaption>
            </figure>
          }
        </div>
      </section>
      <p-dialog [visible]="!!opened()" (visibleChange)="$event || opened.set(undefined)" [modal]="true"
        [dismissableMask]="true" [draggable]="false" [header]="opened()?.caption ?? ''" [style]="dialogStyle">
        @if (opened(); as ref) {
          <div class="refs__compare" data-testid="reference-dialog">
            @if (comparePhotoUrl(); as own) {
              <figure>
                <app-auth-image [src]="own" [alt]="'diagnosis.yourPhoto' | translate" />
                <figcaption class="refs__caption">{{ 'diagnosis.yourPhoto' | translate }}</figcaption>
              </figure>
            }
            <figure>
              <app-auth-image [src]="ref.url" [cacheId]="ref.id" [alt]="ref.caption" />
              <figcaption>
                <span class="refs__caption">{{ 'diagnosis.referencePhoto' | translate }}</span>
                @if (ref.attribution) { <small class="refs__attr">{{ ref.attribution }}</small> }
              </figcaption>
            </figure>
          </div>
        }
      </p-dialog>
    } @else if (onlyPlaceholders()) {
      <p class="refs__note" data-testid="references-pending">{{ 'diagnosis.referencesPending' | translate }}</p>
    }`,
  styles: `
    .refs__title { font-size: 0.95rem; font-weight: 600; color: var(--ap-text-sec); margin: 8px 0; }
    .refs__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
    .refs__grid figure { display: none; margin: 0; }
    .refs__grid .refs__tile--ready { display: block; }
    .refs__open { all: unset; display: block; width: 100%; cursor: zoom-in; border-radius: var(--ap-radius-sm); overflow: hidden; }
    .refs__open:focus-visible { outline: var(--ap-focus-width) solid var(--ap-focus-ring); outline-offset: var(--ap-focus-offset); }
    figcaption { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
    .refs__caption { font-size: 0.85rem; color: var(--ap-text); }
    .refs__attr { font-size: 0.75rem; color: var(--ap-text-muted); }
    .refs__compare { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .refs__compare figure { margin: 0; }
    .refs__compare app-auth-image { border-radius: var(--ap-radius-sm); overflow: hidden; }
    .refs__note { font-size: 0.9rem; color: var(--ap-text-sec); margin: 8px 0 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceGalleryComponent {
  readonly references = input<ReferenceImageDto[]>([]);
  readonly comparePhotoUrl = input<string>();
  protected readonly dialogStyle = DIAGNOSIS_CONFIG.referenceDialogStyle;
  protected readonly photos = computed(() => this.references().filter((ref) => !isPlaceholderReference(ref)));
  protected readonly onlyPlaceholders = computed(() => this.references().length > 0 && this.photos().length === 0);
  protected readonly loaded = signal<ReadonlySet<string>>(new Set());
  protected readonly anyLoaded = computed(() => this.photos().some((ref) => this.loaded().has(ref.id)));
  protected readonly opened = signal<ReferenceImageDto | undefined>(undefined);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const markLoaded = (event: Event) => {
      const id = (event.target as Element).closest(`[${REF_ID_ATTR}]`)?.getAttribute(REF_ID_ATTR);
      if (id) this.loaded.update((ids) => new Set(ids).add(id));
    };
    // Image load events do not bubble, so they are caught in the capture phase on the host.
    host.addEventListener('load', markLoaded, true);
    inject(DestroyRef).onDestroy(() => host.removeEventListener('load', markLoaded, true));
  }
}
