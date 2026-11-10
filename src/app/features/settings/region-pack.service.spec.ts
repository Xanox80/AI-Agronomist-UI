import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { CatalogPackCache } from '../../core/offline/catalog-pack-cache.service';
import { RegionPackService } from './region-pack.service';

describe('RegionPackService', () => {
  const status = { regionCode: 'UA-SOUTH', version: 4, stale: false };
  const authApi = { getFarm: vi.fn(), updateFarm: vi.fn() };
  const catalogApi = { status: vi.fn() };
  const packCache = { refresh: vi.fn(), get: vi.fn(), rememberRegion: vi.fn() };
  let service: RegionPackService;

  beforeEach(() => {
    catalogApi.status.mockReturnValue(of(status));
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: authApi }, { provide: CatalogApi, useValue: catalogApi }, { provide: CatalogPackCache, useValue: packCache }],
    });
    service = TestBed.inject(RegionPackService);
  });

  it('loads the farm region and catalogue status', async () => {
    authApi.getFarm.mockReturnValue(of({ regionCode: 'UA-SOUTH' }));
    await service.load();
    expect(service.region()).toBe('UA-SOUTH');
    expect(service.status()).toEqual(status);
  });

  it('stores the selected region on the farm', async () => {
    authApi.updateFarm.mockReturnValue(of({ regionCode: 'UA-WEST' }));
    await service.selectRegion('UA-WEST');
    expect(authApi.updateFarm).toHaveBeenCalledWith({ regionCode: 'UA-WEST' });
    expect(service.region()).toBe('UA-WEST');
  });

  it('stores the pack of the current region on the device on manual refresh', async () => {
    authApi.getFarm.mockReturnValue(of({ regionCode: 'UA-SOUTH' }));
    packCache.refresh.mockResolvedValue({ version: 7 });
    packCache.get.mockResolvedValue({ version: 7 });
    await service.load();
    await service.refresh();
    expect(packCache.refresh).toHaveBeenCalledWith('UA-SOUTH');
    expect(service.refreshedVersion()).toBe(7);
  });

  it('flags a failed refresh', async () => {
    packCache.refresh.mockRejectedValue(new Error('offline'));
    await service.refresh();
    expect(service.failed()).toBe(true);
  });

  it('flags a failed region change and keeps the old region', async () => {
    authApi.updateFarm.mockReturnValue(throwError(() => new Error('x')));
    await service.selectRegion('UA-WEST');
    expect(service.failed()).toBe(true);
    expect(service.region()).toBe('');
  });
});
