import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecommendationApi } from '../../core/api/recommendation.api';
import { AutoApproveSettingDto, ProblemCategory } from '../../core/api/models';
import { SETTINGS_CONFIG } from './settings.config';

/** FR-19: per-category auto-approve rules; only the chief agronomist may write them. */
@Injectable({ providedIn: 'root' })
export class AutoApproveService {
  private readonly api = inject(RecommendationApi);
  private readonly rules = signal<readonly AutoApproveSettingDto[]>([]);

  readonly categories = SETTINGS_CONFIG.autoApproveCategories;
  readonly enabledCategories = signal<ReadonlySet<ProblemCategory | undefined>>(new Set());
  readonly saveFailed = signal(false);

  async load(): Promise<void> {
    this.rules.set(await firstValueFrom(this.api.autoApproveSettings()));
    this.enabledCategories.set(this.enabledIn(this.rules()));
  }

  /** The switch moves at once and is rolled back when the save fails. */
  async setEnabled(category: ProblemCategory, enabled: boolean): Promise<void> {
    const previous = this.enabledCategories();
    this.saveFailed.set(false);
    this.enabledCategories.set(this.withCategory(previous, category, enabled));
    try {
      const saved = await firstValueFrom(
        this.api.saveAutoApproveSetting({ problemCategory: category, minConfidence: this.minConfidenceFor(category), enabled }),
      );
      this.rules.update((rules) => [...rules.filter((r) => r.id !== saved.id), saved]);
    } catch {
      this.enabledCategories.set(previous);
      this.saveFailed.set(true);
    }
  }

  private enabledIn(rules: readonly AutoApproveSettingDto[]): ReadonlySet<ProblemCategory | undefined> {
    return new Set(rules.filter((r) => r.enabled && r.problemCategory).map((r) => r.problemCategory));
  }

  private withCategory(set: ReadonlySet<ProblemCategory | undefined>, category: ProblemCategory, on: boolean) {
    const next = new Set(set);
    if (on) next.add(category);
    else next.delete(category);
    return next;
  }

  private minConfidenceFor(category: ProblemCategory): number {
    return this.rules().find((r) => r.problemCategory === category && !r.diagnosisId)?.minConfidence
      ?? SETTINGS_CONFIG.autoApproveMinConfidence;
  }
}
