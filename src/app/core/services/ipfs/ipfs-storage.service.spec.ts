import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { IPFSStorageService, IPFS_CONFIG } from './ipfs-storage.service';
import { IndexedDbStorageService } from '../indexed-db-storage.service';
import { IPFSShareLinkService } from './ipfs-share-link.service';
import { IPFSConfig } from '../../domain/interfaces/ipfs.interface';

describe('IPFSStorageService', () => {
  let service: IPFSStorageService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let localCacheSpy: jasmine.SpyObj<IndexedDbStorageService>;
  let shareLinkServiceSpy: jasmine.SpyObj<IPFSShareLinkService>;
  
  const mockConfig: IPFSConfig = {
    mode: 'api',
    gateway: 'http://127.0.0.1:8080',
    apiEndpoint: '/api/v0',
    timeout: 30000,
    retryAttempts: 3,
    maxFileSize: 100 * 1024 * 1024,
    enableEncryption: false
  };

  const mockCid = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  const mockPath = '/test/file.txt';
  const mockData = new TextEncoder().encode('test data');

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post', 'get']);
    localCacheSpy = jasmine.createSpyObj('IndexedDbStorageService', ['write', 'read', 'exists', 'delete', 'list']);
    shareLinkServiceSpy = jasmine.createSpyObj('IPFSShareLinkService', ['generateShareLink', 'generateMultipleShareLinks']);

    localCacheSpy.write.and.returnValue(Promise.resolve());
    localCacheSpy.read.and.returnValue(Promise.resolve(mockData));
    localCacheSpy.exists.and.returnValue(Promise.resolve(false));
    localCacheSpy.delete.and.returnValue(Promise.resolve());
    localCacheSpy.list.and.returnValue(Promise.resolve([]));

    shareLinkServiceSpy.generateShareLink.and.returnValue(`https://ipfs.io/ipfs/${mockCid}`);
    shareLinkServiceSpy.generateMultipleShareLinks.and.returnValue([
      `https://ipfs.io/ipfs/${mockCid}`,
      `https://gateway.ipfs.io/ipfs/${mockCid}`
    ]);

    TestBed.configureTestingModule({
      providers: [
        IPFSStorageService,
        { provide: IPFS_CONFIG, useValue: mockConfig },
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: IndexedDbStorageService, useValue: localCacheSpy },
        { provide: IPFSShareLinkService, useValue: shareLinkServiceSpy }
      ]
    });

    service = TestBed.inject(IPFSStorageService);
    
    // Mock loadCidMappings to prevent initialization errors
    spyOn(service as any, 'loadCidMappings').and.returnValue(Promise.resolve());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('write', () => {
    it('should write to local cache and IPFS', async () => {
      httpClientSpy.post.and.returnValue(of({ Hash: mockCid }));
      
      await service.write(mockPath, mockData);
      
      expect(localCacheSpy.write).toHaveBeenCalledWith(mockPath, mockData);
      expect(httpClientSpy.post).toHaveBeenCalled();
      expect(service.getCidForPath(mockPath)).toBe(mockCid);
    });

    it('should handle IPFS upload failure', async () => {
      httpClientSpy.post.and.returnValue(throwError(() => new Error('IPFS error')));
      
      await expectAsync(service.write(mockPath, mockData)).toBeRejectedWithError('Failed to add to IPFS: IPFS error');
      expect(localCacheSpy.write).toHaveBeenCalled(); // Still writes to local cache
    });
  });

  describe('read', () => {
    it('should read from local cache if exists', async () => {
      localCacheSpy.exists.and.returnValue(Promise.resolve(true));
      
      const result = await service.read(mockPath);
      
      expect(result).toEqual(mockData);
      expect(localCacheSpy.read).toHaveBeenCalledWith(mockPath);
      expect(httpClientSpy.post).not.toHaveBeenCalled();
    });

    it('should read from IPFS if not in cache', async () => {
      localCacheSpy.exists.and.returnValue(Promise.resolve(false));
      service['pathToCidMap'].set(mockPath, mockCid);
      httpClientSpy.post.and.returnValue(of(mockData));
      
      const result = await service.read(mockPath);
      
      expect(result).toEqual(mockData);
      expect(httpClientSpy.post).toHaveBeenCalled();
      expect(localCacheSpy.write).toHaveBeenCalledWith(mockPath, mockData);
    });

    it('should throw error if no CID mapping found', async () => {
      localCacheSpy.exists.and.returnValue(Promise.resolve(false));
      
      await expectAsync(service.read(mockPath)).toBeRejectedWithError(`No CID mapping found for path: ${mockPath}`);
    });
  });

  describe('exists', () => {
    it('should return true if exists in local cache', async () => {
      localCacheSpy.exists.and.returnValue(Promise.resolve(true));
      
      const result = await service.exists(mockPath);
      
      expect(result).toBe(true);
    });

    it('should return true if CID mapping exists', async () => {
      localCacheSpy.exists.and.returnValue(Promise.resolve(false));
      service['pathToCidMap'].set(mockPath, mockCid);
      
      const result = await service.exists(mockPath);
      
      expect(result).toBe(true);
    });

    it('should return false if not in cache and no CID mapping', async () => {
      localCacheSpy.exists.and.returnValue(Promise.resolve(false));
      
      const result = await service.exists(mockPath);
      
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete from local cache and remove CID mapping', async () => {
      service['pathToCidMap'].set(mockPath, mockCid);
      service['cidToPathMap'].set(mockCid, mockPath);
      
      await service.delete(mockPath);
      
      expect(localCacheSpy.delete).toHaveBeenCalledWith(mockPath);
      expect(service.getCidForPath(mockPath)).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should combine and deduplicate paths from cache and CID mappings', async () => {
      const cachePaths = ['/cached/file1.txt', '/cached/file2.txt'];
      const ipfsPaths = ['/ipfs/file1.txt', '/cached/file1.txt']; // One duplicate
      
      localCacheSpy.list.and.returnValue(Promise.resolve(cachePaths));
      ipfsPaths.forEach(path => service['pathToCidMap'].set(path, mockCid));
      
      const result = await service.list();
      
      expect(result).toContain('/cached/file1.txt');
      expect(result).toContain('/cached/file2.txt');
      expect(result).toContain('/ipfs/file1.txt');
      expect(result.length).toBe(3); // Deduplication works
    });
  });

  describe('isHealthy', () => {
    it('should return true when IPFS client is healthy', async () => {
      httpClientSpy.post.and.returnValue(of({ Version: '0.1.0' }));
      
      const result = await service.isHealthy();
      
      expect(result).toBe(true);
    });

    it('should return false when IPFS client is not healthy', async () => {
      httpClientSpy.post.and.returnValue(throwError(() => new Error('Network error')));
      
      const result = await service.isHealthy();
      
      expect(result).toBe(false);
    });
  });

  describe('share link functionality', () => {
    beforeEach(() => {
      service['pathToCidMap'].set(mockPath, mockCid);
    });

    it('should generate share link for existing content', () => {
      const link = service.generateShareLink(mockPath);
      
      expect(link).toBe(`https://ipfs.io/ipfs/${mockCid}`);
      expect(shareLinkServiceSpy.generateShareLink).toHaveBeenCalledWith(mockCid, { filename: undefined });
    });

    it('should generate share link with filename', () => {
      const filename = 'document.pdf';
      const link = service.generateShareLink(mockPath, filename);
      
      expect(link).toBe(`https://ipfs.io/ipfs/${mockCid}`);
      expect(shareLinkServiceSpy.generateShareLink).toHaveBeenCalledWith(mockCid, { filename });
    });

    it('should return null for non-existent content', () => {
      const link = service.generateShareLink('/non/existent/path');
      
      expect(link).toBeNull();
      expect(shareLinkServiceSpy.generateShareLink).not.toHaveBeenCalled();
    });

    it('should generate multiple share links', () => {
      const links = service.generateMultipleShareLinks(mockPath);
      
      expect(links.length).toBe(2);
      expect(links[0]).toContain(mockCid);
      expect(shareLinkServiceSpy.generateMultipleShareLinks).toHaveBeenCalledWith(mockCid, { filename: undefined });
    });

    it('should return empty array for non-existent content', () => {
      const links = service.generateMultipleShareLinks('/non/existent/path');
      
      expect(links).toEqual([]);
      expect(shareLinkServiceSpy.generateMultipleShareLinks).not.toHaveBeenCalled();
    });

    it('should provide access to share link service', () => {
      const shareService = service.getShareLinkService();
      
      expect(shareService).toBe(shareLinkServiceSpy);
    });
  });

  describe('getCidForPath', () => {
    it('should return CID for mapped path', () => {
      service['pathToCidMap'].set(mockPath, mockCid);
      
      const cid = service.getCidForPath(mockPath);
      
      expect(cid).toBe(mockCid);
    });

    it('should return undefined for unmapped path', () => {
      const cid = service.getCidForPath('/unmapped/path');
      
      expect(cid).toBeUndefined();
    });
  });
});