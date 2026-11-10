import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SyncApi } from '../api/sync.api';
import { DiagnosisResultDto, SyncPullResponse } from '../api/models';
import { OfflineMeta } from './offline-meta.service';
import { RefinementNotifier } from './refinement-notifier';
import { PulledEntityType, PulledStore } from './pulled-store.service';

type Identified = { id: string };

/** Pulls server changes (refined diagnoses, recommendations, field edits) into the local mirror (FR-26). */
@Injectable({ providedIn: 'root' })
export class SyncPuller {
  private readonly api = inject(SyncApi);
  private readonly meta = inject(OfflineMeta);
  private readonly pulled = inject(PulledStore);
  private readonly notifier = inject(RefinementNotifier);

  async pull(deviceId: string): Promise<void> {
    const since = await this.meta.lastPullAt();
    let cursor: string | undefined;
    let response: SyncPullResponse;
    do {
      response = await firstValueFrom(this.api.pull(deviceId, since, cursor));
      await this.store(response);
      cursor = response.nextCursor;
    } while (cursor);
    await this.meta.setLastPullAt(response.serverTime);
  }

  private async store(response: SyncPullResponse): Promise<void> {
    for (const [entityType, rows] of Object.entries(response.changes) as [PulledEntityType, Identified[]][]) {
      for (const row of rows) await this.pulled.put(entityType, row.id, row);
    }
    for (const [entityType, ids] of Object.entries(response.deleted ?? {})) {
      for (const id of ids) await this.pulled.remove(entityType as PulledEntityType, id);
    }
    const refined = (response.changes.diagnoses as DiagnosisResultDto[]).filter((d) => d.pass === 'server_refined');
    if (refined.length) this.notifier.announce(refined[refined.length - 1]);
  }
}
