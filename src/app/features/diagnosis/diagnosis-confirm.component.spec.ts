import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DiagnosisConfirmComponent } from './diagnosis-confirm.component';

describe('DiagnosisConfirmComponent', () => {
  function render(confirmedId?: string) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(DiagnosisConfirmComponent);
    fixture.componentRef.setInput('hypotheses', [
      { rank: 1, diagnosisId: 'd1', diagnosisCode: 'rust', nameUk: 'Іржа', nameEn: 'Rust', probability: 0.6, evidence: '' },
    ]);
    fixture.componentRef.setInput('confirmedId', confirmedId);
    fixture.detectChanges();
    return fixture;
  }

  it('confirms the top-1 diagnosis id', () => {
    const fixture = render();
    const emitted: string[] = [];
    fixture.componentInstance.confirmed.subscribe((id) => emitted.push(id));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('p-button button')!.click();
    expect(emitted).toEqual(['d1']);
  });

  it('shows the confirmed marker once a diagnosis is confirmed', () => {
    expect((render('d1').nativeElement as HTMLElement).querySelector('[data-testid=confirmed]')).not.toBeNull();
  });
});
