import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { FieldsApi } from '../../core/api/fields.api';
import { ObservationsApi } from '../../core/api/observations.api';
import { BbchStageDto, CatalogPackDto, CropDto, FieldDto, LatLng } from '../../core/api/models';
import { CatalogPackCache } from '../../core/offline/catalog-pack-cache.service';
import { contourContains } from './point-in-polygon';
import { SCOUTING_CONFIG } from './scouting.config';

/** Reference data of wizard step 1: fields (online or cached), GPS suggestion, remembered crop, crops, BBCH. */
@Injectable({ providedIn: 'root' })
export class ScoutingContextService {
  private readonly fieldsApi = inject(FieldsApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly packCache = inject(CatalogPackCache);
  private readonly observationsApi = inject(ObservationsApi);

  async loadFields(): Promise<FieldDto[]> {
    try {
      const page = await firstValueFrom(this.fieldsApi.list({ pageSize: SCOUTING_CONFIG.fieldsPageSize }));
      this.writeCache(page.items);
      return page.items;
    } catch {
      return this.readCache();
    }
  }

  async suggestFieldId(point: LatLng, fields: FieldDto[]): Promise<string | undefined> {
    try {
      const result = await firstValueFrom(this.fieldsApi.locate(point));
      return result.matches[0]?.fieldId;
    } catch {
      return fields.find((field) => field.contour && contourContains(field.contour, point))?.id;
    }
  }

  async rememberedCropId(field: FieldDto): Promise<string | undefined> {
    try {
      const memory = await firstValueFrom(this.fieldsApi.getCropMemory(field.id));
      // the device value may still be in the outbox, so it is newer than the server memory
      return this.readCropMemory()[field.id] ?? memory.cropId ?? field.cropId;
    } catch {
      return this.readCropMemory()[field.id] ?? field.cropId;
    }
  }

  async loadPhotoCount(observationId: string): Promise<number> {
    return (await firstValueFrom(this.observationsApi.get(observationId))).photos.length;
  }

  loadCrops(): Promise<CropDto[]> {
    return this.orCachedPack(() => firstValueFrom(this.catalogApi.crops()), (pack) => pack.crops);
  }

  loadBbchStages(cropId: string): Promise<BbchStageDto[]> {
    return this.orCachedPack(
      () => firstValueFrom(this.catalogApi.bbchStages(cropId)),
      (pack) => pack.bbch.filter((stage) => stage.cropId === cropId),
    );
  }

  /** Keeps the last crop per field on the device so it is prefilled offline; the server learns it from the observation. */
  rememberCropLocally(fieldId: string | undefined, cropId: string | undefined): void {
    if (!fieldId || !cropId) return;
    this.writeJson(SCOUTING_CONFIG.cropMemoryCacheKey, { ...this.readCropMemory(), [fieldId]: cropId });
  }

  private async orCachedPack<T>(request: () => Promise<T[]>, fromPack: (pack: CatalogPackDto) => T[]): Promise<T[]> {
    try {
      return await request();
    } catch {
      try {
        const pack = await this.packCache.get();
        return pack ? fromPack(pack) : [];
      } catch {
        return [];
      }
    }
  }

  private readCropMemory(): Record<string, string> {
    return this.readJson<Record<string, string>>(SCOUTING_CONFIG.cropMemoryCacheKey, {});
  }

  private writeCache(fields: FieldDto[]): void {
    this.writeJson(SCOUTING_CONFIG.fieldsCacheKey, fields);
  }

  private readCache(): FieldDto[] {
    return this.readJson<FieldDto[]>(SCOUTING_CONFIG.fieldsCacheKey, []);
  }

  private writeJson(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable: the offline fallback just has no cache
    }
  }

  private readJson<T>(key: string, fallback: T): T {
    try {
      return (JSON.parse(localStorage.getItem(key) ?? 'null') as T | null) ?? fallback;
    } catch {
      return fallback;
    }
  }
}
