import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { SyncService } from './sync.service';

/** Starts the online-event listener and the periodic sync when the app boots (FR-24). */
export function provideOfflineSync(): EnvironmentProviders {
  return provideAppInitializer(() => inject(SyncService).start());
}
