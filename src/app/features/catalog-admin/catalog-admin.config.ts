import { InjectionToken } from '@angular/core';
import { ProposalEntityType } from '../../core/api/models';

export type DirectoryId = 'diagnoses' | 'thresholds' | 'products';

export const CATALOG_ADMIN_CONFIG = {
  directories: ['diagnoses', 'thresholds', 'products'] as readonly DirectoryId[],
  proposalEntityType: {
    diagnoses: 'diagnosis',
    thresholds: 'threshold',
    products: 'product',
  } as Record<DirectoryId, ProposalEntityType>,
  proposalOperations: ['create', 'update', 'delete'] as const,
  queuePageSize: 50,
  millisPerDay: 86_400_000,
  payloadRows: 6,
} as const;

/** Injected so staleness checks are testable with a fixed time. */
export const CATALOG_ADMIN_NOW = new InjectionToken<() => Date>('CATALOG_ADMIN_NOW', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
