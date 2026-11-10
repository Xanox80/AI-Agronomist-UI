import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SyncApi } from '../api/sync.api';
import { splitAttachments } from './attachment-upload';
import { OutboxEntry, OutboxService } from './outbox.service';
import { SyncPolicy } from './sync-policy';
import { UploadQueueService } from './upload-queue.service';

export interface PushOutcome { sent: number; failed: number; lastError?: string }

/** Sends due outbox entries to /sync/push; applied observations hand their blobs to the upload queue. */
@Injectable({ providedIn: 'root' })
export class OutboxPusher {
  private readonly outbox = inject(OutboxService);
  private readonly uploads = inject(UploadQueueService);
  private readonly api = inject(SyncApi);
  private readonly policy = inject(SyncPolicy);

  async push(deviceId: string, now: number): Promise<PushOutcome> {
    const entries = await this.outbox.due(now, this.policy.batchSize);
    if (entries.length === 0) return { sent: 0, failed: 0 };
    try {
      const response = await firstValueFrom(
        this.api.push({ deviceId, items: entries.map((entry) => this.toWireItem(entry)) }),
      );
      return await this.settle(entries, response.results, now);
    } catch {
      await Promise.all(entries.map((entry) => this.outbox.markFailed(entry.item.clientId, now)));
      return { sent: 0, failed: entries.length, lastError: 'network' };
    }
  }

  private toWireItem(entry: OutboxEntry) {
    const { json } = splitAttachments(entry.item.payload, entry.item.clientId, '');
    return { ...entry.item, payload: json };
  }

  private async settle(
    entries: OutboxEntry[],
    results: { clientId: string; status: string; serverId?: string; error?: string }[],
    now: number,
  ): Promise<PushOutcome> {
    const byClientId = new Map(results.map((result) => [result.clientId, result]));
    const outcome: PushOutcome = { sent: 0, failed: 0 };
    for (const entry of entries) {
      const result = byClientId.get(entry.item.clientId);
      if (result && result.status !== 'failed') {
        await this.complete(entry, result.status, result.serverId ?? entry.item.clientId);
        outcome.sent++;
      } else {
        await this.outbox.markFailed(entry.item.clientId, now);
        outcome.failed++;
        outcome.lastError = result?.error ?? 'missing_result';
      }
    }
    return outcome;
  }

  /** On conflict the server already holds the winning version: the local copy and its attachments are dropped. */
  private async complete(entry: OutboxEntry, status: string, serverId: string): Promise<void> {
    if (entry.item.entityType === 'observation' && status !== 'conflict') {
      const { uploads } = splitAttachments(entry.item.payload, serverId, entry.item.clientTimestamp);
      await this.uploads.addAll(uploads);
    }
    await this.outbox.markDone(entry.item.clientId);
  }
}
