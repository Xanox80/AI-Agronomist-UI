import { TaskPriority, TaskStatus, TaskType } from '../../core/api/models';

export const TASKS_CONFIG = {
  pageSize: 100,
  draftsStorageKey: 'ap-scout.task-drafts',
  statuses: ['open', 'in_progress', 'done', 'cancelled'] as readonly TaskStatus[],
  priorities: ['low', 'normal', 'high', 'urgent'] as readonly TaskPriority[],
  types: ['treatment', 'reinspection', 'sampling'] as readonly TaskType[],
  defaultPriority: 'normal' as TaskPriority,
  defaultType: 'treatment' as TaskType,
  defaultDoseUnit: 'l/ha',
  doseUnits: ['l/ha', 'kg/ha'] as readonly string[],
  areaDecimals: 2,
  mapZoom: 16,
  mapMarkerRadiusPx: 10,
  mapHeightPx: 220,
} as const;
