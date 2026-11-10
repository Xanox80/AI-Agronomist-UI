import { inject, Injectable } from '@angular/core';
import { SyncStatusDto } from '../api/models';
import { BackoffPolicy, OFFLINE_CONFIG } from './offline.config';

/** Current retry/batch tunables: local config until the server advertises its own (SYNC_CLIENT_CONFIG_EXPOSED). */
@Injectable({ providedIn: 'root' })
export class SyncPolicy {
  private readonly config = inject(OFFLINE_CONFIG);
  backoff: BackoffPolicy = this.config.backoff;
  readonly maxAttempts = this.config.maxAttempts;
  batchSize = this.config.batchSize;

  apply(status: SyncStatusDto): void {
    if (status.backoff && isValidBackoff(status.backoff)) this.backoff = status.backoff;
    if (status.batchSize && Number.isInteger(status.batchSize) && status.batchSize > 0) {
      this.batchSize = status.batchSize;
    }
  }
}

function isValidBackoff({ baseMs, maxMs, factor }: BackoffPolicy): boolean {
  return [baseMs, maxMs, factor].every((value) => Number.isFinite(value) && value > 0) && maxMs >= baseMs;
}
