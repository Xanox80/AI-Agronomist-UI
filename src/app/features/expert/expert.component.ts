import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ExpertCaseDto, ExpertCaseStatus } from '../../core/api/models';
import { EXPERT_CONFIG } from './expert.config';
import { ExpertService } from './expert.service';

const STATUS_FILTERS = ['open', 'in_review', 'resolved'] as const;

/** Disputed-case queue: priority first, with a reason badge per case. */
@Component({
  selector: 'app-expert',
  imports: [RouterLink, TranslatePipe, ButtonModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .case {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding: 1rem; min-height: var(--ap-touch-min);
      margin-top: 0.75rem; background: var(--ap-surface); border: 1px solid var(--ap-border);
      border-radius: var(--ap-radius); color: var(--ap-text); text-decoration: none;
    }
    .case .spacer { flex: 1; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .meta { color: var(--ap-text-sec); font-size: 0.875rem; }
    .state { color: var(--ap-text-sec); margin-top: 1rem; }
    .state.error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <div class="scout-page-header">
        <h1>{{ 'expert.title' | translate }}</h1>
      </div>
      <div class="filters">
        @for (f of filters; track f) {
          <p-button [label]="'expert.status.' + f | translate" [severity]="f === status() ? 'primary' : 'secondary'"
            (onClick)="setStatus(f)" />
        }
      </div>
      @if (loading()) {
        <p class="state">{{ 'common.loading' | translate }}</p>
      } @else if (failed()) {
        <p class="state error">{{ 'common.error' | translate }}
          <p-button severity="secondary" [label]="'common.retry' | translate" (onClick)="load()" />
        </p>
      } @else if (cases().length === 0) {
        <p class="state">{{ 'expert.queue.empty' | translate }}</p>
      }
      @for (c of cases(); track c.id) {
        <a class="case" [routerLink]="['/expert', c.id]">
          <p-tag [severity]="severity(c)" [value]="'expert.reason.' + c.reason | translate" />
          <strong>{{ topName(c) }}</strong>
          <span class="spacer"></span>
          <span class="meta">{{ 'expert.queue.priority' | translate }}: {{ c.priority }}</span>
          <span class="meta">{{ c.createdAt.slice(0, dateChars) }}</span>
        </a>
      }
    </section>
  `,
})
export class ExpertComponent implements OnInit {
  private readonly service = inject(ExpertService);

  protected readonly dateChars = EXPERT_CONFIG.isoDateChars;
  private readonly translate = inject(TranslateService);
  protected readonly filters = STATUS_FILTERS;
  protected readonly status = signal<ExpertCaseStatus>('open');
  protected readonly cases = signal<ExpertCaseDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  ngOnInit(): Promise<void> {
    return this.load();
  }

  protected setStatus(status: ExpertCaseStatus): Promise<void> {
    this.status.set(status);
    return this.load();
  }

  protected severity(c: ExpertCaseDto): 'warn' | 'danger' | 'info' {
    return EXPERT_CONFIG.reasonSeverity[c.reason];
  }

  protected topName(c: ExpertCaseDto): string {
    const top = c.diagnosis.hypotheses[0];
    if (!top) return '';
    return (this.translate.currentLang === 'en' ? top.nameEn : top.nameUk) || top.diagnosisCode;
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      this.cases.set(await this.service.queue(this.status()));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
