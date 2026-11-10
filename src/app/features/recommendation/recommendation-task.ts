import { ObservationDto, RecommendationDto, TaskType } from '../../core/api/models';

const TREATING_LEVELS: readonly string[] = ['treat', 'urgent'];

export const taskTypeFor = (recommendation: RecommendationDto): TaskType =>
  TREATING_LEVELS.includes(recommendation.actionLevel) ? 'treatment' : 'reinspection';

/** Query params that prefill the new-task form from an approved recommendation and its observation. */
export function taskQueryParams(
  recommendation: RecommendationDto, observation: ObservationDto, title: string,
): Record<string, string> {
  const params: Record<string, string | number | undefined> = {
    type: taskTypeFor(recommendation),
    title,
    fieldId: observation.fieldId,
    observationId: recommendation.observationId,
    diagnosisId: recommendation.diagnosisId ?? undefined,
    recommendationId: recommendation.id,
    lat: observation.lat,
    lng: observation.lng,
    photoIds: observation.photos.map((photo) => photo.id).join(',') || undefined,
  };
  return Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, string | number] => entry[1] !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}
