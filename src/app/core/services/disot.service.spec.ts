import { TestBed } from '@angular/core/testing';
import { DisotService } from './disot.service';
import { CasService } from './cas.service';
import { SignatureService } from './signature.service';
import { HashService } from './hash.service';
import { LocalStorageService } from './local-storage.service';
import { DisotEntry, DisotEntryType } from '../domain/interfaces/disot.interface';
import { ContentHash } from '../domain/interfaces/content.interface';
import { STORAGE_PROVIDER } from './storage-provider.factory';

describe('DisotService', () => {
  let service: DisotService;
  let casService: CasService;
  let signatureService: SignatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DisotService,
        CasService,
        SignatureService,
        HashService,
        LocalStorageService,
        { provide: STORAGE_PROVIDER, useClass: LocalStorageService }
      ]
    });

    service = TestBed.inject(DisotService);
    casService = TestBed.inject(CasService);
    signatureService = TestBed.inject(SignatureService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('createEntry', () => {
    it('should create a new DISOT entry', async () => {
      const contentHash: ContentHash = {
        algorithm: 'sha256',
        value: 'test123hash'
      };
      const keyPair = await signatureService.generateKeyPair();
      
      const entry = await service.createEntry(
        contentHash,
        DisotEntryType.BLOG_POST,
        keyPair.privateKey
      );

      expect(entry).toBeTruthy();
      expect(entry.id).toBeTruthy();
      expect(entry.contentHash).toEqual(contentHash);
      expect(entry.type).toBe(DisotEntryType.BLOG_POST);
      expect(entry.signature).toBeTruthy();
      expect(entry.signature.publicKey).toBeTruthy();
      expect(entry.signature.publicKey.length).toBe(64);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('should store entry in CAS', async () => {
      const contentHash: ContentHash = {
        algorithm: 'sha256',
        value: 'storedHash'
      };
      const keyPair = await signatureService.generateKeyPair();
      
      spyOn(casService, 'store').and.returnValue(Promise.resolve({
        algorithm: 'sha256',
        value: 'entryHash'
      }));

      const entry = await service.createEntry(
        contentHash,
        DisotEntryType.DOCUMENT,
        keyPair.privateKey
      );

      expect(casService.store).toHaveBeenCalled();
      expect(entry.id).toBe('entryHash');
    });
  });

  describe('verifyEntry', () => {
    it('should verify valid entry', async () => {
      const contentHash: ContentHash = {
        algorithm: 'sha256',
        value: 'verifyHash'
      };
      const keyPair = await signatureService.generateKeyPair();
      
      const entry = await service.createEntry(
        contentHash,
        DisotEntryType.SIGNATURE,
        keyPair.privateKey
      );

      const isValid = await service.verifyEntry(entry);
      expect(isValid).toBe(true);
    });

    it('should reject tampered entry', async () => {
      const contentHash: ContentHash = {
        algorithm: 'sha256',
        value: 'originalHash'
      };
      const keyPair = await signatureService.generateKeyPair();
      
      const entry = await service.createEntry(
        contentHash,
        DisotEntryType.IMAGE,
        keyPair.privateKey
      );

      // Tamper with the signature to make it invalid
      entry.signature.value = 'invalid_signature_value';

      const isValid = await service.verifyEntry(entry);
      expect(isValid).toBe(false);
    });
  });

  describe('getEntry', () => {
    it('should retrieve entry by id', async () => {
      const contentHash: ContentHash = {
        algorithm: 'sha256',
        value: 'retrieveHash'
      };
      const keyPair = await signatureService.generateKeyPair();
      
      const createdEntry = await service.createEntry(
        contentHash,
        DisotEntryType.BLOG_POST,
        keyPair.privateKey
      );

      const retrievedEntry = await service.getEntry(createdEntry.id);
      
      expect(retrievedEntry).toBeTruthy();
      expect(retrievedEntry.id).toBe(createdEntry.id);
      expect(retrievedEntry.contentHash).toEqual(createdEntry.contentHash);
    });

    it('should throw error for non-existent entry', async () => {
      await expectAsync(service.getEntry('nonexistent'))
        .toBeRejectedWithError('DISOT entry not found');
    });
  });

  describe('listEntries', () => {
    it('should list all entries', async () => {
      const keyPair = await signatureService.generateKeyPair();
      
      // Create multiple entries
      await service.createEntry(
        { algorithm: 'sha256', value: 'hash1' },
        DisotEntryType.BLOG_POST,
        keyPair.privateKey
      );
      
      await service.createEntry(
        { algorithm: 'sha256', value: 'hash2' },
        DisotEntryType.DOCUMENT,
        keyPair.privateKey
      );

      const entries = await service.listEntries();
      
      expect(entries.length).toBe(2);
    });

    it('should filter entries by type', async () => {
      const keyPair = await signatureService.generateKeyPair();
      
      await service.createEntry(
        { algorithm: 'sha256', value: 'blog1' },
        DisotEntryType.BLOG_POST,
        keyPair.privateKey
      );
      
      await service.createEntry(
        { algorithm: 'sha256', value: 'doc1' },
        DisotEntryType.DOCUMENT,
        keyPair.privateKey
      );

      const blogEntries = await service.listEntries({ 
        type: DisotEntryType.BLOG_POST 
      });
      
      expect(blogEntries.length).toBe(1);
      expect(blogEntries[0].type).toBe(DisotEntryType.BLOG_POST);
    });
  });
});