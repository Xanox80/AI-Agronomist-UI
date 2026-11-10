import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ConnectivityService } from './connectivity.service';
import { SyncStatusComponent } from './sync-status.component';
import { SyncService } from './sync.service';

describe('SyncStatusComponent', () => {
  const sync = {
    pendingCount: signal(2), lastSyncAt: signal<string | null>(null), lastError: signal<string | null>(null),
    syncing: signal(false), stuckCount: signal(0), syncNow: vi.fn(),
  };
  const online = signal(true);

  function render(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [SyncStatusComponent],
      providers: [
        provideTranslateService(),
        { provide: SyncService, useValue: sync },
        { provide: ConnectivityService, useValue: { online } },
      ],
    });
    const fixture = TestBed.createComponent(SyncStatusComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('shows an error message when the sync reports one', () => {
    sync.lastError.set('network');
    expect(render().querySelectorAll('p-message').length).toBe(1);
  });

  it('shows the offline warning and the stuck-items error together', () => {
    sync.lastError.set(null);
    sync.stuckCount.set(1);
    online.set(false);
    expect(render().querySelectorAll('p-message').length).toBe(2);
  });
});
