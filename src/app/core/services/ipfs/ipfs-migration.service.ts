import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { IStorageProvider } from '../../domain/interfaces/storage.interface';
import { IPFSStorageService } from './ipfs-storage.service';
import { HeliaStorageService } from '../helia/helia-storage.service';
import { STORAGE_PROVIDER, STORAGE_TYPE, StorageType } from '../storage-provider.factory';

export interface MigrationProgress {
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  currentItem?: string;
  status: 'idle' | 'preparing' | 'migrating' | 'completed' | 'failed';
  errors: Array<{ path: string; error: string }>;
}

export interface MigrationOptions {
  batchSize?: number;
  deleteAfterMigration?: boolean;
  skipExisting?: boolean;
  filter?: (path: string) => boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IPFSMigrationService {
  private progressSubject = new BehaviorSubject<MigrationProgress>({
    totalItems: 0,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    status: 'idle',
    errors: []
  });

  private cancelSubject = new Subject<void>();
  private isRunning = false;
  private isCancelled = false;

  progress$ = this.progressSubject.asObservable();

  constructor(
    @Inject(STORAGE_PROVIDER) private currentStorageProvider: IStorageProvider,
    @Inject(STORAGE_TYPE) private currentStorageType: StorageType
  ) {}

  /**
   * Migrate content from current storage provider to IPFS or Helia
   */
  async migrateToIPFS(
    targetProvider: IPFSStorageService | HeliaStorageService,
    options: MigrationOptions = {}
  ): Promise<MigrationProgress> {
    if (this.isRunning) {
      throw new Error('Migration is already in progress');
    }

    if (this.currentStorageProvider === targetProvider) {
      throw new Error('Cannot migrate to the same storage provider');
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.cancelSubject = new Subject<void>();

    const {
      batchSize = 10,
      deleteAfterMigration = false,
      skipExisting = true,
      filter
    } = options;

    try {
      // Update status to preparing
      this.updateProgress({ status: 'preparing' });

      // Get list of all items to migrate
      const allPaths = await this.currentStorageProvider.list();
      const pathsToMigrate = filter ? allPaths.filter(filter) : allPaths;

      // Initialize progress
      this.updateProgress({
        totalItems: pathsToMigrate.length,
        processedItems: 0,
        successfulItems: 0,
        failedItems: 0,
        status: 'migrating',
        errors: []
      });

      // Process in batches
      for (let i = 0; i < pathsToMigrate.length; i += batchSize) {
        // Check for cancellation
        if (this.isCancelled) {
          this.updateProgress({ status: 'failed' });
          break;
        }

        const batch = pathsToMigrate.slice(i, i + batchSize);
        await this.processBatch(batch, targetProvider, skipExisting, deleteAfterMigration);
      }

      // Update final status
      const finalProgress = this.progressSubject.value;
      if (finalProgress.failedItems === 0) {
        this.updateProgress({ status: 'completed' });
      } else {
        this.updateProgress({ status: 'failed' });
      }

      return this.progressSubject.value;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a batch of items for migration
   */
  private async processBatch(
    paths: string[],
    targetProvider: IPFSStorageService | HeliaStorageService,
    skipExisting: boolean,
    deleteAfterMigration: boolean
  ): Promise<void> {
    const promises = paths.map(path => 
      this.migrateItem(path, targetProvider, skipExisting, deleteAfterMigration)
    );

    await Promise.all(promises);
  }

  /**
   * Migrate a single item
   */
  private async migrateItem(
    path: string,
    targetProvider: IPFSStorageService | HeliaStorageService,
    skipExisting: boolean,
    deleteAfterMigration: boolean
  ): Promise<void> {
    try {
      // Update current item
      this.updateProgress({ currentItem: path });

      // Check if already exists in target
      if (skipExisting && await targetProvider.exists(path)) {
        this.incrementProgress(true);
        return;
      }

      // Read from source
      const data = await this.currentStorageProvider.read(path);

      // Write to target
      await targetProvider.write(path, data);

      // Delete from source if requested
      if (deleteAfterMigration) {
        await this.currentStorageProvider.delete(path);
      }

      // Update progress with success
      this.incrementProgress(true);
    } catch (error) {
      // Update progress with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.incrementProgress(false, { path, error: errorMessage });
    }
  }

  /**
   * Increment progress counters atomically
   */
  private incrementProgress(success: boolean, error?: { path: string; error: string }): void {
    const currentProgress = this.progressSubject.value;
    
    if (success) {
      this.updateProgress({
        processedItems: currentProgress.processedItems + 1,
        successfulItems: currentProgress.successfulItems + 1
      });
    } else {
      this.updateProgress({
        processedItems: currentProgress.processedItems + 1,
        failedItems: currentProgress.failedItems + 1,
        errors: error ? [...currentProgress.errors, error] : currentProgress.errors
      });
    }
  }

  /**
   * Cancel ongoing migration
   */
  cancelMigration(): void {
    if (this.isRunning) {
      this.isCancelled = true;
      this.cancelSubject.next();
      this.cancelSubject.complete();
    }
  }

  /**
   * Get migration statistics
   */
  getMigrationStats(): {
    canMigrate: boolean;
    currentStorageType: StorageType;
    estimatedItems?: number;
  } {
    const canMigrate = this.currentStorageType !== StorageType.IPFS && 
                      this.currentStorageType !== StorageType.HELIA;

    return {
      canMigrate,
      currentStorageType: this.currentStorageType,
      estimatedItems: undefined // This would require an async call to list()
    };
  }

  /**
   * Estimate migration size
   */
  async estimateMigrationSize(): Promise<{
    itemCount: number;
    totalSize: number;
    estimatedTime: number;
  }> {
    const paths = await this.currentStorageProvider.list();
    let totalSize = 0;

    // Sample first 10 items to estimate average size
    const sampleSize = Math.min(10, paths.length);
    let sampleTotalSize = 0;

    for (let i = 0; i < sampleSize; i++) {
      try {
        const data = await this.currentStorageProvider.read(paths[i]);
        sampleTotalSize += data.length;
      } catch {
        // Skip items that fail to read
      }
    }

    // Estimate total size based on sample
    const averageSize = sampleSize > 0 ? sampleTotalSize / sampleSize : 0;
    totalSize = Math.round(averageSize * paths.length);

    // Estimate time (assuming 1MB/s upload speed)
    const estimatedTime = Math.round(totalSize / (1024 * 1024));

    return {
      itemCount: paths.length,
      totalSize,
      estimatedTime
    };
  }

  /**
   * Update migration progress
   */
  private updateProgress(update: Partial<MigrationProgress>): void {
    this.progressSubject.next({
      ...this.progressSubject.value,
      ...update
    });
  }

  /**
   * Reset migration state
   */
  reset(): void {
    this.progressSubject.next({
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      status: 'idle',
      errors: []
    });
  }

  /**
   * Check if migration is running
   */
  isMigrationRunning(): boolean {
    return this.isRunning;
  }
}