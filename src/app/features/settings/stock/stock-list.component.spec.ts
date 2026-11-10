import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SETTINGS_CONFIG } from '../settings.config';
import { StockListComponent } from './stock-list.component';
import { StockListService } from './stock-list.service';

describe('StockListComponent', () => {
  const service = {
    items: signal([{ id: '1', productName: 'Fungicide', quantity: 5, unit: 'l', warehouse: 'W1' }]),
    total: signal(1), page: signal(1), pageSize: 50, search: vi.fn(), goToPage: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    service.search.mockReset();
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: StockListService, useValue: service }],
    });
  });

  afterEach(() => vi.useRealTimers());

  it('loads the first page and renders the rows', () => {
    const fixture = TestBed.createComponent(StockListComponent);
    fixture.detectChanges();
    expect(service.search).toHaveBeenCalledWith('');
    expect(fixture.nativeElement.textContent).toContain('Fungicide');
  });

  it('searches once after typing stops', () => {
    const fixture = TestBed.createComponent(StockListComponent);
    fixture.detectChanges();
    service.search.mockClear();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    for (const value of ['f', 'fu', 'fun']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    vi.advanceTimersByTime(SETTINGS_CONFIG.stockSearchDebounceMs);
    expect(service.search).toHaveBeenCalledTimes(1);
    expect(service.search).toHaveBeenCalledWith('fun');
  });
});
