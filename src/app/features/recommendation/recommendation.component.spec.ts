import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RecommendationDto } from '../../core/api/models';
import { AuthSession } from '../../core/auth/auth-session.service';
import { RecommendationComponent } from './recommendation.component';
import { RecommendationService } from './recommendation.service';

const draft: RecommendationDto = {
  id: 'r1', observationId: 'o1', status: 'draft', actionLevel: 'treat',
  weather: { verdict: 'go', reason: 'weather.window.go', reasonParams: {}, forecastSummary: [] },
  safetyWarnings: [], items: [], excludedItems: [], explanation: 'why', sources: [],
  catalogVersion: 1, catalogStale: true, autoApproved: false, disclaimerCode: 'decision_support',
};

async function render(role: 'chief_agronomist' | 'scout') {
  TestBed.configureTestingModule({
    providers: [
      provideTranslateService(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'o1' } } } },
      { provide: RecommendationService, useValue: { loadOrCreate: () => Promise.resolve(draft) } },
      { provide: AuthSession, useValue: { hasAnyRole: (roles: string[]) => roles.includes(role) } },
    ],
  });
  const fixture = TestBed.createComponent(RecommendationComponent);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('RecommendationComponent', () => {
  it('shows the stale directory warning and the disclaimer', async () => {
    const el = await render('scout');
    expect(el.querySelector('.stale')).not.toBeNull();
    expect(el.querySelector('.disclaimer')).not.toBeNull();
  });

  it('offers approve and reject only to the chief agronomist on a draft', async () => {
    expect((await render('chief_agronomist')).querySelector('.badges ~ .actions')).not.toBeNull();
  });

  it('lets a scout enter the measured damage on a draft', async () => {
    expect((await render('scout')).querySelector('#damage')).not.toBeNull();
  });

  it('hides approve and reject from a scout', async () => {
    expect((await render('scout')).querySelector('.badges ~ .actions')).toBeNull();
  });
});
