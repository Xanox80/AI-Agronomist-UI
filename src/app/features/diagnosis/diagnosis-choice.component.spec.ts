import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CatalogDiagnosisDto } from '../../core/api/models';
import { DiagnosisChoiceComponent } from './diagnosis-choice.component';
import { DiagnosisChoice } from './diagnosis-view';

describe('DiagnosisChoiceComponent', () => {
  const choices: DiagnosisChoice[] = [
    { diagnosisId: 'd2', name: 'Септоріоз', percent: 25 },
    { diagnosisId: 'd3', name: 'Борошниста роса', percent: 10 },
  ];
  const catalogue = [{ id: 'c1', nameUk: 'Фузаріоз', nameEn: 'Fusarium' }] as CatalogDiagnosisDto[];

  function render(list: DiagnosisChoice[] = choices, cancellable = true) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(DiagnosisChoiceComponent);
    fixture.componentRef.setInput('choices', list);
    fixture.componentRef.setInput('catalogue', catalogue);
    fixture.componentRef.setInput('cancellable', cancellable);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const emitted: string[] = [];
    fixture.componentInstance.chosen.subscribe((id) => emitted.push(id));
    const click = (element: HTMLElement) => {
      element.click();
      fixture.detectChanges();
    };
    const confirmButton = () => root.querySelector<HTMLButtonElement>('[data-testid=choice-confirm] button')!;
    return { fixture, root, emitted, click, confirmButton };
  }

  it('shows each hypothesis with its model percentage as a large option', () => {
    const options = render().root.querySelectorAll('[data-testid=choice-option]');
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain('Септоріоз');
    expect(options[0].textContent).toContain('25%');
  });

  it('keeps the confirm button disabled until an option is chosen', () => {
    const { root, click, confirmButton } = render();
    expect(confirmButton().disabled).toBe(true);
    const option = root.querySelectorAll<HTMLButtonElement>('[data-testid=choice-option]')[1];
    click(option);
    expect(option.getAttribute('aria-pressed')).toBe('true');
    expect(confirmButton().disabled).toBe(false);
  });

  it('emits the chosen hypothesis id', () => {
    const { root, emitted, click, confirmButton } = render();
    click(root.querySelectorAll<HTMLButtonElement>('[data-testid=choice-option]')[1]);
    click(confirmButton());
    expect(emitted).toEqual(['d3']);
  });

  it('opens the catalogue select only after "Another diagnosis" and drops the hypothesis pick', () => {
    const { root, click, confirmButton } = render();
    expect(root.querySelector('p-select')).toBeNull();
    click(root.querySelector<HTMLButtonElement>('[data-testid=choice-option]')!);
    click(root.querySelector<HTMLButtonElement>('[data-testid=choice-other]')!);
    expect(root.querySelector('p-select')).not.toBeNull();
    expect(confirmButton().disabled).toBe(true);
  });

  it('shows the catalogue select straight away when there are no hypotheses to offer', () => {
    expect(render([]).root.querySelector('p-select')).not.toBeNull();
  });

  it('offers cancel only when the panel can be closed', () => {
    const { fixture, root } = render();
    const cancelled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);
    root.querySelector<HTMLButtonElement>('[data-testid=choice-cancel] button')!.click();
    expect(cancelled).toHaveBeenCalled();
    TestBed.resetTestingModule();
    expect(render(choices, false).root.querySelector('[data-testid=choice-cancel]')).toBeNull();
  });
});
