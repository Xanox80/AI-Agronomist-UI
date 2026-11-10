import { inject, Injectable } from '@angular/core';
import { finalize, map, Observable, shareReplay } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { AuthSession } from './auth-session.service';

/** Swaps the refresh token for a new pair; concurrent callers share one request so the token is rotated once. */
@Injectable({ providedIn: 'root' })
export class TokenRefresher {
  private readonly api = inject(AuthApi);
  private readonly session = inject(AuthSession);
  private inflight?: Observable<string>;

  /** Emits the new access token, or errors when there is no refresh token or the server rejects it. */
  refresh(): Observable<string> {
    const refreshToken = this.session.refreshToken();
    if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');
    this.inflight ??= this.api.refresh({ refreshToken }).pipe(
      map((pair) => {
        this.session.start(pair);
        return pair.accessToken;
      }),
      finalize(() => (this.inflight = undefined)),
      shareReplay(1),
    );
    return this.inflight;
  }
}
