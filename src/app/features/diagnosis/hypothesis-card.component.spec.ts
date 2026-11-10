import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { HypothesisCardComponent } from './hypothesis-card.component';

describe('HypothesisCardComponent', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(HypothesisCardComponent);
    fixture.componentRef.setInput('hypothesis', {
      rank: 2, diagnosisCode: 'rust', nameUk: 'Іржа', nameEn: 'Rust', probability: 0.62, evidence: 'pustules',
    });
    fixture.componentRef.setInput('references', [{ id: 'i1', url: '/r.jpg', caption: 'cap', attribution: '', diagnosisCode: 'rust' }]);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the calibrated probability and the localized name', () => {
    const text = (render().nativeElement as HTMLElement).textContent;
    expect(text).toContain('62%');
    expect(text).toContain('Іржа');
  });

  it('renders reference photos for comparison', () => {
    expect((render().nativeElement as HTMLElement).querySelectorAll('figure')).toHaveLength(1);
  });

  it('emits the rank when picked', () => {
    const fixture = render();
    const picked: number[] = [];
    fixture.componentInstance.picked.subscribe((rank) => picked.push(rank));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.card__head')!.click();
    expect(picked).toEqual([2]);
  });
});
