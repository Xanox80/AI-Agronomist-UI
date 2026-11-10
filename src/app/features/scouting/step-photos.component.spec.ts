import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ScoutingWizard } from './scouting-wizard.service';
import { createWizardStub } from './scouting-wizard.stub';
import { StepPhotosComponent } from './step-photos.component';
import { CapturedPhoto } from './scouting.types';

const report = { sharpness: 1, exposure: 1, plantCoverage: 1, objectSize: 1, passed: false };
const photo = (issues: string[]): CapturedPhoto => ({
  clientId: 'p1', blob: new Blob(['x']), previewUrl: 'blob:p1', report, issues,
});

describe('StepPhotosComponent', () => {
  function render(wizard = createWizardStub()) {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: ScoutingWizard, useValue: wizard }],
    });
    const fixture = TestBed.createComponent(StepPhotosComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('recommends the angle of the next photo and the hints of the chosen object', () => {
    const wizard = createWizardStub();
    wizard.organ.set('pest');
    wizard.photos.set([photo([])]);
    const host = render(wizard);
    expect(host.textContent).toContain('scouting.angles.2');
    expect(host.querySelectorAll('.hints li')).toHaveLength(4);
  });

  it('opens the rear camera input', () => {
    const input = render().querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.getAttribute('capture')).toBe('environment');
  });

  it('explains what is wrong with a photo and prompts a retake', () => {
    const wizard = createWizardStub();
    wizard.photos.set([photo(['qualityGate.hint.clippedHighlights'])]);
    const text = render(wizard).textContent;
    expect(text).toContain('qualityGate.hint.clippedHighlights');
    expect(text).toContain('scouting.quality.retake');
  });

  it('shows no retake prompt for a good photo', () => {
    const wizard = createWizardStub();
    wizard.photos.set([photo([])]);
    expect(render(wizard).querySelector('.retake-prompt')).toBeNull();
  });

  it('hands a chosen camera file to the wizard', async () => {
    const wizard = createWizardStub();
    const input = render(wizard).querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'a.jpg');
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await Promise.resolve();
    expect(wizard.receivePhoto).toHaveBeenCalledWith(file);
  });
});
