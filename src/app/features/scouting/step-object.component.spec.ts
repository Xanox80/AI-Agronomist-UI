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

  it('offers the six object types as a labelled radio group', () => {
    const host = render();
    expect(host.querySelectorAll('button[role="radio"]')).toHaveLength(6);
    expect(host.querySelector('[role="radiogroup"]')?.getAttribute('aria-labelledby')).toBe('scout-object-title');
  });

  it('chooses an object type with a single tap', () => {
    const wizard = createWizardStub();
    const host = render(wizard);
    (host.querySelectorAll('button[role="radio"]')[4] as HTMLButtonElement).click();
    expect(wizard.chooseOrgan).toHaveBeenCalledWith('pest');
  });

  it('marks the remembered object type as checked', () => {
    const wizard = createWizardStub();
    wizard.organ.set('leaf');
    const checked = render(wizard).querySelector('button[aria-checked="true"]');
    expect(checked?.textContent).toContain('scouting.object.leaf');
  });
});
