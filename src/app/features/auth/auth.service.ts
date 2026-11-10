import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { AuthApi, LoginRequest, UserDto } from '../../core/api';
import { AuthSession } from '../../core/auth/auth-session.service';
import { LOGIN_PATH } from '../../core/auth/role.guard';

/** Sign-in, sign-out and the profile of the signed-in user. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly session = inject(AuthSession);
  private readonly router = inject(Router);

  readonly user = signal<UserDto | null>(null);

  login(request: LoginRequest): Observable<UserDto> {
    return this.api.login(request).pipe(
      tap((response) => {
        this.session.start(response);
        this.user.set(response.user);
      }),
      map((response) => response.user),
    );
  }

  loadProfile(): Observable<UserDto> {
    return this.api.me().pipe(tap((user) => this.user.set(user)));
  }

  logout(): void {
    const refreshToken = this.session.refreshToken();
    const revoke$ = refreshToken ? this.api.logout({ refreshToken }) : of(undefined);
    revoke$
      .pipe(
        catchError(() => of(undefined)),
        finalize(() => {
          this.session.clear();
          this.user.set(null);
          void this.router.navigateByUrl(LOGIN_PATH);
        }),
      )
      .subscribe();
  }
}
