import { TestBed } from '@angular/core/testing';
import { MetadataService } from './metadata.service';
import { DisotService } from '../disot.service';
import { 
  MetadataContent, 
  AuthorRole, 
  createMetadataContent 
} from '../../domain/interfaces/metadata-entry';
import { DisotEntry, DisotEntryType } from '../../domain/interfaces/disot.interface';

describe('MetadataService', () => {
  let service: MetadataService;
  let disotService: jasmine.SpyObj<DisotService>;

  beforeEach(() => {
    const disotSpy = jasmine.createSpyObj('DisotService', 
      ['createEntry', 'getEntry', 'listEntries']);

    TestBed.configureTestingModule({
      providers: [
        MetadataService,
        { provide: DisotService, useValue: disotSpy }
      ]
    });

    service = TestBed.inject(MetadataService);
    disotService = TestBed.inject(DisotService) as jasmine.SpyObj<DisotService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createMetadataEntry', () => {
    it('should create a metadata entry with valid content', async () => {
      // Arrange
      const metadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmTest123',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor456',
          role: AuthorRole.CREATOR
        }]
      });

      const expectedEntry: DisotEntry = {
        id: 'entry-123',
        contentHash: { algorithm: 'sha256', value: 'QmHash789' },
        type: DisotEntryType.METADATA,
        signature: { 
          value: 'sig',
          algorithm: 'secp256k1',
          publicKey: 'pubkey'
        },
        timestamp: new Date(),
        metadata: metadata
      };

      disotService.createEntry.and.returnValue(Promise.resolve(expectedEntry));

      // Act
      const result = await service.createMetadataEntry(metadata, 'private-key');

      // Assert
      expect(disotService.createEntry).toHaveBeenCalledWith(
        metadata,
        DisotEntryType.METADATA,
        'private-key'
      );
      expect(result).toEqual(expectedEntry);
    });

    it('should throw error if metadata is invalid', async () => {
      // Arrange
      const invalidMetadata = {} as MetadataContent;

      // Act & Assert
      await expectAsync(
        service.createMetadataEntry(invalidMetadata, 'private-key')
      ).toBeRejectedWithError('Invalid metadata content');
    });
  });

  describe('getMetadataContent', () => {
    it('should retrieve metadata content from entry', async () => {
      // Arrange
      const metadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmTest123',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor456',
          role: AuthorRole.CREATOR
        }]
      });

      const entry: DisotEntry = {
        id: 'entry-123',
        contentHash: { algorithm: 'sha256', value: 'QmHash789' },
        type: DisotEntryType.METADATA,
        signature: { 
          value: 'sig',
          algorithm: 'secp256k1',
          publicKey: 'pubkey'
        },
        timestamp: new Date(),
        metadata: metadata
      };

      disotService.getEntry.and.returnValue(Promise.resolve(entry));

      // Act
      const result = await service.getMetadataContent('entry-123');

      // Assert
      expect(disotService.getEntry).toHaveBeenCalledWith('entry-123');
      expect(result).toEqual(metadata);
    });

    it('should throw error if entry is not metadata type', async () => {
      // Arrange
      const entry: DisotEntry = {
        id: 'entry-123',
        contentHash: { algorithm: 'sha256', value: 'QmHash789' },
        type: DisotEntryType.DOCUMENT,
        signature: { 
          value: 'sig',
          algorithm: 'secp256k1',
          publicKey: 'pubkey'
        },
        timestamp: new Date()
      };

      disotService.getEntry.and.returnValue(Promise.resolve(entry));

      // Act & Assert
      await expectAsync(
        service.getMetadataContent('entry-123')
      ).toBeRejectedWithError('Entry is not a metadata entry');
    });

    it('should throw error if metadata is invalid', async () => {
      // Arrange
      const entry: DisotEntry = {
        id: 'entry-123',
        contentHash: { algorithm: 'sha256', value: 'QmHash789' },
        type: DisotEntryType.METADATA,
        signature: { 
          value: 'sig',
          algorithm: 'secp256k1',
          publicKey: 'pubkey'
        },
        timestamp: new Date(),
        metadata: { invalid: 'data' }
      };

      disotService.getEntry.and.returnValue(Promise.resolve(entry));

      // Act & Assert
      await expectAsync(
        service.getMetadataContent('entry-123')
      ).toBeRejectedWithError('Invalid metadata content');
    });
  });

  describe('updateMetadataEntry', () => {
    it('should create new version with updates', async () => {
      // Arrange
      const originalMetadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmOriginal123',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor456',
          role: AuthorRole.CREATOR
        }],
        version: '1.0.0'
      });

      const originalEntry: DisotEntry = {
        id: 'entry-123',
        contentHash: { algorithm: 'sha256', value: 'QmHash789' },
        type: DisotEntryType.METADATA,
        signature: { 
          value: 'sig',
          algorithm: 'secp256k1',
          publicKey: 'pubkey'
        },
        timestamp: new Date(),
        metadata: originalMetadata
      };

      const updates = {
        references: [{
          hash: 'QmUpdated456',
          mimeType: 'text/markdown',
          mimeTypeSource: 'manual' as const
        }]
      };

      const newEntry: DisotEntry = {
        id: 'entry-456',
        contentHash: { algorithm: 'sha256', value: 'QmNewHash' },
        type: DisotEntryType.METADATA,
        signature: { 
          value: 'sig',
          algorithm: 'secp256k1',
          publicKey: 'pubkey'
        },
        timestamp: new Date(),
        metadata: { ...originalMetadata, ...updates }
      };

      disotService.getEntry.and.returnValue(Promise.resolve(originalEntry));
      disotService.createEntry.and.returnValue(Promise.resolve(newEntry));

      // Act
      const result = await service.updateMetadataEntry('entry-123', updates, 'private-key');

      // Assert
      expect(result).toEqual(newEntry);
      const createdMetadata = disotService.createEntry.calls.mostRecent().args[0] as MetadataContent;
      expect(createdMetadata.version.previousVersion).toBe('entry-123');
      expect(createdMetadata.references).toEqual(updates.references);
    });
  });

  describe('findByReference', () => {
    it('should find entries containing specific content hash', async () => {
      // Arrange
      const targetHash = 'QmTarget123';
      
      const metadataWithTarget: MetadataContent = createMetadataContent({
        references: [{
          hash: targetHash,
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor1',
          role: AuthorRole.CREATOR
        }]
      });

      const metadataWithoutTarget: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmOther456',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'  
        }],
        authors: [{
          authorHash: 'QmAuthor2',
          role: AuthorRole.CREATOR
        }]
      });

      const entries: DisotEntry[] = [
        {
          id: 'entry-1',
          contentHash: { algorithm: 'sha256', value: 'hash1' },
          type: DisotEntryType.METADATA,
          signature: { 
            value: 'sig1',
            algorithm: 'secp256k1',
            publicKey: 'key1'
          },
          timestamp: new Date(),
          metadata: metadataWithTarget
        },
        {
          id: 'entry-2',
          contentHash: { algorithm: 'sha256', value: 'hash2' },
          type: DisotEntryType.METADATA,
          signature: { 
            value: 'sig2',
            algorithm: 'secp256k1',
            publicKey: 'key2'
          },
          timestamp: new Date(),
          metadata: metadataWithoutTarget
        }
      ];

      disotService.listEntries.and.returnValue(Promise.resolve(entries));

      // Act
      const result = await service.findByReference(targetHash);

      // Assert
      expect(result).toEqual([entries[0]]);
    });
  });

  describe('findByAuthor', () => {
    it('should find entries by specific author', async () => {
      // Arrange
      const targetAuthor = 'QmTargetAuthor';
      
      const metadataWithAuthor: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmContent1',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: targetAuthor,
          role: AuthorRole.CREATOR
        }]
      });

      const metadataWithoutAuthor: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmContent2',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmOtherAuthor',
          role: AuthorRole.CREATOR
        }]
      });

      const entries: DisotEntry[] = [
        {
          id: 'entry-1',
          contentHash: { algorithm: 'sha256', value: 'hash1' },
          type: DisotEntryType.METADATA,
          signature: { 
            value: 'sig1',
            algorithm: 'secp256k1',
            publicKey: 'key1'
          },
          timestamp: new Date(),
          metadata: metadataWithAuthor
        },
        {
          id: 'entry-2',
          contentHash: { algorithm: 'sha256', value: 'hash2' },
          type: DisotEntryType.METADATA,
          signature: { 
            value: 'sig2',
            algorithm: 'secp256k1',
            publicKey: 'key2'
          },
          timestamp: new Date(),
          metadata: metadataWithoutAuthor
        }
      ];

      disotService.listEntries.and.returnValue(Promise.resolve(entries));

      // Act
      const result = await service.findByAuthor(targetAuthor);

      // Assert
      expect(result).toEqual([entries[0]]);
    });
  });

  describe('getVersionHistory', () => {
    it('should retrieve complete version chain', async () => {
      // Arrange
      const v3Metadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmV3',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor',
          role: AuthorRole.CREATOR
        }],
        version: '3.0.0',
        previousVersion: 'entry-2'
      });

      const v2Metadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmV2',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor',
          role: AuthorRole.CREATOR
        }],
        version: '2.0.0',
        previousVersion: 'entry-1'
      });

      const v1Metadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmV1',
          mimeType: 'text/plain',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor',
          role: AuthorRole.CREATOR
        }],
        version: '1.0.0'
      });

      const entries = new Map([
        ['entry-3', { 
          id: 'entry-3', 
          type: DisotEntryType.METADATA, 
          contentHash: { algorithm: 'sha256', value: 'hash3' },
          signature: { value: 'sig3', algorithm: 'secp256k1', publicKey: 'key3' },
          timestamp: new Date(),
          metadata: v3Metadata 
        } as DisotEntry],
        ['entry-2', { 
          id: 'entry-2', 
          type: DisotEntryType.METADATA, 
          contentHash: { algorithm: 'sha256', value: 'hash2' },
          signature: { value: 'sig2', algorithm: 'secp256k1', publicKey: 'key2' },
          timestamp: new Date(),
          metadata: v2Metadata 
        } as DisotEntry],
        ['entry-1', { 
          id: 'entry-1', 
          type: DisotEntryType.METADATA, 
          contentHash: { algorithm: 'sha256', value: 'hash1' },
          signature: { value: 'sig1', algorithm: 'secp256k1', publicKey: 'key1' },
          timestamp: new Date(),
          metadata: v1Metadata 
        } as DisotEntry]
      ]);

      disotService.getEntry.and.callFake((id: string) => {
        const entry = entries.get(id);
        if (!entry) throw new Error('Not found');
        return Promise.resolve(entry);
      });

      // Act
      const result = await service.getVersionHistory('entry-3');

      // Assert
      expect(result.length).toBe(3);
      expect(result.map(e => e.id)).toEqual(['entry-3', 'entry-2', 'entry-1']);
    });
  });
});