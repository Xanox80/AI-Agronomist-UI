import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ApiError } from '../../core/api';
import { DisplayControlsComponent } from '../shell/display-controls.component';
import { AuthService } from './auth.service';

const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;
const ERROR_KEYS: Record<number, string> = {
  [HTTP_UNAUTHORIZED]: 'auth.invalidCredentials',
  [HTTP_TOO_MANY_REQUESTS]: 'auth.tooManyAttempts',
};
const FALLBACK_ERROR_KEY = 'common.error';
const HOME_PATH = '/';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TranslatePipe, ButtonModule, InputTextModule, DisplayControlsComponent],
  template: `
    <section class="login">
      <app-display-controls class="login__controls" />
      <form class="login__form" (ngSubmit)="submit()">
        <h1>{{ 'auth.title' | translate }}</h1>
        <label for="email">{{ 'auth.email' | translate }}</label>
        <input pInputText id="email" name="email" type="email" autocomplete="username" required [(ngModel)]="email" />
        <label for="password">{{ 'auth.password' | translate }}</label>
        <input
          pInputText
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          [(ngModel)]="password"
        />
        @if (errorKey(); as key) {
          <p class="login__error" role="alert">{{ key | translate }}</p>
        }
        <p-button type="submit" [label]="'auth.submit' | translate" [loading]="busy()" [fluid]="true" />
      </form>
    </section>
  `,
  styles: `
    .login {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }
    .login__controls {
      align-self: flex-end;
    }
    .login__form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      max-width: 24rem;
      padding: 1.5rem;
      background: var(--ap-surface);
      border: 1px solid var(--ap-border);
      border-radius: var(--ap-radius);
    }
    .login__error {
      margin: 0;
      color: var(--ap-danger);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected submit(): void {
    this.busy.set(true);
    this.errorKey.set(null);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => void this.router.navigateByUrl(HOME_PATH),
      error: (error: ApiError) => {
        this.errorKey.set(ERROR_KEYS[error.statusCode] ?? FALLBACK_ERROR_KEY);
        this.busy.set(false);
      },
    });
  }
}
