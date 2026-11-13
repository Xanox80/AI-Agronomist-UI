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

  it('reports locating instead of a missing GPS while the fix is pending', () => {
    const wizard = createWizardStub();
    wizard.loading.set(true);
    const text = render(wizard).textContent;
    expect(text).toContain('scouting.field.locating');
    expect(text).not.toContain('scouting.field.noGps');
  });

  it('shows the field suggestion when the field was picked by GPS', () => {
    const wizard = createWizardStub();
    wizard.fix.set({ lat: 1, lng: 2, accuracyM: 7 });
    wizard.fieldLinkMethod.set('gps');
    const text = render(wizard).textContent;
    expect(text).toContain('scouting.field.suggested');
    expect(text).not.toContain('scouting.field.gpsFix');
  });

  it('shows the GPS accuracy when no field contains the position', () => {
    const wizard = createWizardStub();
    wizard.fix.set({ lat: 1, lng: 2, accuracyM: 7 });
    expect(render(wizard).textContent).toContain('scouting.field.gpsFix');
  });
});
