import { authInterceptorInterceptor } from './core/interceptors/auth-interceptor-interceptor';
import { errorInterceptorInterceptor } from './core/interceptors/error-interceptor-interceptor';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptorInterceptor, errorInterceptorInterceptor])),
  ],
};
