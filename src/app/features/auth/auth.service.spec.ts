import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthApi, UserDto } from '../../core/api';
import { AuthSession } from '../../core/auth/auth-session.service';
import { AuthService } from './auth.service';

const user = { id: 'u1', displayName: 'Olena', role: 'scout' } as UserDto;
const token = `h.${btoa(JSON.stringify({ role: 'scout' }))}.s`;

describe('AuthService', () => {
  let api: { login: ReturnType<typeof vi.fn>; me: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let service: AuthService;
  let session: AuthSession;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    api = { login: vi.fn(), me: vi.fn(), logout: vi.fn() };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthApi, useValue: api }] });
    service = TestBed.inject(AuthService);
    session = TestBed.inject(AuthSession);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('starts the session and exposes the user after login', () => {
    api.login.mockReturnValue(of({ accessToken: token, refreshToken: 'r', expiresIn: 900, user }));
    service.login({ email: 'a@b.c', password: 'x' }).subscribe();
    expect(session.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual(user);
  });

  it('loads the profile of an already signed-in user', () => {
    api.me.mockReturnValue(of(user));
    service.loadProfile().subscribe();
    expect(service.user()).toEqual(user);
  });

  it('clears the session and returns to login on logout', () => {
    session.start({ accessToken: token, refreshToken: 'r' });
    api.logout.mockReturnValue(of(undefined));
    service.logout();
    expect(api.logout).toHaveBeenCalledWith({ refreshToken: 'r' });
    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('signs out locally even when the server call fails', () => {
    session.start({ accessToken: token, refreshToken: 'r' });
    api.logout.mockReturnValue(throwError(() => new Error('offline')));
    service.logout();
    expect(session.isAuthenticated()).toBe(false);
  });
});
