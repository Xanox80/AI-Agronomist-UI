import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { AuthSession } from '../../core/auth/auth-session.service';
import { RegionPackService } from './region-pack.service';

@Component({
  selector: 'app-region-panel',
  imports: [TranslatePipe, FormsModule, ButtonModule, SelectModule, TagModule],
  template: `
    <section class="panel">
      <h2>{{ 'settings.region.title' | translate }}</h2>
      <p class="hint">{{ 'settings.region.hint' | translate }}</p>
      <div class="actions">
        <p-select
          [options]="service.regionCodes"
          [ngModel]="service.region()"
          [disabled]="!canChangeRegion()"
          (onChange)="service.selectRegion($event.value)"
          [ariaLabel]="'settings.region.title' | translate"
        />
        <p-button
          icon="pi pi-refresh"
          [label]="'settings.region.refresh' | translate"
          (onClick)="service.refresh()"
        />
      </div>
      @if (!canChangeRegion()) {
        <p class="hint">{{ 'settings.region.chiefOnly' | translate }}</p>
      }
      @if (service.failed()) {
        <p class="error" role="alert">{{ 'settings.region.failed' | translate }}</p>
      }
      @if (service.status(); as status) {
        <p>
          {{ 'settings.region.version' | translate: { version: status.version } }}
          @if (status.stale) {
            <p-tag severity="warn" [value]="'settings.region.stale' | translate: { days: status.daysSinceVerified }" />
          }
          @if (status.containsDemoData) {
            <p-tag severity="info" [value]="'settings.region.demo' | translate" />
          }
        </p>
      }
      @if (service.refreshedVersion() !== null) {
        <p>{{ 'settings.region.refreshed' | translate: { version: service.refreshedVersion() } }}</p>
      }
    </section>
  `,
  styleUrl: './settings-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegionPanelComponent implements OnInit {
  protected readonly service = inject(RegionPackService);
  private readonly session = inject(AuthSession);

  protected readonly canChangeRegion = computed(() => this.session.role() === 'chief_agronomist');

  ngOnInit(): void {
    void this.service.load();
  }
}
