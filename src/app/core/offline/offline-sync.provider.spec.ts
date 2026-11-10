import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideOfflineSync } from './offline-sync.provider';
import { SyncService } from './sync.service';

describe('provideOfflineSync', () => {
  it('starts the sync service when the app initialises', async () => {
    const start = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: SyncService, useValue: { start } }, provideOfflineSync()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    expect(start).toHaveBeenCalledTimes(1);
  });
});
