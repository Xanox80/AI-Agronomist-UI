import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { FieldsApi } from '../../core/api/fields.api';
import { FieldDto } from '../../core/api/models';
import { CatalogPackCache } from '../../core/offline/catalog-pack-cache.service';
import { ObservationsApi } from '../../core/api/observations.api';
import { ScoutingContextService } from './scouting-context.service';

const field = (id: string, cropId?: string): FieldDto => ({
  id, name: id, areaHa: 1, cropId, source: 'manual', nearWater: false, nearApiary: false, nearSettlement: false,
  contour: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
});

describe('ScoutingContextService', () => {
  let fieldsApi: Record<string, ReturnType<typeof vi.fn>>;
  let catalogApi: Record<string, ReturnType<typeof vi.fn>>;
  const packGet = vi.fn();
  let service: ScoutingContextService;

  beforeEach(() => {
    localStorage.clear();
    packGet.mockReset();
    fieldsApi = { list: vi.fn(), locate: vi.fn(), getCropMemory: vi.fn() };
    catalogApi = { crops: vi.fn(), bbchStages: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: FieldsApi, useValue: fieldsApi },
        { provide: CatalogApi, useValue: catalogApi },
        { provide: ObservationsApi, useValue: { get: () => of({ photos: [{}, {}] }) } },
        { provide: CatalogPackCache, useValue: { get: packGet } },
      ],
    });
    service = TestBed.inject(ScoutingContextService);
  });

  it('serves cached fields when the API is unreachable', async () => {
    fieldsApi['list'].mockReturnValueOnce(of({ items: [field('a')], total: 1, page: 1, pageSize: 1 }));
    await service.loadFields();
    fieldsApi['list'].mockReturnValueOnce(throwError(() => new Error('offline')));
    expect((await service.loadFields()).map((f) => f.id)).toEqual(['a']);
  });

  it('uses the backend match when online', async () => {
    fieldsApi['locate'].mockReturnValue(of({ matches: [{ fieldId: 'server', name: 'S' }] }));
    expect(await service.suggestFieldId({ lat: 5, lng: 5 }, [field('a')])).toBe('server');
  });

  it('falls back to point-in-polygon on cached fields when offline', async () => {
    fieldsApi['locate'].mockReturnValue(throwError(() => new Error('offline')));
    expect(await service.suggestFieldId({ lat: 5, lng: 5 }, [field('a')])).toBe('a');
    expect(await service.suggestFieldId({ lat: 50, lng: 50 }, [field('a')])).toBeUndefined();
  });

  it('prefers the remembered crop over the field crop', async () => {
    fieldsApi['getCropMemory'].mockReturnValue(of({ cropId: 'remembered' }));
    expect(await service.rememberedCropId(field('a', 'default'))).toBe('remembered');
  });

  it('uses the field crop when the memory is empty or unreachable', async () => {
    fieldsApi['getCropMemory'].mockReturnValue(throwError(() => new Error('offline')));
    expect(await service.rememberedCropId(field('a', 'default'))).toBe('default');
  });

  it('returns no crops when the catalogue and the cached pack are both unavailable', async () => {
    catalogApi['crops'].mockReturnValue(throwError(() => new Error('offline')));
    packGet.mockResolvedValue(undefined);
    expect(await service.loadCrops()).toEqual([]);
  });

  it('serves crops and the crop BBCH stages from the cached pack when offline', async () => {
    const crop = { id: 'wheat', code: 'wheat', nameUk: 'ѕшениц€', nameEn: 'Wheat' };
    const stage = (id: string, cropId: string) => ({ id, cropId, bbchFrom: 10, bbchTo: 19, nameUk: 'a', nameEn: 'b', phase: 'p' });
    catalogApi['crops'].mockReturnValue(throwError(() => new Error('offline')));
    catalogApi['bbchStages'].mockReturnValue(throwError(() => new Error('offline')));
    packGet.mockResolvedValue({ crops: [crop], bbch: [stage('s1', 'wheat'), stage('s2', 'corn')] });
    expect(await service.loadCrops()).toEqual([crop]);
    expect((await service.loadBbchStages('wheat')).map((s) => s.id)).toEqual(['s1']);
  });

  it('prefills the locally remembered crop when the memory endpoint is unreachable', async () => {
    fieldsApi['getCropMemory'].mockReturnValue(throwError(() => new Error('offline')));
    service.rememberCropLocally('a', 'local');
    expect(await service.rememberedCropId(field('a', 'default'))).toBe('local');
  });

  it('counts the photos an observation already has', async () => {
    expect(await service.loadPhotoCount('o1')).toBe(2);
  });
});
