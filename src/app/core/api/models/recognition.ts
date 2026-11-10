import { Organ, PestStage, ProblemCategory, DiagnosisPass } from './enums';

export interface DiagnosisRegion { x: number; y: number; w: number; h: number; photoSeq: number }

export interface HypothesisDto {
  rank: number;
  diagnosisId?: string;
  diagnosisCode: string;
  nameUk: string;
  nameEn: string;
  probability: number;
  stage?: string;
  evidence: string;
  region?: DiagnosisRegion;
}

export interface QuestionOption { value: string; labelUk: string; labelEn: string }
export interface QuestionDto {
  id: string;
  textUk: string;
  textEn: string;
  answerType: 'yes_no' | 'choice';
  options?: QuestionOption[];
  narrowsDiagnosisCodes: string[];
}

export interface ReferenceImageDto {
  id: string; diagnosisCode: string; stage?: string; url: string; caption: string; attribution: string;
}

export interface PestInfoDto {
  species?: string; stage?: PestStage; densityPerPlant?: number; densityPerM2?: number;
}

export interface DiagnosisResultDto {
  id: string;
  observationId: string;
  pass: DiagnosisPass;
  modelVersion: string;
  cropCode?: string;
  organ?: Organ;
  problemCategory?: ProblemCategory;
  unsure: boolean;
  unsureReason?: string;
  outOfDistribution: boolean;
  hypotheses: HypothesisDto[];
  pest?: PestInfoDto;
  clarifyingQuestions: QuestionDto[];
  answers: Record<string, string>;
  referenceImages: ReferenceImageDto[];
  needsMorePhotos: boolean;
  createdAt: string;
}

export interface AnswerQuestionsRequest { answers: Record<string, string> }
export interface RecognitionStatusDto {
  provider: string;
  model: string;
  thresholds: { unsure: number; ood: number };
  temperature: number;
}
