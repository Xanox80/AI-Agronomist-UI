import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CatalogAdminService } from './catalog-admin.service';

@Component({
  selector: 'app-proposal-queue',
  imports: [TranslatePipe, JsonPipe, ButtonModule, InputTextModule],
  template: `
    <section class="panel">
      <h2>{{ 'catalogAdmin.queue.title' | translate }}</h2>
      @for (proposal of service.pending(); track proposal.id) {
        <article class="proposal">
          <strong>{{ 'catalogAdmin.entity.' + proposal.entityType | translate }}</strong>
          <span>{{ 'catalogAdmin.operation.' + proposal.operation | translate }}</span>
          <pre>{{ proposal.payload | json }}</pre>
          <input pInputText #comment [placeholder]="'catalogAdmin.queue.comment' | translate" />
          @if (missingCommentId() === proposal.id) {
            <p class="error" role="alert">{{ 'catalogAdmin.queue.commentRequired' | translate }}</p>
          }
          <div class="actions">
            <p-button icon="pi pi-check" [label]="'catalogAdmin.queue.approve' | translate"
              (onClick)="approve(proposal.id, comment.value)" />
            <p-button icon="pi pi-times" severity="danger" [outlined]="true"
              [label]="'catalogAdmin.queue.reject' | translate" (onClick)="reject(proposal.id, comment.value)" />
          </div>
        </article>
      } @empty {
        <p class="hint">{{ 'catalogAdmin.queue.empty' | translate }}</p>
      }
    </section>
  `,
  styleUrl: './catalog-admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalQueueComponent implements OnInit {
  protected readonly service = inject(CatalogAdminService);

  ngOnInit(): void {
    void this.service.loadQueue();
  }

  protected readonly missingCommentId = signal<string | null>(null);

  protected approve(id: string, comment: string): void {
    void this.service.approve(id, comment.trim() || undefined);
  }

  protected reject(id: string, comment: string): void {
    const trimmed = comment.trim();
    this.missingCommentId.set(trimmed ? null : id);
    if (trimmed) void this.service.reject(id, trimmed);
  }
}
