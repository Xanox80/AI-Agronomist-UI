import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { CatalogApi } from '../api/catalog.api';
import { CatalogPackDto } from '../api/models';
import { readStored, writeStored } from '../../features/shell/safe-storage';
import { mergePack } from './catalog-pack-merge';
import { OFFLINE_CONFIG, OFFLINE_STORES } from './offline.config';
import { KeyValueStore, OfflineDb } from './offline-db';

/** Regional catalogue/reference package kept in IndexedDB with a version check and delta refresh (FR-25). */
@Injectable({ providedIn: 'root' })
export class CatalogPackCache {
  private readonly api = inject(CatalogApi);
  private readonly authApi = inject(AuthApi);
  private readonly config = inject(OFFLINE_CONFIG);
  private readonly store: KeyValueStore<CatalogPackDto> = inject(OfflineDb).store<CatalogPackDto>(OFFLINE_STORES.catalog);

  /** The region of the farm's pack as last seen online; the default until the farm has been read once. */
  knownRegion(): string {
    return readStored(this.config.catalogRegionStorageKey) ?? this.config.catalogRegion;
  }

  rememberRegion(region: string): void {
    writeStored(this.config.catalogRegionStorageKey, region);
  }

  get(region: string = this.knownRegion()): Promise<CatalogPackDto | undefined> {
    return this.store.get(region);
  }

  /** Returns the up-to-date pack of the farm's region (or the given one), downloading a delta only when the server version is newer. */
  async refresh(region?: string): Promise<CatalogPackDto> {
    const target = region ?? (await this.farmRegion());
    this.rememberRegion(target);
    const cached = await this.get(target);
    const status = await firstValueFrom(this.api.status(target));
    if (cached && cached.version >= status.version) return cached;
    const delta = await firstValueFrom(this.api.pack({ region: target, sinceVersion: cached?.version }));
    const merged = mergePack(cached, delta);
    await this.store.put(merged);
    return merged;
  }

  private async farmRegion(): Promise<string> {
    try {
      return (await firstValueFrom(this.authApi.getFarm())).regionCode;
    } catch {
      return this.knownRegion();
    }
  }
}
