import { TestBed } from '@angular/core/testing';
import { TaskDto } from '../../core/api/models';
import { TaskDraftsStore } from './task-drafts.store';
import { TASKS_CONFIG } from './tasks.config';

const draft = (clientId: string): TaskDto => ({
  id: clientId, clientId, type: 'treatment', fieldId: 'f1', fieldName: 'North', photoUrls: [], priority: 'normal',
  status: 'open', title: 'Spray', notes: '', createdAt: '2026-11-10T00:00:00Z',
});

describe('TaskDraftsStore', () => {
  beforeEach(() => localStorage.removeItem(TASKS_CONFIG.draftsStorageKey));

  it('persists drafts and restores them in a new instance', () => {
    TestBed.inject(TaskDraftsStore).upsert(draft('a'));
    TestBed.resetTestingModule();
    expect(TestBed.inject(TaskDraftsStore).drafts().map((d) => d.clientId)).toEqual(['a']);
  });

  it('replaces a draft with the same client id', () => {
    const store = TestBed.inject(TaskDraftsStore);
    store.upsert(draft('a'));
    store.upsert({ ...draft('a'), title: 'Changed' });
    expect(store.drafts()).toHaveLength(1);
    expect(store.find('a')?.title).toBe('Changed');
  });

  it('removes confirmed drafts', () => {
    const store = TestBed.inject(TaskDraftsStore);
    store.upsert(draft('a'));
    store.upsert(draft('b'));
    store.remove(['a']);
    expect(store.drafts().map((d) => d.clientId)).toEqual(['b']);
  });

  it('starts empty when stored data is corrupt', () => {
    localStorage.setItem(TASKS_CONFIG.draftsStorageKey, '{oops');
    expect(TestBed.inject(TaskDraftsStore).drafts()).toEqual([]);
  });
});
