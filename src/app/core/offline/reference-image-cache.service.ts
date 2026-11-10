import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReferenceImageDto } from '../api/models';
import { OFFLINE_STORES } from './offline.config';
import { KeyValueStore, OfflineDb } from './offline-db';

interface CachedReferenceImage { id: string; blob: Blob }

/** Reference photos stored as blobs so diagnosis explanations work offline; fetched through the authenticated client. */
@Injectable({ providedIn: 'root' })
export class ReferenceImageCache {
  private readonly http = inject(HttpClient);
  private readonly store: KeyValueStore<CachedReferenceImage> =
    inject(OfflineDb).store<CachedReferenceImage>(OFFLINE_STORES.referenceImages);

  /** Downloads images not cached yet; individual failures are skipped and retried on the next refresh. */
  async cacheMissing(images: ReferenceImageDto[]): Promise<void> {
    for (const image of images) {
      if (await this.store.get(image.id)) continue;
      try {
        const blob = await firstValueFrom(this.http.get(image.url, { responseType: 'blob' }));
        await this.store.put({ id: image.id, blob });
      } catch {
        continue;
      }
    }
  }

  async blob(imageId: string): Promise<Blob | undefined> {
    return (await this.store.get(imageId))?.blob;
  }
}
