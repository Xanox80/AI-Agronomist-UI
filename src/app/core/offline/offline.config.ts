import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface BackoffPolicy { baseMs: number; maxMs: number; factor: number }

export const OFFLINE_STORES = {
  outbox: 'outbox',
  uploads: 'uploads',
  catalog: 'catalog',
  referenceImages: 'referenceImages',
  pulled: 'pulled',
  meta: 'meta',
} as const;

export type OfflineStoreName = (typeof OFFLINE_STORES)[keyof typeof OFFLINE_STORES];

export interface OfflineConfig {
  dbName: string;
  dbVersion: number;
  pollIntervalMs: number;
  backoff: BackoffPolicy;
  /** Used until the server advertises its own batch size via /sync/status. */
  batchSize: number;
  catalogRegion: string;
  /** Remembers the farm's pack region so offline reads use the same pack the background refresh stored. */
  catalogRegionStorageKey: string;
  /** Items that fail this many times stop retrying and stay queued as stuck. */
  maxAttempts: number;
}

// shortcut: belongs in environment.sync (shared file); move there when it is editable
const OFFLINE_DEFAULTS = {
  dbName: 'ap-scout-offline',
  dbVersion: 1,
  batchSize: 25,
  catalogRegion: 'UA-DEFAULT',
  catalogRegionStorageKey: 'ap-scout.catalog-region',
  maxAttempts: 10,
};

export const OFFLINE_CONFIG = new InjectionToken<OfflineConfig>('OFFLINE_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    ...OFFLINE_DEFAULTS,
    pollIntervalMs: environment.sync.pollIntervalMs,
    backoff: environment.sync.backoff,
  }),
});
