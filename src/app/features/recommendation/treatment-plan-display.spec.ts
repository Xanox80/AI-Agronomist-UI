import { HttpErrorResponse } from '@angular/common/http';
import { treatmentPlanFailure } from './treatment-plan-display';

describe('treatmentPlanFailure', () => {
  it('treats 503 as the plan service being unavailable', () => {
    expect(treatmentPlanFailure(new HttpErrorResponse({ status: 503 }))).toBe('unavailable');
  });

  it('treats any other failure as an error', () => {
    expect(treatmentPlanFailure(new HttpErrorResponse({ status: 500 }))).toBe('error');
    expect(treatmentPlanFailure(new Error('offline'))).toBe('error');
  });
});
