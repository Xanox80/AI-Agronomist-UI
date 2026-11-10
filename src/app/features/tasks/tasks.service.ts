import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { TasksApi } from '../../core/api/tasks.api';
import { FieldDto, ProductDto, TaskDto, TaskInput, TaskStatus, TreatmentInput, UserDto } from '../../core/api/models';
import { OutboxService } from '../../core/offline/outbox.service';
import { ScoutingContextService } from '../scouting/scouting-context.service';
import { OnlineStatusService } from '../shell/online-status.service';
import { TaskDraftsStore } from './task-drafts.store';
import { matchesFilters, TaskFilters } from './task-filters';
import { TaskFormValue, toTaskInput } from './task-form.model';
import { TASKS_CONFIG } from './tasks.config';

export interface TaskView extends TaskDto {
  draft: boolean;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly api = inject(TasksApi);
  private readonly scoutingContext = inject(ScoutingContextService);
  private readonly authApi = inject(AuthApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly outbox = inject(OutboxService);
  private readonly drafts = inject(TaskDraftsStore);
  private readonly online = inject(OnlineStatusService);

  async list(filters: TaskFilters): Promise<TaskView[]> {
    const server = await this.fetchServerTasks(filters);
    const known = new Set(server.map((t) => t.clientId));
    this.drafts.remove(this.drafts.drafts().filter((d) => known.has(d.clientId)).map((d) => d.clientId));
    const pending = this.drafts.drafts().filter((d) => matchesFilters(d, filters));
    return [...pending.map((d) => ({ ...d, draft: true })), ...server.map((t) => ({ ...t, draft: false }))];
  }

  async get(id: string): Promise<TaskView> {
    const draft = this.drafts.find(id);
    if (draft) return { ...draft, draft: true };
    return { ...(await firstValueFrom(this.api.get(id))), draft: false };
  }

  async create(value: TaskFormValue, fieldName: string): Promise<TaskView> {
    const input = toTaskInput(value, crypto.randomUUID());
    if (this.online.online()) {
      try {
        return { ...(await firstValueFrom(this.api.create(input))), draft: false };
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }
    return this.saveDraft({
      ...input, id: input.clientId, fieldName, photoUrls: [], status: 'open', notes: input.notes ?? '',
      createdAt: new Date().toISOString(),
    });
  }

  async update(task: TaskView, value: TaskFormValue): Promise<TaskView> {
    const input = toTaskInput(value, task.clientId);
    if (task.draft) return this.saveDraft({ ...task, ...input, fieldName: task.fieldName, status: task.status });
    const { clientId: _clientId, ...patch } = input;
    return { ...(await firstValueFrom(this.api.update(task.id, patch))), draft: false };
  }

  async changeStatus(task: TaskView, status: TaskStatus): Promise<TaskView> {
    if (task.draft) return this.saveDraft({ ...task, status });
    return { ...(await firstValueFrom(this.api.update(task.id, { status }))), draft: false };
  }

  async complete(task: TaskView, treatment?: TreatmentInput): Promise<TaskView> {
    return { ...(await firstValueFrom(this.api.complete(task.id, treatment ? { treatment } : {}))), draft: false };
  }

  remove(task: TaskView): Promise<void> {
    if (!task.draft) return firstValueFrom(this.api.remove(task.id));
    this.drafts.remove([task.clientId]);
    return Promise.resolve();
  }

  /** Online list, or the device copy kept by scouting, so a task draft can be created offline. */
  fields(): Promise<FieldDto[]> {
    return this.scoutingContext.loadFields();
  }

  async assignees(): Promise<UserDto[]> {
    const page = await firstValueFrom(
      this.authApi.listUsers({ pageSize: TASKS_CONFIG.pageSize }).pipe(catchError(() => of(null))),
    );
    return page?.items ?? [];
  }

  products(): Promise<ProductDto[]> {
    return firstValueFrom(this.catalogApi.products());
  }

  private async fetchServerTasks(filters: TaskFilters): Promise<TaskDto[]> {
    try {
      const items = await this.fetchAllPages(filters);
      return items.filter((t) => matchesFilters(t, filters));
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      return [];
    }
  }

  private async fetchAllPages(filters: TaskFilters): Promise<TaskDto[]> {
    const items: TaskDto[] = [];
    for (let page = 1; ; page++) {
      const result = await firstValueFrom(
        this.api.list({
          status: filters.status ?? undefined,
          fieldId: filters.fieldId ?? undefined,
          assigneeId: filters.assigneeId ?? undefined,
          page,
          pageSize: TASKS_CONFIG.pageSize,
        }),
      );
      items.push(...result.items);
      if (result.items.length === 0 || items.length >= result.total) return items;
    }
  }

  private async saveDraft(draft: TaskDto): Promise<TaskView> {
    this.drafts.upsert(draft);
    await this.outbox
      .enqueue({
        entityType: 'task', clientId: draft.clientId, operation: 'upsert',
        clientTimestamp: new Date().toISOString(), payload: toDraftPayload(draft),
      })
      .catch(() => undefined);
    return { ...draft, draft: true };
  }
}

function toDraftPayload(draft: TaskDto): TaskInput {
  const { type, fieldId, priority, title, clientId, observationId, lat, lng, diagnosisId, recommendationId,
    photoIds, assigneeUserId, deadline, notes, status } = draft;
  return { clientId, type, fieldId, priority, title, observationId, lat, lng, diagnosisId, recommendationId,
    photoIds, assigneeUserId, deadline, notes, status };
}

function isNetworkError(error: unknown): boolean {
  return (error as { status?: number })?.status === 0;
}
