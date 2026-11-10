import { TestBed } from '@angular/core/testing';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { AttachmentUpload } from './attachment-upload';
import { OfflineDb } from './offline-db';
import { SyncPolicy } from './sync-policy';
import { UploadQueueService } from './upload-queue.service';

const upload = (clientId: string, queuedAt: string): AttachmentUpload => ({
  kind: 'voice', clientId, observationId: 'o1', durationSec: 3, file: new Blob(['x']), queuedAt, attempts: 0, nextAttemptAt: 0,
});

describe('UploadQueueService', () => {
  let queue: UploadQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: OfflineDb, useValue: new FakeOfflineDb() }] });
    queue = TestBed.inject(UploadQueueService);
  });

  it('returns queued uploads oldest first and removes finished ones', async () => {
    await queue.addAll([upload('b', '2'), upload('a', '1')]);
    expect((await queue.due(0, 10)).map((u) => u.clientId)).toEqual(['a', 'b']);
    await queue.markDone('a');
    expect(await queue.count()).toBe(1);
  });

  it('moves an upload to stuck after the maximum attempts', async () => {
    await queue.addAll([upload('a', '1')]);
    for (let i = 0; i < TestBed.inject(SyncPolicy).maxAttempts; i++) await queue.markFailed('a', 0);
    expect(await queue.count()).toBe(0);
    expect(await queue.stuckCount()).toBe(1);
  });
});
