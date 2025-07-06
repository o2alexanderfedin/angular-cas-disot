import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { IPFSMigrationService, MigrationProgress } from '../../../core/services/ipfs/ipfs-migration.service';
import { STORAGE_PROVIDER, STORAGE_TYPE, StorageType } from '../../../core/services/storage-provider.factory';
import { IStorageProvider } from '../../../core/domain/interfaces/storage.interface';
import { IPFSStorageService } from '../../../core/services/ipfs/ipfs-storage.service';
import { HeliaStorageService } from '../../../core/services/helia/helia-storage.service';

@Component({
  selector: 'app-migration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="migration-container">
      <h2>Storage Migration</h2>
      
      <div class="migration-info" *ngIf="!canMigrate">
        <p class="info-message">
          Your content is already stored in {{ currentStorageType }}. 
          Migration is only available when using In-Memory or IndexedDB storage.
        </p>
      </div>

      <div class="migration-content" *ngIf="canMigrate">
        <div class="migration-overview">
          <h3>Migrate to Distributed Storage</h3>
          <p>
            Transfer your content from {{ getStorageTypeName(currentStorageType) }} 
            to a distributed storage system (IPFS or Helia).
          </p>
        </div>

        <div class="migration-estimate" *ngIf="!isRunning && estimate">
          <h4>Migration Estimate</h4>
          <div class="estimate-details">
            <div class="estimate-item">
              <span class="label">Total Items:</span>
              <span class="value">{{ estimate.itemCount }}</span>
            </div>
            <div class="estimate-item">
              <span class="label">Total Size:</span>
              <span class="value">{{ formatBytes(estimate.totalSize) }}</span>
            </div>
            <div class="estimate-item">
              <span class="label">Estimated Time:</span>
              <span class="value">{{ formatTime(estimate.estimatedTime) }}</span>
            </div>
          </div>
        </div>

        <div class="migration-options" *ngIf="!isRunning">
          <h4>Migration Options</h4>
          
          <div class="option-group">
            <label>Target Storage:</label>
            <select [(ngModel)]="targetStorageType" class="form-select">
              <option [value]="StorageType.IPFS">IPFS (External Node)</option>
              <option [value]="StorageType.HELIA">Helia (Browser IPFS)</option>
            </select>
          </div>

          <div class="option-group">
            <label>
              <input type="checkbox" [(ngModel)]="options.deleteAfterMigration">
              Delete files from source after successful migration
            </label>
          </div>

          <div class="option-group">
            <label>
              <input type="checkbox" [(ngModel)]="options.skipExisting">
              Skip files that already exist in target
            </label>
          </div>

          <div class="option-group">
            <label>Batch Size:</label>
            <input 
              type="number" 
              [(ngModel)]="options.batchSize" 
              min="1" 
              max="50"
              class="form-input"
            >
          </div>

          <div class="action-buttons">
            <button 
              (click)="estimateMigration()" 
              class="btn-secondary"
              [disabled]="isEstimating"
            >
              {{ isEstimating ? 'Estimating...' : 'Estimate Migration' }}
            </button>
            <button 
              (click)="startMigration()" 
              class="btn-primary"
              [disabled]="!targetStorageType"
            >
              Start Migration
            </button>
          </div>
        </div>

        <div class="migration-progress" *ngIf="isRunning && progress">
          <h4>Migration Progress</h4>
          
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              [style.width.%]="getProgressPercentage()"
              [class.error]="progress.status === 'failed'"
            ></div>
          </div>

          <div class="progress-details">
            <div class="progress-item">
              <span class="label">Status:</span>
              <span class="value" [class]="progress.status">{{ progress.status }}</span>
            </div>
            <div class="progress-item">
              <span class="label">Progress:</span>
              <span class="value">{{ progress.processedItems }} / {{ progress.totalItems }}</span>
            </div>
            <div class="progress-item">
              <span class="label">Successful:</span>
              <span class="value success">{{ progress.successfulItems }}</span>
            </div>
            <div class="progress-item" *ngIf="progress.failedItems > 0">
              <span class="label">Failed:</span>
              <span class="value error">{{ progress.failedItems }}</span>
            </div>
            <div class="progress-item" *ngIf="progress.currentItem">
              <span class="label">Current File:</span>
              <span class="value">{{ progress.currentItem }}</span>
            </div>
          </div>

          <div class="migration-errors" *ngIf="progress.errors.length > 0">
            <h5>Errors:</h5>
            <ul class="error-list">
              <li *ngFor="let error of progress.errors">
                <strong>{{ error.path }}:</strong> {{ error.error }}
              </li>
            </ul>
          </div>

          <div class="action-buttons">
            <button (click)="cancelMigration()" class="btn-danger">
              Cancel Migration
            </button>
          </div>
        </div>

        <div class="migration-complete" *ngIf="!isRunning && progress && progress.status === 'completed'">
          <div class="success-message">
            <h4>Migration Completed Successfully!</h4>
            <p>All {{ progress.successfulItems }} items have been migrated to {{ targetStorageType }}.</p>
            <p class="note">
              Remember to update your storage settings to use the new storage provider.
            </p>
          </div>
          <button (click)="resetMigration()" class="btn-primary">
            Start New Migration
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .migration-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .migration-info {
      background-color: #f0f8ff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .info-message {
      margin: 0;
      color: #0066cc;
    }

    .migration-content {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
    }

    .migration-overview {
      margin-bottom: 30px;
    }

    .migration-overview h3 {
      margin-top: 0;
      color: #333;
    }

    .migration-estimate {
      background-color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .estimate-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 10px;
    }

    .estimate-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
      color: #333;
    }

    .migration-options {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .option-group {
      margin-bottom: 15px;
    }

    .option-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .form-select, .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-input {
      width: 100px;
    }

    input[type="checkbox"] {
      margin-right: 8px;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .btn-primary, .btn-secondary, .btn-danger {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2980b9;
    }

    .btn-secondary {
      background-color: #95a5a6;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #7f8c8d;
    }

    .btn-danger {
      background-color: #e74c3c;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c0392b;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .migration-progress {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
    }

    .progress-bar {
      width: 100%;
      height: 30px;
      background-color: #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      margin-bottom: 20px;
    }

    .progress-fill {
      height: 100%;
      background-color: #3498db;
      transition: width 0.3s ease;
    }

    .progress-fill.error {
      background-color: #e74c3c;
    }

    .progress-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    }

    .progress-item {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .value.preparing, .value.migrating {
      color: #3498db;
    }

    .value.completed, .value.success {
      color: #27ae60;
    }

    .value.failed, .value.error {
      color: #e74c3c;
    }

    .migration-errors {
      background-color: #fee;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .migration-errors h5 {
      margin-top: 0;
      color: #c0392b;
    }

    .error-list {
      margin: 0;
      padding-left: 20px;
      font-size: 14px;
    }

    .migration-complete {
      text-align: center;
      padding: 20px;
    }

    .success-message {
      background-color: #d4edda;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .success-message h4 {
      margin-top: 0;
      color: #155724;
    }

    .note {
      font-style: italic;
      color: #666;
      margin-top: 10px;
    }
  `]
})
export class MigrationComponent implements OnInit, OnDestroy {
  StorageType = StorageType;
  canMigrate = false;
  currentStorageType: StorageType;
  targetStorageType?: StorageType;
  isRunning = false;
  isEstimating = false;
  progress?: MigrationProgress;
  estimate?: { itemCount: number; totalSize: number; estimatedTime: number };
  
  options = {
    batchSize: 10,
    deleteAfterMigration: false,
    skipExisting: true
  };

  private destroy$ = new Subject<void>();

  constructor(
    private migrationService: IPFSMigrationService,
    @Inject(STORAGE_TYPE) storageType: StorageType,
    @Inject(STORAGE_PROVIDER) _storageProvider: IStorageProvider,
    private ipfsStorage: IPFSStorageService,
    private heliaStorage: HeliaStorageService
  ) {
    this.currentStorageType = storageType;
  }

  ngOnInit(): void {
    const stats = this.migrationService.getMigrationStats();
    this.canMigrate = stats.canMigrate;

    // Subscribe to migration progress
    this.migrationService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.progress = progress;
        this.isRunning = progress.status === 'preparing' || progress.status === 'migrating';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async estimateMigration(): Promise<void> {
    this.isEstimating = true;
    try {
      this.estimate = await this.migrationService.estimateMigrationSize();
    } catch (error) {
      console.error('Failed to estimate migration:', error);
    } finally {
      this.isEstimating = false;
    }
  }

  async startMigration(): Promise<void> {
    if (!this.targetStorageType) return;

    const targetProvider = this.targetStorageType === StorageType.IPFS 
      ? this.ipfsStorage 
      : this.heliaStorage;

    try {
      await this.migrationService.migrateToIPFS(targetProvider, this.options);
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  cancelMigration(): void {
    this.migrationService.cancelMigration();
  }

  resetMigration(): void {
    this.migrationService.reset();
    this.estimate = undefined;
    this.targetStorageType = undefined;
  }

  getProgressPercentage(): number {
    if (!this.progress || this.progress.totalItems === 0) return 0;
    return (this.progress.processedItems / this.progress.totalItems) * 100;
  }

  getStorageTypeName(type: StorageType): string {
    switch (type) {
      case StorageType.IN_MEMORY:
        return 'In-Memory Storage';
      case StorageType.INDEXED_DB:
        return 'IndexedDB';
      case StorageType.IPFS:
        return 'IPFS';
      case StorageType.HELIA:
        return 'Helia';
      default:
        return 'Unknown';
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    return `${Math.floor(seconds / 3600)} hours`;
  }
}