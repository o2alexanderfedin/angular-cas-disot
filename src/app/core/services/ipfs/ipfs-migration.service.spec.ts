import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IPFSMigrationService, MigrationProgress } from './ipfs-migration.service';
import { STORAGE_PROVIDER, STORAGE_TYPE, StorageType } from '../storage-provider.factory';
import { IStorageProvider } from '../../domain/interfaces/storage.interface';
import { IPFSStorageService } from './ipfs-storage.service';

describe('IPFSMigrationService', () => {
  let service: IPFSMigrationService;
  let mockSourceProvider: jasmine.SpyObj<IStorageProvider>;
  let mockTargetProvider: jasmine.SpyObj<IPFSStorageService>;
  let progressUpdates: MigrationProgress[] = [];

  beforeEach(() => {
    mockSourceProvider = jasmine.createSpyObj('IStorageProvider', 
      ['list', 'read', 'write', 'exists', 'delete']);
    mockTargetProvider = jasmine.createSpyObj('IPFSStorageService', 
      ['list', 'read', 'write', 'exists', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        IPFSMigrationService,
        { provide: STORAGE_PROVIDER, useValue: mockSourceProvider },
        { provide: STORAGE_TYPE, useValue: StorageType.INDEXED_DB }
      ]
    });

    service = TestBed.inject(IPFSMigrationService);

    // Subscribe to progress updates
    progressUpdates = [];
    service.progress$.subscribe(progress => progressUpdates.push(progress));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial idle state', () => {
    expect(progressUpdates[0]).toEqual({
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      status: 'idle',
      errors: []
    });
  });

  describe('migrateToIPFS', () => {
    const mockPaths = ['/file1.txt', '/file2.txt', '/file3.txt'];
    const mockData = new Uint8Array([1, 2, 3, 4, 5]);

    beforeEach(() => {
      mockSourceProvider.list.and.returnValue(Promise.resolve(mockPaths));
      mockSourceProvider.read.and.returnValue(Promise.resolve(mockData));
      mockTargetProvider.exists.and.returnValue(Promise.resolve(false));
      mockTargetProvider.write.and.returnValue(Promise.resolve());
      mockSourceProvider.delete.and.returnValue(Promise.resolve());
    });

    it('should migrate all files successfully', async () => {
      const result = await service.migrateToIPFS(mockTargetProvider);

      expect(result.status).toBe('completed');
      expect(result.totalItems).toBe(3);
      expect(result.processedItems).toBe(3);
      expect(result.successfulItems).toBe(3);
      expect(result.failedItems).toBe(0);
      expect(mockTargetProvider.write).toHaveBeenCalledTimes(3);
    });

    it('should handle migration with batch size', async () => {
      const result = await service.migrateToIPFS(mockTargetProvider, { batchSize: 2 });

      expect(result.status).toBe('completed');
      expect(result.successfulItems).toBe(3);
      // Should process in 2 batches (2 + 1)
      expect(mockTargetProvider.write).toHaveBeenCalledTimes(3);
    });

    it('should skip existing files when skipExisting is true', async () => {
      mockTargetProvider.exists.and.returnValue(Promise.resolve(true));

      const result = await service.migrateToIPFS(mockTargetProvider, { skipExisting: true });

      expect(result.successfulItems).toBe(3);
      expect(mockTargetProvider.write).not.toHaveBeenCalled();
    });

    it('should not skip existing files when skipExisting is false', async () => {
      mockTargetProvider.exists.and.returnValue(Promise.resolve(true));

      const result = await service.migrateToIPFS(mockTargetProvider, { skipExisting: false });

      expect(result.successfulItems).toBe(3);
      expect(mockTargetProvider.write).toHaveBeenCalledTimes(3);
    });

    it('should delete source files when deleteAfterMigration is true', async () => {
      const result = await service.migrateToIPFS(mockTargetProvider, { deleteAfterMigration: true });

      expect(result.successfulItems).toBe(3);
      expect(mockSourceProvider.delete).toHaveBeenCalledTimes(3);
    });

    it('should not delete source files when deleteAfterMigration is false', async () => {
      const result = await service.migrateToIPFS(mockTargetProvider, { deleteAfterMigration: false });

      expect(result.successfulItems).toBe(3);
      expect(mockSourceProvider.delete).not.toHaveBeenCalled();
    });

    it('should apply filter function', async () => {
      const filter = (path: string) => path.includes('file1');
      const result = await service.migrateToIPFS(mockTargetProvider, { filter });

      expect(result.totalItems).toBe(1);
      expect(result.successfulItems).toBe(1);
      expect(mockTargetProvider.write).toHaveBeenCalledTimes(1);
    });

    it('should handle read errors', async () => {
      mockSourceProvider.read.and.returnValue(Promise.reject(new Error('Read failed')));

      const result = await service.migrateToIPFS(mockTargetProvider);

      expect(result.status).toBe('failed');
      expect(result.failedItems).toBe(3);
      expect(result.errors.length).toBe(3);
      expect(result.errors[0].error).toBe('Read failed');
    });

    it('should handle write errors', async () => {
      mockTargetProvider.write.and.returnValue(Promise.reject(new Error('Write failed')));

      const result = await service.migrateToIPFS(mockTargetProvider);

      expect(result.status).toBe('failed');
      expect(result.failedItems).toBe(3);
      expect(result.errors[0].error).toBe('Write failed');
    });

    it('should handle partial failures', async () => {
      let callCount = 0;
      mockTargetProvider.write.and.callFake(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Write failed'));
        }
        return Promise.resolve();
      });

      const result = await service.migrateToIPFS(mockTargetProvider);

      expect(result.status).toBe('failed');
      expect(result.successfulItems).toBe(2);
      expect(result.failedItems).toBe(1);
    });

    it('should track progress updates', async () => {
      await service.migrateToIPFS(mockTargetProvider);

      // Check progress updates
      const statusUpdates = progressUpdates.map(p => p.status);
      expect(statusUpdates).toContain('preparing');
      expect(statusUpdates).toContain('migrating');
      expect(statusUpdates).toContain('completed');
    });

    it('should prevent concurrent migrations', async () => {
      const migration1 = service.migrateToIPFS(mockTargetProvider);
      const migration2 = service.migrateToIPFS(mockTargetProvider);

      await expectAsync(migration2).toBeRejectedWithError('Migration is already in progress');
      await migration1; // Let first migration complete
    });

    it('should prevent migration to same provider', async () => {
      await expectAsync(service.migrateToIPFS(mockSourceProvider as any))
        .toBeRejectedWithError('Cannot migrate to the same storage provider');
    });
  });

  describe('cancelMigration', () => {
    it('should cancel ongoing migration', fakeAsync(() => {
      const mockPaths = Array.from({ length: 100 }, (_, i) => `/file${i}.txt`);
      mockSourceProvider.list.and.returnValue(Promise.resolve(mockPaths));
      mockSourceProvider.read.and.callFake(() => {
        return new Promise(resolve => setTimeout(() => resolve(new Uint8Array()), 100));
      });
      mockTargetProvider.write.and.callFake(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });

      service.migrateToIPFS(mockTargetProvider, { batchSize: 1 });

      tick(150); // Process one item
      service.cancelMigration();
      tick(10000); // Wait for potential completion

      expect(service.isMigrationRunning()).toBe(false);
    }));
  });

  describe('getMigrationStats', () => {
    it('should indicate migration is possible from non-IPFS storage', () => {
      const stats = service.getMigrationStats();
      expect(stats.canMigrate).toBe(true);
      expect(stats.currentStorageType).toBe(StorageType.INDEXED_DB);
    });

    it('should indicate migration is not possible from IPFS storage', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          IPFSMigrationService,
          { provide: STORAGE_PROVIDER, useValue: mockSourceProvider },
          { provide: STORAGE_TYPE, useValue: StorageType.IPFS }
        ]
      });
      service = TestBed.inject(IPFSMigrationService);

      const stats = service.getMigrationStats();
      expect(stats.canMigrate).toBe(false);
    });
  });

  describe('estimateMigrationSize', () => {
    it('should estimate migration size based on sample', async () => {
      const mockPaths = Array.from({ length: 100 }, (_, i) => `/file${i}.txt`);
      const mockData = new Uint8Array(1024); // 1KB per file

      mockSourceProvider.list.and.returnValue(Promise.resolve(mockPaths));
      mockSourceProvider.read.and.returnValue(Promise.resolve(mockData));

      const estimate = await service.estimateMigrationSize();

      expect(estimate.itemCount).toBe(100);
      expect(estimate.totalSize).toBeGreaterThan(0);
      expect(estimate.estimatedTime).toBeGreaterThan(0);
      // Should only read sample size (10 items)
      expect(mockSourceProvider.read).toHaveBeenCalledTimes(10);
    });

    it('should handle read errors in estimation', async () => {
      mockSourceProvider.list.and.returnValue(Promise.resolve(['/file1.txt']));
      mockSourceProvider.read.and.returnValue(Promise.reject(new Error('Read failed')));

      const estimate = await service.estimateMigrationSize();

      expect(estimate.itemCount).toBe(1);
      expect(estimate.totalSize).toBe(0);
      expect(estimate.estimatedTime).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset migration state', async () => {
      // Run a migration first
      mockSourceProvider.list.and.returnValue(Promise.resolve(['/file.txt']));
      mockSourceProvider.read.and.returnValue(Promise.resolve(new Uint8Array()));
      mockTargetProvider.write.and.returnValue(Promise.resolve());

      await service.migrateToIPFS(mockTargetProvider);

      // Reset
      service.reset();

      const currentProgress = progressUpdates[progressUpdates.length - 1];
      expect(currentProgress).toEqual({
        totalItems: 0,
        processedItems: 0,
        successfulItems: 0,
        failedItems: 0,
        status: 'idle',
        errors: []
      });
    });
  });

  describe('isMigrationRunning', () => {
    it('should correctly report migration status', async () => {
      expect(service.isMigrationRunning()).toBe(false);

      mockSourceProvider.list.and.returnValue(Promise.resolve(['/file.txt']));
      mockSourceProvider.read.and.returnValue(Promise.resolve(new Uint8Array()));
      mockTargetProvider.write.and.returnValue(Promise.resolve());

      const migrationPromise = service.migrateToIPFS(mockTargetProvider);
      expect(service.isMigrationRunning()).toBe(true);

      await migrationPromise;
      expect(service.isMigrationRunning()).toBe(false);
    });
  });
});