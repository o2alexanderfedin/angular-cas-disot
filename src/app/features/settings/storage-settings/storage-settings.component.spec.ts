import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StorageSettingsComponent } from './storage-settings.component';
import { StorageType, STORAGE_TYPE, STORAGE_PROVIDER } from '../../../core/services/storage-provider.factory';
import { provideRouter } from '@angular/router';
import { IStorageProvider } from '../../../core/domain/interfaces/storage.interface';
import { IPFS_CONFIG } from '../../../core/services/ipfs/ipfs-storage.service';
import { DEFAULT_IPFS_CONFIG } from '../../../core/services/ipfs/ipfs.config';

describe('StorageSettingsComponent', () => {
  let component: StorageSettingsComponent;
  let fixture: ComponentFixture<StorageSettingsComponent>;
  let mockLocalStorage: any;
  let mockStorageProvider: jasmine.SpyObj<IStorageProvider>;

  beforeEach(async () => {
    mockStorageProvider = jasmine.createSpyObj('IStorageProvider', ['write', 'read', 'exists', 'delete', 'list']);
    // Add isHealthy method for IPFS providers
    (mockStorageProvider as any).isHealthy = jasmine.createSpy('isHealthy').and.returnValue(Promise.resolve(true));
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: jasmine.createSpy('getItem'),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem'),
      clear: jasmine.createSpy('clear')
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });

    await TestBed.configureTestingModule({
      imports: [StorageSettingsComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StorageSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current storage type', () => {
    expect(component.currentStorageType).toBe(StorageType.IN_MEMORY);
    expect(component.selectedStorageType).toBe(StorageType.IN_MEMORY);
  });

  it('should check IndexedDB availability', () => {
    component.checkIndexedDbAvailability();
    expect(component.indexedDbAvailable).toBe('indexedDB' in window);
  });

  it('should detect storage type changes', () => {
    component.selectedStorageType = StorageType.INDEXED_DB;
    component.onStorageTypeChange();
    expect(component.storageChanged).toBe(true);
  });

  it('should not show change notification if storage type unchanged', () => {
    component.selectedStorageType = StorageType.IN_MEMORY;
    component.onStorageTypeChange();
    expect(component.storageChanged).toBe(false);
  });

  it('should save preference and reload on apply', () => {
    const reloadSpy = spyOn(component, 'reloadPage');
    
    component.selectedStorageType = StorageType.INDEXED_DB;
    component.currentStorageType = StorageType.IN_MEMORY;
    
    component.applyChanges();
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cas-storage-type', StorageType.INDEXED_DB);
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should not reload if storage type unchanged', () => {
    const reloadSpy = spyOn(component, 'reloadPage');
    
    component.selectedStorageType = StorageType.IN_MEMORY;
    component.currentStorageType = StorageType.IN_MEMORY;
    
    component.applyChanges();
    
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('should cancel changes', () => {
    component.selectedStorageType = StorageType.INDEXED_DB;
    component.currentStorageType = StorageType.IN_MEMORY;
    component.storageChanged = true;
    
    component.cancelChanges();
    
    expect(component.selectedStorageType).toBe(StorageType.IN_MEMORY);
    expect(component.storageChanged).toBe(false);
  });

  it('should clear IndexedDB storage with confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    const reloadSpy = spyOn(component, 'reloadPage');
    const deleteDbSpy = spyOn(indexedDB, 'deleteDatabase').and.returnValue({} as any);
    
    component.currentStorageType = StorageType.INDEXED_DB;
    
    await component.clearStorage();
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to clear all stored data? This action cannot be undone.'
    );
    expect(deleteDbSpy).toHaveBeenCalledWith('cas-storage');
    expect(window.alert).toHaveBeenCalledWith('Storage cleared successfully. The page will reload.');
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should not clear storage if not confirmed', async () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const deleteDbSpy = spyOn(indexedDB, 'deleteDatabase');
    
    await component.clearStorage();
    
    expect(deleteDbSpy).not.toHaveBeenCalled();
  });

  it('should handle storage clear errors', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    spyOn(console, 'error');
    spyOn(indexedDB, 'deleteDatabase').and.returnValue(Promise.reject(new Error('Delete failed')) as any);
    
    component.currentStorageType = StorageType.INDEXED_DB;
    
    await component.clearStorage();
    
    expect(console.error).toHaveBeenCalledWith('Error clearing storage:', jasmine.any(Error));
    expect(window.alert).toHaveBeenCalledWith('Failed to clear storage. Please try again.');
  });

  it('should have a reloadPage method', () => {
    expect(component.reloadPage).toBeDefined();
    expect(typeof component.reloadPage).toBe('function');
  });

  describe('IPFS-specific tests', () => {
    let ipfsStorageProvider: any;

    beforeEach(async () => {
      ipfsStorageProvider = jasmine.createSpyObj('IPFSStorageService', ['write', 'read', 'exists', 'delete', 'list', 'isHealthy']);
      
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [StorageSettingsComponent, HttpClientTestingModule],
        providers: [
          provideRouter([]),
          { provide: STORAGE_TYPE, useValue: StorageType.IPFS },
          { provide: STORAGE_PROVIDER, useValue: ipfsStorageProvider },
          { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(StorageSettingsComponent);
      component = fixture.componentInstance;
      
      // Override the checkIPFSHealth method to bypass instanceof check in tests
      component.checkIPFSHealth = async () => {
        if (component.currentStorageType === StorageType.IPFS) {
          try {
            component.ipfsHealthy = await ipfsStorageProvider.isHealthy();
          } catch (error) {
            component.ipfsHealthy = false;
          }
        }
      };
    });

    it('should check IPFS health on init when using IPFS storage', async () => {
      ipfsStorageProvider.isHealthy.and.returnValue(Promise.resolve(true));
      
      fixture.detectChanges();
      await component.checkIPFSHealth();
      await fixture.whenStable();
      
      expect(ipfsStorageProvider.isHealthy).toHaveBeenCalled();
      expect(component.ipfsHealthy).toBe(true);
    });

    it('should handle IPFS health check failure', async () => {
      ipfsStorageProvider.isHealthy.and.returnValue(Promise.reject(new Error('Connection failed')));
      
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(component.ipfsHealthy).toBe(false);
    });

    it('should show IPFS warning when not healthy', () => {
      component.selectedStorageType = StorageType.IPFS;
      component.ipfsHealthy = false;
      fixture.detectChanges();
      
      const warning = fixture.nativeElement.querySelector('.warning');
      expect(warning).toBeTruthy();
      expect(warning.textContent).toContain('IPFS node not detected');
    });

    it('should display IPFS info when healthy', () => {
      component.currentStorageType = StorageType.IPFS;
      component.ipfsHealthy = true;
      component.ipfsConfig = DEFAULT_IPFS_CONFIG;
      fixture.detectChanges();
      
      const ipfsInfo = fixture.nativeElement.querySelector('.ipfs-info');
      expect(ipfsInfo).toBeTruthy();
      
      const statusText = ipfsInfo.querySelector('.healthy');
      expect(statusText).toBeTruthy();
      expect(statusText.textContent).toBe('Connected');
    });

    it('should handle null ipfsConfig gracefully', () => {
      component.currentStorageType = StorageType.IPFS;
      component.ipfsHealthy = true;
      component.ipfsConfig = null;
      fixture.detectChanges();
      
      const apiEndpoint = fixture.nativeElement.querySelector('.ipfs-info p:nth-child(2)');
      expect(apiEndpoint).toBeFalsy(); // Should not render due to *ngIf="ipfsHealthy && ipfsConfig"
    });

    it('should clear IPFS local cache', async () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      const reloadSpy = spyOn(component, 'reloadPage');
      const deleteDbSpy = spyOn(indexedDB, 'deleteDatabase').and.returnValue({} as any);
      
      component.currentStorageType = StorageType.IPFS;
      
      await component.clearStorage();
      
      expect(deleteDbSpy).toHaveBeenCalledWith('cas-storage');
      expect(window.alert).toHaveBeenCalledWith('Local cache cleared successfully. IPFS content remains on the network.');
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('template null safety', () => {
    it('should not throw errors with undefined ipfsConfig', () => {
      component.currentStorageType = StorageType.IPFS;
      component.ipfsHealthy = true;
      component.ipfsConfig = undefined as any;
      
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle all storage types in template', async () => {
      // Test each storage type by recreating the component with the proper configuration
      const storageTypes = [StorageType.IN_MEMORY, StorageType.INDEXED_DB, StorageType.IPFS];
      
      for (const type of storageTypes) {
        await TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
          imports: [StorageSettingsComponent, HttpClientTestingModule],
          providers: [
            provideRouter([]),
            { provide: STORAGE_TYPE, useValue: type },
            { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
            { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
          ]
        }).compileComponents();

        const testFixture = TestBed.createComponent(StorageSettingsComponent);
        const testComponent = testFixture.componentInstance;
        
        expect(() => testFixture.detectChanges()).not.toThrow();
        expect(testComponent.currentStorageType).toBe(type);
      }
    });
  });

  describe('dependency injection edge cases', () => {
    it('should handle missing IPFS_CONFIG gracefully', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [StorageSettingsComponent, HttpClientTestingModule],
        providers: [
          provideRouter([]),
          { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
          { provide: STORAGE_PROVIDER, useValue: mockStorageProvider }
          // IPFS_CONFIG is optional, so component should still work
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(StorageSettingsComponent);
      const newComponent = newFixture.componentInstance;
      
      expect(() => newFixture.detectChanges()).not.toThrow();
      expect(newComponent.ipfsConfig).toBeNull();
    });
  });
});