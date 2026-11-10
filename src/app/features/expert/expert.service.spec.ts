import { ExpertCaseDto } from '../../core/api/models';
import { sortQueue } from './expert.service';

const item = (id: string, priority: number, createdAt: string) => ({ id, priority, createdAt }) as ExpertCaseDto;

describe('sortQueue', () => {
  it('orders by priority descending and then by age', () => {
    const sorted = sortQueue([item('old-low', 1, '2026-01-01'), item('new-high', 9, '2026-02-02'), item('old-high', 9, '2026-01-02')]);
    expect(sorted.map((c) => c.id)).toEqual(['old-high', 'new-high', 'old-low']);
  });

  it('does not mutate the input', () => {
    const input = [item('a', 1, 'x'), item('b', 2, 'x')];
    sortQueue(input);
    expect(input[0].id).toBe('a');
  });
});
