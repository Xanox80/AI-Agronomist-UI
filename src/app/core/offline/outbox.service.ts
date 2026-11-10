import { inject, Injectable } from '@angular/core';
import { SyncPushItem } from '../api/models';
import { OFFLINE_STORES } from './offline.config';
import { OfflineDb } from './offline-db';
import { RetryQueue } from './retry-queue';
import { SyncPolicy } from './sync-policy';

export interface OutboxEntry {
  item: SyncPushItem;
  attempts: number;
  nextAttemptAt: number;
}

/** IndexedDB-backed queue of changes created offline (observations with photo blobs, tasks, confirmations). */
@Injectable({ providedIn: 'root' })
export class OutboxService {
  private readonly policy = inject(SyncPolicy);
  private readonly queue = new RetryQueue<OutboxEntry>(
    inject(OfflineDb).store<OutboxEntry>(OFFLINE_STORES.outbox),
    (entry) => entry.item.clientId,
    () => this.policy.backoff,
    (entry) => entry.item.clientTimestamp,
    this.policy.maxAttempts,
  );

  enqueue(item: SyncPushItem): Promise<void> {
    return this.queue.add({ item, attempts: 0, nextAttemptAt: 0 });
  }

  due(now: number, limit: number): Promise<OutboxEntry[]> {
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
