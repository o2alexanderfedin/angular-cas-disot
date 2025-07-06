import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentSelectionModalComponent } from './content-selection-modal.component';
import { CasService } from '../../../core/services/cas.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContentHash, Content, ContentMetadata } from '../../../core/domain/interfaces/content.interface';

describe('ContentSelectionModalComponent', () => {
  let component: ContentSelectionModalComponent;
  let fixture: ComponentFixture<ContentSelectionModalComponent>;
  let mockCasService: jasmine.SpyObj<CasService>;

  const mockContentHash1: ContentHash = {
    algorithm: 'SHA-256',
    value: 'abc123def456'
  };

  const mockContentHash2: ContentHash = {
    algorithm: 'SHA-256',
    value: 'xyz789uvw456'
  };

  const mockContent1: Content = {
    data: new TextEncoder().encode('Test content 1')
  };

  const mockContent2: Content = {
    data: new TextEncoder().encode('{"test": "data"}')
  };

  const mockMetadata1: ContentMetadata = {
    name: 'test1.txt',
    contentType: 'text/plain',
    size: 14,
    createdAt: new Date('2025-01-06')
  };

  const mockMetadata2: ContentMetadata = {
    name: 'test2.json',
    contentType: 'application/json',
    size: 16,
    createdAt: new Date('2025-01-05')
  };

  beforeEach(async () => {
    mockCasService = jasmine.createSpyObj('CasService', [
      'getAllContent',
      'getMetadata',
      'retrieve'
    ]);

    // Setup default mock to prevent errors during component creation
    mockCasService.getAllContent.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [ContentSelectionModalComponent, FormsModule, CommonModule],
      providers: [
        { provide: CasService, useValue: mockCasService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentSelectionModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadContent', () => {
    it('should load content items on initialization', async () => {
      mockCasService.getAllContent.and.returnValue(Promise.resolve([
        { hash: mockContentHash1, content: mockContent1 },
        { hash: mockContentHash2, content: mockContent2 }
      ]));
      mockCasService.getMetadata.and.returnValues(
        Promise.resolve(mockMetadata1),
        Promise.resolve(mockMetadata2)
      );

      await component.loadContent();

      expect(mockCasService.getAllContent).toHaveBeenCalled();
      expect(mockCasService.getMetadata).toHaveBeenCalledTimes(2);
      expect(component.contentItems.length).toBe(2);
      expect(component.filteredItems.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle errors when loading content', async () => {
      mockCasService.getAllContent.and.returnValue(Promise.reject(new Error('Load failed')));
      spyOn(console, 'error');

      await component.loadContent();

      expect(component.isLoading).toBeFalse();
      expect(component.contentItems).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to load content:', jasmine.any(Error));
    });

    it('should handle empty content list', async () => {
      mockCasService.getAllContent.and.returnValue(Promise.resolve([]));

      await component.loadContent();

      expect(component.contentItems).toEqual([]);
      expect(component.filteredItems).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('filterContent', () => {
    beforeEach(() => {
      component.contentItems = [
        {
          hash: mockContentHash1,
          metadata: mockMetadata1,
          previewData: null,
          previewType: null
        },
        {
          hash: mockContentHash2,
          metadata: mockMetadata2,
          previewData: null,
          previewType: null
        }
      ];
    });

    it('should show all items when search is empty', () => {
      component.searchTerm = '';
      component.filterContent();

      expect(component.filteredItems.length).toBe(2);
    });

    it('should filter items by hash', () => {
      component.searchTerm = 'abc123';
      component.filterContent();

      expect(component.filteredItems.length).toBe(1);
      expect(component.filteredItems[0].hash.value).toBe('abc123def456');
    });

    it('should be case insensitive', () => {
      component.searchTerm = 'ABC123';
      component.filterContent();

      expect(component.filteredItems.length).toBe(1);
      expect(component.filteredItems[0].hash.value).toBe('abc123def456');
    });

    it('should show no items when no match found', () => {
      component.searchTerm = 'nonexistent';
      component.filterContent();

      expect(component.filteredItems.length).toBe(0);
    });
  });

  describe('selectContent', () => {
    it('should emit selected content and close modal', () => {
      const contentSelectedSpy = spyOn(component.contentSelected, 'emit');
      const closeSpy = spyOn(component, 'close');

      component.selectContent(mockContentHash1);

      expect(contentSelectedSpy).toHaveBeenCalledWith(mockContentHash1);
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should emit closed event', () => {
      const closedSpy = spyOn(component.closed, 'emit');

      component.close();

      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe('togglePreview', () => {
    let item: any;

    beforeEach(() => {
      item = {
        hash: mockContentHash1,
        metadata: mockMetadata1,
        previewData: null,
        previewType: null,
        isLoadingPreview: false
      };
    });

    it('should load preview when preview is null', async () => {
      spyOn(component, 'loadPreview').and.returnValue(Promise.resolve());

      await component.togglePreview(item);

      expect(component.loadPreview).toHaveBeenCalledWith(item);
    });

    it('should hide preview when preview exists', async () => {
      item.previewData = 'Test preview';
      item.previewType = 'text';
      item.detectedType = 'text/plain';

      await component.togglePreview(item);

      expect(item.previewData).toBeNull();
      expect(item.previewType).toBeNull();
      expect(item.detectedType).toBeUndefined();
    });
  });

  describe('loadPreview', () => {
    let item: any;

    beforeEach(() => {
      item = {
        hash: mockContentHash1,
        metadata: mockMetadata1,
        previewData: null,
        previewType: null,
        isLoadingPreview: false
      };
    });

    it('should load text preview', async () => {
      mockCasService.retrieve.and.returnValue(Promise.resolve(mockContent1));

      await component.loadPreview(item);

      expect(item.isLoadingPreview).toBeFalse();
      expect(item.detectedType).toBe('text/plain');
      expect(item.previewType).toBe('text');
      expect(item.previewData).toBe('Test content 1');
    });

    it('should load JSON preview', async () => {
      mockCasService.retrieve.and.returnValue(Promise.resolve(mockContent2));
      item.hash = mockContentHash2;
      item.metadata = mockMetadata2;

      await component.loadPreview(item);

      expect(item.previewType).toBe('json');
      expect(item.previewData).toContain('"test"');
    });

    it('should not load preview if already loading', async () => {
      item.isLoadingPreview = true;

      await component.loadPreview(item);

      expect(mockCasService.retrieve).not.toHaveBeenCalled();
    });

    it('should handle preview loading errors', async () => {
      mockCasService.retrieve.and.returnValue(Promise.reject(new Error('Retrieve failed')));
      spyOn(console, 'error');

      await component.loadPreview(item);

      expect(item.isLoadingPreview).toBeFalse();
      expect(console.error).toHaveBeenCalledWith('Failed to preview content:', jasmine.any(Error));
    });
  });

  describe('UI interactions', () => {
    beforeEach(async () => {
      mockCasService.getAllContent.and.returnValue(Promise.resolve([
        { hash: mockContentHash1, content: mockContent1 }
      ]));
      mockCasService.getMetadata.and.returnValue(Promise.resolve(mockMetadata1));
      
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should display search input', () => {
      const searchInput = fixture.nativeElement.querySelector('.search-input');
      expect(searchInput).toBeTruthy();
      expect(searchInput.placeholder).toContain('Search by hash...');
    });

    it('should display loading state', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const loadingElement = fixture.nativeElement.querySelector('.loading');
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.textContent).toContain('Loading content');
    });

    it('should display empty state when no items', () => {
      component.filteredItems = [];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No content found');
    });

    it('should close modal when clicking backdrop', () => {
      const closeSpy = spyOn(component, 'close');
      const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');

      backdrop.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not close modal when clicking content', () => {
      const closeSpy = spyOn(component, 'close');
      const modalContent = fixture.nativeElement.querySelector('.modal-content');

      modalContent.click();

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should close modal when clicking close button', () => {
      const closeSpy = spyOn(component, 'close');
      const closeButton = fixture.nativeElement.querySelector('.close-button');

      closeButton.click();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(512)).toBe('512 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1536)).toBe('1.5 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
    });
  });

});