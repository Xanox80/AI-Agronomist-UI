import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DisplayPreferences } from './display-preferences.service';

/**
 * Language switcher and sun-mode toggle, shared by the login page, settings and the shell header.
 * With the host class `display-controls--compact` the language buttons hide on phones (settings keeps them).
 */
@Component({
  selector: 'app-display-controls',
  imports: [TranslatePipe, ButtonModule],
  template: `
    <div class="controls" role="group" [attr.aria-label]="'shell.displayControls' | translate">
      @for (locale of prefs.locales; track locale) {
        <p-button
          class="controls__locale"
          [label]="locale.toUpperCase()"
          size="small"
          [outlined]="prefs.locale() !== locale"
          [pt]="{ root: { 'aria-pressed': prefs.locale() === locale } }"
          (onClick)="prefs.setLocale(locale)"
        />
      }
      <p-button
        class="controls__sun"
        icon="pi pi-sun"
        size="small"
        [outlined]="!prefs.sunMode()"
        [pt]="{ root: { 'aria-pressed': prefs.sunMode() } }"
        [ariaLabel]="'shell.sunMode' | translate"
        (onClick)="prefs.toggleSunMode()"
      />
    </div>
  `,
  styleUrl: './display-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayControlsComponent {
  protected readonly prefs = inject(DisplayPreferences);
}
