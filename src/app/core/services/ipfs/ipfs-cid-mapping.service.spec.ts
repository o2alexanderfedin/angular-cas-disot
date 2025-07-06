import { TestBed } from '@angular/core/testing';
import { IPFSCIDMappingService, CIDMapping } from './ipfs-cid-mapping.service';

describe('IPFSCIDMappingService', () => {
  let service: IPFSCIDMappingService;
  let mockLocalStorage: any;

  const createTestMapping = (num: number): CIDMapping => ({
    cid: `Qm${num}`,
    path: `/test/file${num}.txt`,
    hash: `hash${num}`,
    timestamp: new Date(2024, 0, num),
    size: num * 1000,
    mimeType: 'text/plain',
    pinned: num % 2 === 0
  });

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem'),
      clear: jasmine.createSpy('clear')
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });

    TestBed.configureTestingModule({});
    service = TestBed.inject(IPFSCIDMappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addMapping', () => {
    it('should add a new mapping', (done) => {
      const mapping = createTestMapping(1);
      
      service.mappings$.subscribe(mappings => {
        if (mappings.length > 0) {
          expect(mappings.length).toBe(1);
          expect(mappings[0]).toEqual(mapping);
          done();
        }
      });

      service.addMapping(mapping);
    });

    it('should update stats when adding mapping', (done) => {
      const mapping = createTestMapping(1);
      
      service.stats$.subscribe(stats => {
        if (stats.totalMappings > 0) {
          expect(stats.totalMappings).toBe(1);
          expect(stats.totalSize).toBe(1000);
          expect(stats.pinnedCount).toBe(0);
          done();
        }
      });

      service.addMapping(mapping);
    });

    it('should save to localStorage', () => {
      const mapping = createTestMapping(1);
      service.addMapping(mapping);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ipfs-cid-mappings',
        jasmine.any(String)
      );
    });
  });

  describe('getMappingByCID', () => {
    it('should retrieve mapping by CID', () => {
      const mapping = createTestMapping(1);
      service.addMapping(mapping);

      const retrieved = service.getMappingByCID('Qm1');
      expect(retrieved).toEqual(mapping);
    });

    it('should return undefined for non-existent CID', () => {
      const retrieved = service.getMappingByCID('QmNonExistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getMappingByPath', () => {
    it('should retrieve mapping by path', () => {
      const mapping = createTestMapping(1);
      service.addMapping(mapping);

      const retrieved = service.getMappingByPath('/test/file1.txt');
      expect(retrieved).toEqual(mapping);
    });
  });

  describe('getMappingByHash', () => {
    it('should retrieve mapping by hash', () => {
      const mapping = createTestMapping(1);
      service.addMapping(mapping);

      const retrieved = service.getMappingByHash('hash1');
      expect(retrieved).toEqual(mapping);
    });
  });

  describe('updateMapping', () => {
    it('should update existing mapping', (done) => {
      const mapping = createTestMapping(1);
      service.addMapping(mapping);

      service.mappings$.subscribe(mappings => {
        if (mappings.length > 0 && mappings[0].pinned === true) {
          expect(mappings[0].pinned).toBe(true);
          expect(mappings[0].size).toBe(2000);
          done();
        }
      });

      service.updateMapping('Qm1', { pinned: true, size: 2000 });
    });

    it('should not update non-existent mapping', () => {
      service.updateMapping('QmNonExistent', { pinned: true });
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeMapping', () => {
    it('should remove mapping', (done) => {
      const mapping = createTestMapping(1);
      service.addMapping(mapping);

      service.mappings$.subscribe(mappings => {
        if (mappings.length === 0) {
          expect(mappings.length).toBe(0);
          done();
        }
      });

      service.removeMapping('Qm1');
    });

    it('should remove from all indexes', () => {
      const mapping = createTestMapping(1);
      service.addMapping(mapping);
      service.removeMapping('Qm1');

      expect(service.getMappingByCID('Qm1')).toBeUndefined();
      expect(service.getMappingByPath('/test/file1.txt')).toBeUndefined();
      expect(service.getMappingByHash('hash1')).toBeUndefined();
    });
  });

  describe('searchMappings', () => {
    beforeEach(() => {
      service.addMapping(createTestMapping(1));
      service.addMapping(createTestMapping(2));
      service.addMapping(createTestMapping(3));
    });

    it('should search by CID', (done) => {
      service.searchMappings('Qm1').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].cid).toBe('Qm1');
        done();
      });
    });

    it('should search by path', (done) => {
      service.searchMappings('file2').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].path).toContain('file2');
        done();
      });
    });

    it('should search by hash', (done) => {
      service.searchMappings('hash3').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].hash).toBe('hash3');
        done();
      });
    });

    it('should be case insensitive', (done) => {
      service.searchMappings('FILE1').subscribe(results => {
        expect(results.length).toBe(1);
        done();
      });
    });
  });

  describe('getMappingsByDateRange', () => {
    beforeEach(() => {
      service.addMapping(createTestMapping(1));
      service.addMapping(createTestMapping(15));
      service.addMapping(createTestMapping(30));
    });

    it('should filter by date range', (done) => {
      const startDate = new Date(2024, 0, 10);
      const endDate = new Date(2024, 0, 20);

      service.getMappingsByDateRange(startDate, endDate).subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].cid).toBe('Qm15');
        done();
      });
    });
  });

  describe('getPinnedMappings', () => {
    beforeEach(() => {
      service.addMapping(createTestMapping(1)); // unpinned
      service.addMapping(createTestMapping(2)); // pinned
      service.addMapping(createTestMapping(3)); // unpinned
      service.addMapping(createTestMapping(4)); // pinned
    });

    it('should return only pinned mappings', (done) => {
      service.getPinnedMappings().subscribe(results => {
        expect(results.length).toBe(2);
        expect(results.every(m => m.pinned)).toBe(true);
        done();
      });
    });
  });

  describe('exportMappings', () => {
    it('should export mappings as JSON', () => {
      service.addMapping(createTestMapping(1));
      service.addMapping(createTestMapping(2));

      const exported = service.exportMappings();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe('1.0');
      expect(parsed.timestamp).toBeTruthy();
      expect(parsed.mappings.length).toBe(2);
    });
  });

  describe('importMappings', () => {
    it('should import valid mappings', (done) => {
      const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        mappings: [
          createTestMapping(1),
          createTestMapping(2)
        ]
      };

      service.mappings$.subscribe(mappings => {
        if (mappings.length === 2) {
          expect(mappings.length).toBe(2);
          done();
        }
      });

      service.importMappings(JSON.stringify(data));
    });

    it('should throw error for invalid data', () => {
      expect(() => service.importMappings('invalid json')).toThrowError('Invalid mapping data format');
    });

    it('should skip invalid mappings', () => {
      const data = {
        version: '1.0',
        mappings: [
          createTestMapping(1),
          { invalid: 'mapping' }
        ]
      };

      service.importMappings(JSON.stringify(data));
      
      // Should only import the valid mapping
      service.mappings$.subscribe(mappings => {
        expect(mappings.length).toBe(1);
      });
    });
  });

  describe('clearMappings', () => {
    it('should clear all mappings', (done) => {
      service.addMapping(createTestMapping(1));
      service.addMapping(createTestMapping(2));

      service.mappings$.subscribe(mappings => {
        if (mappings.length === 0) {
          expect(mappings.length).toBe(0);
          done();
        }
      });

      service.clearMappings();
    });

    it('should reset stats', (done) => {
      service.addMapping(createTestMapping(1));
      service.clearMappings();

      service.stats$.subscribe(stats => {
        if (stats.totalMappings === 0) {
          expect(stats).toEqual({
            totalMappings: 0,
            totalSize: 0,
            pinnedCount: 0
          });
          done();
        }
      });
    });
  });

  describe('stats calculation', () => {
    it('should calculate correct stats', (done) => {
      service.addMapping(createTestMapping(1));
      service.addMapping(createTestMapping(2));
      service.addMapping(createTestMapping(3));

      service.stats$.subscribe(stats => {
        if (stats.totalMappings === 3) {
          expect(stats.totalMappings).toBe(3);
          expect(stats.totalSize).toBe(6000); // 1000 + 2000 + 3000
          expect(stats.pinnedCount).toBe(1); // only mapping 2 is pinned
          expect(stats.oldestMapping).toEqual(new Date(2024, 0, 1));
          expect(stats.newestMapping).toEqual(new Date(2024, 0, 3));
          done();
        }
      });
    });
  });

  describe('localStorage persistence', () => {
    it('should load mappings from localStorage on init', () => {
      const savedData = {
        version: '1.0',
        mappings: [createTestMapping(1)]
      };
      
      mockLocalStorage.getItem.and.returnValue(JSON.stringify(savedData));
      
      // Create new service instance to trigger loading
      const newService = new IPFSCIDMappingService();
      
      newService.mappings$.subscribe(mappings => {
        expect(mappings.length).toBe(1);
      });
    });
  });
});