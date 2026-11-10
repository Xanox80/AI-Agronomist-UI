import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../api/models';
import { AuthSession } from './auth-session.service';

export const LOGIN_PATH = '/login';
export const FORBIDDEN_REDIRECT_PATH = '/';

/** Requires a signed-in user; when roles are given, the token role must be one of them. */
export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const session = inject(AuthSession);
    const router = inject(Router);
    if (!session.isAuthenticated()) {
      return router.parseUrl(LOGIN_PATH);
    }
    return roles.length === 0 || session.hasAnyRole(roles) ? true : router.parseUrl(FORBIDDEN_REDIRECT_PATH);
  };
}
