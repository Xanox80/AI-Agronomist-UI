import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnalyticsApi } from '../../core/api/analytics.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { FieldsApi } from '../../core/api/fields.api';
import {
  AnalyticsFilter, AnalyticsSummaryDto, CatalogDiagnosisDto, CropDto, ExportFormat, FieldDto, HeatmapDto,
} from '../../core/api/models';
import { HEATMAP_CONFIG } from './heatmap.config';

export interface HeatmapLookups {
  crops: CropDto[];
  diagnoses: CatalogDiagnosisDto[];
  fields: FieldDto[];
}

@Injectable({ providedIn: 'root' })
export class HeatmapService {
  private readonly analyticsApi = inject(AnalyticsApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly fieldsApi = inject(FieldsApi);

  async lookups(): Promise<HeatmapLookups> {
    const [crops, diagnoses, fields] = await Promise.all([
      firstValueFrom(this.catalogApi.crops()),
      firstValueFrom(this.catalogApi.diagnoses()),
      firstValueFrom(this.fieldsApi.list({ pageSize: HEATMAP_CONFIG.fieldsPageSize })),
    ]);
    return { crops, diagnoses, fields: fields.items };
  }

  async load(filter: AnalyticsFilter): Promise<{ heatmap: HeatmapDto; summary: AnalyticsSummaryDto }> {
    const [heatmap, summary] = await Promise.all([this.heatmap(filter), this.summary(filter)]);
    return { heatmap, summary };
  }

  heatmap(filter: AnalyticsFilter): Promise<HeatmapDto> {
    return firstValueFrom(this.analyticsApi.heatmap(filter));
  }

  summary(filter: AnalyticsFilter): Promise<AnalyticsSummaryDto> {
    return firstValueFrom(this.analyticsApi.summary(filter));
  }

  exportObservations(format: ExportFormat, filter: AnalyticsFilter): Promise<Blob> {
    return firstValueFrom(this.analyticsApi.export('observations', format, filter));
  }
}
