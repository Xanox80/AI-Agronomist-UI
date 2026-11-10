import { TestBed } from '@angular/core/testing';
import { OFFLINE_STORES } from './offline.config';
import { IDB_OPEN, OfflineDb } from './offline-db';

const openDB = vi.fn();

describe('OfflineDb', () => {
  beforeEach(() => {
    openDB.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: IDB_OPEN, useValue: openDB }] });
  });

  it('creates only missing stores, with the key paths the queues rely on', async () => {
    const createObjectStore = vi.fn();
    openDB.mockImplementation(async (...args: unknown[]) => {
      const upgrade = (args[2] as { upgrade?: (db: unknown) => void } | undefined)?.upgrade;
      upgrade?.({ objectStoreNames: { contains: (n: string) => n === OFFLINE_STORES.meta }, createObjectStore });
      return { count: async () => 0 };
    });
    await TestBed.inject(OfflineDb).store('outbox').count();
    const created = Object.fromEntries(createObjectStore.mock.calls.map(([name, options]) => [name, options?.keyPath]));
    expect(created).toEqual({
      outbox: 'item.clientId', uploads: 'clientId', catalog: 'regionCode', referenceImages: 'id', pulled: 'key',
    });
  });

  it('opens the database again after a failed open', async () => {
    openDB.mockImplementationOnce(() => Promise.reject(new Error('blocked'))).mockResolvedValue({ count: async () => 4 });
    const store = TestBed.inject(OfflineDb).store('outbox');
    await expect(store.count()).rejects.toThrow('blocked');
    expect(await store.count()).toBe(4);
  });
});
