import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/api/auth.api';
import { readStored, writeStored } from '../shell/safe-storage';
import { SETTINGS_CONFIG } from './settings.config';

/** Section 7 privacy: opt out of storing observation coordinates. */
@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly api = inject(AuthApi);

  readonly geoCollectionEnabled = signal(readStored(SETTINGS_CONFIG.geoCollectionStorageKey) !== String(false));
  readonly saveFailed = signal(false);

  async load(): Promise<void> {
    this.remember((await firstValueFrom(this.api.me())).geoCollectionEnabled);
  }

  async setGeoCollection(enabled: boolean): Promise<void> {
    const previous = this.geoCollectionEnabled();
    this.saveFailed.set(false);
    this.remember(enabled);
    try {
      const user = await firstValueFrom(this.api.updateMe({ geoCollectionEnabled: enabled }));
      this.remember(user.geoCollectionEnabled);
    } catch {
      this.remember(previous);
      this.saveFailed.set(true);
    }
  }

  private remember(enabled: boolean): void {
    this.geoCollectionEnabled.set(enabled);
    writeStored(SETTINGS_CONFIG.geoCollectionStorageKey, String(enabled));
  }
}
