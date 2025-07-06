import { TestBed } from '@angular/core/testing';
import { DisotService } from './disot.service';
import { CasService } from './cas.service';
import { SignatureService } from './signature.service';
import { HashService } from './hash.service';
import { DisotEntry, DisotEntryType } from '../domain/interfaces/disot.interface';
import { MetadataContent, createMetadataContent, AuthorRole } from '../domain/interfaces/metadata-entry';
import { ContentHash, Content } from '../domain/interfaces/content.interface';
import { Signature } from '../domain/interfaces/crypto.interface';

describe('DisotService - Metadata Support', () => {
  let service: DisotService;
  let casService: jasmine.SpyObj<CasService>;
  let signatureService: jasmine.SpyObj<SignatureService>;
  let hashService: jasmine.SpyObj<HashService>;

  beforeEach(() => {
    const casSpy = jasmine.createSpyObj('CasService', ['store', 'retrieve']);
    const signatureSpy = jasmine.createSpyObj('SignatureService', ['sign', 'verify']);
    const hashSpy = jasmine.createSpyObj('HashService', ['hash']);

    TestBed.configureTestingModule({
      providers: [
        DisotService,
        { provide: CasService, useValue: casSpy },
        { provide: SignatureService, useValue: signatureSpy },
        { provide: HashService, useValue: hashSpy }
      ]
    });

    service = TestBed.inject(DisotService);
    casService = TestBed.inject(CasService) as jasmine.SpyObj<CasService>;
    signatureService = TestBed.inject(SignatureService) as jasmine.SpyObj<SignatureService>;
    hashService = TestBed.inject(HashService) as jasmine.SpyObj<HashService>;
  });

  describe('createEntry with metadata content', () => {
    it('should handle metadata content directly', async () => {
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

      const signature: Signature = {
        value: 'sig123',
        algorithm: 'secp256k1',
        publicKey: 'pubkey123'
      };

      const entryHash: ContentHash = {
        algorithm: 'sha256',
        value: 'entry-hash-123'
      };

      signatureService.sign.and.returnValue(Promise.resolve(signature));
      hashService.hash.and.returnValue(Promise.resolve('content-hash-456'));
      casService.store.and.returnValue(Promise.resolve(entryHash));

      // Act
      const result = await service.createEntry(metadata, DisotEntryType.METADATA, 'private-key');

      // Assert
      expect(result.type).toBe(DisotEntryType.METADATA);
      expect(result.metadata).toEqual(metadata);
      expect(result.id).toBe('entry-hash-123');
      expect(result.signature).toEqual(signature);
      
      // Verify metadata was hashed for contentHash
      expect(hashService.hash).toHaveBeenCalled();
      const hashCall = hashService.hash.calls.mostRecent();
      const hashedData = new TextDecoder().decode(hashCall.args[0]);
      expect(hashedData).toContain(JSON.stringify(metadata));
    });

    it('should store the entry with metadata in CAS', async () => {
      // Arrange
      const metadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmDoc123',
          mimeType: 'application/pdf',
          mimeTypeSource: 'manual'
        }],
        authors: [{
          authorHash: 'QmAuthor789',
          role: AuthorRole.EDITOR
        }],
        version: '2.0.0',
        previousVersion: 'entry-v1'
      });

      const signature: Signature = {
        value: 'sig456',
        algorithm: 'secp256k1',
        publicKey: 'pubkey456'
      };

      const entryHash: ContentHash = {
        algorithm: 'sha256',
        value: 'entry-hash-456'
      };

      signatureService.sign.and.returnValue(Promise.resolve(signature));
      hashService.hash.and.returnValue(Promise.resolve('content-hash-789'));
      casService.store.and.returnValue(Promise.resolve(entryHash));

      // Act
      await service.createEntry(metadata, DisotEntryType.METADATA, 'private-key');

      // Assert
      expect(casService.store).toHaveBeenCalled();
      const storeCall = casService.store.calls.mostRecent();
      const storedContent = storeCall.args[0] as Content;
      const storedData = new TextDecoder().decode(storedContent.data);
      const storedEntry = JSON.parse(storedData);
      
      expect(storedEntry.metadata).toEqual(metadata);
      expect(storedEntry.type).toBe(DisotEntryType.METADATA);
    });
  });

  describe('getEntry with metadata', () => {
    it('should retrieve and return metadata entry', async () => {
      // Arrange
      const metadata: MetadataContent = createMetadataContent({
        references: [{
          hash: 'QmContent999',
          mimeType: 'text/markdown',
          mimeTypeSource: 'detected'
        }],
        authors: [{
          authorHash: 'QmAuthor111',
          role: AuthorRole.CREATOR
        }]
      });

      const storedEntry = {
        id: 'entry-123',
        contentHash: { algorithm: 'sha256', value: 'hash-123' },
        signature: { 
          value: 'sig789', 
          algorithm: 'secp256k1', 
          publicKey: 'key789' 
        },
        timestamp: new Date().toISOString(),
        type: DisotEntryType.METADATA,
        metadata: metadata
      };

      const content: Content = {
        data: new TextEncoder().encode(JSON.stringify(storedEntry))
      };

      casService.retrieve.and.returnValue(Promise.resolve(content));

      // Act
      const result = await service.getEntry('entry-123');

      // Assert
      expect(result.type).toBe(DisotEntryType.METADATA);
      expect(result.metadata).toEqual(metadata);
      expect(result.id).toBe('entry-123');
    });
  });

  describe('listEntries with metadata filter', () => {
    it('should filter entries by metadata type', async () => {
      // Arrange
      const metadataEntry: DisotEntry = {
        id: 'meta-1',
        contentHash: { algorithm: 'sha256', value: 'hash-meta' },
        signature: { value: 'sig1', algorithm: 'secp256k1', publicKey: 'key1' },
        timestamp: new Date(),
        type: DisotEntryType.METADATA,
        metadata: createMetadataContent({
          references: [{ hash: 'ref1', mimeType: 'text/plain', mimeTypeSource: 'detected' }],
          authors: [{ authorHash: 'auth1', role: AuthorRole.CREATOR }]
        })
      };

      const blogEntry: DisotEntry = {
        id: 'blog-1',
        contentHash: { algorithm: 'sha256', value: 'hash-blog' },
        signature: { value: 'sig2', algorithm: 'secp256k1', publicKey: 'key2' },
        timestamp: new Date(),
        type: DisotEntryType.BLOG_POST
      };

      // Add entries to service's internal storage
      await service['entries'].set(metadataEntry.id, metadataEntry);
      await service['entries'].set(blogEntry.id, blogEntry);

      // Act
      const result = await service.listEntries({ type: DisotEntryType.METADATA });

      // Assert
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(metadataEntry);
    });
  });
});