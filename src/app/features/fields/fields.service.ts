import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { FieldsApi } from '../../core/api/fields.api';
import { ObservationsApi } from '../../core/api/observations.api';
import {
  CropDto, FieldDto, FieldImportResult, FieldInput, FieldLocateResult, LatLng, ObservationDto, Page,
} from '../../core/api/models';
import { FIELDS_CONFIG } from './fields.config';

@Injectable({ providedIn: 'root' })
export class FieldsService {
  private readonly fieldsApi = inject(FieldsApi);
  private readonly observationsApi = inject(ObservationsApi);
  private readonly catalogApi = inject(CatalogApi);

  list(q?: string, cropId?: string, page = 1): Promise<Page<FieldDto>> {
    return firstValueFrom(
      this.fieldsApi.list({ q: q || undefined, cropId: cropId || undefined, page, pageSize: FIELDS_CONFIG.pageSize }),
    );
  }

  async locate(point: LatLng): Promise<FieldLocateResult['matches']> {
    return (await firstValueFrom(this.fieldsApi.locate(point))).matches;
  }

  async rememberedCrop(fieldId: string): Promise<string | undefined> {
    return (await firstValueFrom(this.fieldsApi.getCropMemory(fieldId))).cropId;
  }

  get(id: string): Promise<FieldDto> {
    return firstValueFrom(this.fieldsApi.get(id));
  }

  async save(id: string | undefined, input: FieldInput): Promise<FieldDto> {
    const saved = await firstValueFrom(id ? this.fieldsApi.update(id, input) : this.fieldsApi.create(input));
    if (input.cropId) await firstValueFrom(this.fieldsApi.setCropMemory(saved.id, input.cropId)).catch(() => undefined);
    return saved;
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.fieldsApi.remove(id));
  }

  importFile(file: File, dryRun: boolean): Promise<FieldImportResult> {
    return firstValueFrom(this.fieldsApi.import(file, dryRun));
  }

  crops(): Promise<CropDto[]> {
    return firstValueFrom(this.catalogApi.crops());
  }

  async history(fieldId: string): Promise<ObservationDto[]> {
    const page = await firstValueFrom(
      this.observationsApi.list({ fieldId, pageSize: FIELDS_CONFIG.historyPageSize }),
    );
    return [...page.items].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }
}
