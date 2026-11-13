import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { TasksApi, TaskDto } from '../../core/api';
import { AuthSession } from '../../core/auth/auth-session.service';
import { AuthService } from '../auth/auth.service';
import { HOME_PRIMARY_ACTIONS, HomePrimaryAction, OPEN_TASKS_LIMIT } from './home.config';

/** Loads my open tasks once the signed-in user is known, and picks the role's primary action. */
@Injectable()
export class HomeService {
  private readonly tasksApi = inject(TasksApi);
  private readonly auth = inject(AuthService);
  private readonly session = inject(AuthSession);

  readonly openTasks = signal<TaskDto[]>([]);
  readonly tasksLoading = signal(false);
  readonly tasksFailed = signal(false);
  readonly primaryAction = computed<HomePrimaryAction | undefined>(() => {
    const role = this.session.role();
    return role ? HOME_PRIMARY_ACTIONS[role] : undefined;
  });

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      if (userId) {
        this.load(userId);
      }
    });
  }

  reloadTasks(): void {
    const userId = this.auth.user()?.id;
    if (userId) {
      this.load(userId);
    }
  }

  private load(assigneeId: string): void {
    this.tasksFailed.set(false);
    this.tasksLoading.set(true);
    this.tasksApi.list({ status: 'open', assigneeId, pageSize: OPEN_TASKS_LIMIT }).subscribe({
      next: (page) => {
        this.openTasks.set(page.items);
        this.tasksLoading.set(false);
      },
      error: () => {
        this.tasksFailed.set(true);
        this.tasksLoading.set(false);
      },
    });
  }
}
