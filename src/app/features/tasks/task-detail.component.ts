import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthSession } from '../../core/auth/auth-session.service';
import { TaskStatus, TreatmentInput } from '../../core/api/models';
import { PRIORITY_SEVERITY, STATUS_SEVERITY } from './task-display';
import { TaskCompleteDialogComponent } from './task-complete-dialog.component';
import { TaskMapComponent } from './task-map.component';
import { allowedTransitions } from './task-status-transitions';
import { TasksService, TaskView } from './tasks.service';

@Component({
  selector: 'app-task-detail',
  imports: [DatePipe, RouterLink, TranslatePipe, ButtonModule, TagModule, TaskCompleteDialogComponent, TaskMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .tags, .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1rem; }
    dt { color: var(--ap-text-sec); }
    dd { margin: 0; }
    .photos { display: flex; gap: 0.5rem; overflow-x: auto; }
    .photos img { height: 9rem; border-radius: var(--ap-radius-sm); border: 1px solid var(--ap-border); }
    .state { color: var(--ap-text-sec); }
    .state.error { color: var(--ap-danger); }
    h2 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; }
  `,
  template: `
    <section class="scout-page">
      @if (task(); as t) {
        <div class="scout-page-header">
          <h1>{{ t.title }}</h1>
        </div>
        <div class="tags">
          <p-tag [value]="'tasks.type.' + t.type | translate" severity="secondary" />
          <p-tag [value]="'tasks.status.' + t.status | translate" [severity]="statusSeverity[t.status]" />
          <p-tag [value]="'tasks.priority.' + t.priority | translate" [severity]="prioritySeverity[t.priority]" />
          @if (t.draft) { <p-tag icon="pi pi-sync" [value]="'tasks.syncBadge' | translate" severity="warn" /> }
        </div>
        <dl>
          <dt>{{ 'tasks.form.field' | translate }}</dt><dd>{{ t.fieldName }}</dd>
          @if (t.assigneeName) { <dt>{{ 'tasks.form.assignee' | translate }}</dt><dd>{{ t.assigneeName }}</dd> }
          @if (t.deadline) { <dt>{{ 'tasks.form.deadline' | translate }}</dt><dd>{{ t.deadline | date: 'medium' }}</dd> }
          @if (t.completedAt) { <dt>{{ 'tasks.detail.completedAt' | translate }}</dt><dd>{{ t.completedAt | date: 'medium' }}</dd> }
          @if (t.diagnosisName) {
            <dt>{{ 'tasks.detail.diagnosis' | translate }}</dt>
            <dd>
              @if (t.observationId) { <a [routerLink]="['/diagnosis', t.observationId]">{{ t.diagnosisName }}</a> }
              @else { {{ t.diagnosisName }} }
            </dd>
          }
          @if (t.observationId && t.recommendationId) {
            <dt>{{ 'tasks.detail.recommendation' | translate }}</dt>
            <dd><a [routerLink]="['/recommendation', t.observationId]">{{ 'tasks.detail.openRecommendation' | translate }}</a></dd>
          }
        </dl>
        @if (t.notes) {
          <h2>{{ 'tasks.form.notes' | translate }}</h2>
          <p>{{ t.notes }}</p>
        }
        @if (t.photoUrls.length > 0) {
          <h2>{{ 'tasks.detail.photos' | translate }}</h2>
          <div class="photos">
            @for (url of t.photoUrls; track url) { <img [src]="url" [alt]="'tasks.detail.photoAlt' | translate" /> }
          </div>
        }
        @if (t.lat != null && t.lng != null) {
          <h2>{{ 'tasks.detail.mapPin' | translate }}</h2>
          <app-task-map [position]="{ lat: t.lat, lng: t.lng }" />
        }
        @if (actionError()) { <p class="state error">{{ 'common.error' | translate }}</p> }
        <div class="actions">
          @if (canChangeStatus()) {
            @for (next of transitions(); track next) {
              <p-button [label]="'tasks.transition.' + next | translate" [severity]="next === 'cancelled' ? 'danger' : 'primary'"
                [disabled]="busy()" (onClick)="moveTo(next)" />
            }
          }
          @if (canEdit()) {
            <p-button icon="pi pi-pencil" severity="secondary" [label]="'tasks.detail.edit' | translate"
              [routerLink]="['/tasks', t.id, 'edit']" />
          }
          @if (canDelete()) {
            <p-button icon="pi pi-trash" severity="danger" [outlined]="true" [label]="'common.delete' | translate"
              [disabled]="busy()" (onClick)="remove()" />
          }
        </div>
        @if (completing()) {
          <app-task-complete-dialog [(visible)]="completing" [fieldAreaHa]="fieldAreaHa()"
            (completed)="finish($event)" />
        }
      } @else if (failed()) {
        <p class="state error">{{ 'common.error' | translate }}
          <p-button severity="secondary" [label]="'common.retry' | translate" (onClick)="load()" />
        </p>
      } @else {
        <p class="state">{{ 'common.loading' | translate }}</p>
      }
    </section>
  `,
})
export class TaskDetailComponent implements OnInit {
  private readonly service = inject(TasksService);
  private readonly session = inject(AuthSession);
  private readonly router = inject(Router);

  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly statusSeverity = STATUS_SEVERITY;
  protected readonly prioritySeverity = PRIORITY_SEVERITY;
  protected readonly task = signal<TaskView | null>(null);
  protected readonly fieldAreaHa = signal<number | undefined>(undefined);
  protected readonly failed = signal(false);
  protected readonly actionError = signal(false);
  protected readonly busy = signal(false);
  protected readonly completing = signal(false);

  protected readonly transitions = computed(() => allowedTransitions(this.task()?.status ?? 'done'));
  protected readonly canEdit = computed(() => this.session.hasAnyRole(['scout', 'chief_agronomist']));
  protected readonly canDelete = computed(() => this.session.hasAnyRole(['chief_agronomist']) || this.task()?.draft === true);
  protected readonly canChangeStatus = computed(() => this.session.role() !== null);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.failed.set(false);
    try {
      const task = await this.service.get(this.id);
      this.task.set(task);
      void this.loadFieldArea(task.fieldId);
    } catch {
      this.failed.set(true);
    }
  }

  protected moveTo(status: TaskStatus): void {
    const task = this.task();
    if (!task) return;
    if (status !== 'done') {
      void this.run(async () => this.task.set(await this.service.changeStatus(task, status)));
    } else if (task.type === 'treatment') {
      this.completing.set(true);
    } else {
      void this.run(async () => this.task.set(await this.service.complete(task)));
    }
  }

  protected finish(treatment: TreatmentInput): void {
    const task = this.task();
    if (!task) return;
    void this.run(async () => {
      this.task.set(await this.service.complete(task, treatment));
      this.completing.set(false);
    });
  }

  protected remove(): void {
    const task = this.task();
    if (!task) return;
    void this.run(async () => {
      await this.service.remove(task);
      await this.router.navigate(['/tasks']);
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.actionError.set(false);
    try {
      await action();
    } catch {
      this.actionError.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  private async loadFieldArea(fieldId: string): Promise<void> {
    try {
      this.fieldAreaHa.set((await this.service.fields()).find((f) => f.id === fieldId)?.areaHa);
    } catch {
      this.fieldAreaHa.set(undefined);
    }
  }
}
