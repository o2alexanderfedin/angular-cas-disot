import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IPFSStatusIndicatorComponent } from './ipfs-status-indicator.component';
import { IPFS_CONFIG } from '../../core/services/ipfs/ipfs-storage.service';
import { StorageType, STORAGE_TYPE, STORAGE_PROVIDER } from '../../core/services/storage-provider.factory';
import { DEFAULT_IPFS_CONFIG } from '../../core/services/ipfs/ipfs.config';

describe('IPFSStatusIndicatorComponent', () => {
  let component: IPFSStatusIndicatorComponent;
  let fixture: ComponentFixture<IPFSStatusIndicatorComponent>;
  let mockStorageProvider: any;

  beforeEach(async () => {
    // Create a more flexible mock that includes isHealthy as a spy
    mockStorageProvider = {
      write: jasmine.createSpy('write'),
      read: jasmine.createSpy('read'),
      exists: jasmine.createSpy('exists'),
      delete: jasmine.createSpy('delete'),
      list: jasmine.createSpy('list'),
      isHealthy: jasmine.createSpy('isHealthy').and.returnValue(Promise.resolve(true))
    };
    
    await TestBed.configureTestingModule({
      imports: [IPFSStatusIndicatorComponent, HttpClientTestingModule],
      providers: [
        { provide: STORAGE_TYPE, useValue: StorageType.IPFS },
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IPFSStatusIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show indicator only when storage type is IPFS', () => {
    mockStorageProvider.isHealthy.and.returnValue(Promise.resolve(true));
    fixture.detectChanges();

    const statusElement = fixture.nativeElement.querySelector('.ipfs-status');
    expect(statusElement).toBeTruthy();
  });

  it('should not show indicator for other storage types', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [IPFSStatusIndicatorComponent, HttpClientTestingModule],
      providers: [
        { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
      ]
    });
    
    const nonIpfsFixture = TestBed.createComponent(IPFSStatusIndicatorComponent);
    nonIpfsFixture.detectChanges();

    const statusElement = nonIpfsFixture.nativeElement.querySelector('.ipfs-status');
    expect(statusElement).toBeFalsy();
  });

  it('should show connected status when IPFS is healthy', fakeAsync(() => {
    mockStorageProvider.isHealthy.and.returnValue(Promise.resolve(true));
    
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    expect(component.isConnected).toBe(true);
    
    const statusText = fixture.nativeElement.querySelector('.status-text');
    expect(statusText.textContent).toContain('Connected');
    
    const indicator = fixture.nativeElement.querySelector('.status-indicator');
    expect(indicator.classList).toContain('connected');
  }));

  it('should show disconnected status when IPFS is not healthy', fakeAsync(() => {
    mockStorageProvider.isHealthy.and.returnValue(Promise.resolve(false));
    
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    expect(component.isConnected).toBe(false);
    
    const statusText = fixture.nativeElement.querySelector('.status-text');
    expect(statusText.textContent).toContain('Disconnected');
    
    const indicator = fixture.nativeElement.querySelector('.status-indicator');
    expect(indicator.classList).toContain('disconnected');
  }));

  it('should handle connection errors', fakeAsync(() => {
    const error = new Error('Connection refused');
    mockStorageProvider.isHealthy.and.returnValue(Promise.reject(error));
    
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    expect(component.isConnected).toBe(false);
    expect(component.errorMessage).toBe('Connection refused');
  }));

  it('should periodically check connection status', fakeAsync(() => {
    let callCount = 0;
    mockStorageProvider.isHealthy.and.callFake(() => {
      callCount++;
      return Promise.resolve(callCount > 2);
    });
    
    fixture.detectChanges();
    
    // Initial check
    tick(100);
    expect(mockStorageProvider.isHealthy).toHaveBeenCalledTimes(2); // Initial + timer start
    expect(component.isConnected).toBe(false);
    
    // After 30 seconds
    tick(30000);
    expect(mockStorageProvider.isHealthy).toHaveBeenCalledTimes(3);
    expect(component.isConnected).toBe(true);
  }));

  it('should toggle details visibility', () => {
    fixture.detectChanges();
    
    expect(component.showDetails).toBe(false);
    
    component.toggleDetails();
    expect(component.showDetails).toBe(true);
    
    component.toggleDetails();
    expect(component.showDetails).toBe(false);
  });

  it('should show error message in details when disconnected', fakeAsync(() => {
    mockStorageProvider.isHealthy.and.returnValue(Promise.reject(new Error('Node not found')));
    
    component.showDetails = true;
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    const details = fixture.nativeElement.querySelector('.status-details');
    expect(details.textContent).toContain('Node not found');
  }));

  it('should show healthy message in details when connected', fakeAsync(() => {
    mockStorageProvider.isHealthy.and.returnValue(Promise.resolve(true));
    
    component.showDetails = true;
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    const details = fixture.nativeElement.querySelector('.status-details');
    expect(details.textContent).toContain('Node is healthy');
  }));

  it('should show indicator for Helia storage type', async () => {
    TestBed.resetTestingModule();
    const heliaProvider = {
      write: jasmine.createSpy('write'),
      read: jasmine.createSpy('read'),
      exists: jasmine.createSpy('exists'),
      delete: jasmine.createSpy('delete'),
      list: jasmine.createSpy('list'),
      isHealthy: jasmine.createSpy('isHealthy').and.returnValue(Promise.resolve(true))
    };
    
    TestBed.configureTestingModule({
      imports: [IPFSStatusIndicatorComponent, HttpClientTestingModule],
      providers: [
        { provide: STORAGE_TYPE, useValue: StorageType.HELIA },
        { provide: STORAGE_PROVIDER, useValue: heliaProvider },
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
      ]
    });
    
    const heliaFixture = TestBed.createComponent(IPFSStatusIndicatorComponent);
    heliaFixture.detectChanges();

    const statusElement = heliaFixture.nativeElement.querySelector('.ipfs-status');
    expect(statusElement).toBeTruthy();
    
    const statusText = heliaFixture.nativeElement.querySelector('.status-text');
    expect(statusText.textContent).toContain('Helia');
  });

  it('should clean up on destroy', fakeAsync(() => {
    mockStorageProvider.isHealthy.and.returnValue(Promise.resolve(true));
    
    fixture.detectChanges();
    tick(100);
    
    const initialCallCount = mockStorageProvider.isHealthy.calls.count();
    
    // Destroy component
    fixture.destroy();
    
    // Wait for what would be the next check
    tick(30000);
    
    // Should not have made any more calls after destroy
    expect(mockStorageProvider.isHealthy.calls.count()).toBe(initialCallCount);
  }));
});