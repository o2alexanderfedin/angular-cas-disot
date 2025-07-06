import { TestBed } from '@angular/core/testing';
import { 
  storageProviderFactory, 
  STORAGE_TYPE, 
  StorageType, 
  STORAGE_PROVIDER 
} from './storage-provider.factory';
import { LocalStorageService } from './local-storage.service';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { IStorageProvider } from '../domain/interfaces/storage.interface';

describe('StorageProviderFactory', () => {
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let indexedDbService: jasmine.SpyObj<IndexedDbStorageService>;

  beforeEach(() => {
    // Create spies for services
    localStorageService = jasmine.createSpyObj('LocalStorageService', ['write', 'read', 'exists', 'delete', 'list', 'clear']);
    indexedDbService = jasmine.createSpyObj('IndexedDbStorageService', ['write', 'read', 'exists', 'delete', 'list', 'clear']);
  });

  describe('factory function', () => {
    it('should return LocalStorageService when type is IN_MEMORY', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        StorageType.IN_MEMORY
      );

      expect(result).toBe(localStorageService);
    });

    it('should return IndexedDbStorageService when type is INDEXED_DB', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        StorageType.INDEXED_DB
      );

      expect(result).toBe(indexedDbService);
    });

    it('should return LocalStorageService when type is undefined', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        undefined
      );

      expect(result).toBe(localStorageService);
    });

    it('should use default type when none provided', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        undefined
      );

      expect(result).toBe(localStorageService);
    });
  });

  describe('dependency injection', () => {
    it('should provide storage provider using factory', () => {
      TestBed.configureTestingModule({
        providers: [
          LocalStorageService,
          IndexedDbStorageService,
          { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
          {
            provide: STORAGE_PROVIDER,
            useFactory: storageProviderFactory,
            deps: [LocalStorageService, IndexedDbStorageService, STORAGE_TYPE]
          }
        ]
      });

      const storageProvider = TestBed.inject(STORAGE_PROVIDER);
      expect(storageProvider).toBeInstanceOf(LocalStorageService);
    });

    it('should provide IndexedDB storage when configured', () => {
      TestBed.configureTestingModule({
        providers: [
          LocalStorageService,
          IndexedDbStorageService,
          { provide: STORAGE_TYPE, useValue: StorageType.INDEXED_DB },
          {
            provide: STORAGE_PROVIDER,
            useFactory: storageProviderFactory,
            deps: [LocalStorageService, IndexedDbStorageService, STORAGE_TYPE]
          }
        ]
      });

      const storageProvider = TestBed.inject(STORAGE_PROVIDER);
      expect(storageProvider).toBe(TestBed.inject(IndexedDbStorageService));
    });

    it('should use default when STORAGE_TYPE is not provided', () => {
      TestBed.configureTestingModule({
        providers: [
          LocalStorageService,
          IndexedDbStorageService,
          // Provide null as STORAGE_TYPE to test default behavior
          { provide: STORAGE_TYPE, useValue: null },
          {
            provide: STORAGE_PROVIDER,
            useFactory: storageProviderFactory,
            deps: [LocalStorageService, IndexedDbStorageService, STORAGE_TYPE]
          }
        ]
      });

      const storageProvider = TestBed.inject(STORAGE_PROVIDER);
      expect(storageProvider).toBeInstanceOf(LocalStorageService);
    });
  });

  describe('StorageType enum', () => {
    it('should have correct values', () => {
      expect(StorageType.IN_MEMORY).toBe('in-memory');
      expect(StorageType.INDEXED_DB).toBe('indexed-db');
    });
  });

  describe('edge cases', () => {
    it('should handle null localStorageService', () => {
      const result = storageProviderFactory(
        null as any,
        indexedDbService,
        StorageType.IN_MEMORY
      );

      expect(result).toBeNull();
    });


    it('should handle when all parameters are undefined', () => {
      const result = storageProviderFactory(
        null as any,
        null as any,
        undefined
      );

      expect(result).toBeNull();
    });
  });

  describe('integration with actual services', () => {
    it('should work with real service instances', () => {
      const realLocalStorage = new LocalStorageService();
      const realIndexedDb = new IndexedDbStorageService();

      const result = storageProviderFactory(
        realLocalStorage,
        realIndexedDb,
        StorageType.INDEXED_DB
      );

      expect(result).toBe(realIndexedDb);
    });
  });
});