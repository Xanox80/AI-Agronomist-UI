import { Injectable, signal } from '@angular/core';
import { TaskDto } from '../../core/api/models';
import { readStored, writeStored } from '../shell/safe-storage';
import { TASKS_CONFIG } from './tasks.config';

/** Tasks created offline, kept on the device until the server confirms them. */
@Injectable({ providedIn: 'root' })
export class TaskDraftsStore {
  readonly drafts = signal<readonly TaskDto[]>(this.read());

  upsert(draft: TaskDto): void {
    this.replaceAll([...this.drafts().filter((d) => d.clientId !== draft.clientId), draft]);
  }

  remove(clientIds: readonly string[]): void {
    if (clientIds.length === 0) return;
    this.replaceAll(this.drafts().filter((d) => !clientIds.includes(d.clientId)));
  }

  find(id: string): TaskDto | undefined {
    return this.drafts().find((d) => d.id === id || d.clientId === id);
  }

  private replaceAll(next: readonly TaskDto[]): void {
    this.drafts.set(next);
    writeStored(TASKS_CONFIG.draftsStorageKey, JSON.stringify(next));
  }

  private read(): readonly TaskDto[] {
    const raw = readStored(TASKS_CONFIG.draftsStorageKey);
    try {
      return raw ? (JSON.parse(raw) as TaskDto[]) : [];
    } catch {
      return [];
    }
  }
}
