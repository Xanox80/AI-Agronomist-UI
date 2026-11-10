import { PageQuery } from './common';
import { ExpertCaseReason, ExpertCaseStatus, LabelSource, ProblemCategory, Role } from './enums';
import { ObservationDto } from './observations';
import { DiagnosisResultDto } from './recognition';

export type LabelAction = 'confirm' | 'change' | 'add_new_class' | 'reject';
export interface AffectedRegion { type: 'rect' | 'polygon'; points: { x: number; y: number }[]; photoSeq: number }

export interface LabelDto {
  id: string; labelerName: string; labelerRole: Role; labelSource: LabelSource; action: LabelAction;
  diagnosisId?: string; affectedRegion?: AffectedRegion; weight: number; comment?: string; createdAt: string;
}
export interface ExpertCaseDto {
  id: string;
  reason: ExpertCaseReason;
  status: ExpertCaseStatus;
  priority: number;
  observation: ObservationDto;
  diagnosis: DiagnosisResultDto;
  userCorrection?: { fromDiagnosisId: string; toDiagnosisId: string };
  labels: LabelDto[];
  createdAt: string;
}
export interface ExpertCasesQuery extends PageQuery { status?: ExpertCaseStatus; reason?: ExpertCaseReason; cropId?: string }
export interface NewClassInput { code: string; nameUk: string; nameEn: string; problemCategory: ProblemCategory; cropIds: string[] }
export interface CreateLabelRequest {
  action: LabelAction; diagnosisId?: string; newClass?: NewClassInput; affectedRegion?: AffectedRegion; comment?: string;
}
export interface ResolveCaseRequest { finalDiagnosisId: string }
export interface FeedbackRequest {
  observationId: string; clientId: string; finalDiagnosisId: string; correctedFromModel: boolean;
}
export interface DatasetStatsDto {
  labeled: number; byDiagnosis: { code: string; count: number }[]; pendingReview: number; exportableCount: number;
}
