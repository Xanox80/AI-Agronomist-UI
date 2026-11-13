import {
  DiagnosisRegion, DiagnosisResultDto, HypothesisDto, ObservationDto, PhotoDto, QuestionDto, ReferenceImageDto,
} from '../../core/api/models';
import { ANSWER, DIAGNOSIS_CONFIG, UNSURE_REASON } from './diagnosis.config';
import { UiLang } from './current-lang';

export type ProbabilityLevel = 'high' | 'medium' | 'low';
export type UncertainReason = 'outOfDistribution' | 'providerError' | 'needsMorePhotos' | 'lowConfidence';
export interface AnswerOption { value: string; label?: string; labelKey?: string }
export interface DiagnosisChoice { diagnosisId: string; name: string; percent: number }

export function pick(uk: string, en: string, lang: UiLang): string {
  return lang === 'en' ? en : uk;
}

/** Rounds to the configured step and never shows 0% for a listed hypothesis, which would read as "impossible". */
export function toPercent(probability: number): number {
  const step = DIAGNOSIS_CONFIG.percentStep;
  const rounded = Math.round((probability * DIAGNOSIS_CONFIG.percentFactor) / step) * step;
  return probability > 0 ? Math.max(rounded, step) : 0;
}

export function probabilityLevel(probability: number): ProbabilityLevel {
  if (probability >= DIAGNOSIS_CONFIG.highProbability) return 'high';
  return probability >= DIAGNOSIS_CONFIG.mediumProbability ? 'medium' : 'low';
}

export function regionStyle(region: DiagnosisRegion): Record<string, string> {
  const pct = (value: number) => `${value * DIAGNOSIS_CONFIG.percentFactor}%`;
  return { left: pct(region.x), top: pct(region.y), width: pct(region.w), height: pct(region.h) };
}

export function photoFor(photos: readonly PhotoDto[], hypothesis: HypothesisDto | undefined): PhotoDto | undefined {
  const seq = hypothesis?.region?.photoSeq;
  return photos.find((photo) => photo.seq === seq) ?? photos[0];
}

export function isKnown(value: string | undefined): value is string {
  return !!value && value !== DIAGNOSIS_CONFIG.unknownValue;
}

export function isPlaceholderReference(image: ReferenceImageDto): boolean {
  return image.attribution?.startsWith(DIAGNOSIS_CONFIG.placeholderAttributionPrefix) ?? false;
}

/** The evidence line when every hypothesis carries the same one (local classifier), so it is shown once, not per card. */
export function sharedEvidence(hypotheses: readonly HypothesisDto[]): string | undefined {
  const first = hypotheses[0]?.evidence;
  const shared = hypotheses.length > 1 && !!first && hypotheses.every((h) => h.evidence === first);
  return shared ? first : undefined;
}

export function uncertainReason(result: DiagnosisResultDto): UncertainReason {
  if (result.outOfDistribution || result.unsureReason === UNSURE_REASON.outOfDistribution) return 'outOfDistribution';
  if (result.unsureReason === UNSURE_REASON.providerError) return 'providerError';
  return result.needsMorePhotos ? 'needsMorePhotos' : 'lowConfidence';
}

export function referencesFor(images: readonly ReferenceImageDto[], diagnosisCode: string): ReferenceImageDto[] {
  return images.filter((image) => image.diagnosisCode === diagnosisCode)
    .slice(0, DIAGNOSIS_CONFIG.maxReferencesPerHypothesis);
}

export function answerOptions(question: QuestionDto, lang: UiLang): AnswerOption[] {
  const unsure: AnswerOption = { value: ANSWER.unsure, labelKey: 'diagnosis.answer.unsure' };
  const base: AnswerOption[] = question.answerType === 'choice'
    ? (question.options ?? []).map((o) => ({ value: o.value, label: pick(o.labelUk, o.labelEn, lang) }))
    : [
        { value: ANSWER.yes, labelKey: 'diagnosis.answer.yes' },
        { value: ANSWER.no, labelKey: 'diagnosis.answer.no' },
      ];
  return [...base, unsure];
}

export function isAwaitingServer(observation: ObservationDto): boolean {
  return observation.status === 'draft' || observation.status === 'pending_sync' || observation.photos?.length === 0;
}

export function isCorrection(chosenDiagnosisId: string, hypotheses: readonly HypothesisDto[]): boolean {
  return hypotheses[0]?.diagnosisId !== chosenDiagnosisId;
}

/** Hypotheses the user can name as the right diagnosis; only catalogue-linked ones can be confirmed. */
export function diagnosisChoices(hypotheses: readonly HypothesisDto[], lang: UiLang, excludeTop: boolean): DiagnosisChoice[] {
  return hypotheses.slice(excludeTop ? 1 : 0).flatMap((h) => h.diagnosisId
    ? [{ diagnosisId: h.diagnosisId, name: pick(h.nameUk, h.nameEn, lang), percent: toPercent(h.probability) }]
    : []);
}
