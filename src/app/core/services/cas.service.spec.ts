import { TestBed } from '@angular/core/testing';
import { CasService } from './cas.service';
import { HashService } from './hash.service';
import { LocalStorageService } from './local-storage.service';
import { ContentHash } from '../domain/interfaces/content.interface';

describe('CasService', () => {
  let service: CasService;
  let hashService: jasmine.SpyObj<HashService>;
  let storageService: jasmine.SpyObj<LocalStorageService>;

  beforeEach(() => {
    const hashSpy = jasmine.createSpyObj('HashService', ['hash', 'verify']);
    const storageSpy = jasmine.createSpyObj('LocalStorageService', ['write', 'read', 'exists', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        CasService,
        { provide: HashService, useValue: hashSpy },
        { provide: LocalStorageService, useValue: storageSpy }
      ]
    });

    service = TestBed.inject(CasService);
    hashService = TestBed.inject(HashService) as jasmine.SpyObj<HashService>;
    storageService = TestBed.inject(LocalStorageService) as jasmine.SpyObj<LocalStorageService>;
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('store', () => {
    it('should store content and return hash', async () => {
      const testData = new TextEncoder().encode('Test Content');
      const expectedHash = 'abcdef1234567890';
      
      hashService.hash.and.returnValue(Promise.resolve(expectedHash));
      storageService.write.and.returnValue(Promise.resolve());

      const result = await service.store({ data: testData });

      expect(hashService.hash).toHaveBeenCalledWith(testData);
      expect(storageService.write).toHaveBeenCalledWith(
        `cas/sha256/${expectedHash}`,
        testData
      );
      expect(result).toEqual({
        algorithm: 'sha256',
        value: expectedHash
      });
    });

    it('should not store if content already exists', async () => {
      const testData = new TextEncoder().encode('Existing Content');
      const existingHash = 'existing1234567890';
      
      hashService.hash.and.returnValue(Promise.resolve(existingHash));
      storageService.exists.and.returnValue(Promise.resolve(true));

      const result = await service.store({ data: testData });

      expect(storageService.write).not.toHaveBeenCalled();
      expect(result).toEqual({
        algorithm: 'sha256',
        value: existingHash
      });
    });
  });

  describe('retrieve', () => {
    it('should retrieve content by hash', async () => {
      const hash: ContentHash = { algorithm: 'sha256', value: 'test123' };
      const expectedData = new TextEncoder().encode('Retrieved Content');
      
      storageService.read.and.returnValue(Promise.resolve(expectedData));

      const result = await service.retrieve(hash);

      expect(storageService.read).toHaveBeenCalledWith('cas/sha256/test123');
      expect(result.data).toEqual(expectedData);
      expect(result.hash).toEqual(hash);
    });

    it('should throw error if content not found', async () => {
      const hash: ContentHash = { algorithm: 'sha256', value: 'notfound' };
      
      storageService.read.and.returnValue(Promise.reject(new Error('File not found')));

      await expectAsync(service.retrieve(hash)).toBeRejectedWithError('Content not found');
    });
  });

  describe('exists', () => {
    it('should check if content exists', async () => {
      const hash: ContentHash = { algorithm: 'sha256', value: 'exists123' };
      
      storageService.exists.and.returnValue(Promise.resolve(true));

      const result = await service.exists(hash);

      expect(storageService.exists).toHaveBeenCalledWith('cas/sha256/exists123');
      expect(result).toBe(true);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for existing content', async () => {
      const hash: ContentHash = { algorithm: 'sha256', value: 'meta123' };
      const testData = new TextEncoder().encode('Metadata Test');
      
      storageService.read.and.returnValue(Promise.resolve(testData));

      const result = await service.getMetadata(hash);

      expect(result.hash).toEqual(hash);
      expect(result.size).toBe(testData.length);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });
});