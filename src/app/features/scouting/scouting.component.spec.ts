import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ScoutingWizard } from './scouting-wizard.service';
import { createWizardStub, WizardStub } from './scouting-wizard.stub';
import { ScoutingComponent } from './scouting.component';

describe('ScoutingComponent', () => {
  function render(wizard: WizardStub) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    TestBed.overrideComponent(ScoutingComponent, {
      set: { providers: [{ provide: ScoutingWizard, useValue: wizard }] },
    });
    const fixture = TestBed.createComponent(ScoutingComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('starts the wizard when opened', () => {
    const wizard = createWizardStub();
    render(wizard);
    expect(wizard.start).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['field', 'app-scouting-step-field'],
    ['object', 'app-scouting-step-object'],
    ['photos', 'app-scouting-step-photos'],
    ['note', 'app-scouting-step-note'],
  ])('renders the %s step template', (step, selector) => {
    const wizard = createWizardStub();
    wizard.currentStep.set(step);
    expect(render(wizard).querySelector(selector)).not.toBeNull();
  });

  it('offers submit instead of next on the last step', () => {
    const wizard = createWizardStub();
    wizard.currentStep.set('note');
    wizard.isLastStep.set(true);
    const host = render(wizard);
    expect(host.textContent).toContain('scouting.submit');
    expect(host.textContent).not.toContain('common.next');
  });
});
