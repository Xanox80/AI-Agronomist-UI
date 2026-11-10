import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoginResponse, Role } from '../api/models';
import { decodeJwtPayload } from './jwt-payload';

interface StoredSession {
  accessToken: string;
  refreshToken?: string;
}

/** Holds the JWT pair; the role is always derived from the access token. */
@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly session = signal<StoredSession | null>(this.read());

  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.session()?.refreshToken ?? null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly role = computed<Role | null>(() => {
    const token = this.accessToken();
    return token ? (decodeJwtPayload(token)?.role ?? null) : null;
  });

  start(response: Pick<LoginResponse, 'accessToken' | 'refreshToken'>): void {
    this.update({ accessToken: response.accessToken, refreshToken: response.refreshToken });
  }

  clear(): void {
    this.update(null);
  }

  hasAnyRole(roles: readonly Role[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  private update(next: StoredSession | null): void {
    this.session.set(next);
    try {
      if (next) {
        localStorage.setItem(environment.authStorageKey, JSON.stringify(next));
      } else {
        localStorage.removeItem(environment.authStorageKey);
      }
    } catch {
      // storage unavailable: the session lives in memory only
    }
  }

  private read(): StoredSession | null {
    try {
      const raw = localStorage.getItem(environment.authStorageKey);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }
}
