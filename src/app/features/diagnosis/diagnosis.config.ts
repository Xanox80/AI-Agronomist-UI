export const DIAGNOSIS_CONFIG = {
  maxReferencesPerHypothesis: 3,
  highProbability: 0.7,
  mediumProbability: 0.4,
  percentFactor: 100,
  /** Shown percentages are rounded to this step: the model is not precise to a single percent. */
  percentStep: 5,
  densityDecimals: 1,
  topRank: 1,
  pollIntervalMs: 1500,
  pollMaxAttempts: 40,
  scoutingRoute: '/scouting',
  recommendationRoute: '/recommendation',
  createTaskIcon: 'pi pi-plus',
  retryIcon: 'pi pi-refresh',
  addPhotosIcon: 'pi pi-camera',
  confirmedIcon: 'pi pi-check-circle',
  confirmTopIcon: 'pi pi-check',
  notThisIcon: 'pi pi-times',
  otherDiagnosisIcon: 'pi pi-search',
  changeAnswerIcon: 'pi pi-pencil',
  referenceDialogStyle: { width: '48rem', maxWidth: '95vw' },
  /** Value the recognition provider sends when it could not tell the crop, organ or category. */
  unknownValue: 'unknown',
  /** Attribution the backend seed gives generated stand-ins for reference photos (catalog-seed.service). */
  placeholderAttributionPrefix: 'Placeholder',
} as const;

export const ANSWER = { yes: 'yes', no: 'no', unsure: 'unsure' } as const;

/** Backend `unsureReason` values the screen explains differently (be-recognition UnsureReason). */
export const UNSURE_REASON = { outOfDistribution: 'out_of_distribution', providerError: 'provider_error' } as const;
