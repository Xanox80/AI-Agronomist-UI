import { OfflineStoreName } from '../offline.config';
import { InMemoryStore } from './in-memory-store';

const KEY_OF: Partial<Record<OfflineStoreName, (value: never) => string>> = {
  outbox: (v: { item: { clientId: string } }) => v.item.clientId,
  uploads: (v: { clientId: string }) => v.clientId,
  catalog: (v: { regionCode: string }) => v.regionCode,
  referenceImages: (v: { id: string }) => v.id,
  pulled: (v: { key: string }) => v.key,
};

/** OfflineDb stand-in that keeps every store in memory. */
export class FakeOfflineDb {
  private readonly stores = new Map<string, InMemoryStore<unknown>>();

  store<T>(name: OfflineStoreName): InMemoryStore<T> {
    if (!this.stores.has(name)) this.stores.set(name, new InMemoryStore<unknown>(KEY_OF[name] as never));
    return this.stores.get(name) as InMemoryStore<T>;
  }
}
