import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AnalyticsApi } from '../../core/api/analytics.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { FieldsApi } from '../../core/api/fields.api';
import { HeatmapService } from './heatmap.service';

describe('HeatmapService', () => {
  const analytics = {
    heatmap: vi.fn(() => of({ points: [], fields: [] })),
    summary: vi.fn(() => of({ total: 0, byDiagnosis: [], byField: [], byWeek: [] })),
    export: vi.fn(() => of(new Blob(['x']))),
  };
  const catalog = { crops: vi.fn(() => of([{ id: 'c' }])), diagnoses: vi.fn(() => of([{ id: 'd' }])) };
  const fields = { list: vi.fn(() => of({ items: [{ id: 'f' }], total: 1, page: 1, pageSize: 100 })) };
  let service: HeatmapService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AnalyticsApi, useValue: analytics },
        { provide: CatalogApi, useValue: catalog },
        { provide: FieldsApi, useValue: fields },
      ],
    });
    service = TestBed.inject(HeatmapService);
  });

  it('loads crops, diagnoses and fields for the filter dropdowns', async () => {
    const lookups = await service.lookups();
    expect(lookups.crops).toHaveLength(1);
    expect(lookups.diagnoses).toHaveLength(1);
    expect(lookups.fields).toHaveLength(1);
  });

  it('passes the filter to the heatmap request', async () => {
    await service.heatmap({ cropId: 'c' });
    expect(analytics.heatmap).toHaveBeenCalledWith({ cropId: 'c' });
  });

  it('requests the observations export in the chosen format with the filter', async () => {
    await service.exportObservations('geojson', { fieldId: 'f' });
    expect(analytics.export).toHaveBeenCalledWith('observations', 'geojson', { fieldId: 'f' });
  });
});
