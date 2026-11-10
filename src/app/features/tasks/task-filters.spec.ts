import { TaskDto } from '../../core/api/models';
import { matchesFilters, NO_TASK_FILTERS } from './task-filters';

const task: TaskDto = {
  id: 't', clientId: 't', type: 'treatment', fieldId: 'f1', fieldName: 'North', photoUrls: [], priority: 'high',
  status: 'open', title: 'Spray', notes: '', assigneeUserId: 'u1', createdAt: '2026-11-10T00:00:00Z',
};

describe('matchesFilters', () => {
  it('matches everything when no filter is set', () => {
    expect(matchesFilters(task, NO_TASK_FILTERS)).toBe(true);
  });

  it('requires every set filter to match', () => {
    expect(matchesFilters(task, { ...NO_TASK_FILTERS, status: 'open', priority: 'high' })).toBe(true);
    expect(matchesFilters(task, { ...NO_TASK_FILTERS, status: 'open', priority: 'low' })).toBe(false);
  });

  it('filters by field and assignee', () => {
    expect(matchesFilters(task, { ...NO_TASK_FILTERS, fieldId: 'f2' })).toBe(false);
    expect(matchesFilters(task, { ...NO_TASK_FILTERS, assigneeId: 'u1' })).toBe(true);
  });
});
