import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IPFSClient } from './ipfs-client.service';
import { IPFSStorageService, IPFS_CONFIG } from './ipfs-storage.service';
import { IPFSUploadQueueService } from './ipfs-upload-queue.service';
import { IPFSCIDMappingService } from './ipfs-cid-mapping.service';
import { IPFSShareLinkService } from './ipfs-share-link.service';
import { IndexedDbStorageService } from '../indexed-db-storage.service';
import { DEFAULT_IPFS_CONFIG } from './ipfs.config';
import { StorageType, STORAGE_TYPE, STORAGE_PROVIDER, storageProviderFactory } from '../storage-provider.factory';
import { LocalStorageService } from '../local-storage.service';
import { HeliaStorageService } from '../helia/helia-storage.service';

describe('IPFS Integration Tests', () => {
  describe('Service Instantiation', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
          IndexedDbStorageService,
          LocalStorageService,
          IPFSShareLinkService
        ]
      });
    });

    it('should create IPFSClient with proper dependencies', () => {
      TestBed.configureTestingModule({
        providers: [IPFSClient]
      });
      
      const client = TestBed.inject(IPFSClient);
      expect(client).toBeTruthy();
      expect(client.getType()).toBe(DEFAULT_IPFS_CONFIG.mode);
    });

    it('should create IPFSStorageService with all dependencies', () => {
      TestBed.configureTestingModule({
        providers: [IPFSStorageService, IPFSShareLinkService]
      });
      
      const service = TestBed.inject(IPFSStorageService);
      expect(service).toBeTruthy();
    });

    it('should create IPFSUploadQueueService', () => {
      TestBed.configureTestingModule({
        providers: [IPFSStorageService, IPFSShareLinkService, IPFSUploadQueueService]
      });
      
      const queueService = TestBed.inject(IPFSUploadQueueService);
      expect(queueService).toBeTruthy();
    });

    it('should create IPFSCIDMappingService', () => {
      TestBed.configureTestingModule({
        providers: [IPFSCIDMappingService]
      });
      
      const mappingService = TestBed.inject(IPFSCIDMappingService);
      expect(mappingService).toBeTruthy();
    });
  });

  describe('Storage Provider Factory Integration', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
          LocalStorageService,
          IndexedDbStorageService,
          IPFSStorageService,
          IPFSShareLinkService,
          HeliaStorageService
        ]
      });
    });

    it('should create IPFS storage provider through factory', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: STORAGE_TYPE, useValue: StorageType.IPFS },
          {
            provide: STORAGE_PROVIDER,
            useFactory: storageProviderFactory,
            deps: [LocalStorageService, IndexedDbStorageService, IPFSStorageService, HeliaStorageService, STORAGE_TYPE]
          }
        ]
      });
      
      const provider = TestBed.inject(STORAGE_PROVIDER);
      expect(provider).toBeTruthy();
      expect(provider).toBeInstanceOf(IPFSStorageService);
    });

    it('should handle all storage types in factory', () => {
      const testCases = [
        { type: StorageType.IN_MEMORY, expectedClass: LocalStorageService },
        { type: StorageType.INDEXED_DB, expectedClass: IndexedDbStorageService },
        { type: StorageType.IPFS, expectedClass: IPFSStorageService },
        { type: StorageType.HELIA, expectedClass: HeliaStorageService }
      ];

      testCases.forEach(({ type, expectedClass }) => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [HttpClientTestingModule],
          providers: [
            { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
            LocalStorageService,
            IndexedDbStorageService,
            IPFSStorageService,
            IPFSShareLinkService,
            HeliaStorageService,
            { provide: STORAGE_TYPE, useValue: type },
            {
              provide: STORAGE_PROVIDER,
              useFactory: storageProviderFactory,
              deps: [LocalStorageService, IndexedDbStorageService, IPFSStorageService, HeliaStorageService, STORAGE_TYPE]
            }
          ]
        });
        
        const provider = TestBed.inject(STORAGE_PROVIDER);
        expect(provider).toBeInstanceOf(expectedClass);
      });
    });
  });

  describe('Circular Dependency Prevention', () => {
    it('should not have circular dependencies between IPFS services', () => {
      // This test will fail to compile if there are circular dependencies
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
          IndexedDbStorageService,
          IPFSClient,
          IPFSStorageService,
          IPFSShareLinkService,
          IPFSUploadQueueService,
          IPFSCIDMappingService
        ]
      });
      
      // Try to inject all services
      expect(() => {
        TestBed.inject(IPFSClient);
        TestBed.inject(IPFSStorageService);
        TestBed.inject(IPFSUploadQueueService);
        TestBed.inject(IPFSCIDMappingService);
      }).not.toThrow();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing optional configuration fields', () => {
      const minimalConfig = {
        mode: 'gateway' as const,
        gateway: 'https://ipfs.io',
        timeout: 30000,
        retryAttempts: 3,
        maxFileSize: 100 * 1024 * 1024,
        enableEncryption: false
      };

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: IPFS_CONFIG, useValue: minimalConfig },
          IPFSClient
        ]
      });
      
      const client = TestBed.inject(IPFSClient);
      expect(client).toBeTruthy();
    });

    it('should validate required configuration fields', () => {
      const invalidConfig = {
        // Invalid mode
        mode: 'invalid' as any,
        timeout: 60000,
        maxFileSize: 100 * 1024 * 1024,
        enableEncryption: false
      };

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: IPFS_CONFIG, useValue: invalidConfig },
          IPFSClient
        ]
      });
      
      expect(() => TestBed.inject(IPFSClient)).toThrowError('Invalid IPFS configuration: unsupported mode');
    });
  });

  describe('Type Safety Tests', () => {
    it('should enforce correct types for injection tokens', () => {
      // This test verifies that TypeScript catches type mismatches
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          // Correct type
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
          // Wrong type should be caught by TypeScript
          // { provide: STORAGE_TYPE, useValue: 'wrong-type' }, // This would cause TS error
          { provide: STORAGE_TYPE, useValue: StorageType.IPFS },
          LocalStorageService,
          IndexedDbStorageService,
          IPFSStorageService,
          HeliaStorageService
        ]
      });
      
      const storageType = TestBed.inject(STORAGE_TYPE);
      expect(Object.values(StorageType)).toContain(storageType);
    });
  });

  describe('Error Propagation', () => {
    it('should properly propagate errors from IPFSClient to IPFSStorageService', async () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: IPFS_CONFIG, useValue: { ...DEFAULT_IPFS_CONFIG, timeout: 1 } }, // Very short timeout
          IndexedDbStorageService,
          IPFSStorageService
        ]
      });
      
      const service = TestBed.inject(IPFSStorageService);
      
      try {
        await service.write('test.txt', new Uint8Array([1, 2, 3]));
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});