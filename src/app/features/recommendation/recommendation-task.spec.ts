import { ObservationDto, RecommendationDto } from '../../core/api/models';
import { taskQueryParams, taskTypeFor } from './recommendation-task';

const recommendation = (over: Partial<RecommendationDto> = {}) =>
  ({ id: 'r1', observationId: 'o1', diagnosisId: 'd1', actionLevel: 'treat', ...over }) as RecommendationDto;
const observation = { fieldId: 'f1', lat: 50.5, lng: 30.5, photos: [{ id: 'p1' }, { id: 'p2' }] } as ObservationDto;

describe('recommendation task prefill', () => {
  it('links the task to the recommendation, diagnosis, coordinates and photos', () => {
    expect(taskQueryParams(recommendation(), observation, 'Treat')).toEqual({
      type: 'treatment', title: 'Treat', fieldId: 'f1', observationId: 'o1', diagnosisId: 'd1',
      recommendationId: 'r1', lat: '50.5', lng: '30.5', photoIds: 'p1,p2',
    });
  });

  it('omits values the observation does not have', () => {
    const params = taskQueryParams(recommendation({ diagnosisId: null }), { photos: [] } as unknown as ObservationDto, 'x');
    expect(Object.keys(params)).toEqual(['type', 'title', 'observationId', 'recommendationId']);
  });

  it('plans a re-inspection when no treatment is needed', () => {
    expect(taskTypeFor(recommendation({ actionLevel: 'observe' }))).toBe('reinspection');
  });
});
