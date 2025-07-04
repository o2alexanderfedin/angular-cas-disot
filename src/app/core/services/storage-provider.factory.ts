import { InjectionToken } from '@angular/core';
import { IStorageProvider } from '../domain/interfaces/storage.interface';
import { LocalStorageService } from './local-storage.service';
import { IndexedDbStorageService } from './indexed-db-storage.service';

export const STORAGE_PROVIDER = new InjectionToken<IStorageProvider>('storage.provider');

export enum StorageType {
  IN_MEMORY = 'in-memory',
  INDEXED_DB = 'indexed-db'
}

export function storageProviderFactory(
  localStorageService: LocalStorageService,
  indexedDbService: IndexedDbStorageService,
  storageType: StorageType = StorageType.IN_MEMORY
): IStorageProvider {
  switch (storageType) {
    case StorageType.INDEXED_DB:
      return indexedDbService;
    case StorageType.IN_MEMORY:
    default:
      return localStorageService;
  }
}

export const STORAGE_TYPE = new InjectionToken<StorageType>('storage.type');

export function getStorageType(): StorageType {
  // Check if IndexedDB is available
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    // Check user preference from localStorage
    const savedPreference = localStorage.getItem('cas-storage-type');
    if (savedPreference === StorageType.INDEXED_DB) {
      return StorageType.INDEXED_DB;
    }
  }
  
  // Default to in-memory storage
  return StorageType.IN_MEMORY;
}