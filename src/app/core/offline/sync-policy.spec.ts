import { TestBed } from '@angular/core/testing';
import { SyncStatusDto } from '../api/models';
import { SyncPolicy } from './sync-policy';

const status = (patch: Partial<SyncStatusDto>): SyncStatusDto => ({ pendingRefinement: 0, catalogVersion: 1, ...patch });

describe('SyncPolicy', () => {
  let policy: SyncPolicy;

  beforeEach(() => { policy = TestBed.inject(SyncPolicy); });

  it('adopts a valid server-advertised batch size and backoff', () => {
    policy.apply(status({ batchSize: 5, backoff: { baseMs: 100, maxMs: 1000, factor: 3 } }));
    expect(policy.batchSize).toBe(5);
    expect(policy.backoff).toEqual({ baseMs: 100, maxMs: 1000, factor: 3 });
  });

  it('ignores a zero or fractional batch size', () => {
    const before = policy.batchSize;
    policy.apply(status({ batchSize: 0 }));
    policy.apply(status({ batchSize: 2.5 }));
    expect(policy.batchSize).toBe(before);
  });

  it('ignores non-positive, NaN or inverted backoff values', () => {
    const before = policy.backoff;
    policy.apply(status({ backoff: { baseMs: 0, maxMs: 1000, factor: 2 } }));
    policy.apply(status({ backoff: { baseMs: NaN, maxMs: 1000, factor: 2 } }));
    policy.apply(status({ backoff: { baseMs: 500, maxMs: 100, factor: 2 } }));
    expect(policy.backoff).toBe(before);
  });
});
