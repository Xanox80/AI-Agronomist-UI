import { TaskDto, TaskPriority, TaskStatus } from '../../core/api/models';

export interface TaskFilters {
  status: TaskStatus | null;
  fieldId: string | null;
  assigneeId: string | null;
  priority: TaskPriority | null;
}

export const NO_TASK_FILTERS: TaskFilters = { status: null, fieldId: null, assigneeId: null, priority: null };

export function matchesFilters(task: TaskDto, filters: TaskFilters): boolean {
  return (
    (filters.status === null || task.status === filters.status) &&
    (filters.fieldId === null || task.fieldId === filters.fieldId) &&
    (filters.assigneeId === null || task.assigneeUserId === filters.assigneeId) &&
    (filters.priority === null || task.priority === filters.priority)
  );
}
