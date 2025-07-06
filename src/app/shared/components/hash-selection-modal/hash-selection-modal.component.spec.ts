import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HashSelectionModalComponent } from './hash-selection-modal.component';
import { HashSelectionService, HashItem } from '../../../core/services/hash-selection.service';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';

describe('HashSelectionModalComponent', () => {
  let component: HashSelectionModalComponent;
  let fixture: ComponentFixture<HashSelectionModalComponent>;
  let hashSelectionService: jasmine.SpyObj<HashSelectionService>;

  const mockHash1: ContentHash = {
    algorithm: 'sha256',
    value: 'abc123def456'
  };

  const mockHash2: ContentHash = {
    algorithm: 'sha256',
    value: 'xyz789uvw012'
  };

  const mockHashItems: HashItem[] = [
    {
      hash: mockHash1,
      metadata: {
        size: 1024,
        createdAt: new Date('2024-01-01'),
        contentType: 'text/plain'
      }
    },
    {
      hash: mockHash2,
      metadata: {
        size: 2048,
        createdAt: new Date('2024-01-02'),
        contentType: 'application/json'
      }
    }
  ];

  beforeEach(async () => {
    const hashServiceSpy = jasmine.createSpyObj('HashSelectionService', [
      'searchHashes',
      'formatFileSize',
      'getPreviewData'
    ]);

    await TestBed.configureTestingModule({
      imports: [HashSelectionModalComponent, FormsModule],
      providers: [
        { provide: HashSelectionService, useValue: hashServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HashSelectionModalComponent);
    component = fixture.componentInstance;
    hashSelectionService = TestBed.inject(HashSelectionService) as jasmine.SpyObj<HashSelectionService>;

    // Setup default service responses
    hashSelectionService.searchHashes.and.returnValue(Promise.resolve(mockHashItems));
    hashSelectionService.formatFileSize.and.callFake((size: number) => `${size} bytes`);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search and loading state', () => {
    expect(component.searchTerm).toBe('');
    expect(component.isLoading).toBe(true);
    expect(component.hashItems).toEqual([]);
  });

  it('should load hash items on init', async () => {
    // Act
    fixture.detectChanges();
    await fixture.whenStable();

    // Assert
    expect(hashSelectionService.searchHashes).toHaveBeenCalledWith('');
    expect(component.hashItems).toEqual(mockHashItems);
    expect(component.isLoading).toBe(false);
  });

  it('should search hashes when search term changes', async () => {
    // Arrange
    fixture.detectChanges();
    await fixture.whenStable();
    
    const filteredItems = [mockHashItems[0]];
    hashSelectionService.searchHashes.and.returnValue(Promise.resolve(filteredItems));

    // Act
    component.searchTerm = 'abc';
    await component.onSearchChange();

    // Assert
    expect(hashSelectionService.searchHashes).toHaveBeenCalledWith('abc');
    expect(component.hashItems).toEqual(filteredItems);
  });

  it('should emit hashSelected when hash is selected', () => {
    // Arrange
    spyOn(component.hashSelected, 'emit');

    // Act
    component.selectHash(mockHash1);

    // Assert
    expect(component.hashSelected.emit).toHaveBeenCalledWith(mockHash1);
  });

  it('should emit closed when modal is closed', () => {
    // Arrange
    spyOn(component.closed, 'emit');

    // Act
    component.close();

    // Assert
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should format hash value for display', () => {
    // Act
    const result = component.formatHashForDisplay('abcdef123456789012345');

    // Assert
    expect(result).toBe('abcdef...89012345');
  });

  it('should handle short hash values', () => {
    // Act
    const result = component.formatHashForDisplay('abc123');

    // Assert
    expect(result).toBe('abc123');
  });

  it('should toggle preview and load preview data', async () => {
    // Arrange
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.hashItems = mockHashItems;
    const previewData = 'Hello world';
    hashSelectionService.getPreviewData.and.returnValue(Promise.resolve(previewData));

    // Act
    await component.togglePreview(mockHashItems[0]);

    // Assert
    expect(hashSelectionService.getPreviewData).toHaveBeenCalledWith(mockHash1, 'text');
    expect(component.previews.get(mockHash1.value)).toBe(previewData);
    expect(component.previewStates.get(mockHash1.value)).toBe(true);
  });

  it('should hide preview when toggling already visible preview', async () => {
    // Arrange
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.hashItems = mockHashItems;
    component.previewStates.set(mockHash1.value, true);
    component.previews.set(mockHash1.value, 'existing preview');

    // Act
    await component.togglePreview(mockHashItems[0]);

    // Assert
    expect(component.previewStates.get(mockHash1.value)).toBe(false);
    expect(component.previews.get(mockHash1.value)).toBe('');
  });

  it('should handle preview loading errors gracefully', async () => {
    // Arrange
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.hashItems = mockHashItems;
    hashSelectionService.getPreviewData.and.returnValue(
      Promise.reject(new Error('Preview failed'))
    );

    // Act
    await component.togglePreview(mockHashItems[0]);

    // Assert
    expect(component.previews.get(mockHash1.value)).toBe('Failed to load preview');
    expect(component.previewStates.get(mockHash1.value)).toBe(true);
  });

  it('should handle search errors gracefully', async () => {
    // Arrange
    hashSelectionService.searchHashes.and.returnValue(
      Promise.reject(new Error('Search failed'))
    );

    // Act
    fixture.detectChanges();
    await fixture.whenStable();

    // Assert
    expect(component.error).toBe('Failed to load hashes: Search failed');
    expect(component.isLoading).toBe(false);
  });

  it('should show loading state during search', async () => {
    // Arrange
    fixture.detectChanges();
    await fixture.whenStable();
    
    // Reset loading state
    component.isLoading = false;
    
    // Create a delayed promise
    let resolvePromise: (value: HashItem[]) => void;
    const delayedPromise = new Promise<HashItem[]>(resolve => {
      resolvePromise = resolve;
    });
    hashSelectionService.searchHashes.and.returnValue(delayedPromise);

    // Act
    const searchPromise = component.onSearchChange();
    
    // Assert loading state
    expect(component.isLoading).toBe(true);
    
    // Resolve and check final state
    resolvePromise!([]);
    await searchPromise;
    expect(component.isLoading).toBe(false);
  });

  it('should display correct metadata information', () => {
    // Act
    const dateString = component.formatDate(new Date('2024-01-01T10:30:00Z'));
    
    // Assert
    expect(dateString).toBeTruthy();
    expect(typeof dateString).toBe('string');
  });

  it('should prevent event propagation when selecting hash', () => {
    // Arrange
    const mockEvent = { stopPropagation: jasmine.createSpy('stopPropagation') };
    spyOn(component.hashSelected, 'emit');

    // Act
    component.selectHashAndStopPropagation(mockHash1, mockEvent as any);

    // Assert
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.hashSelected.emit).toHaveBeenCalledWith(mockHash1);
  });
});