import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { HypothesisDto } from '../../core/api/models';
import { ConfirmedDiagnosis, DiagnosisConfirmComponent } from './diagnosis-confirm.component';

describe('DiagnosisConfirmComponent', () => {
  const hypotheses: HypothesisDto[] = [
    { rank: 1, diagnosisId: 'd1', diagnosisCode: 'rust', nameUk: 'Іржа', nameEn: 'Rust', probability: 0.6, evidence: '' },
    { rank: 2, diagnosisId: 'd2', diagnosisCode: 'septoria', nameUk: 'Септоріоз', nameEn: 'Septoria', probability: 0.25, evidence: '' },
  ];

  function render(inputs: { confirmation?: ConfirmedDiagnosis; allowTopConfirm?: boolean } = {}) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('uk', { diagnosis: { confirmedAs: 'Confirmed: {{name}}', confirmTop: 'Yes, {{name}}' } });
    translate.use('uk');
    const fixture = TestBed.createComponent(DiagnosisConfirmComponent);
    fixture.componentRef.setInput('hypotheses', hypotheses);
    fixture.componentRef.setInput('confirmation', inputs.confirmation);
    fixture.componentRef.setInput('allowTopConfirm', inputs.allowTopConfirm ?? true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const emitted: string[] = [];
    fixture.componentInstance.confirmed.subscribe((id) => emitted.push(id));
    const click = (selector: string) => {
      root.querySelector<HTMLButtonElement>(selector)!.click();
      fixture.detectChanges();
    };
    return { fixture, root, emitted, click };
  }

  it('offers "Yes, it is <top-1>" and "Not this" as the first step', () => {
    const { root } = render();
    expect(root.querySelector('[data-testid=confirm-top]')?.textContent).toContain('Yes, Іржа');
    expect(root.querySelector('[data-testid=not-this]')).not.toBeNull();
    expect(root.querySelector('app-diagnosis-choice')).toBeNull();
  });

  it('confirms the top-1 diagnosis id in one tap', () => {
    const { emitted, click } = render();
    click('[data-testid=confirm-top] button');
    expect(emitted).toEqual(['d1']);
  });

  it('opens the other hypotheses without top-1 on "Not this" and confirms the picked one', () => {
    const { root, emitted, click } = render();
    click('[data-testid=not-this] button');
    const options = root.querySelectorAll<HTMLButtonElement>('[data-testid=choice-option]');
    expect([...options].map((o) => o.textContent)).toEqual([expect.stringContaining('Септоріоз')]);
    expect(root.querySelector('[data-testid=confirm-top]')).toBeNull();
    click('[data-testid=choice-option]');
    click('[data-testid=choice-confirm] button');
    expect(emitted).toEqual(['d2']);
  });

  it('moves focus to the correction panel when it opens', async () => {
    const { fixture, root, click } = render();
    click('[data-testid=not-this] button');
    await fixture.whenStable();
    expect(document.activeElement).toBe(root.querySelector('app-diagnosis-choice h3'));
  });

  it('returns to the two buttons when the correction is cancelled', () => {
    const { root, click } = render();
    click('[data-testid=not-this] button');
    click('[data-testid=choice-cancel] button');
    expect(root.querySelector('app-diagnosis-choice')).toBeNull();
    expect(root.querySelector('[data-testid=confirm-top]')).not.toBeNull();
  });

  it('has no one-tap top-1 confirmation in not-sure mode but lists every hypothesis to pick from', () => {
    const { root } = render({ allowTopConfirm: false });
    expect(root.querySelector('[data-testid=confirm-top]')).toBeNull();
    expect(root.querySelectorAll('[data-testid=choice-option]')).toHaveLength(2);
    expect(root.querySelector('[data-testid=choice-cancel]')).toBeNull();
  });

  it('announces the confirmed diagnosis and that the photos went to model training', () => {
    const { root } = render({ confirmation: { diagnosisId: 'd1' } });
    const status = root.querySelector('[role=status]');
    expect(status?.textContent).toContain('Confirmed: Іржа');
    expect(status?.querySelector('[data-testid=training-note]')?.textContent).toContain('diagnosis.trainingNote');
    expect(root.querySelector('[data-testid=confirm-top]')).toBeNull();
  });

  it('falls back to the generic confirmed text for an unknown diagnosis id', () => {
    const marker = render({ confirmation: { diagnosisId: 'missing' } }).root.querySelector('[data-testid=confirmed]');
    expect(marker?.textContent).toContain('diagnosis.confirmed');
    expect(marker?.textContent).not.toContain('Іржа');
  });

  it('lets the user change a confirmed answer and closes the edit state on the next confirmation', () => {
    const { fixture, root, click } = render({ confirmation: { diagnosisId: 'd1' } });
    click('[data-testid=change-answer] button');
    expect(root.querySelector('[data-testid=confirmed]')).toBeNull();
    expect(root.querySelector('[data-testid=confirm-top]')).not.toBeNull();
    fixture.componentRef.setInput('confirmation', { diagnosisId: 'd1' });
    fixture.detectChanges();
    expect(root.querySelector('[data-testid=confirmed]')).not.toBeNull();
  });
});
