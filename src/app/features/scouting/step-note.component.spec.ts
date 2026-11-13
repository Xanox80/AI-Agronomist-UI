import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ScoutingWizard } from './scouting-wizard.service';
import { createWizardStub } from './scouting-wizard.stub';
import { StepNoteComponent } from './step-note.component';

describe('StepNoteComponent', () => {
  function render(wizard = createWizardStub()) {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: ScoutingWizard, useValue: wizard }],
    });
    const fixture = TestBed.createComponent(StepNoteComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the record button when idle', () => {
    expect(render().textContent).toContain('scouting.note.record');
  });

  it('shows the stop button while recording', () => {
    const wizard = createWizardStub();
    wizard.recording.set(true);
    expect(render(wizard).textContent).toContain('scouting.note.stop');
  });

  it('hides the voice controls when recording is unsupported', () => {
    const wizard = createWizardStub();
    wizard.voiceSupported = false;
    expect(render(wizard).textContent).not.toContain('scouting.note.record');
  });

  it('reports a recorded note, a denied microphone and a failed submit', () => {
    const wizard = createWizardStub();
    wizard.voiceNote.set({ blob: new Blob(['v']), durationSec: 4 });
    wizard.voiceError.set(true);
    wizard.submitFailed.set(true);
    const text = render(wizard).textContent;
    expect(text).toContain('scouting.note.recorded');
    expect(text).toContain('scouting.note.micDenied');
    expect(text).toContain('scouting.submitFailed');
  });

  it('says nothing about drafts while online', () => {
    expect(render().textContent).not.toContain('scouting.offlineDraft');
  });

  it('explains offline that the observation is kept as a draft until sync', () => {
    const wizard = createWizardStub();
    wizard.online.set(false);
    expect(render(wizard).textContent).toContain('scouting.offlineDraft');
  });

  it('tells the scout to wait while the photos are being sent', () => {
    const wizard = createWizardStub();
    wizard.submitting.set(true);
    expect(render(wizard).textContent).toContain('scouting.sending');
  });
});
