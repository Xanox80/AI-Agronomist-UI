import { ProblemCategory } from '../../core/api/models';

export const SETTINGS_CONFIG = {
  /** Categories a chief agronomist may auto-approve; quarantine and critical diagnoses are always excluded server-side. */
  autoApproveCategories: ['disease', 'pest', 'weed', 'nutrition', 'abiotic_stress'] as readonly ProblemCategory[],
  /** Server floor is RECOMMENDATION_AUTO_APPROVE_MIN_CONFIDENCE; the UI never proposes less. */
  autoApproveMinConfidence: 0.9,
  regionCodes: ['UA-DEFAULT', 'UA-NORTH', 'UA-CENTER', 'UA-SOUTH', 'UA-EAST', 'UA-WEST'] as readonly string[],
  /** Remembers the opt-out on the device so offline scouting still honours it. */
  geoCollectionStorageKey: 'ap-scout.geo-collection',
  stockPageSize: 50,
  stockSearchDebounceMs: 300,
  stockColumnCount: 4,
} as const;
