import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { PRIORITY_SEVERITY, STATUS_SEVERITY } from './task-display';
import { TaskView } from './tasks.service';

@Component({
  selector: 'app-task-card',
  imports: [DatePipe, RouterLink, TranslatePipe, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    a {
      display: block; padding: 0.75rem 1rem; min-height: var(--ap-touch-min); background: var(--ap-surface);
      border: 1px solid var(--ap-border); border-radius: var(--ap-radius); color: var(--ap-text);
      text-decoration: none;
    }
    strong { display: block; font-size: 1.05rem; }
    .meta { color: var(--ap-text-sec); font-size: 0.875rem; margin-top: 0.25rem; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.5rem; }
  `,
  template: `
    <a [routerLink]="['/tasks', task().id]">
      <strong>{{ task().title }}</strong>
      <div class="meta">
        {{ task().fieldName }}
        @if (task().deadline) { · {{ task().deadline | date: 'short' }} }
        @if (task().assigneeName) { · {{ task().assigneeName }} }
      </div>
      <div class="tags">
        <p-tag [value]="'tasks.type.' + task().type | translate" severity="secondary" />
        <p-tag [value]="'tasks.status.' + task().status | translate" [severity]="statusSeverity[task().status]" />
        <p-tag [value]="'tasks.priority.' + task().priority | translate"
          [severity]="prioritySeverity[task().priority]" />
        @if (task().draft) {
          <p-tag icon="pi pi-sync" [value]="'tasks.syncBadge' | translate" severity="warn" />
        }
      </div>
    </a>
  `,
})
export class TaskCardComponent {
  readonly task = input.required<TaskView>();
  protected readonly statusSeverity = STATUS_SEVERITY;
  protected readonly prioritySeverity = PRIORITY_SEVERITY;
}
