import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AuthSession } from '../../core/auth/auth-session.service';
import { FieldDto, UserDto } from '../../core/api/models';
import { EnumSelectComponent } from './enum-select.component';
import { NO_TASK_FILTERS, TaskFilters } from './task-filters';
import { TaskCardComponent } from './task-card.component';
import { TASKS_CONFIG } from './tasks.config';
import { TasksService, TaskView } from './tasks.service';

type ViewMode = 'list' | 'board';

@Component({
  selector: 'app-task-list',
  imports: [FormsModule, RouterLink, TranslatePipe, ButtonModule, SelectModule, EnumSelectComponent, TaskCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: center; }
    .toolbar p-select, .toolbar app-enum-select { flex: 1 1 10rem; min-width: 10rem; }
    .stack { display: grid; gap: 0.75rem; }
    .board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(16rem, 1fr); gap: 0.75rem; overflow-x: auto; }
    .column { background: var(--ap-muted-bg); border-radius: var(--ap-radius); padding: 0.75rem; }
    .column h2 { font-size: 1rem; margin: 0 0 0.75rem; }
    .state { color: var(--ap-text-sec); margin-top: 1rem; }
    .state.error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <div class="scout-page-header">
        <h1>{{ 'tasks.title' | translate }}</h1>
        @if (canEdit()) {
          <p-button icon="pi pi-plus" [label]="'tasks.list.add' | translate" routerLink="/tasks/new" />
        }
      </div>
      <div class="toolbar">
        <p-button [label]="'tasks.view.list' | translate" icon="pi pi-list"
          [severity]="view() === 'list' ? 'primary' : 'secondary'" (onClick)="view.set('list')" />
        <p-button [label]="'tasks.view.board' | translate" icon="pi pi-th-large"
          [severity]="view() === 'board' ? 'primary' : 'secondary'" (onClick)="view.set('board')" />
        <app-enum-select [values]="statuses" prefix="tasks.status" placeholder="tasks.filter.status" [clearable]="true"
          [value]="filters().status" (valueChange)="setFilter('status', $event)" />
        <p-select [options]="fieldOptions()" [ngModel]="filters().fieldId" (ngModelChange)="setFilter('fieldId', $event)"
          optionLabel="label" optionValue="value" [showClear]="true" [placeholder]="'tasks.filter.field' | translate" />
        @if (assigneeOptions().length > 0) {
          <p-select [options]="assigneeOptions()" [ngModel]="filters().assigneeId"
            (ngModelChange)="setFilter('assigneeId', $event)" optionLabel="label" optionValue="value"
            [showClear]="true" [placeholder]="'tasks.filter.assignee' | translate" />
        }
        <app-enum-select [values]="priorities" prefix="tasks.priority" placeholder="tasks.filter.priority"
          [clearable]="true" [value]="filters().priority" (valueChange)="setFilter('priority', $event)" />
      </div>
      @if (loading()) {
        <p class="state">{{ 'common.loading' | translate }}</p>
      } @else if (failed()) {
        <p class="state error">{{ 'common.error' | translate }}
          <p-button severity="secondary" [label]="'common.retry' | translate" (onClick)="load()" />
        </p>
      } @else if (tasks().length === 0) {
        <p class="state">{{ 'tasks.list.empty' | translate }}</p>
      } @else if (view() === 'list') {
        <div class="stack">
          @for (task of tasks(); track task.clientId) { <app-task-card [task]="task" /> }
        </div>
      } @else {
        <div class="board">
          @for (column of columns(); track column.status) {
            <div class="column">
              <h2>{{ 'tasks.status.' + column.status | translate }} ({{ column.tasks.length }})</h2>
              <div class="stack">
                @for (task of column.tasks; track task.clientId) { <app-task-card [task]="task" /> }
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class TaskListComponent implements OnInit {
  private readonly service = inject(TasksService);
  private readonly session = inject(AuthSession);

  protected readonly statuses = TASKS_CONFIG.statuses;
  protected readonly priorities = TASKS_CONFIG.priorities;
  protected readonly view = signal<ViewMode>('list');
  protected readonly filters = signal<TaskFilters>(NO_TASK_FILTERS);
  protected readonly tasks = signal<TaskView[]>([]);
  protected readonly fields = signal<FieldDto[]>([]);
  protected readonly assignees = signal<UserDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  protected readonly canEdit = computed(() => this.session.hasAnyRole(['scout', 'chief_agronomist']));
  protected readonly fieldOptions = computed(() => this.fields().map((f) => ({ value: f.id, label: f.name })));
  private readonly seenAssignees = signal<ReadonlyMap<string, string>>(new Map());
  protected readonly assigneeOptions = computed(() => {
    const options = new Map(this.seenAssignees());
    this.assignees().forEach((u) => options.set(u.id, u.displayName));
    return [...options].map(([value, label]) => ({ value, label }));
  });
  protected readonly columns = computed(() =>
    TASKS_CONFIG.statuses.map((status) => ({ status, tasks: this.tasks().filter((t) => t.status === status) })),
  );

  ngOnInit(): void {
    void this.loadLookups();
    void this.load();
  }

  protected setFilter<K extends keyof TaskFilters>(key: K, value: TaskFilters[K] | undefined | null): void {
    this.filters.update((current) => ({ ...current, [key]: value ?? null }));
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const tasks = await this.service.list(this.filters());
      this.tasks.set(tasks);
      this.rememberAssignees(tasks);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private rememberAssignees(tasks: TaskView[]): void {
    const seen = new Map(this.seenAssignees());
    tasks.forEach((t) => t.assigneeUserId && seen.set(t.assigneeUserId, t.assigneeName ?? t.assigneeUserId));
    this.seenAssignees.set(seen);
  }

  private async loadLookups(): Promise<void> {
    try {
      this.fields.set(await this.service.fields());
    } catch {
      this.fields.set([]);
    }
    this.assignees.set(await this.service.assignees());
  }
}
