import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { IPFSStorageService } from './ipfs-storage.service';

export interface UploadQueueItem {
  id: string;
  path: string;
  data: Uint8Array;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  cid?: string;
  error?: string;
  timestamp: Date;
}

export interface UploadQueueStatus {
  total: number;
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
}

@Injectable({
  providedIn: 'root'
})
export class IPFSUploadQueueService {
  private queue: Map<string, UploadQueueItem> = new Map();
  private queueSubject = new BehaviorSubject<UploadQueueItem[]>([]);
  private statusSubject = new BehaviorSubject<UploadQueueStatus>({
    total: 0,
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0
  });
  
  private uploadProgressSubject = new Subject<UploadQueueItem>();
  private maxConcurrentUploads = 3;
  private activeUploads = 0;
  private autoProcess = true;
  
  queue$ = this.queueSubject.asObservable();
  status$ = this.statusSubject.asObservable();
  uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private ipfsStorage: IPFSStorageService) {}

  /**
   * Enable or disable automatic processing (useful for testing)
   */
  setAutoProcess(enabled: boolean): void {
    this.autoProcess = enabled;
    if (enabled) {
      this.processQueue();
    }
  }

  /**
   * Add a file to the upload queue
   */
  addToQueue(path: string, data: Uint8Array): string {
    const id = this.generateId();
    const item: UploadQueueItem = {
      id,
      path,
      data,
      status: 'pending',
      progress: 0,
      timestamp: new Date()
    };
    
    this.queue.set(id, item);
    this.updateQueueState();
    if (this.autoProcess) {
      this.processQueue();
    }
    
    return id;
  }

  /**
   * Add multiple files to the queue
   */
  addMultipleToQueue(files: Array<{ path: string; data: Uint8Array }>): string[] {
    const ids = files.map(file => this.addToQueue(file.path, file.data));
    return ids;
  }

  /**
   * Cancel an upload
   */
  cancelUpload(id: string): void {
    const item = this.queue.get(id);
    if (item && item.status === 'pending') {
      this.queue.delete(id);
      this.updateQueueState();
    }
  }

  /**
   * Clear completed uploads from the queue
   */
  clearCompleted(): void {
    Array.from(this.queue.entries()).forEach(([id, item]) => {
      if (item.status === 'completed') {
        this.queue.delete(id);
      }
    });
    this.updateQueueState();
  }

  /**
   * Retry failed uploads
   */
  retryFailed(): void {
    Array.from(this.queue.values()).forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.progress = 0;
        delete item.error;
      }
    });
    this.updateQueueState();
    if (this.autoProcess) {
      this.processQueue();
    }
  }

  /**
   * Get upload item by ID
   */
  getUpload(id: string): UploadQueueItem | undefined {
    return this.queue.get(id);
  }

  private async processQueue(): Promise<void> {
    if (this.activeUploads >= this.maxConcurrentUploads) {
      return;
    }

    const pendingItems = Array.from(this.queue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (pendingItems.length === 0) {
      return;
    }

    const item = pendingItems[0];
    await this.uploadItem(item);
  }

  private async uploadItem(item: UploadQueueItem): Promise<void> {
    try {
      this.activeUploads++;
      item.status = 'uploading';
      item.progress = 0;
      this.updateQueueState();
      this.uploadProgressSubject.next(item);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (item.progress < 90) {
          item.progress += Math.random() * 20;
          this.uploadProgressSubject.next(item);
        }
      }, 500);

      await this.ipfsStorage.write(item.path, item.data);
      
      clearInterval(progressInterval);
      
      item.status = 'completed';
      item.progress = 100;
      item.cid = this.ipfsStorage.getCidForPath(item.path);
      this.uploadProgressSubject.next(item);
      
    } catch (error) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Upload failed';
      this.uploadProgressSubject.next(item);
    } finally {
      this.activeUploads--;
      this.updateQueueState();
      
      // Process next item in queue
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private updateQueueState(): void {
    const items = Array.from(this.queue.values());
    this.queueSubject.next(items);
    
    const status: UploadQueueStatus = {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      uploading: items.filter(i => i.status === 'uploading').length,
      completed: items.filter(i => i.status === 'completed').length,
      failed: items.filter(i => i.status === 'failed').length
    };
    
    this.statusSubject.next(status);
  }

  private generateId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}