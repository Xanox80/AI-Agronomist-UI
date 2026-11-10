import { registerLocaleData } from '@angular/common';
import localeUk from '@angular/common/locales/uk';
import { ApplicationConfig, isDevMode, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { FeatureTranslateLoader } from './core/i18n/feature-translate-loader';
import { I18N_ASSETS_PREFIX, I18N_FEATURES } from './core/i18n/i18n-features';
import { provideOfflineSync } from './core/offline/offline-sync.provider';
import { primeNgProvider } from './core/theme/prime-ng.provider';
import { readStored } from './features/shell/safe-storage';

registerLocaleData(localeUk);

const SERVICE_WORKER_REGISTRATION_STRATEGY = 'registerWhenStable:30000';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    primeNgProvider,
    provideOfflineSync(),
    MessageService,
    ConfirmationService,
    provideTranslateService({
      defaultLanguage: environment.defaultLocale,
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new FeatureTranslateLoader(http, I18N_ASSETS_PREFIX, I18N_FEATURES),
        deps: [HttpClient],
      },
    }),
    { provide: LOCALE_ID, useFactory: () => (readStored(environment.localeStorageKey) === 'en' ? 'en' : 'uk') },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: SERVICE_WORKER_REGISTRATION_STRATEGY,
    }),
  ],
};
