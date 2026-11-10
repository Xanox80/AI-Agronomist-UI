import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Role } from '../api/models';
import { AuthSession } from './auth-session.service';
import { roleGuard } from './role.guard';

function tokenFor(role: Role): string {
  return `h.${btoa(JSON.stringify({ role }))}.s`;
}

function runGuard(...roles: Role[]): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    roleGuard(...roles)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('roleGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('redirects an anonymous user to the login page', () => {
    expect(runGuard('scout').toString()).toBe('/login');
  });

  it('lets any signed-in user through when no roles are required', () => {
    TestBed.inject(AuthSession).start({ accessToken: tokenFor('mechanic') });
    expect(runGuard()).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    TestBed.inject(AuthSession).start({ accessToken: tokenFor('expert') });
    expect(runGuard('expert', 'chief_agronomist')).toBe(true);
  });

  it('redirects a user whose role is not listed', () => {
    TestBed.inject(AuthSession).start({ accessToken: tokenFor('mechanic') });
    expect(runGuard('chief_agronomist').toString()).toBe('/');
  });
});
