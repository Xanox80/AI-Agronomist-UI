import { TestBed } from '@angular/core/testing';
import { AuthSession } from './auth-session.service';

const expertToken = `h.${btoa(JSON.stringify({ role: 'expert' }))}.s`;

describe('AuthSession', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('is unauthenticated without a stored token', () => {
    const session = TestBed.inject(AuthSession);
    expect(session.isAuthenticated()).toBe(false);
    expect(session.role()).toBeNull();
  });

  it('derives the role from the access token after start', () => {
    const session = TestBed.inject(AuthSession);
    session.start({ accessToken: expertToken });
    expect(session.role()).toBe('expert');
    expect(session.hasAnyRole(['expert', 'chief_agronomist'])).toBe(true);
    expect(session.hasAnyRole(['scout'])).toBe(false);
  });

  it('restores the session after a reload', () => {
    TestBed.inject(AuthSession).start({ accessToken: expertToken });
    TestBed.resetTestingModule();
    expect(TestBed.inject(AuthSession).role()).toBe('expert');
  });

  it('forgets the token on clear', () => {
    const session = TestBed.inject(AuthSession);
    session.start({ accessToken: expertToken });
    session.clear();
    expect(session.isAuthenticated()).toBe(false);
  });
});
