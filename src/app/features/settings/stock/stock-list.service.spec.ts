import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StockApi } from '../../../core/api/stock.api';
import { SETTINGS_CONFIG } from '../settings.config';
import { StockListService } from './stock-list.service';

describe('StockListService', () => {
  const list = vi.fn();
  let service: StockListService;

  beforeEach(() => {
    list.mockReset();
    list.mockReturnValue(of({ items: [{ id: '1' }], total: 1, page: 1, pageSize: 50 }));
    TestBed.configureTestingModule({ providers: [{ provide: StockApi, useValue: { list } }] });
    service = TestBed.inject(StockListService);
  });

  it('loads stock with the configured page size and a trimmed query', async () => {
    await service.search('  fung ');
    expect(list).toHaveBeenCalledWith({ q: 'fung', page: 1, pageSize: SETTINGS_CONFIG.stockPageSize });
    expect(service.items().length).toBe(1);
  });

  it('requests a later page with the same query and keeps the total', async () => {
    list.mockReturnValue(of({ items: [], total: 120, page: 2, pageSize: 50 }));
    await service.search('fung');
    await service.goToPage(2);
    expect(list).toHaveBeenLastCalledWith({ q: 'fung', page: 2, pageSize: SETTINGS_CONFIG.stockPageSize });
    expect(service.total()).toBe(120);
    expect(service.page()).toBe(2);
  });

  it('omits an empty query', async () => {
    await service.search('   ');
    expect(list.mock.calls[0][0].q).toBeUndefined();
  });
});
