import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { CatalogStatusDto, ProposalDto } from '../../core/api/models';
import { DisplayPreferences } from '../shell/display-preferences.service';
import { CATALOG_ADMIN_CONFIG, CATALOG_ADMIN_NOW, DirectoryId } from './catalog-admin.config';
import { DIRECTORY_SOURCES, DirectoryRow, isStale } from './directory-sources';
import { parseProposalPayload } from './proposal-payload';

export interface ProposalDraft {
  directory: DirectoryId;
  operation: ProposalDto['operation'];
  entityId?: string;
  payloadText: string;
}

/** Section 5: browse directories, propose changes, and approve or reject the pending queue. */
@Injectable({ providedIn: 'root' })
export class CatalogAdminService {
  private readonly api = inject(CatalogApi);
  private readonly prefs = inject(DisplayPreferences);
  private readonly now = inject(CATALOG_ADMIN_NOW);
  private latestOpen = 0;

  readonly directories = CATALOG_ADMIN_CONFIG.directories;
  readonly status = signal<CatalogStatusDto | null>(null);
  readonly directory = signal<DirectoryId>(CATALOG_ADMIN_CONFIG.directories[0]);
  readonly rows = signal<DirectoryRow[]>([]);
  readonly pending = signal<readonly ProposalDto[]>([]);

  async loadStatus(): Promise<void> {
    this.status.set(await firstValueFrom(this.api.status()));
  }

  async openDirectory(directory: DirectoryId): Promise<void> {
    const request = ++this.latestOpen;
    this.directory.set(directory);
    const rows = await DIRECTORY_SOURCES[directory](this.api, this.prefs.locale());
    if (request === this.latestOpen) this.rows.set(rows);
  }

  isRowStale(row: DirectoryRow): boolean {
    const status = this.status();
    return status !== null && isStale(row.verifiedAt ?? status.lastVerifiedAt, status.staleAfterDays, this.now());
  }

  async verify(note?: string): Promise<void> {
    const status = this.status();
    if (status) this.status.set(await firstValueFrom(this.api.verify({ regionCode: status.regionCode, note })));
  }

  async loadQueue(): Promise<void> {
    const page = await firstValueFrom(
      this.api.proposals({ status: 'pending', pageSize: CATALOG_ADMIN_CONFIG.queuePageSize }),
    );
    this.pending.set(page.items);
  }

  /** Returns false without calling the API when the payload is not a JSON object. */
  async propose(draft: ProposalDraft): Promise<boolean> {
    const payload = draft.operation === 'delete' ? {} : parseProposalPayload(draft.payloadText);
    if (!payload) return false;
    await firstValueFrom(
      this.api.createProposal({
        entityType: CATALOG_ADMIN_CONFIG.proposalEntityType[draft.directory],
        entityId: draft.entityId,
        operation: draft.operation,
        payload,
      }),
    );
    await this.loadQueue();
    return true;
  }

  async approve(id: string, comment?: string): Promise<void> {
    await firstValueFrom(this.api.approveProposal(id, comment));
    await this.afterReview();
  }

  async reject(id: string, comment: string): Promise<void> {
    await firstValueFrom(this.api.rejectProposal(id, comment));
    await this.afterReview();
  }

  private async afterReview(): Promise<void> {
    await Promise.all([this.loadQueue(), this.loadStatus(), this.openDirectory(this.directory())]);
  }
}
