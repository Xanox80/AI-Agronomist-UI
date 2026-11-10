import { backoffDelayMs } from './backoff';
import { BackoffPolicy } from './offline.config';
import { KeyValueStore } from './offline-db';

export interface Retryable { attempts: number; nextAttemptAt: number }

/** Persistent queue where failed entries wait out an exponential backoff, then become stuck after maxAttempts. */
export class RetryQueue<T extends Retryable> {
  constructor(
    private readonly store: KeyValueStore<T>,
    private readonly keyOf: (entry: T) => string,
    private readonly backoff: () => BackoffPolicy,
    private readonly orderBy: (entry: T) => string,
    private readonly maxAttempts: number,
  ) {}

  add(entry: T): Promise<void> {
    return this.store.put(entry);
  }

  async due(now: number, limit: number): Promise<T[]> {
    const entries = (await this.store.getAll()).filter(
      (entry) => entry.attempts < this.maxAttempts && entry.nextAttemptAt <= now,
    );
    return entries.sort((a, b) => this.orderBy(a).localeCompare(this.orderBy(b))).slice(0, limit);
  }

  remove(key: string): Promise<void> {
    return this.store.delete(key);
  }

  async markFailed(key: string, now: number): Promise<void> {
    const entry = await this.store.get(key);
    if (!entry) return;
    const attempts = entry.attempts + 1;
    await this.store.put({ ...entry, attempts, nextAttemptAt: now + backoffDelayMs(attempts, this.backoff()) });
  }

  /** Entries still being retried. */
  async count(): Promise<number> {
    return (await this.store.getAll()).filter((entry) => entry.attempts < this.maxAttempts).length;
  }

  /** Entries that exhausted their attempts; kept so no data is lost silently. */
  async stuckCount(): Promise<number> {
    return (await this.store.getAll()).filter((entry) => entry.attempts >= this.maxAttempts).length;
  }
}
