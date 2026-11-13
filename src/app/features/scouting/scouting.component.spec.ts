import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ScoutingWizard } from './scouting-wizard.service';
import { createWizardStub, WizardStub } from './scouting-wizard.stub';
import { ScoutingComponent } from './scouting.component';

describe('ScoutingComponent', () => {
  function create(wizard: WizardStub) {
    TestBed.configureTestingModule({ providers: [provideTranslateService(), provideRouter([])] });
    TestBed.overrideComponent(ScoutingComponent, {
      set: { providers: [{ provide: ScoutingWizard, useValue: wizard }] },
    });
    const fixture = TestBed.createComponent(ScoutingComponent);
    fixture.detectChanges();
    return fixture;
  }

  function render(wizard: WizardStub) {
    return create(wizard).nativeElement as HTMLElement;
  }

  afterEach(() => vi.restoreAllMocks());

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

  it('shows the named steps and marks the current one', () => {
    const wizard = createWizardStub();
    wizard.step.set(2);
    const current = render(wizard).querySelector('.stepper [aria-current="step"]');
    expect(current?.textContent).toContain('scouting.steps.photos');
  });

  it('hides back on the first step', () => {
    expect(render(createWizardStub()).textContent).not.toContain('common.back');
  });

  it('offers submit instead of next on the last step', () => {
    const wizard = createWizardStub();
    wizard.currentStep.set('note');
    wizard.isLastStep.set(true);
    const host = render(wizard);
    expect(host.textContent).toContain('scouting.submit');
    expect(host.textContent).not.toContain('common.next');
  });

  it('offers saving a draft instead of sending when offline', () => {
    const wizard = createWizardStub();
    wizard.isLastStep.set(true);
    wizard.online.set(false);
    expect(render(wizard).textContent).toContain('scouting.saveOffline');
  });

  it('explains why next is disabled', () => {
    const wizard = createWizardStub();
    wizard.blockedHintKey.set('scouting.blocked.photos');
    expect(render(wizard).textContent).toContain('scouting.blocked.photos');
  });

  it('confirms a saved observation in place and offers another one', () => {
    const wizard = createWizardStub();
    wizard.savedOutcome.set('queuedOffline');
    const host = render(wizard);
    expect(host.textContent).toContain('scouting.saved.queuedOffline.text');
    expect(host.querySelector('app-scouting-step-field')).toBeNull();
    (host.querySelector('.saved button') as HTMLButtonElement).click();
    expect(wizard.scoutAgain).toHaveBeenCalled();
  });

  it('lets the scout leave freely without unsaved photos', () => {
    const confirm = vi.spyOn(window, 'confirm');
    expect(create(createWizardStub()).componentInstance.canLeave()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before leaving with unsaved photos', () => {
    const wizard = createWizardStub();
    wizard.hasUnsavedWork.set(true);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(create(wizard).componentInstance.canLeave()).toBe(false);
  });
});
