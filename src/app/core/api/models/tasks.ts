import { PageQuery } from './common';
import { TaskPriority, TaskStatus, TaskType } from './enums';

export interface TaskDto {
  id: string;
  clientId: string;
  type: TaskType;
  fieldId: string;
  fieldName: string;
  observationId?: string;
  lat?: number;
  lng?: number;
  diagnosisId?: string;
  diagnosisName?: string;
  recommendationId?: string;
  photoUrls: string[];
  photoIds?: string[];
  priority: TaskPriority;
  assigneeUserId?: string;
  assigneeName?: string;
  deadline?: string;
  status: TaskStatus;
  title: string;
  notes: string;
  completedAt?: string;
  createdAt: string;
}
export type TaskInput = Pick<TaskDto, 'clientId' | 'type' | 'fieldId' | 'priority' | 'title'> &
  Partial<Pick<TaskDto, 'observationId' | 'lat' | 'lng' | 'diagnosisId' | 'recommendationId'
    | 'photoIds' | 'assigneeUserId' | 'deadline' | 'notes' | 'status'>>;
export type TaskPatch = Partial<Omit<TaskInput, 'clientId'>>;
export interface TasksQuery extends PageQuery {
  status?: TaskStatus; fieldId?: string; assigneeId?: string; type?: TaskType;
}

export interface TreatmentInput {
  productId: string; doseValue: number; doseUnit: string; treatedAreaHa: number; appliedAt: string;
}
export interface CompleteTaskRequest { treatment?: TreatmentInput }
export interface TreatmentDto extends TreatmentInput {
  id: string;
  clientId: string;
  fieldId: string;
  productName: string;
  activeSubstanceCodes: string[];
  resistanceGroups: { system: string; group: string }[];
}
export interface CreateTreatmentRequest extends TreatmentInput { clientId: string; fieldId: string }
export interface TreatmentsQuery extends PageQuery { fieldId?: string; from?: string; to?: string }
