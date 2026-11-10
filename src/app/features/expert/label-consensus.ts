import { LabelDto } from '../../core/api/models';

export interface ConsensusEntry { diagnosisId: string; weight: number; share: number }

/** Weighted vote over labels that carry a diagnosis, strongest first. */
export function labelConsensus(labels: readonly LabelDto[]): ConsensusEntry[] {
  const totals = new Map<string, number>();
  for (const label of labels) {
    if (label.diagnosisId && label.action !== 'reject') {
      totals.set(label.diagnosisId, (totals.get(label.diagnosisId) ?? 0) + label.weight);
    }
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([diagnosisId, weight]) => ({ diagnosisId, weight, share: sum > 0 ? weight / sum : 0 }))
    .sort((a, b) => b.weight - a.weight);
}
