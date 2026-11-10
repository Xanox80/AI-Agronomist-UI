import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ConnectivityService } from './connectivity.service';
import { SyncService } from './sync.service';

/** Shows the outbox size, last sync time and errors, with a manual sync button. */
@Component({
  selector: 'ap-sync-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, MessageModule, DatePipe, TranslatePipe],
  styles: `
    :host { display: block; }
    .ap-sync-status { display: flex; flex-direction: column; gap: var(--ap-sync-status-gap, 0.5rem); }
    .ap-sync-status__action { min-height: var(--ap-touch-min); }
  `,
  template: `
    <section class="ap-sync-status">
      @if (!connectivity.online()) {
        <p-message severity="warn" [text]="'offline.status.offline' | translate" />
      }
      @if (sync.stuckCount() > 0) {
        <p-message severity="error" [text]="'offline.status.error' | translate: { code: 'items_stuck' }" />
      }
      @if (sync.lastError(); as code) {
        <p-message severity="error" [text]="'offline.status.error' | translate: { code }" />
      }
      <p>
        {{ sync.pendingCount() > 0
          ? ('offline.status.pending' | translate: { count: sync.pendingCount() })
          : ('offline.status.allSent' | translate) }}
      </p>
      <p>
        @if (sync.lastSyncAt(); as time) {
          {{ 'offline.status.lastSync' | translate: { time: (time | date: lastSyncFormat) } }}
        } @else {
          {{ 'offline.status.never' | translate }}
        }
      </p>
      <p-button
        class="ap-sync-status__action"
        icon="pi pi-sync"
        [label]="(sync.syncing() ? 'offline.status.syncing' : 'offline.status.syncNow') | translate"
        [disabled]="sync.syncing() || !connectivity.online()"
        (onClick)="sync.syncNow()"
      />
    </section>
  `,
})
export class SyncStatusComponent {
  protected readonly lastSyncFormat = 'short';
  protected readonly sync = inject(SyncService);
  protected readonly connectivity = inject(ConnectivityService);
}
