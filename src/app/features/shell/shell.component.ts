import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../auth/auth.service';
import { DisplayControlsComponent } from './display-controls.component';
import { OnlineStatusService } from './online-status.service';
import { ShellNavService } from './shell-nav.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, ButtonModule, DisplayControlsComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly navItems = inject(ShellNavService).items;
  protected readonly online = inject(OnlineStatusService).online;
  protected readonly sidebarCollapsed = signal(false);

  constructor() {
    if (!this.auth.user()) {
      this.auth.loadProfile().subscribe({ error: () => undefined });
    }
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
}
