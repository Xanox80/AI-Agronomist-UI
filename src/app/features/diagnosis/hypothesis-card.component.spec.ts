import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { HypothesisCardComponent } from './hypothesis-card.component';

describe('HypothesisCardComponent', () => {
  function render(showEvidence = true) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(HypothesisCardComponent);
    fixture.componentRef.setInput('hypothesis', {
      rank: 2, diagnosisCode: 'rust', nameUk: 'Іржа', nameEn: 'Rust', probability: 0.62, evidence: 'pustules',
    });
    fixture.componentRef.setInput('references', [{ id: 'i1', url: '/r.jpg', caption: 'cap', attribution: '', diagnosisCode: 'rust' }]);
    fixture.componentRef.setInput('showEvidence', showEvidence);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the rounded confidence, its level and the localized name', () => {
    const root = render().nativeElement as HTMLElement;
    expect(root.textContent).toContain('60%');
    expect(root.textContent).toContain('Іржа');
    expect(root.querySelector('[data-testid=level]')?.textContent).toContain('diagnosis.level.medium');
  });

  it('passes the reference photos to the comparison gallery', () => {
    expect((render().nativeElement as HTMLElement).querySelectorAll('app-reference-gallery figure')).toHaveLength(1);
  });

  it('hides the evidence line when the screen shows a shared one', () => {
    expect((render(false).nativeElement as HTMLElement).querySelector('.card__evidence')).toBeNull();
  });

  it('emits the rank when picked', () => {
    const fixture = render();
    const picked: number[] = [];
    fixture.componentInstance.picked.subscribe((rank) => picked.push(rank));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.card__head')!.click();
    expect(picked).toEqual([2]);
  });
});
