import { inject, Injectable } from '@angular/core';
import { OFFLINE_STORES } from './offline.config';
import { KeyValueStore, OfflineDb } from './offline-db';

export type PulledEntityType = 'fields' | 'tasks' | 'observations' | 'recommendations' | 'diagnoses' | 'treatments';

interface PulledRecord { key: string; entityType: PulledEntityType; id: string; data: unknown }

/** Server-owned entities mirrored on the device from /sync/pull (fields, refined diagnoses, ...). */
@Injectable({ providedIn: 'root' })
export class PulledStore {
  private readonly store: KeyValueStore<PulledRecord> = inject(OfflineDb).store<PulledRecord>(OFFLINE_STORES.pulled);

  put(entityType: PulledEntityType, id: string, data: unknown): Promise<void> {
    return this.store.put({ key: keyOf(entityType, id), entityType, id, data });
  }

  remove(entityType: PulledEntityType, id: string): Promise<void> {
    return this.store.delete(keyOf(entityType, id));
  }

  async get<T>(entityType: PulledEntityType, id: string): Promise<T | undefined> {
    return (await this.store.get(keyOf(entityType, id)))?.data as T | undefined;
  }
}

function keyOf(entityType: PulledEntityType, id: string): string {
  return `${entityType}:${id}`;
}
