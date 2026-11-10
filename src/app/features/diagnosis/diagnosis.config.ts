export const DIAGNOSIS_CONFIG = {
  maxReferencesPerHypothesis: 3,
  highProbability: 0.7,
  mediumProbability: 0.4,
  percentFactor: 100,
  densityDecimals: 1,
  topRank: 1,
  pollIntervalMs: 1500,
  pollMaxAttempts: 40,
  scoutingRoute: '/scouting',
  recommendationRoute: '/recommendation',
  createTaskIcon: 'pi pi-plus',
} as const;

export const ANSWER = { yes: 'yes', no: 'no', unsure: 'unsure' } as const;
