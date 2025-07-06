import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MigrationComponent } from './migration.component';
import { IPFSMigrationService } from '../../../core/services/ipfs/ipfs-migration.service';
import { STORAGE_PROVIDER, STORAGE_TYPE, StorageType } from '../../../core/services/storage-provider.factory';
import { IPFSStorageService, IPFS_CONFIG } from '../../../core/services/ipfs/ipfs-storage.service';
import { HeliaStorageService } from '../../../core/services/helia/helia-storage.service';
import { IPFSShareLinkService } from '../../../core/services/ipfs/ipfs-share-link.service';
import { IStorageProvider } from '../../../core/domain/interfaces/storage.interface';
import { BehaviorSubject } from 'rxjs';
import { DEFAULT_IPFS_CONFIG } from '../../../core/services/ipfs/ipfs.config';

describe('MigrationComponent', () => {
  let component: MigrationComponent;
  let fixture: ComponentFixture<MigrationComponent>;
  let migrationService: jasmine.SpyObj<IPFSMigrationService>;
  let storageProvider: jasmine.SpyObj<IStorageProvider>;
  let ipfsStorage: jasmine.SpyObj<IPFSStorageService>;
  let heliaStorage: jasmine.SpyObj<HeliaStorageService>;
  let progressSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    progressSubject = new BehaviorSubject({
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      status: 'idle',
      errors: []
    });

    migrationService = jasmine.createSpyObj('IPFSMigrationService', [
      'getMigrationStats',
      'estimateMigrationSize',
      'migrateToIPFS',
      'cancelMigration',
      'reset'
    ], {
      progress$: progressSubject.asObservable()
    });

    storageProvider = jasmine.createSpyObj('IStorageProvider', [
      'write', 'read', 'exists', 'delete', 'list'
    ]);

    ipfsStorage = jasmine.createSpyObj('IPFSStorageService', [
      'write', 'read', 'exists', 'delete', 'list'
    ]);

    heliaStorage = jasmine.createSpyObj('HeliaStorageService', [
      'write', 'read', 'exists', 'delete', 'list'
    ]);

    await TestBed.configureTestingModule({
      imports: [MigrationComponent],
      providers: [
        { provide: IPFSMigrationService, useValue: migrationService },
        { provide: STORAGE_TYPE, useValue: StorageType.INDEXED_DB },
        { provide: STORAGE_PROVIDER, useValue: storageProvider },
        { provide: IPFSStorageService, useValue: ipfsStorage },
        { provide: HeliaStorageService, useValue: heliaStorage },
        { provide: IPFSShareLinkService, useValue: {} },
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MigrationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should check if migration is possible on init', () => {
      migrationService.getMigrationStats.and.returnValue({
        canMigrate: true,
        currentStorageType: StorageType.INDEXED_DB
      });

      fixture.detectChanges();

      expect(component.canMigrate).toBe(true);
      expect(component.currentStorageType).toBe(StorageType.INDEXED_DB);
    });

    it('should show info message when migration is not possible', () => {
      migrationService.getMigrationStats.and.returnValue({
        canMigrate: false,
        currentStorageType: StorageType.IPFS
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.info-message')).toBeTruthy();
      expect(compiled.querySelector('.migration-content')).toBeFalsy();
    });

    it('should subscribe to migration progress', () => {
      migrationService.getMigrationStats.and.returnValue({
        canMigrate: true,
        currentStorageType: StorageType.INDEXED_DB
      });

      fixture.detectChanges();

      progressSubject.next({
        totalItems: 10,
        processedItems: 5,
        successfulItems: 5,
        failedItems: 0,
        status: 'migrating',
        errors: []
      });

      expect(component.progress).toBeDefined();
      expect(component.progress?.processedItems).toBe(5);
      expect(component.isRunning).toBe(true);
    });
  });

  describe('migration estimation', () => {
    beforeEach(() => {
      migrationService.getMigrationStats.and.returnValue({
        canMigrate: true,
        currentStorageType: StorageType.INDEXED_DB
      });
      fixture.detectChanges();
    });

    it('should estimate migration size', async () => {
      const mockEstimate = {
        itemCount: 100,
        totalSize: 1048576,
        estimatedTime: 60
      };
      migrationService.estimateMigrationSize.and.returnValue(Promise.resolve(mockEstimate));

      await component.estimateMigration();

      expect(component.estimate).toEqual(mockEstimate);
      expect(component.isEstimating).toBe(false);
    });

    it('should handle estimation errors', async () => {
      migrationService.estimateMigrationSize.and.returnValue(Promise.reject(new Error('Estimation failed')));

      await component.estimateMigration();

      expect(component.estimate).toBeUndefined();
      expect(component.isEstimating).toBe(false);
    });
  });

  describe('migration process', () => {
    beforeEach(() => {
      migrationService.getMigrationStats.and.returnValue({
        canMigrate: true,
        currentStorageType: StorageType.INDEXED_DB
      });
      fixture.detectChanges();
    });

    it('should start migration to IPFS', async () => {
      component.targetStorageType = StorageType.IPFS;
      migrationService.migrateToIPFS.and.returnValue(Promise.resolve({
        totalItems: 10,
        processedItems: 10,
        successfulItems: 10,
        failedItems: 0,
        status: 'completed' as const,
        errors: []
      }));

      await component.startMigration();

      expect(migrationService.migrateToIPFS).toHaveBeenCalledWith(ipfsStorage, component.options);
    });

    it('should start migration to Helia', async () => {
      component.targetStorageType = StorageType.HELIA;
      migrationService.migrateToIPFS.and.returnValue(Promise.resolve({
        totalItems: 10,
        processedItems: 10,
        successfulItems: 10,
        failedItems: 0,
        status: 'completed' as const,
        errors: []
      }));

      await component.startMigration();

      expect(migrationService.migrateToIPFS).toHaveBeenCalledWith(heliaStorage, component.options);
    });

    it('should not start migration without target storage type', async () => {
      component.targetStorageType = undefined;

      await component.startMigration();

      expect(migrationService.migrateToIPFS).not.toHaveBeenCalled();
    });

    it('should handle migration errors', async () => {
      component.targetStorageType = StorageType.IPFS;
      migrationService.migrateToIPFS.and.returnValue(Promise.reject(new Error('Migration failed')));

      await component.startMigration();

      expect(migrationService.migrateToIPFS).toHaveBeenCalled();
    });
  });

  describe('migration controls', () => {
    beforeEach(() => {
      migrationService.getMigrationStats.and.returnValue({
        canMigrate: true,
        currentStorageType: StorageType.INDEXED_DB
      });
      fixture.detectChanges();
    });

    it('should cancel migration', () => {
      component.cancelMigration();
      expect(migrationService.cancelMigration).toHaveBeenCalled();
    });

    it('should reset migration', () => {
      component.estimate = { itemCount: 10, totalSize: 1000, estimatedTime: 10 };
      component.targetStorageType = StorageType.IPFS;

      component.resetMigration();

      expect(migrationService.reset).toHaveBeenCalled();
      expect(component.estimate).toBeUndefined();
      expect(component.targetStorageType).toBeUndefined();
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress percentage', () => {
      component.progress = {
        totalItems: 100,
        processedItems: 50,
        successfulItems: 45,
        failedItems: 5,
        status: 'migrating',
        errors: []
      };

      expect(component.getProgressPercentage()).toBe(50);
    });

    it('should handle zero total items', () => {
      component.progress = {
        totalItems: 0,
        processedItems: 0,
        successfulItems: 0,
        failedItems: 0,
        status: 'idle',
        errors: []
      };

      expect(component.getProgressPercentage()).toBe(0);
    });

    it('should handle undefined progress', () => {
      component.progress = undefined;
      expect(component.getProgressPercentage()).toBe(0);
    });
  });

  describe('formatting helpers', () => {
    it('should format bytes correctly', () => {
      expect(component.formatBytes(0)).toBe('0 Bytes');
      expect(component.formatBytes(1024)).toBe('1 KB');
      expect(component.formatBytes(1048576)).toBe('1 MB');
      expect(component.formatBytes(1073741824)).toBe('1 GB');
    });

    it('should format time correctly', () => {
      expect(component.formatTime(30)).toBe('30 seconds');
      expect(component.formatTime(90)).toBe('1 minutes');
      expect(component.formatTime(3700)).toBe('1 hours');
    });

    it('should get storage type names', () => {
      expect(component.getStorageTypeName(StorageType.IN_MEMORY)).toBe('In-Memory Storage');
      expect(component.getStorageTypeName(StorageType.INDEXED_DB)).toBe('IndexedDB');
      expect(component.getStorageTypeName(StorageType.IPFS)).toBe('IPFS');
      expect(component.getStorageTypeName(StorageType.HELIA)).toBe('Helia');
    });
  });

  describe('UI rendering', () => {
    beforeEach(() => {
      migrationService.getMigrationStats.and.returnValue({
        canMigrate: true,
        currentStorageType: StorageType.INDEXED_DB
      });
      fixture.detectChanges();
    });

    it('should show migration options when not running', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.migration-options')).toBeTruthy();
      expect(compiled.querySelector('.migration-progress')).toBeFalsy();
    });

    it('should show progress when running', () => {
      progressSubject.next({
        totalItems: 10,
        processedItems: 5,
        successfulItems: 5,
        failedItems: 0,
        status: 'migrating',
        errors: []
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.migration-progress')).toBeTruthy();
      expect(compiled.querySelector('.migration-options')).toBeFalsy();
    });

    it('should show completion message when done', () => {
      progressSubject.next({
        totalItems: 10,
        processedItems: 10,
        successfulItems: 10,
        failedItems: 0,
        status: 'completed',
        errors: []
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.migration-complete')).toBeTruthy();
      expect(compiled.querySelector('.success-message')).toBeTruthy();
    });

    it('should show errors when present', () => {
      progressSubject.next({
        totalItems: 10,
        processedItems: 8,
        successfulItems: 6,
        failedItems: 2,
        status: 'migrating',  // Use migrating status so isRunning is true
        errors: [
          { path: '/file1.txt', error: 'Write failed' },
          { path: '/file2.txt', error: 'Read failed' }
        ]
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      // Errors are shown in the progress section during migration
      const migrationProgress = compiled.querySelector('.migration-progress');
      expect(migrationProgress).toBeTruthy();
      
      // Look for error section within progress
      const errorSection = compiled.querySelector('.migration-errors');
      expect(errorSection).toBeTruthy();
      
      // Check for error list items
      const errorItems = compiled.querySelectorAll('.error-list li');
      expect(errorItems.length).toBe(2);
    });
  });
});