import { TaskDto, TaskInput, TaskPriority, TaskType } from '../../core/api/models';
import { TASKS_CONFIG } from './tasks.config';

export interface TaskFormValue {
  type: TaskType;
  fieldId: string | null;
  title: string;
  notes: string;
  priority: TaskPriority;
  assigneeUserId: string | null;
  deadline: Date | null;
  observationId?: string;
  diagnosisId?: string;
  recommendationId?: string;
  photoIds?: string[];
  lat?: number;
  lng?: number;
}

export function emptyTaskForm(): TaskFormValue {
  return {
    type: TASKS_CONFIG.defaultType, fieldId: null, title: '', notes: '',
    priority: TASKS_CONFIG.defaultPriority, assigneeUserId: null, deadline: null,
  };
}

export function isTaskFormValid(value: TaskFormValue): boolean {
  return value.title.trim().length > 0 && value.fieldId !== null;
}

export function toTaskInput(value: TaskFormValue, clientId: string): TaskInput {
  return {
    clientId,
    type: value.type,
    fieldId: value.fieldId ?? '',
    title: value.title.trim(),
    notes: value.notes,
    priority: value.priority,
    assigneeUserId: value.assigneeUserId ?? undefined,
    deadline: value.deadline?.toISOString(),
    observationId: value.observationId,
    diagnosisId: value.diagnosisId,
    recommendationId: value.recommendationId,
    photoIds: value.photoIds,
    lat: value.lat,
    lng: value.lng,
  };
}

export function toTaskForm(task: TaskDto): TaskFormValue {
  return {
    type: task.type, fieldId: task.fieldId, title: task.title, notes: task.notes, priority: task.priority,
    assigneeUserId: task.assigneeUserId ?? null,
    deadline: task.deadline ? new Date(task.deadline) : null,
    observationId: task.observationId, diagnosisId: task.diagnosisId, recommendationId: task.recommendationId,
    lat: task.lat, lng: task.lng,
  };
}
