import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecommendationApi } from '../../core/api/recommendation.api';
import { RecommendationService } from './recommendation.service';

describe('RecommendationService', () => {
  it('trims the rejection reason before sending it', async () => {
    const reject = vi.fn().mockReturnValue(of({ id: 'r1' }));
    TestBed.configureTestingModule({ providers: [{ provide: RecommendationApi, useValue: { reject } }] });
    await TestBed.inject(RecommendationService).reject('r1', '  wrong crop ');
    expect(reject).toHaveBeenCalledWith('r1', { reason: 'wrong crop' });
  });

  it('sends the tank volume when asking for a treatment plan', async () => {
    const treatmentPlan = vi.fn().mockReturnValue(of({ status: 'ready' }));
    TestBed.configureTestingModule({ providers: [{ provide: RecommendationApi, useValue: { treatmentPlan } }] });
    await TestBed.inject(RecommendationService).treatmentPlan('r1', 2000);
    expect(treatmentPlan).toHaveBeenCalledWith('r1', { tankVolumeL: 2000 });
  });
});
