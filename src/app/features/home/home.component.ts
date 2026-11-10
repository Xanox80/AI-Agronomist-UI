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
      <h1>
        {{ 'home.title' | translate }}@if (auth.user(); as user) {, {{ user.displayName }}}
      </h1>

      <p-button
        class="home__scout"
        routerLink="/scouting"
        icon="pi pi-camera"
        [label]="'home.newScouting' | translate"
        size="large"
        [fluid]="true"
      />

      <p-card [header]="'home.syncStatus' | translate">
        <ap-sync-status />
      </p-card>

      <p-card [header]="'home.openTasks' | translate">
        @if (home.tasksFailed()) {
          <p role="alert">{{ 'common.error' | translate }}</p>
        } @else {
          @for (task of home.openTasks(); track task.id) {
            <a class="home__task" routerLink="/tasks">
              <strong>{{ task.title }}</strong>
              <span>{{ task.fieldName }}</span>
            </a>
          } @empty {
            <p>{{ 'home.noOpenTasks' | translate }}</p>
          }
        }
      </p-card>
    </section>
  `,
  styles: `
    .home {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .home__task {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: var(--ap-touch-min);
      padding: 0.25rem 0;
      color: var(--ap-text);
      text-decoration: none;
      border-bottom: 1px solid var(--ap-border);
    }
    .home__task span {
      color: var(--ap-text-sec);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly auth = inject(AuthService);
  protected readonly home = inject(HomeService);
}
