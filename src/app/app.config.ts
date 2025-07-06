import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { STORAGE_PROVIDER, STORAGE_TYPE, storageProviderFactory, getStorageType } from './core/services/storage-provider.factory';
import { LocalStorageService } from './core/services/local-storage.service';
import { IndexedDbStorageService } from './core/services/indexed-db-storage.service';
import { IPFSStorageService, IPFS_CONFIG } from './core/services/ipfs/ipfs-storage.service';
import { HeliaStorageService } from './core/services/helia/helia-storage.service';
import { DEFAULT_IPFS_CONFIG } from './core/services/ipfs/ipfs.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: IPFS_CONFIG,
      useValue: DEFAULT_IPFS_CONFIG
    },
    {
      provide: STORAGE_TYPE,
      useFactory: getStorageType
    },
    {
      provide: STORAGE_PROVIDER,
      useFactory: storageProviderFactory,
      deps: [LocalStorageService, IndexedDbStorageService, IPFSStorageService, HeliaStorageService, STORAGE_TYPE]
    }
  ]
};
