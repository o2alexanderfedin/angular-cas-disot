import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageSettingsComponent } from './storage-settings.component';
import { StorageType, STORAGE_TYPE } from '../../../core/services/storage-provider.factory';
import { Router } from '@angular/router';

describe('StorageSettingsComponent', () => {
  let component: StorageSettingsComponent;
  let fixture: ComponentFixture<StorageSettingsComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLocalStorage: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: jasmine.createSpy('getItem'),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem'),
      clear: jasmine.createSpy('clear')
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });

    await TestBed.configureTestingModule({
      imports: [StorageSettingsComponent],
      providers: [
        { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
        { provide: Router, useValue: mockRouter }
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
});