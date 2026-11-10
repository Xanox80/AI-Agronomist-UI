import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { FieldFormComponent } from './field-form.component';
import { FieldsService } from './fields.service';

describe('FieldFormComponent', () => {
  const service = { crops: vi.fn(), get: vi.fn(), save: vi.fn(), rememberedCrop: vi.fn() };

  function render(id: string | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: FieldsService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', id]]) } } },
      ],
    });
    const fixture = TestBed.createComponent(FieldFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    service.crops.mockResolvedValue([]);
  });

  it('loads the existing field into the form when editing', async () => {
    service.get.mockResolvedValue({ id: 'f1', name: 'North', areaHa: 1, source: 'manual', nearWater: false, nearApiary: false, nearSettlement: false });
    const fixture = render('f1');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('North');
    });
  });

  it('prefills the remembered crop when the field has none', async () => {
    service.get.mockResolvedValue({ id: 'f1', name: 'North', areaHa: 1, source: 'manual', nearWater: false, nearApiary: false, nearSettlement: false });
    service.rememberedCrop.mockResolvedValue('c9');
    const fixture = render('f1');
    const component = fixture.componentInstance as unknown as { model: { cropId: string | null } };
    await vi.waitFor(() => expect(component.model.cropId).toBe('c9'));
  });

  it('sends the typed area for a field without a contour', async () => {
    service.save.mockResolvedValue({ id: 'n' });
    const fixture = render(null);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    const component = fixture.componentInstance as unknown as { model: { name: string; areaHa: number }; save(): Promise<void> };
    Object.assign(component.model, { name: 'Fresh', areaHa: 12 });
    await component.save();
    expect(service.save).toHaveBeenCalledWith(undefined, expect.objectContaining({ areaHa: 12 }));
  });

  it('saves a new field and navigates to its detail page', async () => {
    service.save.mockResolvedValue({ id: 'new-id' });
    const fixture = render(null);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    const component = fixture.componentInstance as unknown as { model: { name: string }; save(): Promise<void> };
    component.model.name = 'Fresh';
    await component.save();
    expect(service.save).toHaveBeenCalledWith(undefined, expect.objectContaining({ name: 'Fresh', source: 'manual' }));
    expect(navigate).toHaveBeenCalledWith(['/fields', 'new-id']);
  });
});
