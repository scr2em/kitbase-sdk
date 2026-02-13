import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideKitbaseAnalytics } from '@kitbase/analytics-angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideKitbaseAnalytics({
      token: 'pk_kitbase_kKQtGUA89MQxzUVMQOg8vT2J7lDBIsgV',
      debug: true,
    }),
  ],
};
