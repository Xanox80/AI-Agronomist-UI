import { environment } from '../../../environments/environment';
import { SCOUTING_STEPS } from './scouting-steps';

/** Tunables of the scouting wizard; photo count and quality thresholds come from the environment. */
export const SCOUTING_CONFIG = {
  stepCount: SCOUTING_STEPS.length,
  minPhotos: 1,
  maxPhotos: environment.maxPhotos,
  maxVoiceSeconds: 60,
  fieldsPageSize: 200,
  fieldsCacheKey: 'ap-scout.scouting.fields',
  cropMemoryCacheKey: 'ap-scout.scouting.crop-memory',
  organMemoryCacheKey: 'ap-scout.scouting.organ-memory',
  geolocation: { enableHighAccuracy: true, timeoutMs: 8000, maximumAgeMs: 30000 },
} as const;
