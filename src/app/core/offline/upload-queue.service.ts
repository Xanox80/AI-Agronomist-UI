import { inject, Injectable } from '@angular/core';
import { AttachmentUpload } from './attachment-upload';
import { OFFLINE_STORES } from './offline.config';
import { OfflineDb } from './offline-db';
import { RetryQueue } from './retry-queue';
import { SyncPolicy } from './sync-policy';

/** Photos and voice notes waiting for their observation to exist on the server. */
@Injectable({ providedIn: 'root' })
export class UploadQueueService {
  private readonly policy = inject(SyncPolicy);
  private readonly queue = new RetryQueue<AttachmentUpload>(
    inject(OfflineDb).store<AttachmentUpload>(OFFLINE_STORES.uploads),
    (entry) => entry.clientId,
    () => this.policy.backoff,
    (entry) => entry.queuedAt,
    this.policy.maxAttempts,
  );

  addAll(uploads: AttachmentUpload[]): Promise<unknown> {
    return Promise.all(uploads.map((upload) => this.queue.add(upload)));
  }

  due(now: number, limit: number): Promise<AttachmentUpload[]> {
    return this.queue.due(now, limit);
  }

  markDone(clientId: string): Promise<void> {
    return this.queue.remove(clientId);
  }

  markFailed(clientId: string, now: number): Promise<void> {
    return this.queue.markFailed(clientId, now);
  }

  count(): Promise<number> {
    return this.queue.count();
  }

  stuckCount(): Promise<number> {
    return this.queue.stuckCount();
  }
}
