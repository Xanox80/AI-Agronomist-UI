import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { CatalogStatusDto } from '../../core/api/models';
import { CatalogPackCache } from '../../core/offline/catalog-pack-cache.service';
import { SETTINGS_CONFIG } from './settings.config';

/** FR-25: the farm's reference-pack region and a manual pack refresh. */
@Injectable({ providedIn: 'root' })
export class RegionPackService {
  private readonly authApi = inject(AuthApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly packCache = inject(CatalogPackCache);

  readonly regionCodes = [...SETTINGS_CONFIG.regionCodes];
  readonly region = signal('');
  readonly status = signal<CatalogStatusDto | null>(null);
  readonly refreshedVersion = signal<number | null>(null);
  readonly failed = signal(false);

  async load(): Promise<void> {
    const [farm, status] = await Promise.all([
      firstValueFrom(this.authApi.getFarm()),
      firstValueFrom(this.catalogApi.status()),
    ]);
    this.region.set(farm.regionCode);
    this.status.set(status);
  }

  async selectRegion(regionCode: string): Promise<void> {
    await this.guarded(async () => {
      const farm = await firstValueFrom(this.authApi.updateFarm({ regionCode }));
      this.region.set(farm.regionCode);
      this.packCache.rememberRegion(farm.regionCode);
      this.status.set(await firstValueFrom(this.catalogApi.status(farm.regionCode)));
    });
  }

  /** Stores the region pack on the device so the directories work offline. */
  async refresh(): Promise<void> {
    await this.guarded(async () => {
      const region = this.region();
      await this.packCache.refresh(region);
      this.refreshedVersion.set((await this.packCache.get(region))?.version ?? null);
    });
  }

  private async guarded(action: () => Promise<void>): Promise<void> {
    this.failed.set(false);
    try {
      await action();
    } catch {
      this.failed.set(true);
    }
  }
}
