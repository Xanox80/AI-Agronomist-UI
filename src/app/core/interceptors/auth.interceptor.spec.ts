import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthSession } from '../auth/auth-session.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  it('adds the bearer token to API requests', () => {
    TestBed.inject(AuthSession).start({ accessToken: 'jwt' });
    http.get('/api/v1/fields').subscribe();
    expect(controller.expectOne('/api/v1/fields').request.headers.get('Authorization')).toBe('Bearer jwt');
  });

  it('does not send the token to other origins', () => {
    TestBed.inject(AuthSession).start({ accessToken: 'jwt' });
    http.get('https://tile.example.com/1.png').subscribe();
    expect(controller.expectOne('https://tile.example.com/1.png').request.headers.has('Authorization')).toBe(false);
  });

  it('sends no header when signed out', () => {
    http.get('/api/v1/fields').subscribe();
    expect(controller.expectOne('/api/v1/fields').request.headers.has('Authorization')).toBe(false);
  });
});
