import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { FieldsApi } from '../../core/api/fields.api';
import { ObservationsApi } from '../../core/api/observations.api';
import { FieldsService } from './fields.service';

describe('FieldsService', () => {
  const fieldsApi = {
    list: vi.fn(), create: vi.fn(), update: vi.fn(), locate: vi.fn(), getCropMemory: vi.fn(), setCropMemory: vi.fn(),
  };
  const observationsApi = { list: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: FieldsApi, useValue: fieldsApi },
        { provide: ObservationsApi, useValue: observationsApi },
        { provide: CatalogApi, useValue: {} },
      ],
    });
  });

  it('creates a field when no id is given and updates otherwise', async () => {
    fieldsApi.create.mockReturnValue(of({ id: 'new' }));
    fieldsApi.update.mockReturnValue(of({ id: 'old' }));
    const service = TestBed.inject(FieldsService);
    expect((await service.save(undefined, { name: 'A' })).id).toBe('new');
    expect((await service.save('old', { name: 'A' })).id).toBe('old');
    expect(fieldsApi.update).toHaveBeenCalledWith('old', { name: 'A' });
  });

  it('remembers the crop after saving a field that has one', async () => {
    fieldsApi.create.mockReturnValue(of({ id: 'new' }));
    fieldsApi.setCropMemory.mockReturnValue(of(undefined));
    await TestBed.inject(FieldsService).save(undefined, { name: 'A', cropId: 'c1' });
    expect(fieldsApi.setCropMemory).toHaveBeenCalledWith('new', 'c1');
  });

  it('returns the fields matching a point and the remembered crop', async () => {
    fieldsApi.locate.mockReturnValue(of({ matches: [{ fieldId: 'f1', name: 'North' }] }));
    fieldsApi.getCropMemory.mockReturnValue(of({ cropId: 'c1' }));
    const service = TestBed.inject(FieldsService);
    expect(await service.locate({ lat: 1, lng: 2 })).toEqual([{ fieldId: 'f1', name: 'North' }]);
    expect(await service.rememberedCrop('f1')).toBe('c1');
  });

  it('passes the crop filter and page to the list query', async () => {
    fieldsApi.list.mockReturnValue(of({ items: [] }));
    await TestBed.inject(FieldsService).list('', 'c1', 2);
    expect(fieldsApi.list.mock.calls[0][0]).toMatchObject({ cropId: 'c1', page: 2 });
  });

  it('drops an empty search text from the list query', async () => {
    fieldsApi.list.mockReturnValue(of({ items: [] }));
    await TestBed.inject(FieldsService).list('');
    expect(fieldsApi.list.mock.calls[0][0].q).toBeUndefined();
  });

  it('returns the observation history newest first', async () => {
    observationsApi.list.mockReturnValue(
      of({ items: [{ id: 'old', capturedAt: '2026-01-01T00:00:00Z' }, { id: 'new', capturedAt: '2026-06-01T00:00:00Z' }] }),
    );
    const history = await TestBed.inject(FieldsService).history('f1');
    expect(history.map((o) => o.id)).toEqual(['new', 'old']);
  });
});
