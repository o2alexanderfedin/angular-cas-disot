import { InjectionToken } from '@angular/core';
import { IStorageProvider } from '../domain/interfaces/storage.interface';
import { LocalStorageService } from './local-storage.service';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { IPFSStorageService } from './ipfs/ipfs-storage.service';
import { HeliaStorageService } from './helia/helia-storage.service';

export const STORAGE_PROVIDER = new InjectionToken<IStorageProvider>('storage.provider');

export enum StorageType {
  IN_MEMORY = 'in-memory',
  INDEXED_DB = 'indexed-db',
  IPFS = 'ipfs',
  HELIA = 'helia'
}

export function storageProviderFactory(
  localStorageService: LocalStorageService,
  indexedDbService: IndexedDbStorageService,
  ipfsStorageService: IPFSStorageService,
  heliaStorageService: HeliaStorageService,
  storageType: StorageType = StorageType.IN_MEMORY
): IStorageProvider {
  switch (storageType) {
    case StorageType.INDEXED_DB:
      return indexedDbService;
    case StorageType.IPFS:
      return ipfsStorageService;
    case StorageType.HELIA:
      return heliaStorageService;
    case StorageType.IN_MEMORY:
    default:
      return localStorageService;
  }
}

export const STORAGE_TYPE = new InjectionToken<StorageType>('storage.type');

export function getStorageType(): StorageType {
  // Check user preference from localStorage
  if (typeof window !== 'undefined') {
    const savedPreference = localStorage.getItem('cas-storage-type');
    
    // Return saved preference if it's a valid storage type
    if (savedPreference === StorageType.INDEXED_DB || 
        savedPreference === StorageType.IPFS ||
        savedPreference === StorageType.HELIA ||
        savedPreference === StorageType.IN_MEMORY) {
      return savedPreference as StorageType;
    }
    
    // Check if IndexedDB is available for default
    if ('indexedDB' in window) {
      return StorageType.INDEXED_DB;
    }
  }
  
  // Default to in-memory storage
  return StorageType.IN_MEMORY;
}