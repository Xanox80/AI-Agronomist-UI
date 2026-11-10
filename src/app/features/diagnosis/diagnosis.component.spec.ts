import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { DiagnosisResultDto, ObservationDto } from '../../core/api/models';
import { ClarifyingQuestionsComponent } from './clarifying-questions.component';
import { DiagnosisConfirmComponent } from './diagnosis-confirm.component';
import { DiagnosisComponent } from './diagnosis.component';
import { DiagnosisService, DiagnosisSnapshot } from './diagnosis.service';

describe('DiagnosisComponent', () => {
  const baseResult: DiagnosisResultDto = {
    id: 'r1', observationId: 'o1', pass: 'initial', modelVersion: 'm', cropCode: 'wheat_winter', organ: 'leaf',
    problemCategory: 'disease', unsure: false, outOfDistribution: false, answers: {}, referenceImages: [],
    needsMorePhotos: false, createdAt: '2026-11-10T00:00:00Z', clarifyingQuestions: [],
    hypotheses: [{ rank: 1, diagnosisId: 'd1', diagnosisCode: 'rust', nameUk: 'Іржа', nameEn: 'Rust', probability: 0.7, evidence: '' }],
  };
  const observation = { id: 'o1', status: 'diagnosed', photos: [] } as unknown as ObservationDto;
  const withQuestion: DiagnosisResultDto = {
    ...baseResult,
    clarifyingQuestions: [{ id: 'q1', textUk: 'Так?', textEn: 'Yes?', answerType: 'yes_no', narrowsDiagnosisCodes: [] }],
  };
  let service: Record<string, ReturnType<typeof vi.fn>>;

  async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }): Promise<void> {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  async function renderFixture(snapshot: DiagnosisSnapshot) {
    service = {
      load: vi.fn(() => Promise.resolve(snapshot)),
      referenceData: vi.fn(() => Promise.resolve({ catalogue: [], crops: [] })),
      answer: vi.fn(),
      confirm: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), { provide: DiagnosisService, useValue: service }],
    });
    const fixture = TestBed.createComponent(DiagnosisComponent);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  }

  async function render(snapshot: DiagnosisSnapshot): Promise<HTMLElement> {
    return (await renderFixture(snapshot)).nativeElement as HTMLElement;
  }

  it('shows the pending-server state when nothing could be loaded offline', async () => {
    expect((await render({})).querySelector('[data-testid=pending]')).not.toBeNull();
  });

  it('shows the pending-server state for an observation without a diagnosis', async () => {
    const root = await render({ observation });
    expect(root.querySelector('[data-testid=pending]')).not.toBeNull();
  });

  it('renders the hierarchy and the hypothesis cards', async () => {
    const root = await render({ observation, diagnosis: baseResult });
    expect(root.querySelector('[data-testid=hierarchy]')?.textContent).toContain('diagnosis.organ.leaf');
    expect(root.querySelectorAll('app-hypothesis-card')).toHaveLength(1);
    expect(root.querySelector('[data-testid=uncertain]')).toBeNull();
  });

  it('shows the uncertain banner in not-sure mode', async () => {
    const root = await render({ observation, diagnosis: { ...baseResult, unsure: true } });
    expect(root.querySelector('[data-testid=uncertain]')).not.toBeNull();
  });

  it('does not rank or offer a one-click confirmation in not-sure mode', async () => {
    const root = await render({ observation, diagnosis: { ...baseResult, unsure: true } });
    expect(root.querySelector('app-hypothesis-card')).toBeNull();
    expect(root.querySelector('app-diagnosis-confirm p-button')?.textContent ?? '').not.toContain('confirmTop');
  });

  it('links the uncertain banner to the scouting flow for the observation', async () => {
    const root = await render({ observation, diagnosis: { ...baseResult, needsMorePhotos: true } });
    expect(root.querySelector('[data-testid=uncertain] a')?.getAttribute('href')).toBe('/scouting?observationId=o1');
  });

  it('shows pest species, stage and density', async () => {
    const root = await render({
      observation, diagnosis: { ...baseResult, pest: { species: 'Aphid', stage: 'larva', densityPerPlant: 12.34 } },
    });
    expect(root.querySelector('[data-testid=pest]')?.textContent).toContain('Aphid');
    expect(root.querySelector('[data-testid=pest]')?.textContent).toContain('12.3');
  });

  it('omits a null pest density', async () => {
    const root = await render({
      observation, diagnosis: { ...baseResult, pest: { species: 'Aphid', densityPerPlant: null } } as unknown as DiagnosisResultDto,
    });
    expect(root.querySelector('[data-testid=pest]')?.textContent).not.toContain('diagnosis.pest.perPlant');
  });

  it('re-ranks with the submitted answers', async () => {
    const fixture = await renderFixture({ observation, diagnosis: withQuestion });
    service['answer'].mockResolvedValue({ ...baseResult, id: 'r2' });
    fixture.debugElement.query(By.directive(ClarifyingQuestionsComponent)).componentInstance.submitted.emit({ q1: 'unsure' });
    await settle(fixture);
    expect(service['answer']).toHaveBeenCalledWith('r1', { q1: 'unsure' });
  });

  it('shows the action error when answering fails', async () => {
    const fixture = await renderFixture({ observation, diagnosis: withQuestion });
    service['answer'].mockRejectedValue(new Error('x'));
    fixture.debugElement.query(By.directive(ClarifyingQuestionsComponent)).componentInstance.submitted.emit({ q1: 'yes' });
    await settle(fixture);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('diagnosis.actionFailed');
  });

  it('confirms a catalogue pick that differs from top-1 as a correction', async () => {
    const fixture = await renderFixture({ observation, diagnosis: baseResult });
    service['confirm'].mockResolvedValue({ ...observation, confirmedDiagnosisId: 'other' });
    fixture.debugElement.query(By.directive(DiagnosisConfirmComponent)).componentInstance.confirmed.emit('other');
    await settle(fixture);
    expect(service['confirm']).toHaveBeenCalledWith('o1', 'other', true);
  });

  it('confirms top-1 without a correction flag', async () => {
    const fixture = await renderFixture({ observation, diagnosis: baseResult });
    service['confirm'].mockResolvedValue(observation);
    fixture.debugElement.query(By.directive(DiagnosisConfirmComponent)).componentInstance.confirmed.emit('d1');
    await settle(fixture);
    expect(service['confirm']).toHaveBeenCalledWith('o1', 'd1', false);
  });

  it('enables Create task after confirmation and opens the recommendation', async () => {
    const confirmed = { ...observation, confirmedDiagnosisId: 'd1' } as ObservationDto;
    const fixture = await renderFixture({ observation: confirmed, diagnosis: baseResult });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('p-button.diag__task button')!;
    expect(button.disabled).toBe(false);
    button.click();
    expect(navigate).toHaveBeenCalledWith(['/recommendation', 'o1']);
  });

  it('disables Create task before confirmation', async () => {
    const root = await render({ observation, diagnosis: baseResult });
    expect(root.querySelector<HTMLButtonElement>('p-button.diag__task button')!.disabled).toBe(true);
  });
});
