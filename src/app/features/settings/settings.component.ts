import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AuthSession } from '../../core/auth/auth-session.service';
import { DisplayControlsComponent } from '../shell/display-controls.component';
import { AutoApprovePanelComponent } from './auto-approve-panel.component';
import { PrivacyService } from './privacy.service';
import { RegionPanelComponent } from './region-panel.component';

@Component({
  selector: 'app-settings',
  imports: [
    TranslatePipe, FormsModule, RouterLink, ToggleSwitchModule, DisplayControlsComponent,
    AutoApprovePanelComponent, RegionPanelComponent,
  ],
  template: `
    <section class="scout-page">
      <h1>{{ 'settings.title' | translate }}</h1>
      <section class="panel">
        <h2>{{ 'settings.display.title' | translate }}</h2>
        <app-display-controls />
      </section>
      <section class="panel">
        <h2>{{ 'settings.privacy.title' | translate }}</h2>
        <label class="row">
          <span>{{ 'settings.privacy.geo' | translate }}</span>
          <p-toggleswitch
            [ngModel]="privacy.geoCollectionEnabled()"
            (onChange)="privacy.setGeoCollection($event.checked)"
            [ariaLabel]="'settings.privacy.geo' | translate"
          />
        </label>
        <p class="hint">{{ 'settings.privacy.geoHint' | translate }}</p>
        @if (privacy.saveFailed()) {
          <p class="error" role="alert">{{ 'settings.saveFailed' | translate }}</p>
        }
      </section>
      <app-region-panel />
      @if (isChief()) {
        <app-auto-approve-panel />
      }
      <section class="panel">
        <a class="row" routerLink="stock">{{ 'settings.stock.link' | translate }}</a>
      </section>
    </section>
  `,
  styleUrl: './settings-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  protected readonly privacy = inject(PrivacyService);
  private readonly session = inject(AuthSession);

  protected readonly isChief = computed(() => this.session.role() === 'chief_agronomist');

  ngOnInit(): void {
    void this.privacy.load();
  }
}
