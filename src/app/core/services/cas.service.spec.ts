import { TestBed } from '@angular/core/testing';
import { CasService } from './cas.service';
import { HashService } from './hash.service';
import { IStorageProvider } from '../domain/interfaces/storage.interface';
import { ContentHash } from '../domain/interfaces/content.interface';
import { STORAGE_PROVIDER } from './storage-provider.factory';

describe('CasService', () => {
  let service: CasService;
  let hashService: jasmine.SpyObj<HashService>;
  let storageService: jasmine.SpyObj<IStorageProvider>;

  beforeEach(() => {
    const hashSpy = jasmine.createSpyObj('HashService', ['hash', 'verify']);
    const storageSpy = jasmine.createSpyObj('StorageProvider', ['write', 'read', 'exists', 'delete', 'list']);

    TestBed.configureTestingModule({
      providers: [
        CasService,
        { provide: HashService, useValue: hashSpy },
        { provide: STORAGE_PROVIDER, useValue: storageSpy }
      ]
    });

    service = TestBed.inject(CasService);
    hashService = TestBed.inject(HashService) as jasmine.SpyObj<HashService>;
    storageService = TestBed.inject(STORAGE_PROVIDER) as jasmine.SpyObj<IStorageProvider>;
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

  describe('getAllContent', () => {
    it('should return all stored content', async () => {
      const paths = [
        'cas/sha256/hash1',
        'cas/sha256/hash2',
        'other/path',  // Should be filtered out
        'cas/sha512/hash3'  // Different algorithm
      ];
      const data1 = new TextEncoder().encode('Content 1');
      const data2 = new TextEncoder().encode('Content 2');
      const data3 = new TextEncoder().encode('Content 3');
      
      storageService.list.and.returnValue(Promise.resolve(paths));
      storageService.read.and.callFake((path: string) => {
        switch (path) {
          case 'cas/sha256/hash1': return Promise.resolve(data1);
          case 'cas/sha256/hash2': return Promise.resolve(data2);
          case 'cas/sha512/hash3': return Promise.resolve(data3);
          default: return Promise.reject(new Error('Not found'));
        }
      });

      const result = await service.getAllContent();

      expect(storageService.list).toHaveBeenCalled();
      expect(result.length).toBe(3);
      expect(result[0].hash).toEqual({ algorithm: 'sha256', value: 'hash1' });
      expect(result[0].content.data).toEqual(data1);
      expect(result[1].hash).toEqual({ algorithm: 'sha256', value: 'hash2' });
      expect(result[1].content.data).toEqual(data2);
      expect(result[2].hash).toEqual({ algorithm: 'sha512', value: 'hash3' });
      expect(result[2].content.data).toEqual(data3);
    });

    it('should handle read errors gracefully', async () => {
      const paths = ['cas/sha256/hash1', 'cas/sha256/corrupt'];
      const data1 = new TextEncoder().encode('Good content');
      
      storageService.list.and.returnValue(Promise.resolve(paths));
      storageService.read.and.callFake((path: string) => {
        if (path === 'cas/sha256/hash1') {
          return Promise.resolve(data1);
        }
        return Promise.reject(new Error('Read error'));
      });
      
      spyOn(console, 'error');

      const result = await service.getAllContent();

      expect(result.length).toBe(1);
      expect(result[0].hash.value).toBe('hash1');
      expect(console.error).toHaveBeenCalledWith(
        'Error reading path cas/sha256/corrupt:',
        jasmine.any(Error)
      );
    });
  });
});