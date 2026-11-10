import { TestBed } from '@angular/core/testing';
import { SyncPushItem } from '../api/models';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { OfflineDb } from './offline-db';
import { OutboxService } from './outbox.service';

const item = (clientId: string, clientTimestamp: string): SyncPushItem =>
  ({ entityType: 'task', clientId, operation: 'upsert', clientTimestamp, payload: {} });

describe('OutboxService', () => {
  let outbox: OutboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: OfflineDb, useValue: new FakeOfflineDb() }] });
    outbox = TestBed.inject(OutboxService);
  });

  it('stores enqueued items and counts them', async () => {
    await outbox.enqueue(item('a', '2026-01-01'));
    await outbox.enqueue(item('b', '2026-01-02'));
    expect(await outbox.count()).toBe(2);
  });

  it('returns due items oldest first', async () => {
    await outbox.enqueue(item('b', '2026-01-02'));
    await outbox.enqueue(item('a', '2026-01-01'));
    expect((await outbox.due(0, 10)).map((e) => e.item.clientId)).toEqual(['a', 'b']);
  });

  it('delays an item after a failure using the configured backoff', async () => {
    await outbox.enqueue(item('a', '2026-01-01'));
    await outbox.markFailed('a', 1000);
    expect(await outbox.due(1000, 10)).toEqual([]);
    expect(await outbox.due(1000 + 2000, 10)).toHaveLength(1);
  });

  it('drops an item once it is done', async () => {
    await outbox.enqueue(item('a', '2026-01-01'));
    await outbox.markDone('a');
    expect(await outbox.count()).toBe(0);
  });
});
