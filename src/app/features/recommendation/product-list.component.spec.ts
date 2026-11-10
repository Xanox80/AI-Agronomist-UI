import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { RecommendationItemDto } from '../../core/api/models';
import { ProductListComponent } from './product-list.component';

const item = (over: Partial<RecommendationItemDto> = {}): RecommendationItemDto => ({
  rank: 1, product: { id: 'p1', name: 'Fungex', source: 'registry', isDemo: false },
  rate: { value: 1.5, unit: 'l/ha' }, applicationTiming: 'early', bbchFrom: 30, bbchTo: 59,
  preHarvestIntervalDays: 21, resistance: { system: 'FRAC', group: '3', rotationOk: false },
  stock: { inStock: true, quantity: 40, unit: 'l' }, costPerHaUah: 120, activeSubstanceCodes: [],
  ...over,
} as unknown as RecommendationItemDto);

function render(items: RecommendationItemDto[]): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideTranslateService()] });
  const fixture = TestBed.createComponent(ProductListComponent);
  fixture.componentRef.setInput('items', items);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ProductListComponent', () => {
  it('renders name, rate and cost', () => {
    const text = render([item()]).textContent ?? '';
    expect(text).toContain('Fungex');
    expect(text).toContain('1.5 l/ha');
    expect(text).toContain('120');
  });

  it('hides stock quantity and cost when the backend sends null', () => {
    const el = render([item({ stock: { inStock: false, quantity: null, unit: 'l' }, costPerHaUah: null } as never)]);
    expect(el.querySelectorAll('dt').length).toBe(6);
  });

  it('marks excluded items', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.componentRef.setInput('items', [item()]);
    fixture.componentRef.setInput('excluded', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.card.excluded')).not.toBeNull();
  });
});
