import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SyncStatusComponent } from '../../core/offline/sync-status.component';
import { AuthService } from '../auth/auth.service';
import { HomeService } from './home.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe, ButtonModule, CardModule, SyncStatusComponent],
  providers: [HomeService],
  template: `
    <section class="scout-page home">
      <h1 class="home__title">
        @if (auth.user(); as user) {
          {{ 'home.greeting' | translate: { name: user.displayName } }}
        } @else {
          {{ 'home.title' | translate }}
        }
      </h1>

      @if (home.primaryAction(); as action) {
        <p-button
          class="home__primary"
          [routerLink]="action.path"
          [icon]="action.icon"
          [label]="action.labelKey | translate"
          size="large"
          [fluid]="true"
        />
      }

      <p-card [header]="'home.openTasks' | translate">
        @if (home.tasksLoading()) {
          <p class="home__state" role="status">{{ 'common.loading' | translate }}</p>
        } @else if (home.tasksFailed()) {
          <div class="home__state" role="alert">
            <p>{{ 'home.tasksFailed' | translate }}</p>
            <p-button
              class="home__retry"
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              [label]="'common.retry' | translate"
              (onClick)="home.reloadTasks()"
            />
          </div>
        } @else {
          @for (task of home.openTasks(); track task.id) {
            <a class="home__task" [routerLink]="['/tasks', task.id]">
              <span class="home__task-text">
                <strong>{{ task.title }}</strong>
                <span class="home__task-field">{{ task.fieldName }}</span>
              </span>
              <i class="pi pi-chevron-right" aria-hidden="true"></i>
            </a>
          } @empty {
            <p class="home__state">{{ 'home.noOpenTasks' | translate }}</p>
          }
          <a class="home__all-tasks" routerLink="/tasks">{{ 'home.allTasks' | translate }}</a>
        }
      </p-card>

      <p-card [header]="'home.syncStatus' | translate">
        <ap-sync-status />
      </p-card>
    </section>
  `,
  styles: `
    .home {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .home__title {
      margin: 0;
      font-size: 1.35rem;
      overflow-wrap: anywhere;
    }
    .home__state {
      margin: 0;
      color: var(--ap-text-sec);
    }
    .home__state p {
      margin: 0 0 0.75rem;
    }
    .home__task {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: var(--ap-touch-min);
      padding: 0.5rem 0;
      color: var(--ap-text);
      text-decoration: none;
      border-bottom: 1px solid var(--ap-border);
    }
    .home__task-text {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }
    .home__task-field {
      color: var(--ap-text-sec);
    }
    .home__all-tasks {
      display: flex;
      align-items: center;
      min-height: var(--ap-touch-min);
      color: var(--ap-accent);
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly auth = inject(AuthService);
  protected readonly home = inject(HomeService);
}
