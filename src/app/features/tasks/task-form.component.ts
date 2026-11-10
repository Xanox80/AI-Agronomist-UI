import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FieldDto, TaskPriority, TaskType, UserDto } from '../../core/api/models';
import { EnumSelectComponent } from './enum-select.component';
import { emptyTaskForm, isTaskFormValid, TaskFormValue, toTaskForm } from './task-form.model';
import { TASKS_CONFIG } from './tasks.config';
import { TasksService, TaskView } from './tasks.service';

@Component({
  selector: 'app-task-form',
  imports: [
    FormsModule, TranslatePipe, ButtonModule, DatePickerModule, InputTextModule, SelectModule, TextareaModule,
    EnumSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .row { display: grid; gap: 0.25rem; margin-bottom: 1rem; }
    .row > *, input, textarea { width: 100%; min-height: var(--ap-touch-min); }
    textarea { min-height: 6rem; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <div class="scout-page-header">
        <h1>{{ (editing() ? 'tasks.form.editTitle' : 'tasks.form.createTitle') | translate }}</h1>
      </div>
      <div class="row">
        <label>{{ 'tasks.form.type' | translate }}</label>
        <app-enum-select [values]="types" prefix="tasks.type" placeholder="tasks.form.type" [value]="form().type"
          (valueChange)="patch({ type: $event ?? form().type })" />
      </div>
      <div class="row">
        <label for="tf-title">{{ 'tasks.form.title' | translate }}</label>
        <input id="tf-title" pInputText [ngModel]="form().title" (ngModelChange)="patch({ title: $event })" />
      </div>
      <div class="row">
        <label for="tf-field">{{ 'tasks.form.field' | translate }}</label>
        <p-select inputId="tf-field" [options]="fields()" optionLabel="name" optionValue="id" [filter]="true"
          [ngModel]="form().fieldId" (ngModelChange)="patch({ fieldId: $event })" />
      </div>
      <div class="row">
        <label>{{ 'tasks.form.priority' | translate }}</label>
        <app-enum-select [values]="priorities" prefix="tasks.priority" placeholder="tasks.form.priority"
          [value]="form().priority" (valueChange)="patch({ priority: $event ?? form().priority })" />
      </div>
      @if (assignees().length > 0) {
        <div class="row">
          <label for="tf-assignee">{{ 'tasks.form.assignee' | translate }}</label>
          <p-select inputId="tf-assignee" [options]="assignees()" optionLabel="displayName" optionValue="id"
            [showClear]="true" [ngModel]="form().assigneeUserId" (ngModelChange)="patch({ assigneeUserId: $event ?? null })" />
        </div>
      }
      <div class="row">
        <label for="tf-deadline">{{ 'tasks.form.deadline' | translate }}</label>
        <p-datepicker inputId="tf-deadline" [showTime]="true" [showIcon]="true" [showClear]="true"
          [ngModel]="form().deadline" (ngModelChange)="patch({ deadline: $event ?? null })" />
      </div>
      <div class="row">
        <label for="tf-notes">{{ 'tasks.form.notes' | translate }}</label>
        <textarea id="tf-notes" pTextarea [ngModel]="form().notes" (ngModelChange)="patch({ notes: $event })"></textarea>
      </div>
      @if (failed()) { <p class="error">{{ 'common.error' | translate }}</p> }
      <div class="actions">
        <p-button icon="pi pi-check" [label]="'common.save' | translate" [disabled]="!valid() || saving()" (onClick)="save()" />
        <p-button severity="secondary" [label]="'common.cancel' | translate" (onClick)="cancel()" />
      </div>
    </section>
  `,
})
export class TaskFormComponent implements OnInit {
  private readonly service = inject(TasksService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly types = TASKS_CONFIG.types;
  protected readonly priorities = TASKS_CONFIG.priorities;
  protected readonly form = signal<TaskFormValue>(emptyTaskForm());
  protected readonly fields = signal<FieldDto[]>([]);
  protected readonly assignees = signal<UserDto[]>([]);
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  protected readonly valid = computed(() => isTaskFormValid(this.form()));
  protected readonly editing = signal<TaskView | null>(null);

  async ngOnInit(): Promise<void> {
    const { paramMap, queryParamMap } = this.route.snapshot;
    this.fields.set(await this.service.fields().catch(() => []));
    this.assignees.set(await this.service.assignees());
    const id = paramMap.get('id');
    if (id) {
      const task = await this.service.get(id).catch(() => null);
      if (task) {
        this.editing.set(task);
        this.form.set(toTaskForm(task));
      }
      return;
    }
    this.form.set(prefillFromQuery(queryParamMap));
  }

  protected patch(change: Partial<TaskFormValue>): void {
    this.form.update((current) => ({ ...current, ...change }));
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.failed.set(false);
    try {
      const existing = this.editing();
      const fieldName = this.fields().find((f) => f.id === this.form().fieldId)?.name ?? '';
      const saved = existing
        ? await this.service.update(existing, this.form())
        : await this.service.create(this.form(), fieldName);
      await this.router.navigate(['/tasks', saved.id]);
    } catch {
      this.failed.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  protected cancel(): void {
    void this.router.navigate(['/tasks']);
  }
}

function prefillFromQuery(params: { get(name: string): string | null }): TaskFormValue {
  const number = (name: string) => (params.get(name) === null ? undefined : Number(params.get(name)));
  const base = emptyTaskForm();
  return {
    ...base,
    type: (params.get('type') as TaskType | null) ?? base.type,
    priority: (params.get('priority') as TaskPriority | null) ?? base.priority,
    fieldId: params.get('fieldId'),
    title: params.get('title') ?? '',
    observationId: params.get('observationId') ?? undefined,
    diagnosisId: params.get('diagnosisId') ?? undefined,
    recommendationId: params.get('recommendationId') ?? undefined,
    photoIds: params.get('photoIds')?.split(',').filter(Boolean),
    lat: number('lat'),
    lng: number('lng'),
  };
}
