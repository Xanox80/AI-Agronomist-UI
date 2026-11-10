import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { CatalogApi } from '../api/catalog.api';
import { CatalogPackDto } from '../api/models';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { CatalogPackCache } from './catalog-pack-cache.service';
import { OfflineDb } from './offline-db';

const pack = (version: number, crops: { id: string }[] = []) =>
  ({
    regionCode: 'UA-DEFAULT', version, publishedAt: 't', crops, bbch: [], diagnoses: [], thresholds: [],
    products: [], registrations: [], activeSubstances: [], referenceImages: [], deleted: {},
  }) as unknown as CatalogPackDto;

describe('CatalogPackCache', () => {
  const api = { status: vi.fn(), pack: vi.fn() };
  const authApi = { getFarm: vi.fn() };
  let cache: CatalogPackCache;

  beforeEach(() => {
    api.status.mockReset();
    api.pack.mockReset();
    localStorage.clear();
    authApi.getFarm.mockReturnValue(of({ regionCode: 'UA-DEFAULT' }));
    TestBed.configureTestingModule({
      providers: [{ provide: OfflineDb, useValue: new FakeOfflineDb() }, { provide: CatalogApi, useValue: api }, { provide: AuthApi, useValue: authApi }],
    });
    cache = TestBed.inject(CatalogPackCache);
  });

  it('downloads the full pack when nothing is cached', async () => {
    api.status.mockReturnValue(of({ version: 3 }));
    api.pack.mockReturnValue(of(pack(3, [{ id: 'a' }])));
    await cache.refresh();
    expect(api.pack).toHaveBeenCalledWith({ region: 'UA-DEFAULT', sinceVersion: undefined });
    expect((await cache.get())?.version).toBe(3);
  });

  it('skips the download when the cached version is current', async () => {
    api.status.mockReturnValue(of({ version: 3 }));
    api.pack.mockReturnValue(of(pack(3)));
    await cache.refresh();
    api.pack.mockClear();
    expect((await cache.refresh()).version).toBe(3);
    expect(api.pack).not.toHaveBeenCalled();
  });

  it('requests a delta and merges it when the server version is newer', async () => {
    api.status.mockReturnValue(of({ version: 1 }));
    api.pack.mockReturnValue(of(pack(1, [{ id: 'a' }])));
    await cache.refresh();
    api.status.mockReturnValue(of({ version: 2 }));
    api.pack.mockReturnValue(of(pack(2, [{ id: 'b' }])));
    const merged = await cache.refresh();
    expect(api.pack).toHaveBeenLastCalledWith({ region: 'UA-DEFAULT', sinceVersion: 1 });
    expect(merged?.crops.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('downloads the farm region pack and reads it back offline from the same region', async () => {
    authApi.getFarm.mockReturnValue(of({ regionCode: 'UA-SOUTH' }));
    api.status.mockReturnValue(of({ version: 2 }));
    api.pack.mockReturnValue(of({ ...pack(2), regionCode: 'UA-SOUTH' }));
    await cache.refresh();
    expect(api.status).toHaveBeenCalledWith('UA-SOUTH');
    expect(api.pack).toHaveBeenCalledWith({ region: 'UA-SOUTH', sinceVersion: undefined });

    authApi.getFarm.mockReturnValue(throwError(() => new Error('offline')));
    expect((await cache.get())?.regionCode).toBe('UA-SOUTH');
  });
});
