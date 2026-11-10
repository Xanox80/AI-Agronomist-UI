import { emptyTaskForm, isTaskFormValid, toTaskForm, toTaskInput } from './task-form.model';

describe('task form model', () => {
  it('is invalid without a title or a field', () => {
    expect(isTaskFormValid(emptyTaskForm())).toBe(false);
    expect(isTaskFormValid({ ...emptyTaskForm(), title: '  ', fieldId: 'f1' })).toBe(false);
    expect(isTaskFormValid({ ...emptyTaskForm(), title: 'Spray', fieldId: 'f1' })).toBe(true);
  });

  it('maps the form to a task input with the client id and an ISO deadline', () => {
    const deadline = new Date('2026-11-12T08:00:00Z');
    const input = toTaskInput({ ...emptyTaskForm(), title: ' Spray ', fieldId: 'f1', deadline }, 'c1');
    expect(input).toMatchObject({
      clientId: 'c1', title: 'Spray', fieldId: 'f1', deadline: '2026-11-12T08:00:00.000Z', type: 'treatment',
    });
  });

  it('round-trips an existing task into form values', () => {
    const form = toTaskForm({
      id: 't1', clientId: 'c1', type: 'sampling', fieldId: 'f1', fieldName: 'North', photoUrls: [],
      priority: 'high', status: 'open', title: 'Sample', notes: '', createdAt: '2026-11-10T00:00:00Z',
      deadline: '2026-11-12T08:00:00.000Z',
    });
    expect(form.type).toBe('sampling');
    expect(form.deadline?.toISOString()).toBe('2026-11-12T08:00:00.000Z');
    expect(form.assigneeUserId).toBeNull();
  });
});
