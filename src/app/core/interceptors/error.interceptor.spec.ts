import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiError } from '../api/models';
import { AuthSession } from '../auth/auth-session.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let session: AuthSession;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    session = TestBed.inject(AuthSession);
    router = TestBed.inject(Router);
  });

  it('rethrows the server error body as an ApiError', () => {
    let caught: ApiError | undefined;
    http.get('/api/v1/fields').subscribe({ error: (error: ApiError) => (caught = error) });

    controller.expectOne('/api/v1/fields').flush(
      { statusCode: 400, error: 'Bad Request', message: ['name must not be empty'], code: 'VALIDATION_FAILED' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(caught?.code).toBe('VALIDATION_FAILED');
  });

  it('renews the access token on 401 and retries the call', () => {
    session.start({ accessToken: 'old', refreshToken: 'r1' });
    let body: unknown;
    http.get('/api/v1/fields').subscribe((value) => (body = value));

    controller.expectOne('/api/v1/fields').flush({}, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/v1/auth/refresh').flush({ accessToken: 'new', refreshToken: 'r2', expiresIn: 900 });
    const retry = controller.expectOne('/api/v1/fields');
    retry.flush({ ok: true });

    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    expect(session.refreshToken()).toBe('r2');
    expect(body).toEqual({ ok: true });
  });

  it('ends the session when the refresh token is refused', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    session.start({ accessToken: 'old', refreshToken: 'r1' });
    http.get('/api/v1/fields').subscribe({ error: () => undefined });

    controller.expectOne('/api/v1/fields').flush({}, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/v1/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('clears the session and goes to login on 401', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    session.start({ accessToken: 'jwt' });
    http.get('/api/v1/fields').subscribe({ error: () => undefined });

    controller.expectOne('/api/v1/fields').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(session.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('keeps the session when the login call itself fails with 401', () => {
    session.start({ accessToken: 'jwt' });
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });

    controller.expectOne('/api/v1/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(session.isAuthenticated()).toBe(true);
  });
});
