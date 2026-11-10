import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthSession } from '../../core/auth/auth-session.service';
import { HeatmapDto } from '../../core/api/models';
import { HeatmapMapComponent } from './heatmap-map.component';
import { HeatmapComponent } from './heatmap.component';
import { HeatmapService } from './heatmap.service';

@Component({ selector: 'app-heatmap-map', template: '' })
class MapStubComponent {
  readonly data = input<HeatmapDto | null>(null);
}

interface HeatmapTestApi {
  setFilter(key: string, value: string): void;
  export(format: 'csv' | 'geojson'): Promise<void>;
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

const summaryDto = {
  total: 2, byDiagnosis: [{ code: 'rust', name: 'Rust', count: 2 }], byField: [], byWeek: [{ week: '2026-W10', count: 2 }],
};

describe('HeatmapComponent', () => {
  const session = { hasAnyRole: vi.fn(() => true) };
  const service = {
    load: vi.fn(async () => ({ heatmap: { points: [], fields: [] }, summary: summaryDto })),
    lookups: vi.fn(async () => ({ crops: [], diagnoses: [], fields: [] })),
    heatmap: vi.fn(async () => ({ points: [], fields: [] })),
    summary: vi.fn(async () => ({
      total: 2, byDiagnosis: [{ code: 'rust', name: 'Rust', count: 2 }], byField: [], byWeek: [],
    })),
    exportObservations: vi.fn(async () => new Blob(['x'])),
  };

  async function create() {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: HeatmapService, useValue: service }, { provide: AuthSession, useValue: session }],
    });
    TestBed.overrideComponent(HeatmapComponent, {
      remove: { imports: [HeatmapMapComponent] },
      add: { imports: [MapStubComponent] },
    });
    const fixture = TestBed.createComponent(HeatmapComponent);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    return { fixture, api: fixture.componentInstance as unknown as HeatmapTestApi };
  }

  beforeEach(() => vi.clearAllMocks());

  it('renders the title and the diagnosis summary after loading', async () => {
    const { fixture } = await create();
    expect(fixture.nativeElement.querySelector('h1')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Rust');
  });

  it('reloads the heatmap with the chosen filter', async () => {
    const { fixture, api } = await create();
    api.setFilter('cropId', 'c1');
    await flush();
    expect(service.load).toHaveBeenLastCalledWith({ cropId: 'c1' });
  });

  it('keeps the latest response when an older request resolves last', async () => {
    const { fixture, api } = await create();
    let resolveOld!: (v: unknown) => void;
    service.load.mockImplementationOnce(() => new Promise((r) => (resolveOld = r)) as never);
    api.setFilter('cropId', 'old');
    service.load.mockResolvedValueOnce({ heatmap: { points: [], fields: [] }, summary: { ...summaryDto, total: 7, byDiagnosis: [{ code: 'n', name: 'Newer', count: 7 }] } });
    api.setFilter('cropId', 'new');
    await flush();
    resolveOld({ heatmap: { points: [], fields: [] }, summary: summaryDto });
    await flush();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Newer');
  });

  it('keeps the lookup error visible after a successful load', async () => {
    service.lookups.mockRejectedValueOnce(new Error('x'));
    const { fixture } = await create();
    expect(fixture.nativeElement.querySelector('.heatmap__error')).not.toBeNull();
  });

  it('rejects a reversed date range without loading', async () => {
    const { fixture, api } = await create();
    service.load.mockClear();
    api.setFilter('from', '2026-05-02');
    api.setFilter('to', '2026-05-01');
    fixture.detectChanges();
    expect(service.load).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.heatmap__error')).not.toBeNull();
  });

  it('shows weekly counts and hides export for non-chief roles', async () => {
    session.hasAnyRole.mockReturnValueOnce(false);
    const { fixture } = await create();
    expect(fixture.nativeElement.textContent).toContain('2026-W10');
    expect(fixture.nativeElement.querySelectorAll('.heatmap__toolbar p-button').length).toBe(1);
  });

  it('downloads the export in the requested format', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { api } = await create();
    await api.export('csv');
    expect(service.exportObservations).toHaveBeenCalledWith('csv', {});
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('shows an error when the export fails', async () => {
    service.exportObservations.mockRejectedValueOnce(new Error('failed'));
    const { fixture, api } = await create();
    await api.export('geojson');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.heatmap__error')).not.toBeNull();
  });
});
