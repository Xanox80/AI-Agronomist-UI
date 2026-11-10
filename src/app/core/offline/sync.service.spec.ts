import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncApi } from '../api/sync.api';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { AttachmentUploader } from './attachment-uploader';
import { CatalogPackCache } from './catalog-pack-cache.service';
import { ConnectivityService } from './connectivity.service';
import { OfflineDb } from './offline-db';
import { OutboxPusher } from './outbox-pusher';
import { OutboxService } from './outbox.service';
import { ReferenceImageCache } from './reference-image-cache.service';
import { SyncPolicy } from './sync-policy';
import { SyncPuller } from './sync-puller';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  const online = signal(true);
  const push = vi.fn();
  const uploadDue = vi.fn();
  const pull = vi.fn();
  const refresh = vi.fn();
  let service: SyncService;

  beforeEach(() => {
    vi.useFakeTimers();
    online.set(true);
    push.mockReset().mockResolvedValue({ sent: 1, failed: 0 });
    uploadDue.mockReset().mockResolvedValue(0);
    pull.mockReset().mockResolvedValue(undefined);
    refresh.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: OfflineDb, useValue: new FakeOfflineDb() },
        { provide: ConnectivityService, useValue: { online } },
        { provide: OutboxPusher, useValue: { push } },
        { provide: AttachmentUploader, useValue: { uploadDue } },
        { provide: SyncPuller, useValue: { pull } },
        { provide: CatalogPackCache, useValue: { refresh } },
        { provide: ReferenceImageCache, useValue: { cacheMissing: vi.fn() } },
        { provide: SyncApi, useValue: { status: () => of({ pendingRefinement: 0, catalogVersion: 1 }) } },
      ],
    });
    service = TestBed.inject(SyncService);
  });

  afterEach(() => vi.useRealTimers());

  it('does nothing while the device is offline', async () => {
    online.set(false);
    await service.syncNow();
    expect(push).not.toHaveBeenCalled();
  });

  it('pushes, uploads, pulls and records the sync time when online', async () => {
    await service.syncNow();
    expect(push).toHaveBeenCalled();
    expect(uploadDue).toHaveBeenCalled();
    expect(pull).toHaveBeenCalled();
    expect(service.lastSyncAt()).not.toBeNull();
    expect(service.lastError()).toBeNull();
  });

  it('exposes the push error and keeps the last sync time empty when items fail', async () => {
    push.mockResolvedValue({ sent: 0, failed: 1, lastError: 'invalid' });
    await service.syncNow();
    expect(service.lastError()).toBe('invalid');
    expect(service.lastSyncAt()).toBeNull();
  });

  it('clears a previous push error once a later cycle sends everything', async () => {
    push.mockResolvedValue({ sent: 0, failed: 1, lastError: 'invalid' });
    await service.syncNow();
    push.mockResolvedValue({ sent: 1, failed: 0 });
    await service.syncNow();
    expect(service.lastError()).toBeNull();
  });

  it('reports upload failures even when the push succeeded', async () => {
    uploadDue.mockResolvedValue(2);
    await service.syncNow();
    expect(service.lastError()).toBe('upload_failed');
  });

  it('names the phase that threw', async () => {
    pull.mockRejectedValue(new Error('down'));
    await service.syncNow();
    expect(service.lastError()).toBe('pull_failed');
  });

  it('retries after the backoff delay once a cycle failed', async () => {
    push.mockResolvedValue({ sent: 0, failed: 1, lastError: 'network' });
    service.start();
    await vi.advanceTimersByTimeAsync(0);
    push.mockClear();
    await vi.advanceTimersByTimeAsync(TestBed.inject(SyncPolicy).backoff.baseMs);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('reports the pending count from the outbox', async () => {
    await TestBed.inject(OutboxService).enqueue({
      entityType: 'task', clientId: 't1', operation: 'upsert', clientTimestamp: 'x', payload: {},
    });
    push.mockResolvedValue({ sent: 0, failed: 0 });
    await service.syncNow();
    expect(service.pendingCount()).toBe(1);
  });

  it('keeps the cycle successful when the catalogue refresh fails', async () => {
    refresh.mockRejectedValue(new Error('down'));
    await service.syncNow();
    expect(service.lastError()).toBeNull();
  });
});
