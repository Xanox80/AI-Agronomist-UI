import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ScoutingWizard } from './scouting-wizard.service';
import { createWizardStub } from './scouting-wizard.stub';
import { StepFieldComponent } from './step-field.component';

describe('StepFieldComponent', () => {
  function render(wizard = createWizardStub()) {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: ScoutingWizard, useValue: wizard }],
    });
    const fixture = TestBed.createComponent(StepFieldComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('warns that GPS is unavailable and offers the three selects', () => {
    const host = render();
    expect(host.textContent).toContain('scouting.field.noGps');
    expect(host.querySelectorAll('p-select')).toHaveLength(3);
  });

  it('shows the GPS accuracy and the field suggestion', () => {
    const wizard = createWizardStub();
    wizard.fix.set({ lat: 1, lng: 2, accuracyM: 7 });
    wizard.fieldLinkMethod.set('gps');
    const host = render(wizard);
    expect(host.textContent).toContain('scouting.field.gpsFix');
    expect(host.textContent).toContain('scouting.field.suggested');
  });
});
