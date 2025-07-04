import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { STORAGE_PROVIDER, STORAGE_TYPE, storageProviderFactory, getStorageType } from './core/services/storage-provider.factory';
import { LocalStorageService } from './core/services/local-storage.service';
import { IndexedDbStorageService } from './core/services/indexed-db-storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: STORAGE_TYPE,
      useFactory: getStorageType
    },
    {
      provide: STORAGE_PROVIDER,
      useFactory: storageProviderFactory,
      deps: [LocalStorageService, IndexedDbStorageService, STORAGE_TYPE]
    }
  ]
};
