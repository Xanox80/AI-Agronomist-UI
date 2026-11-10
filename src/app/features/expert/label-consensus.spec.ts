import { LabelDto } from '../../core/api/models';
import { labelConsensus } from './label-consensus';

const label = (diagnosisId: string | undefined, weight: number, action: LabelDto['action'] = 'change'): LabelDto => ({
  id: 'l', labelerName: 'n', labelerRole: 'expert', labelSource: 'expert', action, diagnosisId, weight, createdAt: '',
});

describe('labelConsensus', () => {
  it('returns nothing when there are no labels', () => {
    expect(labelConsensus([])).toEqual([]);
  });

  it('sums label weights per diagnosis and orders by weight', () => {
    const result = labelConsensus([label('a', 1), label('b', 3), label('a', 1)]);
    expect(result.map((e) => e.diagnosisId)).toEqual(['b', 'a']);
    expect(result[0].share).toBeCloseTo(0.6);
  });

  it('ignores rejects and labels without a diagnosis', () => {
    expect(labelConsensus([label('a', 2, 'reject'), label(undefined, 2)])).toEqual([]);
  });
});
