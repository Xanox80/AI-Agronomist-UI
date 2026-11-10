import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SyncPushItem } from '../api/models';
import { SyncApi } from '../api/sync.api';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { OfflineDb } from './offline-db';
import { OutboxPusher } from './outbox-pusher';
import { OutboxService } from './outbox.service';
import { UploadQueueService } from './upload-queue.service';

const report = { sharpness: 1, exposure: 0.5, plantCoverage: 0.4, objectSize: 0.2, passed: true };
const observation: SyncPushItem = {
  entityType: 'observation', clientId: 'o1', operation: 'upsert', clientTimestamp: '2026-01-01T00:00:00Z',
  payload: { clientId: 'o1', attachments: { photos: [{ clientId: 'p1', seq: 1, qualityReport: report, file: new Blob(['x']) }] } },
};

describe('OutboxPusher', () => {
  const push = vi.fn();
  let pusher: OutboxPusher;
  let outbox: OutboxService;
  let uploads: UploadQueueService;

  beforeEach(() => {
    push.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: OfflineDb, useValue: new FakeOfflineDb() },
        { provide: SyncApi, useValue: { push } },
      ],
    });
    pusher = TestBed.inject(OutboxPusher);
    outbox = TestBed.inject(OutboxService);
    uploads = TestBed.inject(UploadQueueService);
  });

  it('does not call the server when nothing is due', async () => {
    expect(await pusher.push('dev', 0)).toEqual({ sent: 0, failed: 0 });
    expect(push).not.toHaveBeenCalled();
  });

  it('sends the payload without blobs and queues the photos after the observation is applied', async () => {
    await outbox.enqueue(observation);
    push.mockReturnValue(of({ results: [{ clientId: 'o1', entityType: 'observation', status: 'applied', serverId: 'o1' }], serverTime: 't' }));
    const outcome = await pusher.push('dev', 0);
    expect(outcome.sent).toBe(1);
    expect(push.mock.calls[0][0].items[0].payload).toEqual({ clientId: 'o1' });
    expect(await outbox.count()).toBe(0);
    expect((await uploads.due(0, 10)).map((u) => u.clientId)).toEqual(['p1']);
  });

  it('drops conflicting items because the server version wins', async () => {
    await outbox.enqueue({ ...observation, entityType: 'task', payload: {} });
    push.mockReturnValue(of({ results: [{ clientId: 'o1', entityType: 'task', status: 'conflict' }], serverTime: 't' }));
    await pusher.push('dev', 0);
    expect(await outbox.count()).toBe(0);
  });

  it('does not upload local attachments when the server version of an observation wins', async () => {
    await outbox.enqueue(observation);
    push.mockReturnValue(of({
      results: [{ clientId: 'o1', entityType: 'observation', status: 'conflict', serverId: 'srv' }], serverTime: 't',
    }));
    await pusher.push('dev', 0);
    expect(await outbox.count()).toBe(0);
    expect(await uploads.count()).toBe(0);
  });

  it('keeps failed items queued with a delay and reports the error', async () => {
    await outbox.enqueue(observation);
    push.mockReturnValue(of({ results: [{ clientId: 'o1', entityType: 'observation', status: 'failed', error: 'invalid' }], serverTime: 't' }));
    const outcome = await pusher.push('dev', 0);
    expect(outcome).toEqual({ sent: 0, failed: 1, lastError: 'invalid' });
    expect(await outbox.due(0, 10)).toEqual([]);
    expect(await outbox.count()).toBe(1);
  });

  it('keeps everything queued when the network call fails', async () => {
    await outbox.enqueue(observation);
    push.mockReturnValue(throwError(() => new Error('offline')));
    const outcome = await pusher.push('dev', 0);
    expect(outcome.failed).toBe(1);
    expect(await outbox.count()).toBe(1);
  });
});
