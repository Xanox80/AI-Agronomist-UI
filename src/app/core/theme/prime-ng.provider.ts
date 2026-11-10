import { EnvironmentProviders } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import { scoutTheme } from './prime-ng.theme';

export const primeNgProvider: EnvironmentProviders = providePrimeNG({
  ripple: true,
  theme: {
    preset: scoutTheme,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark-mode',
    },
  },
});
