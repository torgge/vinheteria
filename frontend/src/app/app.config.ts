import { APP_INITIALIZER, ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTransloco } from '@jsverse/transloco';
import { PrimeNGConfig } from 'primeng/api';

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
    provideHttpClient(),

    // Animations (required for PrimeNG)
    provideAnimationsAsync(),

    // PrimeNG with M3 ripple enabled
    {
      provide: APP_INITIALIZER,
      useFactory: (config: PrimeNGConfig) => () => {
        config.ripple = true;
      },
      deps: [PrimeNGConfig],
      multi: true,
    },

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
