import { allowedTransitions } from './task-status-transitions';

describe('allowedTransitions', () => {
  it('lets an open task start or be cancelled but not be completed directly', () => {
    expect(allowedTransitions('open')).toEqual(['in_progress', 'cancelled']);
  });

  it('lets an in-progress task be completed', () => {
    expect(allowedTransitions('in_progress')).toContain('done');
  });

  it('allows no transition out of a completed task', () => {
    expect(allowedTransitions('done')).toEqual([]);
  });

  it('lets a cancelled task be reopened', () => {
    expect(allowedTransitions('cancelled')).toEqual(['open']);
  });
});
