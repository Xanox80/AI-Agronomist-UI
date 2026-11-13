import { signal } from '@angular/core';
import { SCOUTING_STEPS, ScoutingStep } from './scouting-steps';
import { SavedOutcome } from './scouting-wizard.service';
import { CapturedPhoto, ScoutingOrgan } from './scouting.types';

/** Test double with the signals and methods the wizard templates read; override per test. */
export function createWizardStub() {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    steps: signal<readonly ScoutingStep[]>(SCOUTING_STEPS),
    stepCount: signal(SCOUTING_STEPS.length),
    step: signal(0),
    currentStep: signal('field'),
    loading: signal(false),
    online: signal(true),
    extendedObservationId: signal<string | undefined>(undefined),
    savedOutcome: signal<SavedOutcome | null>(null),
    blockedHintKey: signal<string | null>(null),
    hasUnsavedWork: signal(false),
    checkingPhoto: signal(false),
    photoLimitReached: signal(false),
    isQuickCapture: signal(false),
    isLastStep: signal(false),
    canAdvance: signal(true),
    submitting: signal(false),
    submitFailed: signal(false),
    fix: signal<{ lat: number; lng: number; accuracyM: number } | null>(null),
    fieldLinkMethod: signal('none'),
    fieldId: signal<string | undefined>(undefined),
    fieldOptions: signal<{ value: string; label: string }[]>([]),
    cropId: signal<string | undefined>(undefined),
    cropOptions: signal<{ value: string; label: string }[]>([]),
    bbchStage: signal<number | undefined>(undefined),
    bbchOptions: signal<{ value: number; label: string }[]>([]),
    organ: signal<ScoutingOrgan | null>(null),
    photos: signal<CapturedPhoto[]>([]),
    canAddPhoto: signal(true),
    scaleMarkerUsed: signal(false),
    textNote: signal(''),
    voiceNote: signal<{ blob: Blob; durationSec: number } | null>(null),
    voiceError: signal(false),
    voiceSupported: true,
    recording: signal(false),
    next: vi.fn(),
    back: vi.fn(),
    submit: vi.fn(),
    selectField: vi.fn(),
    selectCrop: vi.fn(),
    removePhoto: vi.fn(),
    chooseOrgan: vi.fn(),
    scoutAgain: vi.fn(),
    beginPhotoCapture: vi.fn(),
    receivePhoto: vi.fn().mockResolvedValue(undefined),
    recordVoice: vi.fn(),
    stopVoice: vi.fn(),
  };
}

export type WizardStub = ReturnType<typeof createWizardStub>;
