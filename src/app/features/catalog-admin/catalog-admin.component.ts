import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DirectoryId } from './catalog-admin.config';
import { CatalogAdminService } from './catalog-admin.service';
import { ProposalFormComponent } from './proposal-form.component';
import { ProposalQueueComponent } from './proposal-queue.component';

@Component({
  selector: 'app-catalog-admin',
  imports: [
    TranslatePipe, DatePipe, ButtonModule, MessageModule, TableModule, TagModule,
    ProposalFormComponent, ProposalQueueComponent,
  ],
  template: `
    <section class="scout-page">
      <h1>{{ 'catalogAdmin.title' | translate }}</h1>
      @if (service.status(); as status) {
        @if (status.stale) {
          <p-message severity="warn">
            {{ 'catalogAdmin.stale' | translate: { days: status.daysSinceVerified } }}
          </p-message>
        }
        @if (status.containsDemoData) {
          <p-message severity="info">{{ 'catalogAdmin.demo' | translate }}</p-message>
        }
        <p class="hint">{{ 'catalogAdmin.version' | translate: { version: status.version } }}</p>
        <p-button icon="pi pi-verified" [label]="'catalogAdmin.verify' | translate" [outlined]="true"
          (onClick)="service.verify()" />
      }
      <div class="actions tabs" role="group">
        @for (directory of service.directories; track directory) {
          <p-button [label]="'catalogAdmin.directory.' + directory | translate"
            [outlined]="service.directory() !== directory" (onClick)="open(directory)" />
        }
      </div>
      <p-table [value]="service.rows()" [scrollable]="true">
        <ng-template #header>
          <tr>
            <th>{{ 'catalogAdmin.col.name' | translate }}</th>
            <th>{{ 'catalogAdmin.col.detail' | translate }}</th>
            <th>{{ 'catalogAdmin.col.source' | translate }}</th>
            <th>{{ 'catalogAdmin.col.verified' | translate }}</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template #body let-row>
          <tr>
            <td>{{ row.title }}</td>
            <td>{{ row.detail }}</td>
            <td>
              {{ row.source }}
              @if (row.isDemo) {
                <p-tag severity="info" [value]="'catalogAdmin.demoTag' | translate" />
              }
            </td>
            <td>
              {{ row.verifiedAt | date: 'mediumDate' }}
              @if (service.isRowStale(row)) {
                <p-tag severity="warn" [value]="'catalogAdmin.staleTag' | translate" />
              }
            </td>
            <td>
              <p-button icon="pi pi-pencil" [text]="true" [ariaLabel]="'catalogAdmin.propose.title' | translate"
                (onClick)="startProposal(row.id)" />
            </td>
          </tr>
        </ng-template>
      </p-table>
      <div class="actions">
        <p-button icon="pi pi-plus" [label]="'catalogAdmin.propose.new' | translate" (onClick)="startProposal(undefined)" />
      </div>
      @if (proposing()) {
        <app-proposal-form [entityId]="proposalEntityId()" (closed)="proposing.set(false)" />
      }
      <app-proposal-queue />
    </section>
  `,
  styleUrl: './catalog-admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogAdminComponent implements OnInit {
  protected readonly service = inject(CatalogAdminService);
  protected readonly proposing = signal(false);
  protected readonly proposalEntityId = signal<string | undefined>(undefined);

  ngOnInit(): void {
    void this.service.loadStatus();
    void this.service.openDirectory(this.service.directory());
  }

  protected open(directory: DirectoryId): void {
    void this.service.openDirectory(directory);
  }

  protected startProposal(entityId: string | undefined): void {
    this.proposalEntityId.set(entityId);
    this.proposing.set(true);
  }
}
