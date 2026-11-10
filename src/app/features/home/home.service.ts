import { effect, inject, Injectable, signal } from '@angular/core';
import { TasksApi, TaskDto } from '../../core/api';
import { AuthService } from '../auth/auth.service';
import { OPEN_TASKS_LIMIT } from './home.config';

/** Loads my open tasks, and reloads them once the signed-in user is known. */
@Injectable()
export class HomeService {
  private readonly tasksApi = inject(TasksApi);
  private readonly auth = inject(AuthService);

  readonly openTasks = signal<TaskDto[]>([]);
  readonly tasksFailed = signal(false);

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      if (userId) {
        this.load(userId);
      }
    });
  }

  private load(assigneeId: string): void {
    this.tasksFailed.set(false);
    this.tasksApi.list({ status: 'open', assigneeId, pageSize: OPEN_TASKS_LIMIT }).subscribe({
      next: (page) => this.openTasks.set(page.items),
      error: () => this.tasksFailed.set(true),
    });
  }
}
