import { TaskStatus } from '../../core/api/models';

const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['done', 'open', 'cancelled'],
  done: [],
  cancelled: ['open'],
};

export function allowedTransitions(status: TaskStatus): readonly TaskStatus[] {
  return TRANSITIONS[status];
}
