import { inject, Injectable } from '@angular/core';
import { OFFLINE_STORES } from './offline.config';
import { KeyValueStore, OfflineDb } from './offline-db';

const DEVICE_ID_KEY = 'deviceId';
const LAST_PULL_KEY = 'lastPullAt';
const LAST_SYNC_KEY = 'lastSyncAt';

/** Small persisted facts about this device: its id and the last sync/pull times. */
@Injectable({ providedIn: 'root' })
export class OfflineMeta {
  private readonly store: KeyValueStore<string> = inject(OfflineDb).store<string>(OFFLINE_STORES.meta);

  async deviceId(): Promise<string> {
    const existing = await this.store.get(DEVICE_ID_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    await this.store.put(created, DEVICE_ID_KEY);
    return created;
  }

  lastPullAt(): Promise<string | undefined> {
    return this.store.get(LAST_PULL_KEY);
  }

  setLastPullAt(serverTime: string): Promise<void> {
    return this.store.put(serverTime, LAST_PULL_KEY);
  }

  lastSyncAt(): Promise<string | undefined> {
    return this.store.get(LAST_SYNC_KEY);
  }

  setLastSyncAt(iso: string): Promise<void> {
    return this.store.put(iso, LAST_SYNC_KEY);
  }
}
