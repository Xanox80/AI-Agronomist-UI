import { inject, Injectable, InjectionToken } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { OFFLINE_CONFIG, OFFLINE_STORES, OfflineStoreName } from './offline.config';

/** Minimal async key-value view of one IndexedDB object store; fakeable in tests. */
export interface KeyValueStore<T> {
  put(value: T, key?: string): Promise<void>;
  get(key: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  delete(key: string): Promise<void>;
  count(): Promise<number>;
}

const KEY_PATHS: Record<OfflineStoreName, string | undefined> = {
  outbox: 'item.clientId',
  uploads: 'clientId',
  catalog: 'regionCode',
  referenceImages: 'id',
  pulled: 'key',
  meta: undefined,
};

/** The IndexedDB opener; replaced in tests because the test environment has no IndexedDB. */
export const IDB_OPEN = new InjectionToken<typeof openDB>('IDB_OPEN', { providedIn: 'root', factory: () => openDB });

@Injectable({ providedIn: 'root' })
export class OfflineDb {
  private readonly openIdb = inject(IDB_OPEN);
  private readonly config = inject(OFFLINE_CONFIG);
  private database?: Promise<IDBPDatabase>;

  store<T>(name: OfflineStoreName): KeyValueStore<T> {
    const db = () => this.open();
    return {
      put: async (value, key) => { await (await db()).put(name, value, key); },
      get: async (key) => (await db()).get(name, key),
      getAll: async () => (await db()).getAll(name),
      delete: async (key) => (await db()).delete(name, key),
      count: async () => (await db()).count(name),
    };
  }

  private open(): Promise<IDBPDatabase> {
    this.database ??= this.openIdb(this.config.dbName, this.config.dbVersion, {
      upgrade: (db) => {
        for (const name of Object.values(OFFLINE_STORES)) {
          if (db.objectStoreNames.contains(name)) continue;
          const keyPath = KEY_PATHS[name];
          db.createObjectStore(name, keyPath ? { keyPath } : undefined);
        }
      },
    }).catch((error) => {
      this.database = undefined;
      throw error;
    });
    return this.database;
  }
}
