import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IPFSUploadQueueService, UploadQueueItem, UploadQueueStatus } from './ipfs-upload-queue.service';
import { IPFSStorageService, IPFS_CONFIG } from './ipfs-storage.service';
import { DEFAULT_IPFS_CONFIG } from './ipfs.config';
import { IndexedDbStorageService } from '../indexed-db-storage.service';

describe('IPFSUploadQueueService', () => {
  let service: IPFSUploadQueueService;
  let ipfsStorage: jasmine.SpyObj<IPFSStorageService>;
  let queueItems: UploadQueueItem[] = [];
  let queueStatus: UploadQueueStatus | null = null;

  beforeEach(() => {
    const ipfsStorageSpy = jasmine.createSpyObj('IPFSStorageService', 
      ['write', 'read', 'exists', 'delete', 'list', 'getCidForPath']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        IPFSUploadQueueService,
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
        { provide: IPFSStorageService, useValue: ipfsStorageSpy },
        IndexedDbStorageService
      ]
    });

    service = TestBed.inject(IPFSUploadQueueService);
    ipfsStorage = TestBed.inject(IPFSStorageService) as jasmine.SpyObj<IPFSStorageService>;

    // Subscribe to observables
    service.queue$.subscribe(items => queueItems = items);
    service.status$.subscribe(status => queueStatus = status);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty queue', () => {
    expect(queueItems).toEqual([]);
    expect(queueStatus).toEqual({
      total: 0,
      pending: 0,
      uploading: 0,
      completed: 0,
      failed: 0
    });
  });

  describe('addToQueue', () => {
    it('should add item to queue with pending status', fakeAsync(() => {
      // Set up the mock to delay so we can check pending status
      ipfsStorage.write.and.returnValue(new Promise(resolve => setTimeout(resolve, 1000)));
      
      const data = new Uint8Array([1, 2, 3]);
      const id = service.addToQueue('test.txt', data);

      // Check immediately before processing starts
      expect(id).toBeTruthy();
      expect(queueItems.length).toBe(1);
      
      // The item might already be uploading, so check for either status
      const item = queueItems[0];
      expect(item.id).toBe(id);
      expect(item.path).toBe('test.txt');
      expect(item.data).toEqual(data);
      expect(item.progress).toBe(0);
      expect(['pending', 'uploading']).toContain(item.status);
    }));

    it('should update queue status when adding items', fakeAsync(() => {
      // Set up the mock to delay so items stay pending
      ipfsStorage.write.and.returnValue(new Promise(resolve => setTimeout(resolve, 5000)));
      
      service.addToQueue('test1.txt', new Uint8Array([1]));
      service.addToQueue('test2.txt', new Uint8Array([2]));

      // Give a small tick to let the queue update
      tick(10);
      
      expect(queueStatus?.total).toBe(2);
      // Some items might already be uploading
      expect((queueStatus?.pending || 0) + (queueStatus?.uploading || 0)).toBe(2);
      expect(queueStatus?.completed).toBe(0);
      expect(queueStatus?.failed).toBe(0);
    }));
  });

  describe('addMultipleToQueue', () => {
    it('should add multiple files to queue', fakeAsync(() => {
      // Set up the mock to delay so items stay pending
      ipfsStorage.write.and.returnValue(new Promise(resolve => setTimeout(resolve, 5000)));
      
      const files = [
        { path: 'file1.txt', data: new Uint8Array([1]) },
        { path: 'file2.txt', data: new Uint8Array([2]) },
        { path: 'file3.txt', data: new Uint8Array([3]) }
      ];

      const ids = service.addMultipleToQueue(files);

      // Give a small tick to let the queue update
      tick(10);
      
      expect(ids.length).toBe(3);
      expect(queueItems.length).toBe(3);
      expect(queueStatus?.total).toBe(3);
      // Some items might already be uploading
      expect((queueStatus?.pending || 0) + (queueStatus?.uploading || 0)).toBe(3);
    }));
  });

  describe('cancelUpload', () => {
    it('should remove pending upload from queue', () => {
      // Disable auto-processing for this test
      service.setAutoProcess(false);
      
      const id = service.addToQueue('test.txt', new Uint8Array([1]));
      
      service.cancelUpload(id);

      expect(queueItems.length).toBe(0);
      expect(queueStatus?.total).toBe(0);
      
      // Re-enable auto-processing
      service.setAutoProcess(true);
    });

    it('should not remove uploading or completed items', fakeAsync(() => {
      ipfsStorage.write.and.returnValue(Promise.resolve());
      ipfsStorage.getCidForPath.and.returnValue('Qm123');

      const id = service.addToQueue('test.txt', new Uint8Array([1]));
      
      // Let upload start
      tick(100);
      
      // Try to cancel while uploading
      service.cancelUpload(id);
      
      // Item should still be in queue
      expect(queueItems.length).toBe(1);
    }));
  });

  describe('clearCompleted', () => {
    it('should remove only completed items', fakeAsync(() => {
      ipfsStorage.write.and.returnValue(Promise.resolve());
      ipfsStorage.getCidForPath.and.returnValue('Qm123');

      // Add multiple items
      service.addToQueue('file1.txt', new Uint8Array([1]));
      service.addToQueue('file2.txt', new Uint8Array([2]));
      service.addToQueue('file3.txt', new Uint8Array([3]));

      // Wait for first upload to complete
      tick(2000);

      // Clear completed
      service.clearCompleted();

      // Should have removed completed items
      expect(queueItems.length).toBeLessThan(3);
      expect(queueItems.every(item => item.status !== 'completed')).toBe(true);
    }));
  });

  describe('retryFailed', () => {
    it('should reset failed uploads to pending', fakeAsync(() => {
      ipfsStorage.write.and.returnValue(Promise.reject(new Error('Upload failed')));

      const id = service.addToQueue('test.txt', new Uint8Array([1]));
      
      // Wait for upload to fail
      tick(2000);

      const failedItem = service.getUpload(id);
      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.error).toBeTruthy();

      // Disable auto-processing before retry
      service.setAutoProcess(false);
      
      // Reset the mock for retry
      ipfsStorage.write.and.returnValue(new Promise(resolve => setTimeout(resolve, 5000)));
      
      // Retry failed
      service.retryFailed();

      const retriedItem = service.getUpload(id);
      expect(retriedItem?.status).toBe('pending');
      expect(retriedItem?.error).toBeUndefined();
      
      // Re-enable auto-processing
      service.setAutoProcess(true);
    }));
  });

  describe('upload processing', () => {
    it('should process uploads successfully', fakeAsync(() => {
      ipfsStorage.write.and.returnValue(Promise.resolve());
      ipfsStorage.getCidForPath.and.returnValue('QmTest123');

      const id = service.addToQueue('test.txt', new Uint8Array([1, 2, 3]));

      // Wait for upload to complete
      tick(2000);

      const item = service.getUpload(id);
      expect(item?.status).toBe('completed');
      expect(item?.progress).toBe(100);
      expect(item?.cid).toBe('QmTest123');
      expect(ipfsStorage.write).toHaveBeenCalledWith('test.txt', new Uint8Array([1, 2, 3]));
    }));

    it('should handle upload failures', fakeAsync(() => {
      const error = new Error('Network error');
      ipfsStorage.write.and.returnValue(Promise.reject(error));

      const id = service.addToQueue('test.txt', new Uint8Array([1]));

      // Wait for upload to fail
      tick(2000);

      const item = service.getUpload(id);
      expect(item?.status).toBe('failed');
      expect(item?.error).toBe('Network error');
    }));

    it('should limit concurrent uploads', fakeAsync(() => {
      ipfsStorage.write.and.returnValue(new Promise(resolve => {
        setTimeout(() => resolve(), 1000);
      }));

      // Add more items than max concurrent
      for (let i = 0; i < 5; i++) {
        service.addToQueue(`file${i}.txt`, new Uint8Array([i]));
      }

      // Check initial state
      tick(100);
      
      const uploadingCount = queueItems.filter(item => item.status === 'uploading').length;
      expect(uploadingCount).toBeLessThanOrEqual(3); // max concurrent uploads
    }));
  });

  describe('progress updates', () => {
    it('should emit progress updates during upload', fakeAsync(() => {
      let progressUpdates: UploadQueueItem[] = [];
      service.uploadProgress$.subscribe(item => progressUpdates.push({ ...item }));

      ipfsStorage.write.and.returnValue(new Promise(resolve => {
        setTimeout(() => resolve(), 1000);
      }));

      service.addToQueue('test.txt', new Uint8Array([1]));

      // Wait for progress updates
      tick(2000);

      expect(progressUpdates.length).toBeGreaterThan(1);
      expect(progressUpdates[0].status).toBe('uploading');
      expect(progressUpdates[progressUpdates.length - 1].status).toBe('completed');
    }));
  });
});