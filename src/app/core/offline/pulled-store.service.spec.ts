import { TestBed } from '@angular/core/testing';
import { FakeOfflineDb } from './__fixtures__/fake-offline-db';
import { OfflineDb } from './offline-db';
import { PulledStore } from './pulled-store.service';

describe('PulledStore', () => {
  let store: PulledStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: OfflineDb, useValue: new FakeOfflineDb() }] });
    store = TestBed.inject(PulledStore);
  });

  it('keeps entities of different types apart even with equal ids', async () => {
    await store.put('tasks', '1', { n: 'task' });
    await store.put('fields', '1', { n: 'field' });
    expect(await store.get('tasks', '1')).toEqual({ n: 'task' });
    expect(await store.get('fields', '1')).toEqual({ n: 'field' });
  });

  it('forgets a removed entity', async () => {
    await store.put('tasks', '1', {});
    await store.remove('tasks', '1');
    expect(await store.get('tasks', '1')).toBeUndefined();
  });
});
