import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, Injector, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReferenceImageCache } from '../offline/reference-image-cache.service';

/** Shows an image from a JWT-protected endpoint: a plain img tag cannot send the Authorization header. A cached reference image fills in when the request fails (offline). */
@Component({
  selector: 'app-auth-image',
  template: `@if (objectUrl(); as url) { <img [src]="url" [alt]="alt()" [attr.loading]="loading()" /> }`,
  styles: `:host { display: block; } img { display: block; width: 100%; height: auto; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthImageComponent {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  readonly src = input.required<string>();
  readonly alt = input('');
  readonly cacheId = input<string>();
  readonly loading = input<'lazy' | 'eager'>('eager');
  protected readonly objectUrl = signal<string | undefined>(undefined);

  constructor() {
    effect((onCleanup) => {
      const source = this.src();
      let created: string | undefined;
      let cancelled = false;
      const show = (blob: Blob) => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        this.objectUrl.set(created);
      };
      firstValueFrom(this.http.get(source, { responseType: 'blob' }))
        .then(show, (error) => this.cached(error).then(show))
        .catch(() => this.objectUrl.set(undefined));
      onCleanup(() => {
        cancelled = true;
        if (created) URL.revokeObjectURL(created);
      });
    });
  }

  private async cached(error: unknown): Promise<Blob> {
    const cacheId = this.cacheId();
    const blob = cacheId ? await this.injector.get(ReferenceImageCache).blob(cacheId).catch(() => undefined) : undefined;
    if (!blob) throw error;
    return blob;
  }
}
