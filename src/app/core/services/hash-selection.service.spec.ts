import { TestBed } from '@angular/core/testing';
import { HashSelectionService } from './hash-selection.service';
import { CasService } from './cas.service';
import { ContentHash, ContentMetadata, ContentWithHash } from '../domain/interfaces/content.interface';

describe('HashSelectionService', () => {
  let service: HashSelectionService;
  let casService: jasmine.SpyObj<CasService>;

  const mockContentHash1: ContentHash = {
    algorithm: 'sha256',
    value: 'abc123'
  };

  const mockContentHash2: ContentHash = {
    algorithm: 'sha256', 
    value: 'def456'
  };

  const mockMetadata1: ContentMetadata = {
    size: 1024,
    createdAt: new Date('2024-01-01'),
    contentType: 'text/plain'
  };

  const mockMetadata2: ContentMetadata = {
    size: 2048,
    createdAt: new Date('2024-01-02'),
    contentType: 'application/json'
  };

  beforeEach(() => {
    const casServiceSpy = jasmine.createSpyObj('CasService', 
      ['getAllContent', 'getMetadata', 'retrieve']);

    TestBed.configureTestingModule({
      providers: [
        HashSelectionService,
        { provide: CasService, useValue: casServiceSpy }
      ]
    });

    service = TestBed.inject(HashSelectionService);
    casService = TestBed.inject(CasService) as jasmine.SpyObj<CasService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAvailableHashes', () => {
    it('should return available hashes with metadata', async () => {
      // Arrange
      const mockContent1: ContentWithHash = {
        content: { data: new Uint8Array() },
        hash: mockContentHash1
      };
      const mockContent2: ContentWithHash = {
        content: { data: new Uint8Array() },
        hash: mockContentHash2
      };
      
      casService.getAllContent.and.returnValue(Promise.resolve([
        mockContent1,
        mockContent2
      ]));
      casService.getMetadata.and.returnValues(
        Promise.resolve(mockMetadata1),
        Promise.resolve(mockMetadata2)
      );

      // Act
      const result = await service.getAvailableHashes();

      // Assert
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        hash: mockContentHash1,
        metadata: mockMetadata1
      });
      expect(result[1]).toEqual({
        hash: mockContentHash2,
        metadata: mockMetadata2
      });
    });

    it('should handle empty content list', async () => {
      // Arrange
      casService.getAllContent.and.returnValue(Promise.resolve([]));

      // Act
      const result = await service.getAvailableHashes();

      // Assert
      expect(result).toEqual([]);
      expect(casService.getMetadata).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      casService.getAllContent.and.returnValue(
        Promise.reject(new Error('Service error'))
      );

      // Act & Assert
      await expectAsync(service.getAvailableHashes())
        .toBeRejectedWithError('Failed to load available hashes: Service error');
    });
  });

  describe('searchHashes', () => {
    beforeEach(() => {
      const mockContent1: ContentWithHash = {
        content: { data: new Uint8Array() },
        hash: mockContentHash1
      };
      const mockContent2: ContentWithHash = {
        content: { data: new Uint8Array() },
        hash: mockContentHash2
      };
      
      casService.getAllContent.and.returnValue(Promise.resolve([
        mockContent1,
        mockContent2
      ]));
      casService.getMetadata.and.returnValues(
        Promise.resolve(mockMetadata1),
        Promise.resolve(mockMetadata2)
      );
    });

    it('should return all hashes when search term is empty', async () => {
      // Act
      const result = await service.searchHashes('');

      // Assert
      expect(result.length).toBe(2);
    });

    it('should filter hashes by hash value', async () => {
      // Act
      const result = await service.searchHashes('abc');

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].hash.value).toBe('abc123');
    });

    it('should filter hashes by content type', async () => {
      // Act
      const result = await service.searchHashes('json');

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].metadata.contentType).toBe('application/json');
    });

    it('should be case insensitive', async () => {
      // Act
      const result = await service.searchHashes('ABC');

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].hash.value).toBe('abc123');
    });

    it('should return empty array when no matches found', async () => {
      // Act
      const result = await service.searchHashes('xyz');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getHashById', () => {
    beforeEach(() => {
      const mockContent1: ContentWithHash = {
        content: { data: new Uint8Array() },
        hash: mockContentHash1
      };
      const mockContent2: ContentWithHash = {
        content: { data: new Uint8Array() },
        hash: mockContentHash2
      };
      
      casService.getAllContent.and.returnValue(Promise.resolve([
        mockContent1,
        mockContent2
      ]));
      casService.getMetadata.and.returnValues(
        Promise.resolve(mockMetadata1),
        Promise.resolve(mockMetadata2)
      );
    });

    it('should return hash item by value', async () => {
      // Act
      const result = await service.getHashById('abc123');

      // Assert
      expect(result).toEqual({
        hash: mockContentHash1,
        metadata: mockMetadata1
      });
    });

    it('should return null when hash not found', async () => {
      // Act
      const result = await service.getHashById('xyz999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getPreviewData', () => {
    it('should return text preview for text content', async () => {
      // Arrange
      const textData = new TextEncoder().encode('Hello world');
      casService.retrieve.and.returnValue(Promise.resolve({ data: textData }));

      // Act
      const result = await service.getPreviewData(mockContentHash1, 'text');

      // Assert
      expect(result).toBe('Hello world');
    });

    it('should return JSON preview for JSON content', async () => {
      // Arrange
      const jsonData = new TextEncoder().encode('{"key": "value"}');
      casService.retrieve.and.returnValue(Promise.resolve({ data: jsonData }));

      // Act
      const result = await service.getPreviewData(mockContentHash1, 'json');

      // Assert
      expect(result).toBe('{\n  "key": "value"\n}');
    });

    it('should return hex preview for binary content', async () => {
      // Arrange
      const binaryData = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
      casService.retrieve.and.returnValue(Promise.resolve({ data: binaryData }));

      // Act
      const result = await service.getPreviewData(mockContentHash1, 'hex');

      // Assert
      expect(result).toBe('DE AD BE EF');
    });

    it('should handle retrieval errors', async () => {
      // Arrange
      casService.retrieve.and.returnValue(
        Promise.reject(new Error('Retrieval failed'))
      );

      // Act & Assert
      await expectAsync(service.getPreviewData(mockContentHash1, 'text'))
        .toBeRejectedWithError('Failed to get preview: Retrieval failed');
    });

    it('should handle invalid JSON gracefully', async () => {
      // Arrange
      const invalidJsonData = new TextEncoder().encode('invalid json');
      casService.retrieve.and.returnValue(Promise.resolve({ data: invalidJsonData }));

      // Act
      const result = await service.getPreviewData(mockContentHash1, 'json');

      // Assert
      expect(result).toBe('Invalid JSON');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(service.formatFileSize(0)).toBe('0 Bytes');
      expect(service.formatFileSize(1024)).toBe('1 KB');
      expect(service.formatFileSize(1048576)).toBe('1 MB');
      expect(service.formatFileSize(1536)).toBe('1.5 KB');
    });
  });
});