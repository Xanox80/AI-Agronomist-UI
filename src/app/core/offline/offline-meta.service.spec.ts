import { TestBed } from '@angular/core/testing';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { OfflineDb } from './offline-db';
import { OfflineMeta } from './offline-meta.service';

describe('OfflineMeta', () => {
  let meta: OfflineMeta;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: OfflineDb, useValue: new FakeOfflineDb() }] });
    meta = TestBed.inject(OfflineMeta);
  });

  it('generates the device id once and keeps it', async () => {
    const first = await meta.deviceId();
    expect(first).toBeTruthy();
    expect(await meta.deviceId()).toBe(first);
  });

  it('remembers the last pull and sync times', async () => {
    await meta.setLastPullAt('p');
    await meta.setLastSyncAt('s');
    expect(await meta.lastPullAt()).toBe('p');
    expect(await meta.lastSyncAt()).toBe('s');
  });
});
