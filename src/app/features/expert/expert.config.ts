import { ExpertCaseReason, ProblemCategory } from '../../core/api/models';

export const EXPERT_CONFIG = {
  pageSize: 50,
  minPolygonVertices: 3,
  maxPolygonVertices: 50,
  pointDecimals: 4,
  vertexDotPx: 14,
  strokePx: 3,
  fillOpacity: 0.25,
  percentScale: 100,
  weightDecimals: 1,
  isoDateChars: 10,
  reasonSeverity: {
    low_confidence: 'warn',
    user_model_disagreement: 'danger',
    rare_class: 'info',
    out_of_distribution: 'danger',
    unsure_mode: 'warn',
  } as Record<ExpertCaseReason, 'warn' | 'danger' | 'info'>,
  problemCategories: [
    'disease', 'pest', 'weed', 'nutrition', 'abiotic_stress', 'mechanical_damage', 'normal',
  ] as readonly ProblemCategory[],
} as const;
