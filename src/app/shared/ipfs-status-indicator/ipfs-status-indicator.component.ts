import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, timer, of } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { StorageType, STORAGE_TYPE, STORAGE_PROVIDER } from '../../core/services/storage-provider.factory';
import { IStorageProvider } from '../../core/domain/interfaces/storage.interface';

@Component({
  selector: 'app-ipfs-status-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ipfs-status" *ngIf="storageType === StorageType.IPFS || storageType === StorageType.HELIA">
      <div class="status-indicator" [class.connected]="isConnected" [class.disconnected]="!isConnected">
        <span class="status-dot"></span>
        <span class="status-text">{{ getStatusText() }}</span>
      </div>
      <div class="status-details" *ngIf="showDetails">
        <p *ngIf="isConnected">{{ getHealthyMessage() }}</p>
        <p *ngIf="!isConnected && errorMessage">{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .ipfs-status {
      display: inline-block;
      padding: 8px 12px;
      background-color: #f0f0f0;
      border-radius: 4px;
      font-size: 14px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      transition: background-color 0.3s;
    }

    .connected .status-dot {
      background-color: #27ae60;
      animation: pulse 2s infinite;
    }

    .disconnected .status-dot {
      background-color: #e74c3c;
    }

    .status-text {
      font-weight: 500;
    }

    .connected .status-text {
      color: #27ae60;
    }

    .disconnected .status-text {
      color: #e74c3c;
    }

    .status-details {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }

    .status-details p {
      margin: 0;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(39, 174, 96, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(39, 174, 96, 0);
      }
    }
  `]
})
export class IPFSStatusIndicatorComponent implements OnInit, OnDestroy {
  StorageType = StorageType;
  isConnected = false;
  showDetails = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();
  private checkInterval = 30000; // Check every 30 seconds

  constructor(
    @Inject(STORAGE_TYPE) public storageType: StorageType,
    @Inject(STORAGE_PROVIDER) private storageProvider: IStorageProvider
  ) {}

  ngOnInit() {
    if (this.storageType === StorageType.IPFS || this.storageType === StorageType.HELIA) {
      // Initial check
      this.checkConnection();

      // Set up periodic checks
      timer(0, this.checkInterval)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.checkProviderHealth()),
          catchError(error => {
            this.errorMessage = error.message || 'Connection failed';
            return of(false);
          })
        )
        .subscribe(isHealthy => {
          this.isConnected = isHealthy;
          if (isHealthy) {
            this.errorMessage = '';
          }
        });
    }
  }

  private async checkProviderHealth(): Promise<boolean> {
    // Check if the storage provider has isHealthy method
    if ('isHealthy' in this.storageProvider && typeof this.storageProvider.isHealthy === 'function') {
      return await this.storageProvider.isHealthy();
    }
    return false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async checkConnection() {
    try {
      this.isConnected = await this.checkProviderHealth();
      if (this.isConnected) {
        this.errorMessage = '';
      }
    } catch (error) {
      this.isConnected = false;
      this.errorMessage = error instanceof Error ? error.message : 'Connection failed';
    }
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  getStatusText(): string {
    if (this.storageType === StorageType.IPFS) {
      return `IPFS: ${this.isConnected ? 'Connected' : 'Disconnected'}`;
    } else if (this.storageType === StorageType.HELIA) {
      return `Helia: ${this.isConnected ? 'Active' : 'Inactive'}`;
    }
    return '';
  }

  getHealthyMessage(): string {
    if (this.storageType === StorageType.IPFS) {
      return 'Node is healthy';
    } else if (this.storageType === StorageType.HELIA) {
      return 'Browser IPFS is running';
    }
    return '';
  }
}