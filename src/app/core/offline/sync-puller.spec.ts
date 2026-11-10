import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncApi } from '../api/sync.api';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { OfflineDb } from './offline-db';
import { OfflineMeta } from './offline-meta.service';
import { PulledStore } from './pulled-store.service';
import { SyncPuller } from './sync-puller';

const empty = { fields: [], tasks: [], observations: [], recommendations: [], diagnoses: [], treatments: [] };

describe('SyncPuller', () => {
  const pull = vi.fn();
  let puller: SyncPuller;
  let pulled: PulledStore;
  let meta: OfflineMeta;

  beforeEach(() => {
    pull.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: OfflineDb, useValue: new FakeOfflineDb() }, { provide: SyncApi, useValue: { pull } }],
    });
    puller = TestBed.inject(SyncPuller);
    pulled = TestBed.inject(PulledStore);
    meta = TestBed.inject(OfflineMeta);
  });

  it('stores the refined diagnosis under its result id and remembers the server time', async () => {
    pull.mockReturnValue(of({
      serverTime: 't1', deleted: {},
      changes: { ...empty, diagnoses: [{ id: 'd1', observationId: 'o1', pass: 'server_refined' }] },
    }));
    await puller.pull('dev');
    expect(await pulled.get('diagnoses', 'd1')).toMatchObject({ pass: 'server_refined' });
    expect(await meta.lastPullAt()).toBe('t1');
  });

  it('asks only for changes since the previous pull', async () => {
    await meta.setLastPullAt('t0');
    pull.mockReturnValue(of({ serverTime: 't1', changes: empty, deleted: {} }));
    await puller.pull('dev');
    expect(pull).toHaveBeenCalledWith('dev', 't0', undefined);
  });

  it('removes entities the server deleted, including diagnoses by result id', async () => {
    await pulled.put('tasks', 't1', { id: 't1' });
    await pulled.put('diagnoses', 'd1', { id: 'd1' });
    pull.mockReturnValue(of({ serverTime: 't2', changes: empty, deleted: { tasks: ['t1'], diagnoses: ['d1'] } }));
    await puller.pull('dev');
    expect(await pulled.get('tasks', 't1')).toBeUndefined();
    expect(await pulled.get('diagnoses', 'd1')).toBeUndefined();
  });

  it('follows nextCursor until the last page and stores the final server time once', async () => {
    pull
      .mockReturnValueOnce(of({ serverTime: 't1', changes: { ...empty, tasks: [{ id: 'a' }] }, deleted: {}, nextCursor: 'c1' }))
      .mockReturnValueOnce(of({ serverTime: 't1', changes: { ...empty, tasks: [{ id: 'b' }] }, deleted: {} }));
    await puller.pull('dev');
    expect(pull).toHaveBeenNthCalledWith(2, 'dev', undefined, 'c1');
    expect(await pulled.get('tasks', 'b')).toEqual({ id: 'b' });
    expect(await meta.lastPullAt()).toBe('t1');
  });
});
