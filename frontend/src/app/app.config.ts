import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone change detection with event coalescing for performance
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router with component input binding and view transitions
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),

    // HTTP client
    provideHttpClient(
      withInterceptors([])
    ),

    // Animations (required for PrimeNG)
    provideAnimationsAsync(),

    // Transloco i18n
    provideTransloco({
      config: {
        availableLangs: [
          { id: 'pt-BR', label: 'Português (Brasil)' },
          { id: 'es-PY', label: 'Español (Paraguay)' },
          { id: 'en-US', label: 'English (USA)' }
        ],
        defaultLang: 'pt-BR',
        fallbackLang: 'en-US',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: true,
          useFallbackTranslation: true
        }
      },
      loader: TranslocoHttpLoader
    })
  ]
};
