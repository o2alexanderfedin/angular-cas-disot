import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentListComponent } from './content-list.component';
import { CasService } from '../../../core/services/cas.service';
import { SharedModule } from '../../../shared/shared-module';
import { ContentHash, Content } from '../../../core/domain/interfaces/content.interface';

describe('ContentListComponent', () => {
  let component: ContentListComponent;
  let fixture: ComponentFixture<ContentListComponent>;
  let casService: jasmine.SpyObj<CasService>;

  beforeEach(async () => {
    const casSpy = jasmine.createSpyObj('CasService', ['retrieve', 'exists', 'getMetadata']);

    await TestBed.configureTestingModule({
      imports: [ContentListComponent, SharedModule],
      providers: [
        { provide: CasService, useValue: casSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentListComponent);
    component = fixture.componentInstance;
    casService = TestBed.inject(CasService) as jasmine.SpyObj<CasService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty content list', () => {
    expect(component.contentItems).toEqual([]);
    expect(component.filteredItems).toEqual([]);
    expect(component.searchTerm).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should load content items on init', () => {
    spyOn(component, 'loadContentItems');
    
    component.ngOnInit();
    
    expect(component.loadContentItems).toHaveBeenCalled();
  });

  it('should add content item to list', () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'hash123' };
    const mockMetadata = {
      hash: mockHash,
      size: 1024,
      createdAt: new Date(),
      contentType: 'text/plain'
    };

    component.addContentItem(mockHash, mockMetadata);

    expect(component.contentItems.length).toBe(1);
    expect(component.contentItems[0].hash).toEqual(mockHash);
    expect(component.contentItems[0].metadata).toEqual(mockMetadata);
  });

  it('should filter content by search term', () => {
    const hash1: ContentHash = { algorithm: 'sha256', value: 'abc123' };
    const hash2: ContentHash = { algorithm: 'sha256', value: 'def456' };
    const hash3: ContentHash = { algorithm: 'sha256', value: 'abc789' };

    component.contentItems = [
      { hash: hash1, metadata: { hash: hash1, size: 100, createdAt: new Date() }, previewData: null },
      { hash: hash2, metadata: { hash: hash2, size: 200, createdAt: new Date() }, previewData: null },
      { hash: hash3, metadata: { hash: hash3, size: 300, createdAt: new Date() }, previewData: null }
    ];

    component.searchTerm = 'abc';
    component.filterContent();

    expect(component.filteredItems.length).toBe(2);
    expect(component.filteredItems[0].hash.value).toBe('abc123');
    expect(component.filteredItems[1].hash.value).toBe('abc789');
  });

  it('should show all items when search is empty', () => {
    component.contentItems = [
      { hash: { algorithm: 'sha256', value: 'hash1' }, metadata: { hash: { algorithm: 'sha256', value: 'hash1' }, size: 100, createdAt: new Date() }, previewData: null },
      { hash: { algorithm: 'sha256', value: 'hash2' }, metadata: { hash: { algorithm: 'sha256', value: 'hash2' }, size: 200, createdAt: new Date() }, previewData: null }
    ];

    component.searchTerm = '';
    component.filterContent();

    expect(component.filteredItems.length).toBe(2);
  });

  it('should emit contentSelected event', () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'selected123' };
    spyOn(component.contentSelected, 'emit');

    component.selectContent(mockHash);

    expect(component.contentSelected.emit).toHaveBeenCalledWith(mockHash);
  });

  it('should download content', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'download123' };
    const mockContent: Content = {
      data: new Uint8Array([72, 101, 108, 108, 111]), // "Hello"
      hash: mockHash
    };

    casService.retrieve.and.returnValue(Promise.resolve(mockContent));
    spyOn(component, 'downloadFile');

    await component.downloadContent(mockHash);

    expect(casService.retrieve).toHaveBeenCalledWith(mockHash);
    expect(component.downloadFile).toHaveBeenCalledWith(mockContent.data, mockHash.value);
  });

  it('should handle download errors', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'error123' };
    casService.retrieve.and.returnValue(Promise.reject(new Error('Download failed')));

    spyOn(console, 'error');

    await component.downloadContent(mockHash);

    expect(console.error).toHaveBeenCalledWith('Failed to download content:', jasmine.any(Error));
  });

  it('should preview text content', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'preview123' };
    const mockContent: Content = {
      data: new Uint8Array([72, 101, 108, 108, 111]), // "Hello"
      hash: mockHash
    };

    // Add the item to the component first
    component.contentItems = [{
      hash: mockHash,
      metadata: { hash: mockHash, size: 5, createdAt: new Date() },
      previewData: null
    }];

    casService.retrieve.and.returnValue(Promise.resolve(mockContent));

    await component.previewContent(mockHash);

    const item = component.contentItems.find(i => i.hash.value === mockHash.value);
    expect(item?.previewData).toBe('Hello');
  });

  it('should limit preview to 1000 characters', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'longpreview' };
    const longText = 'a'.repeat(2000);
    const mockContent: Content = {
      data: new TextEncoder().encode(longText),
      hash: mockHash
    };

    component.contentItems = [{
      hash: mockHash,
      metadata: { hash: mockHash, size: 2000, createdAt: new Date() },
      previewData: null
    }];

    casService.retrieve.and.returnValue(Promise.resolve(mockContent));

    await component.previewContent(mockHash);

    const item = component.contentItems.find(i => i.hash.value === mockHash.value);
    expect(item?.previewData?.length).toBe(1003); // 1000 + "..."
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1048576)).toBe('1 MB');
    expect(component.formatFileSize(1536)).toBe('1.5 KB');
  });
});