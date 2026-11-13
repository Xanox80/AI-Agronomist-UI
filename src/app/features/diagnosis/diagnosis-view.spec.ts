import {
  DiagnosisResultDto, HypothesisDto, ObservationDto, PhotoDto, QuestionDto, ReferenceImageDto,
} from '../../core/api/models';
import {
  answerOptions, diagnosisChoices, isAwaitingServer, isCorrection, isKnown, isPlaceholderReference, photoFor, pick, probabilityLevel,
  referencesFor, regionStyle, sharedEvidence, toPercent, uncertainReason,
} from './diagnosis-view';

const hyp = (diagnosisId: string): HypothesisDto =>
  ({ rank: 1, diagnosisId, diagnosisCode: 'c', nameUk: 'у', nameEn: 'e', probability: 0.5, evidence: '' });

describe('diagnosis-view', () => {
  it('picks the localized text and defaults to Ukrainian', () => {
    expect(pick('уа', 'en', 'en')).toBe('en');
    expect(pick('уа', 'en', 'uk')).toBe('уа');
  });

  it('rounds probability to the display step to avoid false precision', () => {
    expect(toPercent(0.456)).toBe(45);
    expect(toPercent(0.8)).toBe(80);
  });

  it('never shows a listed hypothesis as 0%', () => {
    expect(toPercent(0.01)).toBe(5);
    expect(toPercent(0)).toBe(0);
  });

  it('treats missing and unknown provider values as not known', () => {
    expect([isKnown('leaf'), isKnown('unknown'), isKnown(undefined)]).toEqual([true, false, false]);
  });

  it('recognises generated reference placeholders by their attribution', () => {
    expect(isPlaceholderReference({ attribution: 'Placeholder - replace with a licensed field photo' } as ReferenceImageDto)).toBe(true);
    expect(isPlaceholderReference({ attribution: 'Photo: Institute' } as ReferenceImageDto)).toBe(false);
  });

  it('returns the evidence line only when every hypothesis shares it', () => {
    const withEvidence = (evidence: string) => ({ ...hyp('x'), evidence });
    expect(sharedEvidence([withEvidence('same'), withEvidence('same')])).toBe('same');
    expect(sharedEvidence([withEvidence('a'), withEvidence('b')])).toBeUndefined();
    expect(sharedEvidence([withEvidence('only')])).toBeUndefined();
  });

  it('explains why the system is not sure', () => {
    const result = (patch: Partial<DiagnosisResultDto>) =>
      ({ unsure: true, outOfDistribution: false, needsMorePhotos: false, ...patch }) as DiagnosisResultDto;
    expect(uncertainReason(result({ outOfDistribution: true }))).toBe('outOfDistribution');
    expect(uncertainReason(result({ unsureReason: 'provider_error' }))).toBe('providerError');
    expect(uncertainReason(result({ needsMorePhotos: true }))).toBe('needsMorePhotos');
    expect(uncertainReason(result({ unsureReason: 'low_confidence' }))).toBe('lowConfidence');
  });

  it('classifies probability levels', () => {
    expect([0.9, 0.5, 0.1].map(probabilityLevel)).toEqual(['high', 'medium', 'low']);
  });

  it('turns a normalised region into percent css', () => {
    expect(regionStyle({ x: 0.1, y: 0.2, w: 0.5, h: 0.25, photoSeq: 1 }))
      .toEqual({ left: '10%', top: '20%', width: '50%', height: '25%' });
  });

  it('picks the photo referenced by the region or falls back to the first', () => {
    const photos = [{ seq: 1, url: 'a' }, { seq: 2, url: 'b' }] as PhotoDto[];
    const withRegion = { ...hyp('x'), region: { x: 0, y: 0, w: 1, h: 1, photoSeq: 2 } };
    expect(photoFor(photos, withRegion)?.url).toBe('b');
    expect(photoFor(photos, hyp('x'))?.url).toBe('a');
    expect(photoFor([], undefined)).toBeUndefined();
  });

  it('limits reference photos per hypothesis', () => {
    const images = Array.from({ length: 5 }, (_, i) => ({ id: `${i}`, diagnosisCode: 'rust' }) as ReferenceImageDto);
    images.push({ id: 'x', diagnosisCode: 'other' } as ReferenceImageDto);
    expect(referencesFor(images, 'rust')).toHaveLength(3);
  });

  it('offers yes, no and unsure for yes/no questions', () => {
    const q = { answerType: 'yes_no' } as QuestionDto;
    expect(answerOptions(q, 'uk').map((o) => o.value)).toEqual(['yes', 'no', 'unsure']);
  });

  it('offers localized choice options plus unsure', () => {
    const q = { answerType: 'choice', options: [{ value: 'a', labelUk: 'А', labelEn: 'A' }] } as QuestionDto;
    expect(answerOptions(q, 'en').map((o) => o.label ?? o.value)).toEqual(['A', 'unsure']);
  });

  it('treats draft and pending_sync observations as awaiting the server', () => {
    expect(isAwaitingServer({ status: 'pending_sync' } as ObservationDto)).toBe(true);
    expect(isAwaitingServer({ status: 'synced' } as ObservationDto)).toBe(false);
  });

  it('detects a correction when the chosen diagnosis differs from top-1', () => {
    expect(isCorrection('b', [hyp('a')])).toBe(true);
    expect(isCorrection('a', [hyp('a')])).toBe(false);
  });

  it('offers catalogue-linked hypotheses as choices, without top-1 when it has its own button', () => {
    const hypotheses: HypothesisDto[] = [
      { ...hyp('a'), probability: 0.6 },
      { ...hyp('b'), rank: 2, nameUk: 'Бе', probability: 0.3 },
      { ...hyp(''), rank: 3, diagnosisId: undefined },
    ];
    expect(diagnosisChoices(hypotheses, 'uk', true)).toEqual([{ diagnosisId: 'b', name: 'Бе', percent: 30 }]);
    expect(diagnosisChoices(hypotheses, 'en', false).map((c) => c.diagnosisId)).toEqual(['a', 'b']);
  });
});
