import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url';
import { ApiError } from '../api/models';
import { AuthSession } from '../auth/auth-session.service';
import { TokenRefresher } from '../auth/token-refresher';
import { LOGIN_PATH } from '../auth/role.guard';

const UNAUTHORIZED = 401;
const NETWORK_ERROR_STATUS = 0;
const FORBIDDEN = 403;
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh'];

/** Renews the access token once on 401 and retries the call; ends the session only when renewal is refused. */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSession);
  const router = inject(Router);
  const refresher = inject(TokenRefresher);
  const isAuthCall = AUTH_ENDPOINTS.some((endpoint) => request.url.endsWith(endpoint));
  const isOwnApi = request.url.startsWith(inject(API_BASE_URL));
  const endSession = () => {
    session.clear();
    void router.navigateByUrl(LOGIN_PATH);
  };

  return next(request).pipe(
    catchError((failure: HttpErrorResponse) => {
      if (!isOwnApi || failure.status !== UNAUTHORIZED || isAuthCall) return throwError(() => toApiError(failure));
      if (!session.refreshToken()) {
        endSession();
        return throwError(() => toApiError(failure));
      }
      return refresher.refresh().pipe(
        switchMap((accessToken) => next(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }))),
        catchError((retryFailure: HttpErrorResponse | ApiError) => {
          const status = retryFailure instanceof HttpErrorResponse ? retryFailure.status : retryFailure.statusCode;
          if (status === UNAUTHORIZED || status === FORBIDDEN) endSession();
          return throwError(() => (retryFailure instanceof HttpErrorResponse ? toApiError(retryFailure) : retryFailure));
        }),
      );
    }),
  );
};

function toApiError(failure: HttpErrorResponse): ApiError {
  const body = failure.error as Partial<ApiError> | null;
  return {
    statusCode: failure.status,
    error: body?.error ?? failure.statusText,
    message: body?.message ?? failure.message,
    code: body?.code ?? (failure.status === NETWORK_ERROR_STATUS ? 'NETWORK_ERROR' : undefined),
  };
}
