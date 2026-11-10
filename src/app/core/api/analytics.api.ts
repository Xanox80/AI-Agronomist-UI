import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toHttpParams } from './api-base-url';
import { AnalyticsFilter, AnalyticsSummaryDto, ExportFormat, ExportResource, HeatmapDto } from './models';

@Injectable({ providedIn: 'root' })
export class AnalyticsApi extends ApiClient {
  heatmap(filter: AnalyticsFilter = {}): Observable<HeatmapDto> {
    return this.http.get<HeatmapDto>(this.url('/analytics/heatmap'), { params: toHttpParams(filter) });
  }

  summary(filter: AnalyticsFilter = {}): Observable<AnalyticsSummaryDto> {
    return this.http.get<AnalyticsSummaryDto>(this.url('/analytics/summary'), { params: toHttpParams(filter) });
  }

  export(resource: ExportResource, format: ExportFormat, filter: AnalyticsFilter = {}): Observable<Blob> {
    return this.http.get(this.url(`/analytics/export/${resource}.${format}`), {
      params: toHttpParams(filter),
      responseType: 'blob',
    });
  }
}
