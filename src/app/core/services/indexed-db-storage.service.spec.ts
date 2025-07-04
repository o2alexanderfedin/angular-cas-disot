import { TestBed } from '@angular/core/testing';
import { IndexedDbStorageService } from './indexed-db-storage.service';

describe('IndexedDbStorageService', () => {
  let service: IndexedDbStorageService;
  let mockIndexedDB: any;
  let mockDb: any;
  let mockObjectStore: any;
  let mockTransaction: any;
  let originalIndexedDB: any;

  beforeEach(() => {
    // Save original indexedDB
    originalIndexedDB = window.indexedDB;
    // Create mock object store
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
      }),
      clear: jasmine.createSpy('clear').and.returnValue({ 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null
      }),
      count: jasmine.createSpy('count').and.returnValue({ 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: 0 
      }),
      getAllKeys: jasmine.createSpy('getAllKeys').and.returnValue({ 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: [] 
      }),
      openCursor: jasmine.createSpy('openCursor').and.returnValue({ 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: null as any
      })
    };

    // Create mock transaction
    mockTransaction = {
      objectStore: jasmine.createSpy('objectStore').and.returnValue(mockObjectStore)
    };

    // Create mock database
    mockDb = {
      transaction: jasmine.createSpy('transaction').and.returnValue(mockTransaction),
      objectStoreNames: {
        contains: jasmine.createSpy('contains').and.returnValue(true)
      },
      createObjectStore: jasmine.createSpy('createObjectStore')
    };

    // Create mock IndexedDB
    mockIndexedDB = {
      open: jasmine.createSpy('open').and.returnValue({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDb
      })
    };

    // Replace global indexedDB
    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [IndexedDbStorageService]
    });
  });

  beforeEach(async () => {
    service = TestBed.inject(IndexedDbStorageService);
    
    // Simulate successful DB initialization
    const openRequest = mockIndexedDB.open.calls.mostRecent().returnValue;
    openRequest.result = mockDb;
    await new Promise(resolve => {
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest });
        }
        resolve(undefined);
      }, 0);
    });
  });

  afterEach(() => {
    // Restore original indexedDB
    Object.defineProperty(window, 'indexedDB', {
      value: originalIndexedDB,
      writable: true,
      configurable: true
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize IndexedDB on creation', () => {
    expect(mockIndexedDB.open).toHaveBeenCalledWith('cas-storage', 1);
  });

  describe('write', () => {
    it('should write data to IndexedDB', async () => {
      const path = 'test/path';
      const data = new Uint8Array([1, 2, 3]);
      const putRequest = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
      
      mockObjectStore.put.and.returnValue(putRequest);
      
      const writePromise = service.write(path, data);
      
      // Simulate success
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({} as any);
        }
      }, 0);
      
      await writePromise;
      
      expect(mockDb.transaction).toHaveBeenCalledWith(['content'], 'readwrite');
      expect(mockObjectStore.put).toHaveBeenCalledWith(data, path);
    });

    it('should handle write errors', async () => {
      const path = 'test/path';
      const data = new Uint8Array([1, 2, 3]);
      const putRequest = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
      
      mockObjectStore.put.and.returnValue(putRequest);
      
      const writePromise = service.write(path, data);
      
      // Simulate error
      setTimeout(() => {
        if (putRequest.onerror) {
          putRequest.onerror({} as any);
        }
      }, 0);
      
      await expectAsync(writePromise).toBeRejectedWithError(`Failed to write path: ${path}`);
    });
  });

  describe('read', () => {
    it('should read data from IndexedDB', async () => {
      const path = 'test/path';
      const expectedData = new Uint8Array([1, 2, 3]);
      const getRequest = { 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: expectedData 
      };
      
      mockObjectStore.get.and.returnValue(getRequest);
      
      const readPromise = service.read(path);
      
      // Simulate success
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({} as any);
        }
      }, 0);
      
      const result = await readPromise;
      
      expect(mockDb.transaction).toHaveBeenCalledWith(['content'], 'readonly');
      expect(mockObjectStore.get).toHaveBeenCalledWith(path);
      expect(result).toEqual(expectedData);
    });

    it('should handle non-existent paths', async () => {
      const path = 'non/existent';
      const getRequest = { 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: null 
      };
      
      mockObjectStore.get.and.returnValue(getRequest);
      
      const readPromise = service.read(path);
      
      // Simulate success with null result
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({} as any);
        }
      }, 0);
      
      await expectAsync(readPromise).toBeRejectedWithError(`Path not found: ${path}`);
    });
  });

  describe('exists', () => {
    it('should return true if path exists', async () => {
      const path = 'test/path';
      const countRequest = { 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: 1 
      };
      
      mockObjectStore.count.and.returnValue(countRequest);
      
      const existsPromise = service.exists(path);
      
      // Simulate success
      setTimeout(() => {
        if (countRequest.onsuccess) {
          countRequest.onsuccess({} as any);
        }
      }, 0);
      
      const result = await existsPromise;
      
      expect(mockObjectStore.count).toHaveBeenCalledWith(path);
      expect(result).toBe(true);
    });

    it('should return false if path does not exist', async () => {
      const path = 'test/path';
      const countRequest = { 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: 0 
      };
      
      mockObjectStore.count.and.returnValue(countRequest);
      
      const existsPromise = service.exists(path);
      
      // Simulate success
      setTimeout(() => {
        if (countRequest.onsuccess) {
          countRequest.onsuccess({} as any);
        }
      }, 0);
      
      const result = await existsPromise;
      
      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should return all stored paths', async () => {
      const expectedKeys = ['path1', 'path2', 'path3'];
      const getAllKeysRequest = { 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: expectedKeys 
      };
      
      mockObjectStore.getAllKeys.and.returnValue(getAllKeysRequest);
      
      const listPromise = service.list();
      
      // Simulate success
      setTimeout(() => {
        if (getAllKeysRequest.onsuccess) {
          getAllKeysRequest.onsuccess({} as any);
        }
      }, 0);
      
      const result = await listPromise;
      
      expect(mockObjectStore.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual(expectedKeys);
    });
  });

  describe('delete', () => {
    it('should delete data from IndexedDB', async () => {
      const path = 'test/path';
      const deleteRequest = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
      
      mockObjectStore.delete.and.returnValue(deleteRequest);
      
      const deletePromise = service.delete(path);
      
      // Simulate success
      setTimeout(() => {
        if (deleteRequest.onsuccess) {
          deleteRequest.onsuccess({} as any);
        }
      }, 0);
      
      await deletePromise;
      
      expect(mockDb.transaction).toHaveBeenCalledWith(['content'], 'readwrite');
      expect(mockObjectStore.delete).toHaveBeenCalledWith(path);
    });
  });

  describe('clear', () => {
    it('should clear all data from IndexedDB', async () => {
      const clearRequest = { onsuccess: null as ((e: any) => void) | null, onerror: null as ((e: any) => void) | null };
      
      mockObjectStore.clear.and.returnValue(clearRequest);
      
      const clearPromise = service.clear();
      
      // Simulate success
      setTimeout(() => {
        if (clearRequest.onsuccess) {
          clearRequest.onsuccess({} as any);
        }
      }, 0);
      
      await clearPromise;
      
      expect(mockDb.transaction).toHaveBeenCalledWith(['content'], 'readwrite');
      expect(mockObjectStore.clear).toHaveBeenCalled();
    });
  });

  describe('getSize', () => {
    it('should calculate total storage size', async () => {
      const mockData1 = new Uint8Array(100);
      const mockData2 = new Uint8Array(200);
      
      const cursorRequest = { 
        onsuccess: null as ((e: any) => void) | null, 
        onerror: null as ((e: any) => void) | null,
        result: null as any 
      };
      
      mockObjectStore.openCursor.and.returnValue(cursorRequest);
      
      const sizePromise = service.getSize();
      
      // Simulate cursor iteration
      setTimeout(() => {
        // First cursor result
        cursorRequest.result = {
          value: mockData1,
          continue: jasmine.createSpy('continue').and.callFake(() => {
            setTimeout(() => {
              // Second cursor result
              cursorRequest.result = {
                value: mockData2,
                continue: jasmine.createSpy('continue').and.callFake(() => {
                  setTimeout(() => {
                    // End of cursor
                    cursorRequest.result = null;
                    if (cursorRequest.onsuccess) {
                      cursorRequest.onsuccess({ target: cursorRequest });
                    }
                  }, 0);
                })
              };
              if (cursorRequest.onsuccess) {
                cursorRequest.onsuccess({ target: cursorRequest });
              }
            }, 0);
          })
        };
        if (cursorRequest.onsuccess) {
          cursorRequest.onsuccess({ target: cursorRequest });
        }
      }, 0);
      
      const result = await sizePromise;
      
      expect(result).toBe(300); // 100 + 200
    });
  });

  describe('error handling', () => {
    it('should handle database initialization errors', async () => {
      // Save original indexedDB and create a failing mock
      const originalIndexedDB = window.indexedDB;
      
      // Create a promise to track when the error handler is called
      let errorHandlerCalled: Promise<void>;
      let resolveErrorHandler: () => void;
      
      errorHandlerCalled = new Promise((resolve) => {
        resolveErrorHandler = resolve;
      });
      
      const failingIndexedDB = {
        open: jasmine.createSpy('open').and.callFake(() => {
          const request = {
            onsuccess: null as ((e: any) => void) | null,
            onerror: null as ((e: any) => void) | null,
            onupgradeneeded: null as ((e: any) => void) | null,
            result: null,
            error: new Error('Failed to open IndexedDB')
          };
          
          // Simulate async error
          setTimeout(() => {
            if (request.onerror) {
              request.onerror({ target: request } as any);
              resolveErrorHandler();
            }
          }, 0);
          
          return request;
        })
      };
      
      try {
        // Replace indexedDB
        Object.defineProperty(window, 'indexedDB', {
          value: failingIndexedDB,
          writable: true,
          configurable: true
        });
        
        // Create service which will trigger initialization
        const failingService = new IndexedDbStorageService();
        
        // Wait for the error handler to be called
        await errorHandlerCalled;
        
        // Give the service time to process the error
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Try to use the service - should fail
        await expectAsync(failingService.read('test')).toBeRejectedWithError('IndexedDB not available');
        
      } finally {
        // Always restore original indexedDB
        Object.defineProperty(window, 'indexedDB', {
          value: originalIndexedDB,
          writable: true,
          configurable: true
        });
      }
    });
  });
});