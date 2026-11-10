import { Injectable, signal } from '@angular/core';

/** Browser online/offline state as a signal. */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly state = signal(navigator.onLine);
  readonly online = this.state.asReadonly();

  constructor() {
    window.addEventListener('online', () => this.state.set(true));
    window.addEventListener('offline', () => this.state.set(false));
  }
}
