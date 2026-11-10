import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DisplayPreferences } from './display-preferences.service';

/** Language switcher and sun-mode toggle, shared by the login page and the shell header. */
@Component({
  selector: 'app-display-controls',
  imports: [TranslatePipe, ButtonModule],
  template: `
    <div class="controls" role="group" [attr.aria-label]="'shell.displayControls' | translate">
      @for (locale of prefs.locales; track locale) {
        <p-button
          [label]="locale.toUpperCase()"
          size="small"
          [outlined]="prefs.locale() !== locale"
          [attr.aria-pressed]="prefs.locale() === locale"
          (onClick)="prefs.setLocale(locale)"
        />
      }
      <p-button
        icon="pi pi-sun"
        size="small"
        [outlined]="!prefs.sunMode()"
        [attr.aria-pressed]="prefs.sunMode()"
        [ariaLabel]="'shell.sunMode' | translate"
        (onClick)="prefs.toggleSunMode()"
      />
    </div>
  `,
  styles: `
    .controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayControlsComponent {
  protected readonly prefs = inject(DisplayPreferences);
}
