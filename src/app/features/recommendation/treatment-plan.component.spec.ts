import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TreatmentPlanDto } from '../../core/api/models';
import { RecommendationService } from './recommendation.service';
import { TreatmentPlanComponent } from './treatment-plan.component';

const plan = (over: Partial<TreatmentPlanDto> = {}): TreatmentPlanDto => ({
  recommendationId: 'r1', status: 'ready', model: 'gpt-oss', summary: 'Дві обробки', precautions: ['Респіратор'],
  monitoring: 'Огляд через 10 днів', validationErrors: [], disclaimerCode: 'treatment_plan_needs_agronomist', generatedAt: '',
  applications: [{
    productId: 'p1', productName: 'Prosaro 250 EC', rateValue: 1, rateUnit: 'l/ha', waterLPerHa: 200, dayOffset: 0,
    timing: 'BBCH 37', note: '', solution: {
      productPerHa: 1, productUnit: 'l', waterLPerHa: 200, productPer100L: 0.5, tankVolumeL: 3000, productPerTank: 15,
      hectaresPerTank: 15, tanksForField: 3, productForField: 45,
    },
  }],
  ...over,
});

async function renderAfterGenerate(treatmentPlan: ReturnType<typeof vi.fn>): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideTranslateService(), { provide: RecommendationService, useValue: { treatmentPlan } }] });
  const fixture = TestBed.createComponent(TreatmentPlanComponent);
  fixture.componentRef.setInput('recommendationId', 'r1');
  fixture.detectChanges();
  await (fixture.componentInstance as unknown as { generate(): Promise<void> }).generate();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('TreatmentPlanComponent', () => {
  it('shows the course with the per-tank and per-field proportions', async () => {
    const text = (await renderAfterGenerate(vi.fn().mockResolvedValue(plan()))).textContent ?? '';
    expect(text).toContain('Prosaro 250 EC');
    expect(text).toContain('15 l');
    expect(text).toContain('45 l');
    expect(text).toContain('Респіратор');
  });

  it('shows no steps of a plan the backend rejected', async () => {
    const el = await renderAfterGenerate(vi.fn().mockResolvedValue(plan({ status: 'rejected', applications: [] })));
    expect(el.querySelector('.card')).toBeNull();
    expect(el.querySelector('.notice')).not.toBeNull();
  });

  it('tells apart an unconfigured plan service from other failures', async () => {
    const el = await renderAfterGenerate(vi.fn().mockRejectedValue(new HttpErrorResponse({ status: 503 })));
    expect(el.querySelector('.error')?.textContent).toContain('recommendation.plan.unavailable');
  });
});
