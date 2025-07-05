import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentUploadComponent } from './content-upload.component';
import { CasService } from '../../../core/services/cas.service';
import { SharedModule } from '../../../shared/shared-module';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';
import { Router } from '@angular/router';

describe('ContentUploadComponent', () => {
  let component: ContentUploadComponent;
  let fixture: ComponentFixture<ContentUploadComponent>;
  let casService: jasmine.SpyObj<CasService>;
  let router: jasmine.SpyObj<any>;

  beforeEach(async () => {
    const casSpy = jasmine.createSpyObj('CasService', ['store', 'exists']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ContentUploadComponent, SharedModule],
      providers: [
        { provide: CasService, useValue: casSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentUploadComponent);
    component = fixture.componentInstance;
    casService = TestBed.inject(CasService) as jasmine.SpyObj<CasService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<any>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(component.selectedFile).toBeNull();
    expect(component.uploadedHash).toBeNull();
    expect(component.isUploading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('should handle file selection', () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [mockFile] } } as any;

    component.onFileSelected(event);

    expect(component.selectedFile).toBe(mockFile);
    expect(component.errorMessage).toBe('');
  });

  it('should clear error when selecting new file', () => {
    component.errorMessage = 'Previous error';
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [mockFile] } } as any;

    component.onFileSelected(event);

    expect(component.errorMessage).toBe('');
  });

  it('should upload file to CAS', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'testhash123' };
    
    component.selectedFile = mockFile;
    casService.store.and.returnValue(Promise.resolve(mockHash));

    await component.uploadFile();

    expect(casService.store).toHaveBeenCalled();
    expect(component.uploadedHash).toEqual(mockHash);
    expect(component.isUploading).toBe(false);
  });

  it('should emit contentStored event after upload', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'testhash123' };
    
    component.selectedFile = mockFile;
    casService.store.and.returnValue(Promise.resolve(mockHash));
    
    spyOn(component.contentStored, 'emit');

    await component.uploadFile();

    expect(component.contentStored.emit).toHaveBeenCalledWith(mockHash);
  });

  it('should handle upload errors', (done) => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    component.selectedFile = mockFile;
    
    // Mock FileReader
    const mockArrayBuffer = new ArrayBuffer(8);
    const mockFileReader = {
      readAsArrayBuffer: jasmine.createSpy('readAsArrayBuffer'),
      onload: null as any,
      onerror: null as any,
      result: mockArrayBuffer
    };
    spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);
    
    // Create a rejected promise but catch it to prevent unhandled rejection
    const rejectedPromise = Promise.reject(new Error('Upload failed'));
    rejectedPromise.catch(() => {}); // Catch to prevent unhandled rejection
    casService.store.and.returnValue(rejectedPromise);

    component.uploadFile().then(() => {
      expect(component.errorMessage).toBe('Upload failed: Upload failed');
      expect(component.isUploading).toBe(false);
      expect(component.uploadedHash).toBeNull();
      done();
    }).catch((error) => {
      // This shouldn't happen as component.uploadFile() catches all errors
      fail('uploadFile should not reject: ' + error);
    });

    // Trigger FileReader onload
    setTimeout(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }
    }, 0);
  });

  it('should not upload without selected file', async () => {
    component.selectedFile = null;

    await component.uploadFile();

    expect(casService.store).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Please select a file');
  });

  it('should show uploading state', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    component.selectedFile = mockFile;
    
    let resolveUpload: (value: ContentHash) => void;
    const uploadPromise = new Promise<ContentHash>((resolve) => {
      resolveUpload = resolve;
    });
    
    casService.store.and.returnValue(uploadPromise);

    const uploadCall = component.uploadFile();
    expect(component.isUploading).toBe(true);

    resolveUpload!({ algorithm: 'sha256', value: 'test' });
    await uploadCall;

    expect(component.isUploading).toBe(false);
  });

  it('should navigate to content list', () => {
    component.navigateToContentList();
    expect(router.navigate).toHaveBeenCalledWith(['/content']);
  });
});