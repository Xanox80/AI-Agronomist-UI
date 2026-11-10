import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { DisplayPreferences } from '../shell/display-preferences.service';
import { CATALOG_ADMIN_NOW } from './catalog-admin.config';
import { CatalogAdminService } from './catalog-admin.service';

describe('CatalogAdminService', () => {
  const api = {
    products: vi.fn(), status: vi.fn(), diagnoses: vi.fn(), proposals: vi.fn(), createProposal: vi.fn(),
    approveProposal: vi.fn(), rejectProposal: vi.fn(), verify: vi.fn(),
  };
  let service: CatalogAdminService;

  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.status.mockReturnValue(of({ regionCode: 'R', staleAfterDays: 180, lastVerifiedAt: '2020-01-01' }));
    api.diagnoses.mockReturnValue(of([{ id: 'd1', code: 'rust', nameUk: 'Іржа', nameEn: 'Rust' }]));
    api.proposals.mockReturnValue(of({ items: [{ id: 'pr1' }], total: 1, page: 1, pageSize: 50 }));
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogApi, useValue: api },
        { provide: CATALOG_ADMIN_NOW, useValue: () => new Date('2026-01-01') },
        { provide: DisplayPreferences, useValue: { locale: signal('uk') } },
      ],
    });
    service = TestBed.inject(CatalogAdminService);
  });

  it('loads rows of the opened directory', async () => {
    await service.openDirectory('diagnoses');
    expect(service.rows()[0].title).toBe('Іржа');
  });

  it('marks rows without their own date stale using the region verification date', async () => {
    await service.loadStatus();
    await service.openDirectory('diagnoses');
    expect(service.isRowStale(service.rows()[0])).toBe(true);
  });

  it('does not call the API when the proposal payload is not a JSON object', async () => {
    const sent = await service.propose({ directory: 'products', operation: 'create', payloadText: 'nope' });
    expect(sent).toBe(false);
    expect(api.createProposal).not.toHaveBeenCalled();
  });

  it('sends a delete proposal with an empty payload and refreshes the queue', async () => {
    api.createProposal.mockReturnValue(of({}));
    const sent = await service.propose({ directory: 'products', operation: 'delete', entityId: 'p1', payloadText: '' });
    expect(sent).toBe(true);
    expect(api.createProposal).toHaveBeenCalledWith({
      entityType: 'product', entityId: 'p1', operation: 'delete', payload: {},
    });
    expect(service.pending().length).toBe(1);
  });

  it('reloads queue and status after an approval', async () => {
    api.approveProposal.mockReturnValue(of({}));
    await service.approve('pr1');
    expect(api.approveProposal).toHaveBeenCalledWith('pr1', undefined);
    expect(api.status).toHaveBeenCalled();
    expect(service.pending().length).toBe(1);
  });

  it('ignores rows of a directory that is no longer the current one', async () => {
    const slow = new Subject<unknown[]>();
    api.diagnoses.mockReturnValueOnce(slow);
    api.products.mockReturnValue(of([{ id: 'p1', name: 'Prod', activeSubstances: [], isDemo: false }]));
    const first = service.openDirectory('diagnoses');
    await service.openDirectory('products');
    slow.next([{ id: 'd1', code: 'x', nameUk: 'Стара', nameEn: 'Old' }]);
    slow.complete();
    await first;
    expect(service.directory()).toBe('products');
    expect(service.rows()[0].title).toBe('Prod');
  });

  it('judges staleness against the injected clock', async () => {
    await service.loadStatus();
    expect(service.isRowStale({ id: 'a', title: '', detail: '', isDemo: false, verifiedAt: '2025-12-31' })).toBe(false);
  });
});
