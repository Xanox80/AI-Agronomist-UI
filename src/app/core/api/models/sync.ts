import { SyncEntityType } from './enums';

export interface SyncPushItem {
  entityType: SyncEntityType;
  clientId: string;
  operation: 'upsert' | 'delete';
  clientTimestamp: string;
  payload: unknown;
}
export interface SyncPushRequest { deviceId: string; items: SyncPushItem[] }
export interface SyncPushResult {
  clientId: string; entityType: SyncEntityType; status: 'applied' | 'conflict' | 'failed'; serverId?: string; error?: string;
}
export interface SyncPushResponse { results: SyncPushResult[]; serverTime: string }
export interface SyncPullResponse {
  serverTime: string;
  changes: Record<'fields' | 'tasks' | 'observations' | 'recommendations' | 'diagnoses' | 'treatments', unknown[]>;
  deleted: Record<string, string[]>;
  nextCursor?: string;
}
export interface SyncStatusDto {
  pendingRefinement: number; lastPushAt?: string; lastPullAt?: string; catalogVersion: number;
  backoff?: { baseMs: number; maxMs: number; factor: number }; batchSize?: number;
}
export interface HealthDto { status: 'ok'; time: string }
