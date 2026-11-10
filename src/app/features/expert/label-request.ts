import { AffectedRegion, CreateLabelRequest, LabelAction, NewClassInput } from '../../core/api/models';

export interface LabelDraft {
  action: LabelAction;
  diagnosisId?: string;
  newClass: Partial<NewClassInput>;
  comment: string;
  region?: AffectedRegion;
}

export type LabelRequestResult = { request: CreateLabelRequest } | { errorKey: string };

function isCompleteNewClass(c: Partial<NewClassInput>): c is NewClassInput {
  return !!(c.code?.trim() && c.nameUk?.trim() && c.nameEn?.trim() && c.problemCategory);
}

/** Validates the labeling form and maps it to the API request. */
export function buildLabelRequest(draft: LabelDraft, modelTopDiagnosisId?: string): LabelRequestResult {
  const base = { action: draft.action, affectedRegion: draft.region, comment: draft.comment.trim() || undefined };
  switch (draft.action) {
    case 'confirm':
      return modelTopDiagnosisId
        ? { request: { ...base, diagnosisId: modelTopDiagnosisId } }
        : { errorKey: 'expert.label.errors.noModelDiagnosis' };
    case 'change':
      return draft.diagnosisId
        ? { request: { ...base, diagnosisId: draft.diagnosisId } }
        : { errorKey: 'expert.label.errors.diagnosisRequired' };
    case 'add_new_class':
      return isCompleteNewClass(draft.newClass)
        ? {
            request: {
              ...base,
              newClass: { ...draft.newClass, code: draft.newClass.code.trim(), cropIds: draft.newClass.cropIds ?? [] },
            },
          }
        : { errorKey: 'expert.label.errors.newClassIncomplete' };
    case 'reject':
      return { request: base };
  }
}
