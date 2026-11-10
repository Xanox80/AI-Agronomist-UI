import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { ScoutingContextService } from '../scouting/scouting-context.service';
import { TasksApi } from '../../core/api/tasks.api';
import { TaskDto } from '../../core/api/models';
import { OutboxService } from '../../core/offline/outbox.service';
import { OnlineStatusService } from '../shell/online-status.service';
import { TaskDraftsStore } from './task-drafts.store';
import { NO_TASK_FILTERS } from './task-filters';
import { emptyTaskForm } from './task-form.model';
import { TasksService } from './tasks.service';
import { TASKS_CONFIG } from './tasks.config';

const serverTask = (clientId: string): TaskDto => ({
  id: `srv-${clientId}`, clientId, type: 'treatment', fieldId: 'f1', fieldName: 'North', photoUrls: [],
  priority: 'normal', status: 'open', title: 'Spray', notes: '', createdAt: '2026-11-10T00:00:00Z',
});
const form = { ...emptyTaskForm(), title: 'Spray', fieldId: 'f1' };

describe('TasksService', () => {
  const online = signal(true);
  const api = { list: vi.fn(), create: vi.fn(), update: vi.fn(), complete: vi.fn(), get: vi.fn(), remove: vi.fn() };
  const outbox = { enqueue: vi.fn() };

  beforeEach(() => {
    localStorage.removeItem(TASKS_CONFIG.draftsStorageKey);
    online.set(true);
    Object.values(api).forEach((fn) => fn.mockReset());
    outbox.enqueue.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: TasksApi, useValue: api },
        { provide: ScoutingContextService, useValue: { loadFields: () => Promise.resolve([]) } },
        { provide: AuthApi, useValue: {} },
        { provide: CatalogApi, useValue: {} },
        { provide: OutboxService, useValue: outbox },
        { provide: OnlineStatusService, useValue: { online } },
      ],
    });
  });

  it('creates a task on the server when online', async () => {
    api.create.mockReturnValue(of(serverTask('c')));
    const task = await TestBed.inject(TasksService).create(form, 'North');
    expect(task.draft).toBe(false);
    expect(outbox.enqueue).not.toHaveBeenCalled();
  });

  it('stores an offline task as a draft and queues it for sync', async () => {
    online.set(false);
    const task = await TestBed.inject(TasksService).create(form, 'North');
    expect(task.draft).toBe(true);
    expect(TestBed.inject(TaskDraftsStore).drafts()).toHaveLength(1);
    expect(outbox.enqueue).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'task', clientId: task.clientId }));
  });

  it('falls back to a draft when the request fails without a connection', async () => {
    api.create.mockReturnValue(throwError(() => ({ status: 0 })));
    expect((await TestBed.inject(TasksService).create(form, 'North')).draft).toBe(true);
  });

  it('does not hide server validation errors behind a draft', async () => {
    api.create.mockReturnValue(throwError(() => ({ status: 400 })));
    await expect(TestBed.inject(TasksService).create(form, 'North')).rejects.toEqual({ status: 400 });
  });

  it('lists drafts first and drops the ones the server already has', async () => {
    const drafts = TestBed.inject(TaskDraftsStore);
    drafts.upsert({ ...serverTask('synced'), id: 'synced' });
    drafts.upsert({ ...serverTask('local'), id: 'local' });
    api.list.mockReturnValue(of({ items: [serverTask('synced')], total: 1, page: 1, pageSize: 100 }));
    const rows = await TestBed.inject(TasksService).list(NO_TASK_FILTERS);
    expect(rows.map((r) => [r.clientId, r.draft])).toEqual([['local', true], ['synced', false]]);
    expect(drafts.drafts().map((d) => d.clientId)).toEqual(['local']);
  });

  it('applies the priority filter that the API does not support', async () => {
    api.list.mockReturnValue(of({ items: [serverTask('a')], total: 1, page: 1, pageSize: 100 }));
    const rows = await TestBed.inject(TasksService).list({ ...NO_TASK_FILTERS, priority: 'urgent' });
    expect(rows).toEqual([]);
  });

  it('loads every page so client-side filters see all tasks', async () => {
    api.list
      .mockReturnValueOnce(of({ items: [serverTask('a')], total: 2, page: 1, pageSize: 1 }))
      .mockReturnValueOnce(of({ items: [serverTask('b')], total: 2, page: 2, pageSize: 1 }));
    const rows = await TestBed.inject(TasksService).list(NO_TASK_FILTERS);
    expect(rows.map((r) => r.clientId)).toEqual(['a', 'b']);
    expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('sends the treatment record when completing', async () => {
    api.complete.mockReturnValue(of(serverTask('a')));
    const treatment = { productId: 'p', doseValue: 1, doseUnit: 'l/ha', treatedAreaHa: 2, appliedAt: '2026-11-10' };
    await TestBed.inject(TasksService).complete({ ...serverTask('a'), draft: false }, treatment);
    expect(api.complete).toHaveBeenCalledWith('srv-a', { treatment });
  });
});
