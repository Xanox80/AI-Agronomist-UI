import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { FieldDetailComponent } from './field-detail.component';
import { ConfirmationService } from 'primeng/api';
import { FieldsService } from './fields.service';

describe('FieldDetailComponent', () => {
  const service = { get: vi.fn(), history: vi.fn(), crops: vi.fn(), remove: vi.fn() };

  function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: FieldsService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'f1']]) } } },
      ],
    });
    const fixture = TestBed.createComponent(FieldDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    service.crops.mockResolvedValue([]);
  });

  it('shows the field name and its observation history', async () => {
    service.get.mockResolvedValue({ id: 'f1', name: 'North', areaHa: 10, source: 'manual' });
    service.history.mockResolvedValue([{ id: 'o1', capturedAt: '2026-06-01T10:00:00Z', status: 'confirmed' }]);
    const fixture = render();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain('North');
      expect(fixture.nativeElement.querySelectorAll('.history-item')).toHaveLength(1);
    });
  });

  it('deletes only after the confirmation is accepted', async () => {
    service.get.mockResolvedValue({ id: 'f1', name: 'North', areaHa: 10, source: 'manual' });
    service.history.mockResolvedValue([]);
    service.remove.mockResolvedValue(undefined);
    const fixture = render();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const confirm = vi.spyOn(fixture.debugElement.injector.get(ConfirmationService), 'confirm');
    (fixture.componentInstance as unknown as { confirmRemove(): void }).confirmRemove();
    expect(service.remove).not.toHaveBeenCalled();
    confirm.mock.calls[0][0].accept?.();
    expect(service.remove).toHaveBeenCalledWith('f1');
  });

  it('shows the error state when the field cannot be loaded', async () => {
    service.get.mockRejectedValue(new Error('404'));
    service.history.mockResolvedValue([]);
    const fixture = render();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.state.error')).not.toBeNull();
    });
  });
});
