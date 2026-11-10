import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SyncApi } from '../api/sync.api';
import { AttachmentUploader } from './attachment-uploader';
import { backoffDelayMs } from './backoff';
import { CatalogPackCache } from './catalog-pack-cache.service';
import { ConnectivityService } from './connectivity.service';
import { OFFLINE_CONFIG } from './offline.config';
import { OfflineMeta } from './offline-meta.service';
import { OutboxPusher } from './outbox-pusher';
import { OutboxService } from './outbox.service';
import { ReferenceImageCache } from './reference-image-cache.service';
import { SyncPolicy } from './sync-policy';
import { SyncPuller } from './sync-puller';
import { UploadQueueService } from './upload-queue.service';

/** Pushes the outbox and pulls server changes when online, retrying with backoff (FR-24, FR-26). */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly config = inject(OFFLINE_CONFIG);
  private readonly connectivity = inject(ConnectivityService);
  private readonly outbox = inject(OutboxService);
  private readonly uploadQueue = inject(UploadQueueService);
  private readonly pusher = inject(OutboxPusher);
  private readonly uploader = inject(AttachmentUploader);
  private readonly puller = inject(SyncPuller);
  private readonly packCache = inject(CatalogPackCache);
  private readonly referenceImages = inject(ReferenceImageCache);
  private readonly meta = inject(OfflineMeta);
  private readonly policy = inject(SyncPolicy);
  private readonly api = inject(SyncApi);

  private readonly pending = signal(0);
  private readonly last = signal<string | null>(null);
  private readonly error = signal<string | null>(null);
  private readonly stuckItems = signal(0);
  private readonly running = signal(false);
  readonly stuckCount = this.stuckItems.asReadonly();
  readonly pendingCount = this.pending.asReadonly();
  readonly lastSyncAt = this.last.asReadonly();
  readonly lastError = this.error.asReadonly();
  readonly syncing = this.running.asReadonly();

  private phase = 'status';
  private started = false;
  /** A request that arrived mid-cycle (a new outbox entry) is served right after the cycle instead of being dropped. */
  private rerunRequested = false;
  private consecutiveFailures = 0;
  private active?: Promise<void>;
  private timer?: ReturnType<typeof setTimeout>;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.meta.lastSyncAt().then((iso) => this.last.set(iso ?? null), () => undefined);
    window.addEventListener('online', () => void this.syncNow());
    void this.syncNow();
  }

  /** Resolves when the cycle (and any cycle requested meanwhile) has finished, so callers can rely on the result. */
  syncNow(): Promise<void> {
    if (this.running()) {
      this.rerunRequested = true;
      return this.active ?? Promise.resolve();
    }
    this.active = this.execute();
    return this.active;
  }

  private async execute(): Promise<void> {
    if (!this.connectivity.online()) {
      await this.refreshPending();
      this.scheduleNext();
      return;
    }
    this.running.set(true);
    try {
      this.finish(await this.runCycle());
    } catch {
      this.finish(`${this.phase}_failed`);
    } finally {
      this.running.set(false);
      await this.refreshPending();
      this.scheduleNext();
    }
    if (this.rerunRequested) {
      this.rerunRequested = false;
      await this.syncNow();
    }
  }

  /** Returns the error code of this cycle, or null when everything was sent. */
  private async runCycle(): Promise<string | null> {
    this.phase = 'status';
    const deviceId = await this.meta.deviceId();
    await firstValueFrom(this.api.status(deviceId)).then((status) => this.policy.apply(status), () => undefined);
    const now = Date.now();
    this.phase = 'push';
    const pushed = await this.pusher.push(deviceId, now);
    this.phase = 'upload';
    const uploadsFailed = await this.uploader.uploadDue(now);
    this.phase = 'pull';
    await this.puller.pull(deviceId);
    await this.refreshCatalogue();
    if (pushed.failed > 0) return pushed.lastError ?? 'push_failed';
    return uploadsFailed > 0 ? 'upload_failed' : null;
  }

  private async refreshCatalogue(): Promise<void> {
    try {
      const pack = await this.packCache.refresh();
      if (pack) await this.referenceImages.cacheMissing(pack.referenceImages);
    } catch {
      // the cached pack stays usable; the next cycle retries
    }
  }

  private finish(errorCode: string | null): void {
    this.error.set(errorCode);
    this.consecutiveFailures = errorCode ? this.consecutiveFailures + 1 : 0;
    if (errorCode) return;
    const iso = new Date().toISOString();
    this.last.set(iso);
    void this.meta.setLastSyncAt(iso);
  }

  private scheduleNext(): void {
    clearTimeout(this.timer);
    if (!this.started) return;
    const delay = this.consecutiveFailures > 0
      ? backoffDelayMs(this.consecutiveFailures, this.policy.backoff)
      : this.config.pollIntervalMs;
    this.timer = setTimeout(() => void this.syncNow(), delay);
  }

  private async refreshPending(): Promise<void> {
    try {
      this.pending.set((await this.outbox.count()) + (await this.uploadQueue.count()));
      this.stuckItems.set((await this.outbox.stuckCount()) + (await this.uploadQueue.stuckCount()));
    } catch {
      // storage unavailable: keep the last known count
    }
  }
}
