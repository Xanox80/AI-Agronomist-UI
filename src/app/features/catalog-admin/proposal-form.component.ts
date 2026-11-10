import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ProposalDto } from '../../core/api/models';
import { CATALOG_ADMIN_CONFIG } from './catalog-admin.config';
import { CatalogAdminService } from './catalog-admin.service';

@Component({
  selector: 'app-proposal-form',
  imports: [TranslatePipe, FormsModule, ButtonModule, SelectModule, TextareaModule],
  template: `
    <section class="panel">
      <h2>{{ 'catalogAdmin.propose.title' | translate }}</h2>
      <p class="hint">
        {{ entityId() ? ('catalogAdmin.propose.forRow' | translate) : ('catalogAdmin.propose.forNew' | translate) }}
      </p>
      @if (entityId()) {
        <p-select [options]="operations" [(ngModel)]="operation" [ariaLabel]="'catalogAdmin.propose.operation' | translate" />
      }
      @if (!entityId() || operation() !== 'delete') {
        <textarea pTextarea [rows]="payloadRows" [(ngModel)]="payloadText"
          [attr.aria-label]="'catalogAdmin.propose.payload' | translate"></textarea>
      }
      @if (invalid()) {
        <p class="error">{{ 'catalogAdmin.propose.invalidPayload' | translate }}</p>
      }
      <div class="actions">
        <p-button [label]="'catalogAdmin.propose.submit' | translate" (onClick)="submit()" />
        <p-button [label]="'common.cancel' | translate" [outlined]="true" (onClick)="closed.emit()" />
      </div>
    </section>
  `,
  styleUrl: './catalog-admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalFormComponent {
  private readonly service = inject(CatalogAdminService);

  readonly entityId = input<string>();
  readonly closed = output<void>();

  protected readonly payloadRows = CATALOG_ADMIN_CONFIG.payloadRows;
  protected readonly operations = [...CATALOG_ADMIN_CONFIG.proposalOperations];
  protected readonly operation = signal<ProposalDto['operation']>('update');
  protected readonly payloadText = signal('');
  protected readonly invalid = signal(false);

  protected async submit(): Promise<void> {
    const sent = await this.service.propose({
      directory: this.service.directory(),
      operation: this.entityId() ? this.operation() : 'create',
      entityId: this.entityId(),
      payloadText: this.payloadText(),
    });
    this.invalid.set(!sent);
    if (sent) this.closed.emit();
  }
}
