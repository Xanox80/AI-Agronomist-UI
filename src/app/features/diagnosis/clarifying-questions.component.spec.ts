import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { QuestionDto } from '../../core/api/models';
import { ClarifyingQuestionsComponent } from './clarifying-questions.component';

describe('ClarifyingQuestionsComponent', () => {
  const question: QuestionDto = {
    id: 'q1', textUk: 'Є наліт?', textEn: 'Is there coating?', answerType: 'yes_no', narrowsDiagnosisCodes: [],
  };

  it('collects the chosen answers and emits them on submit', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(ClarifyingQuestionsComponent);
    fixture.componentRef.setInput('questions', [question]);
    fixture.detectChanges();
    const submitted: Record<string, string>[] = [];
    fixture.componentInstance.submitted.subscribe((a) => submitted.push(a));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('.q__option')).toHaveLength(3);
    root.querySelectorAll<HTMLButtonElement>('.q__option')[1].click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('p-button button')!.click();

    expect(submitted).toEqual([{ q1: 'no' }]);
  });
});
