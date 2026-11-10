import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ScoutingWizard } from './scouting-wizard.service';
import { createWizardStub } from './scouting-wizard.stub';
import { StepObjectComponent } from './step-object.component';

describe('StepObjectComponent', () => {
  function render(wizard = createWizardStub()) {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: ScoutingWizard, useValue: wizard }],
    });
    const fixture = TestBed.createComponent(StepObjectComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('offers the six object types and no hints before one is picked', () => {
    const host = render();
    expect(host.querySelectorAll('button[role="radio"]')).toHaveLength(6);
    expect(host.querySelector('.hints')).toBeNull();
  });

  it('selects an object type on click', () => {
    const wizard = createWizardStub();
    const host = render(wizard);
    (host.querySelectorAll('button[role="radio"]')[4] as HTMLButtonElement).click();
    expect(wizard.organ()).toBe('pest');
  });

  it('shows the capture hints of the chosen object type', () => {
    const wizard = createWizardStub();
    wizard.organ.set('leaf');
    const host = render(wizard);
    expect(host.querySelectorAll('.hints li')).toHaveLength(4);
    expect(host.textContent).toContain('scouting.hints.leaf.extra');
  });
});
