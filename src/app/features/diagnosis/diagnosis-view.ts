import {
  DiagnosisRegion, HypothesisDto, ObservationDto, PhotoDto, QuestionDto, ReferenceImageDto,
} from '../../core/api/models';
import { ANSWER, DIAGNOSIS_CONFIG } from './diagnosis.config';
import { UiLang } from './current-lang';

export type ProbabilityLevel = 'high' | 'medium' | 'low';
export interface AnswerOption { value: string; label?: string; labelKey?: string }

export function pick(uk: string, en: string, lang: UiLang): string {
  return lang === 'en' ? en : uk;
}

export function toPercent(probability: number): number {
  return Math.round(probability * DIAGNOSIS_CONFIG.percentFactor);
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
