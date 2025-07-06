import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { 
  storageProviderFactory, 
  STORAGE_TYPE, 
  StorageType, 
  STORAGE_PROVIDER 
} from './storage-provider.factory';
import { LocalStorageService } from './local-storage.service';
import { IndexedDbStorageService } from './indexed-db-storage.service';
import { IPFSStorageService, IPFS_CONFIG } from './ipfs/ipfs-storage.service';
import { HeliaStorageService } from './helia/helia-storage.service';
import { IPFSShareLinkService } from './ipfs/ipfs-share-link.service';
import { DEFAULT_IPFS_CONFIG } from './ipfs/ipfs.config';

describe('StorageProviderFactory', () => {
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let indexedDbService: jasmine.SpyObj<IndexedDbStorageService>;
  let ipfsStorageService: jasmine.SpyObj<IPFSStorageService>;
  let heliaStorageService: jasmine.SpyObj<HeliaStorageService>;

  beforeEach(() => {
    // Create spies for services
    localStorageService = jasmine.createSpyObj('LocalStorageService', ['write', 'read', 'exists', 'delete', 'list', 'clear']);
    indexedDbService = jasmine.createSpyObj('IndexedDbStorageService', ['write', 'read', 'exists', 'delete', 'list', 'clear']);
    ipfsStorageService = jasmine.createSpyObj('IPFSStorageService', ['write', 'read', 'exists', 'delete', 'list', 'isHealthy', 'getCidForPath']);
    heliaStorageService = jasmine.createSpyObj('HeliaStorageService', ['write', 'read', 'exists', 'delete', 'list', 'isHealthy', 'ensureInitialized']);
  });

  describe('factory function', () => {
    it('should return LocalStorageService when type is IN_MEMORY', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        ipfsStorageService,
        heliaStorageService,
        StorageType.IN_MEMORY
      );

      expect(result).toBe(localStorageService);
    });

    it('should return IndexedDbStorageService when type is INDEXED_DB', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        ipfsStorageService,
        heliaStorageService,
        StorageType.INDEXED_DB
      );

      expect(result).toBe(indexedDbService);
    });

    it('should return IPFSStorageService when type is IPFS', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        ipfsStorageService,
        heliaStorageService,
        StorageType.IPFS
      );

      expect(result).toBe(ipfsStorageService);
    });

    it('should return HeliaStorageService when type is HELIA', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        ipfsStorageService,
        heliaStorageService,
        StorageType.HELIA
      );

      expect(result).toBe(heliaStorageService);
    });

    it('should return LocalStorageService when type is undefined', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        ipfsStorageService,
        heliaStorageService,
        undefined as any
      );

      expect(result).toBe(localStorageService);
    });

    it('should use default type when none provided', () => {
      const result = storageProviderFactory(
        localStorageService,
        indexedDbService,
        ipfsStorageService,
        heliaStorageService,
        undefined as any
      );

      expect(result).toBe(localStorageService);
    });
  });

  describe('dependency injection', () => {
    it('should provide storage provider using factory', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          LocalStorageService,
          IndexedDbStorageService,
          IPFSStorageService,
          HeliaStorageService,
          IPFSShareLinkService,
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
          { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
          {
            provide: STORAGE_PROVIDER,
            useFactory: storageProviderFactory,
            deps: [LocalStorageService, IndexedDbStorageService, IPFSStorageService, HeliaStorageService, STORAGE_TYPE]
          }
        ]
      });

      const storageProvider = TestBed.inject(STORAGE_PROVIDER);
      expect(storageProvider).toBeInstanceOf(LocalStorageService);
    });

    it('should provide IndexedDB storage when configured', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          LocalStorageService,
          IndexedDbStorageService,
          IPFSStorageService,
          HeliaStorageService,
          IPFSShareLinkService,
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
          { provide: STORAGE_TYPE, useValue: StorageType.INDEXED_DB },
          {
            provide: STORAGE_PROVIDER,
            useFactory: storageProviderFactory,
            deps: [LocalStorageService, IndexedDbStorageService, IPFSStorageService, HeliaStorageService, STORAGE_TYPE]
          }
        ]
      });

      const storageProvider = TestBed.inject(STORAGE_PROVIDER);
      expect(storageProvider).toBe(TestBed.inject(IndexedDbStorageService));
    });

    it('should use default when STORAGE_TYPE is not provided', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          LocalStorageService,
          IndexedDbStorageService,
          IPFSStorageService,
          HeliaStorageService,
          IPFSShareLinkService,
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
          // Provide null as STORAGE_TYPE to test default behavior
          { provide: STORAGE_TYPE, useValue: null },
          {
            provide: STORAGE_PROVIDER,
            useFactory: storageProviderFactory,
            deps: [LocalStorageService, IndexedDbStorageService, IPFSStorageService, HeliaStorageService, STORAGE_TYPE]
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
      expect(StorageType.IPFS).toBe('ipfs');
      expect(StorageType.HELIA).toBe('helia');
    });
  });

  describe('edge cases', () => {
    it('should handle null localStorageService', () => {
      const result = storageProviderFactory(
        null as any,
        indexedDbService,
        ipfsStorageService,
        heliaStorageService,
        StorageType.IN_MEMORY
      );

      expect(result).toBeNull();
    });


    it('should handle when all parameters are undefined', () => {
      const result = storageProviderFactory(
        null as any,
        null as any,
        null as any,
        null as any,
        undefined as any
      );

      expect(result).toBeNull();
    });
  });

  describe('integration with actual services', () => {
    it('should work with real service instances', () => {
      const realLocalStorage = new LocalStorageService();
      const realIndexedDb = new IndexedDbStorageService();
      // Create a spy for IPFS since it has dependencies
      const ipfsService = jasmine.createSpyObj('IPFSStorageService', ['write', 'read', 'exists', 'delete', 'list']);

      const result = storageProviderFactory(
        realLocalStorage,
        realIndexedDb,
        ipfsService,
        heliaStorageService,
        StorageType.INDEXED_DB
      );

      expect(result).toBe(realIndexedDb);
    });
  });
});