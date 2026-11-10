import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { FieldListComponent } from './field-list.component';
import { GeolocationService } from '../scouting/geolocation.service';
import { FieldsService } from './fields.service';

describe('FieldListComponent', () => {
  const service = { list: vi.fn(), crops: vi.fn(), locate: vi.fn() };
  const geolocation = { locate: vi.fn() };

  function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]), provideTranslateService(), { provide: FieldsService, useValue: service },
        { provide: GeolocationService, useValue: geolocation },
      ],
    });
    const fixture = TestBed.createComponent(FieldListComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    service.crops.mockResolvedValue([{ id: 'c1', code: 'maize', nameUk: 'Кукурудза', nameEn: 'Maize' }]);
  });

  it('renders a card per field returned by the service', async () => {
    service.list.mockResolvedValue({
      items: [{ id: '1', name: 'North', areaHa: 12.345, cropId: 'c1' }, { id: '2', name: 'South', areaHa: 3 }],
    });
    const fixture = render();
    await vi.waitFor(() => {
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('.field-card');
      expect(cards).toHaveLength(2);
      expect(cards[0].textContent).toContain('North');
      expect(cards[0].textContent).toContain('12.35');
    });
  });

  it('opens the field found under the device position', async () => {
    service.list.mockResolvedValue({ items: [], total: 0 });
    geolocation.locate.mockResolvedValue({ lat: 1, lng: 2 });
    service.locate.mockResolvedValue([{ fieldId: 'f9', name: 'Hit' }]);
    const fixture = render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await (fixture.componentInstance as unknown as { locate(): Promise<void> }).locate();
    expect(navigate).toHaveBeenCalledWith(['/fields', 'f9']);
  });

  it('keeps the list and shows a hint when no field matches the position', async () => {
    service.list.mockResolvedValue({ items: [], total: 0 });
    geolocation.locate.mockResolvedValue(null);
    const fixture = render();
    await (fixture.componentInstance as unknown as { locate(): Promise<void> }).locate();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('fields.list.locateNone');
  });

  it('appends the next page when loading more', async () => {
    service.list.mockResolvedValueOnce({ items: [{ id: '1', name: 'A', areaHa: 1 }], total: 2 });
    service.list.mockResolvedValueOnce({ items: [{ id: '2', name: 'B', areaHa: 1 }], total: 2 });
    const fixture = render();
    await vi.waitFor(() => expect(service.list).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => fixture.detectChanges());
    await (fixture.componentInstance as unknown as { loadMore(): Promise<void> }).loadMore();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.field-card')).toHaveLength(2);
    expect(service.list).toHaveBeenLastCalledWith('', undefined, 2);
  });

  it('shows the error state when loading fails', async () => {
    service.list.mockRejectedValue(new Error('offline'));
    const fixture = render();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.state.error')).not.toBeNull();
    });
  });
});
