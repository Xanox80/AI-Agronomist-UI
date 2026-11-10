import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { readStored, writeStored } from './safe-storage';
import { SUN_MODE_STORAGE_KEY, SUN_THEME_NAME } from './shell.config';


/** Language and high-contrast "sun mode"; both survive a reload and apply to the whole document. */
@Injectable({ providedIn: 'root' })
export class DisplayPreferences {
  private readonly translate = inject(TranslateService);

  readonly locales: readonly string[] = environment.supportedLocales;
  readonly locale = signal(this.initialLocale());
  readonly sunMode = signal(readStored(SUN_MODE_STORAGE_KEY) === 'true');

  constructor() {
    this.translate.use(this.locale());
    this.applyLocale();
    this.applyTheme();
  }

  setLocale(locale: string): void {
    if (!this.locales.includes(locale)) {
      return;
    }
    this.locale.set(locale);
    writeStored(environment.localeStorageKey, locale);
    this.translate.use(locale);
    this.applyLocale();
  }

  toggleSunMode(): void {
    this.sunMode.update((on) => !on);
    writeStored(SUN_MODE_STORAGE_KEY, String(this.sunMode()));
    this.applyTheme();
  }

  private initialLocale(): string {
    const stored = readStored(environment.localeStorageKey);
    return stored && this.locales.includes(stored) ? stored : environment.defaultLocale;
  }

  private applyLocale(): void {
    document.documentElement.lang = this.locale();
  }

  private applyTheme(): void {
    if (this.sunMode()) {
      document.documentElement.dataset['theme'] = SUN_THEME_NAME;
    } else {
      delete document.documentElement.dataset['theme'];
    }
  }
}
