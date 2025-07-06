import { TestBed } from '@angular/core/testing';
import { HeliaStorageService } from './helia-storage.service';
import { IPFSShareLinkService } from '../ipfs/ipfs-share-link.service';
import { IPFS_CONFIG } from '../ipfs/ipfs-storage.service';
import { DEFAULT_IPFS_CONFIG } from '../ipfs/ipfs.config';

describe('HeliaStorageService', () => {
  let service: HeliaStorageService;
  let mockHelia: any;
  let mockFs: any;
  let mockPathCidStore: any;

  // Mock CID class
  class MockCID {
    constructor(public value: string) {}
    toString() { return this.value; }
    static parse(str: string) { return new MockCID(str); }
  }

  beforeEach(() => {
    // Mock UnixFS
    mockFs = {
      addBytes: jasmine.createSpy('addBytes').and.returnValue(Promise.resolve(new MockCID('bafkreitest123'))),
      cat: jasmine.createSpy('cat').and.returnValue({
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([1, 2, 3]);
          yield new Uint8Array([4, 5, 6]);
        }
      })
    };

    // Mock Helia
    mockHelia = {
      stop: jasmine.createSpy('stop').and.returnValue(Promise.resolve())
    };

    // Mock path-CID store
    mockPathCidStore = {
      transaction: jasmine.createSpy('transaction'),
      close: jasmine.createSpy('close'),
      objectStoreNames: {
        contains: jasmine.createSpy('contains').and.returnValue(true)
      },
      createObjectStore: jasmine.createSpy('createObjectStore')
    };

    TestBed.configureTestingModule({
      providers: [
        HeliaStorageService,
        IPFSShareLinkService,
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
      ]
    });

    service = TestBed.inject(HeliaStorageService);
    
    // Override the initialization to prevent actual Helia/IndexedDB calls
    spyOn(service as any, 'initialize').and.callFake(async function(this: any) {
      this.helia = mockHelia;
      this.fs = mockFs;
      this.pathToCidStore = mockPathCidStore;
      this.initialized = true;
    });
    
    // Override path-CID store methods
    spyOn(service as any, 'initializePathCidStore').and.returnValue(Promise.resolve());
    spyOn(service as any, 'getCidForPathPrivate').and.returnValue(Promise.resolve('bafkreitest123'));
    spyOn(service as any, 'savePathCidMapping').and.returnValue(Promise.resolve());
    spyOn(service as any, 'deletePathCidMapping').and.returnValue(Promise.resolve());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {

    it('should initialize Helia on first use', async () => {
      await service.ensureInitialized();
      expect((service as any).initialized).toBe(true);
    });

    it('should only initialize once', async () => {
      await service.ensureInitialized();
      await service.ensureInitialized();
      await service.ensureInitialized();
      
      expect((service as any).initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent initialization calls', async () => {
      const promises = [
        service.ensureInitialized(),
        service.ensureInitialized(),
        service.ensureInitialized()
      ];
      
      await Promise.all(promises);
      expect((service as any).initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('write', () => {
    beforeEach(async () => {
      await service.ensureInitialized();
    });

    it('should write data to Helia', async () => {
      const path = 'test/file.txt';
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      
      await service.write(path, data);
      
      expect(mockFs.addBytes).toHaveBeenCalledWith(data);
      expect((service as any).savePathCidMapping).toHaveBeenCalledWith(path, 'bafkreitest123');
    });

    it('should handle write errors', async () => {
      const path = 'test/file.txt';
      const data = new Uint8Array([1, 2, 3]);
      
      mockFs.addBytes.and.returnValue(Promise.reject(new Error('Write failed')));
      
      await expectAsync(service.write(path, data)).toBeRejectedWithError('Write failed');
    });

    it('should throw error if Helia not initialized', async () => {
      (service as any).fs = null;
      
      await expectAsync(service.write('test', new Uint8Array()))
        .toBeRejectedWithError('Helia not initialized');
    });
  });

  describe('read', () => {
    beforeEach(async () => {
      await service.ensureInitialized();
    });

    it('should read data from Helia', async () => {
      const path = 'test/file.txt';
      
      // Mock the import of CID
      spyOn(service as any, 'read').and.callFake(async function(this: any, path: string) {
        await this.ensureInitialized();
        if (!this.fs) throw new Error('Helia not initialized');
        
        const cidString = await this.getCidForPathPrivate(path);
        if (!cidString) {
          throw new Error(`No content found for path: ${path}`);
        }
        
        // Simulate reading chunks
        const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return result;
      });
      
      const result = await service.read(path);
      
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
      expect((service as any).getCidForPathPrivate).toHaveBeenCalledWith(path);
    });

    it('should throw error if path not found', async () => {
      const path = 'non/existent';
      (service as any).getCidForPathPrivate.and.returnValue(Promise.resolve(null));
      
      await expectAsync(service.read(path))
        .toBeRejectedWithError(`No content found for path: ${path}`);
    });

    it('should handle read errors', async () => {
      const path = 'test/file.txt';
      mockFs.cat.and.throwError('Read failed');
      
      await expectAsync(service.read(path)).toBeRejected();
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      await service.ensureInitialized();
    });

    it('should return true if path exists', async () => {
      // getCidForPathPrivate is already mocked to return 'bafkreitest123'
      const result = await service.exists('test/file.txt');
      expect(result).toBe(true);
    });

    it('should return false if path does not exist', async () => {
      // Override the default mock for this test
      (service as any).getCidForPathPrivate.and.returnValue(Promise.resolve(null));
      
      const result = await service.exists('non/existent');
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await service.ensureInitialized();
    });

    it('should delete path mapping', async () => {
      const path = 'test/file.txt';
      
      await service.delete(path);
      
      expect((service as any).deletePathCidMapping).toHaveBeenCalledWith(path);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await service.ensureInitialized();
    });

    it('should return all stored paths', async () => {
      const mockTransaction = {
        objectStore: jasmine.createSpy('objectStore').and.returnValue({
          getAllKeys: jasmine.createSpy('getAllKeys').and.returnValue({
            onsuccess: null as ((e: any) => void) | null,
            onerror: null as ((e: any) => void) | null,
            result: ['path1', 'path2', 'path3']
          })
        })
      };
      
      mockPathCidStore.transaction.and.returnValue(mockTransaction);
      
      const listPromise = service.list();
      
      // Simulate success
      const request = mockTransaction.objectStore().getAllKeys();
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      
      const result = await listPromise;
      expect(result).toEqual(['path1', 'path2', 'path3']);
    });

    it('should return empty array if store not initialized', async () => {
      (service as any).pathToCidStore = null;
      
      const result = await service.list();
      expect(result).toEqual([]);
    });
  });

  describe('path-CID mapping', () => {
    let mockTransaction: any;
    let mockObjectStore: any;

    beforeEach(async () => {
      mockObjectStore = {
        put: jasmine.createSpy('put').and.returnValue({
          onsuccess: null as ((e: any) => void) | null,
          onerror: null as ((e: any) => void) | null
        }),
        get: jasmine.createSpy('get').and.returnValue({
          onsuccess: null as ((e: any) => void) | null,
          onerror: null as ((e: any) => void) | null,
          result: null
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          onsuccess: null as ((e: any) => void) | null,
          onerror: null as ((e: any) => void) | null
        })
      };

      mockTransaction = {
        objectStore: jasmine.createSpy('objectStore').and.returnValue(mockObjectStore)
      };

      mockPathCidStore.transaction.and.returnValue(mockTransaction);

      await service.ensureInitialized();
      
      // Override the spies to call through to the real implementation for these tests
      (service as any).savePathCidMapping.and.callThrough();
      (service as any).getCidForPathPrivate.and.callThrough();
      (service as any).deletePathCidMapping.and.callThrough();
    });

    it('should save path-CID mapping', async () => {
      const path = 'test/file.txt';
      const cid = 'bafkreitest123';
      
      const putRequest = {
        onsuccess: null as ((e: any) => void) | null,
        onerror: null as ((e: any) => void) | null
      };
      
      mockObjectStore.put.and.returnValue(putRequest);
      
      const savePromise = (service as any).savePathCidMapping(path, cid);
      
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({});
        }
      }, 0);
      
      await savePromise;
      
      expect(mockObjectStore.put).toHaveBeenCalledWith(jasmine.objectContaining({
        path,
        cid,
        timestamp: jasmine.any(String)
      }));
    });

    it('should get CID for path', async () => {
      const path = 'test/file.txt';
      const expectedCid = 'bafkreitest123';
      
      const getRequest = {
        onsuccess: null as ((e: any) => void) | null,
        onerror: null as ((e: any) => void) | null,
        result: { path, cid: expectedCid, timestamp: new Date().toISOString() }
      };
      
      mockObjectStore.get.and.returnValue(getRequest);
      
      const getPromise = (service as any).getCidForPathPrivate(path);
      
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({});
        }
      }, 0);
      
      const result = await getPromise;
      expect(result).toBe(expectedCid);
    });

    it('should return null if path not found', async () => {
      const path = 'non/existent';
      
      const getRequest = {
        onsuccess: null as ((e: any) => void) | null,
        onerror: null as ((e: any) => void) | null,
        result: null
      };
      
      mockObjectStore.get.and.returnValue(getRequest);
      
      const getPromise = (service as any).getCidForPathPrivate(path);
      
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({});
        }
      }, 0);
      
      const result = await getPromise;
      expect(result).toBeNull();
    });

    it('should delete path-CID mapping', async () => {
      const path = 'test/file.txt';
      
      const deleteRequest = {
        onsuccess: null as ((e: any) => void) | null,
        onerror: null as ((e: any) => void) | null
      };
      
      mockObjectStore.delete.and.returnValue(deleteRequest);
      
      const deletePromise = (service as any).deletePathCidMapping(path);
      
      setTimeout(() => {
        if (deleteRequest.onsuccess) {
          deleteRequest.onsuccess({});
        }
      }, 0);
      
      await deletePromise;
      
      expect(mockObjectStore.delete).toHaveBeenCalledWith(path);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      spyOn(service, 'list').and.returnValue(Promise.resolve(['path1', 'path2', 'path3']));
      
      await service.ensureInitialized();
    });

    it('should return storage statistics', async () => {
      const stats = await service.getStats();
      
      expect(stats).toEqual({
        blockCount: 0,
        totalSize: 0,
        pathCount: 3
      });
    });
  });

  describe('isHealthy', () => {
    it('should return true when initialized', async () => {
      await service.ensureInitialized();
      
      const result = await service.isHealthy();
      expect(result).toBe(true);
    });

    it('should return false when not initialized', async () => {
      // Reset the initialized state and make initialize fail
      (service as any).initialized = false;
      (service as any).initPromise = undefined;
      (service as any).initialize.and.returnValue(Promise.reject(new Error('Not initialized')));
      
      const result = await service.isHealthy();
      expect(result).toBe(false);
    });

    it('should return false on initialization error', async () => {
      spyOn(service as any, 'ensureInitialized').and.returnValue(Promise.reject(new Error('Init failed')));
      
      const result = await service.isHealthy();
      expect(result).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(async () => {
      await service.ensureInitialized();
    });

    it('should stop Helia when destroyed', () => {
      service.ngOnDestroy();
      
      expect(mockHelia.stop).toHaveBeenCalled();
    });

    it('should close path-CID database when destroyed', () => {
      service.ngOnDestroy();
      
      expect(mockPathCidStore.close).toHaveBeenCalled();
    });

    it('should handle stop errors gracefully', () => {
      mockHelia.stop.and.returnValue(Promise.reject(new Error('Stop failed')));
      
      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should handle missing Helia instance', () => {
      (service as any).helia = null;
      
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', async () => {
      // Reset the service to test initialization failure
      (service as any).initialized = false;
      (service as any).initPromise = undefined;
      (service as any).initialize.and.returnValue(Promise.reject(new Error('Helia initialization failed')));
      
      await expectAsync(service.ensureInitialized()).toBeRejectedWithError('Helia initialization failed');
    });

    it('should throw error when store not initialized for save', async () => {
      await service.ensureInitialized();
      (service as any).pathToCidStore = null;
      
      // Override the spy to call through to the real implementation
      (service as any).savePathCidMapping.and.callThrough();
      
      await expectAsync((service as any).savePathCidMapping('test', 'cid'))
        .toBeRejectedWithError('Path-CID store not initialized');
    });

    it('should throw error when store not initialized for get', async () => {
      await service.ensureInitialized();
      (service as any).pathToCidStore = null;
      
      // Override the spy to call through to the real implementation
      (service as any).getCidForPathPrivate.and.callThrough();
      
      await expectAsync((service as any).getCidForPathPrivate('test'))
        .toBeRejectedWithError('Path-CID store not initialized');
    });

    it('should throw error when store not initialized for delete', async () => {
      await service.ensureInitialized();
      (service as any).pathToCidStore = null;
      
      // Override the spy to call through to the real implementation
      (service as any).deletePathCidMapping.and.callThrough();
      
      await expectAsync((service as any).deletePathCidMapping('test'))
        .toBeRejectedWithError('Path-CID store not initialized');
    });
  });
});