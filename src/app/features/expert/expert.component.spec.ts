import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ExpertCaseDto } from '../../core/api/models';
import { ExpertComponent } from './expert.component';
import { ExpertService } from './expert.service';

const sample = {
  id: 'c1', reason: 'low_confidence', status: 'open', priority: 5, createdAt: '2026-11-10T08:00:00Z',
  diagnosis: { hypotheses: [{ rank: 1, diagnosisCode: 'rust', nameUk: 'Іржа', nameEn: 'Rust', probability: 0.4 }] },
} as unknown as ExpertCaseDto;

describe('ExpertComponent', () => {
  function setup(queue: () => Promise<ExpertCaseDto[]>) {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), provideRouter([]), { provide: ExpertService, useValue: { queue } }],
    });
    const fixture = TestBed.createComponent(ExpertComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a card with the reason badge for each queued case', async () => {
    const fixture = setup(async () => [sample]);
    await fixture.whenStable();
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('a.case');
    expect(card.textContent).toContain('Іржа');
    expect(card.querySelector('p-tag')).not.toBeNull();
  });

  it('shows the error state when loading fails', async () => {
    const fixture = setup(async () => { throw new Error('x'); });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.state.error')).not.toBeNull();
  });
});
