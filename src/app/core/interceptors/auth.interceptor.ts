import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../api/api-base-url';
import { AuthSession } from '../auth/auth-session.service';

/** Attaches the bearer token to calls to our own API only. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthSession).accessToken();
  if (!token || !request.url.startsWith(inject(API_BASE_URL))) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
