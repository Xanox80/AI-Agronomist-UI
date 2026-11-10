import { TaskPriority, TaskStatus } from '../../core/api/models';

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export const STATUS_SEVERITY: Record<TaskStatus, TagSeverity> = {
  open: 'info', in_progress: 'warn', done: 'success', cancelled: 'secondary',
};

export const PRIORITY_SEVERITY: Record<TaskPriority, TagSeverity> = {
  low: 'secondary', normal: 'info', high: 'warn', urgent: 'danger',
};
