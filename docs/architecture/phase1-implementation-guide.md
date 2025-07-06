# Phase 1: IPFS Implementation Guide 🛠️

[⬅️ IPFS Architecture](./phase1-ipfs-architecture.md) | [🏠 Home](../README.md) | [Roadmap ➡️](./phase1-roadmap.md)

## Table of Contents

1. [Implementation Checklist](#implementation-checklist)
2. [Code Structure](#code-structure)
3. [IPFS Storage Provider](#ipfs-storage-provider)
4. [Upload Queue Implementation](#upload-queue-implementation)
5. [UI Components](#ui-components)
6. [Testing Strategy](#testing-strategy)
7. [Configuration Management](#configuration-management)
8. [Error Handling](#error-handling)

## Implementation Checklist

### Epic 1: Foundation (13 story points)
- [ ] **Install IPFS HTTP client library** (1 point)
- [ ] **Create `IIPFSClient` interface** (2 points)
- [ ] **Implement `IPFSHTTPClient`** (3 points)
- [ ] **Implement `IPFSGatewayClient`** (2 points)
- [ ] **Add IPFS configuration to settings** (1 point)
- [ ] **Create basic `IPFSStorageService`** (3 points)
- [ ] **Update `StorageProviderFactory`** (1 point)
- [ ] **Add IPFS option to settings UI** (2 points)

### Epic 2: Core Features (21 story points)
- [ ] **Implement upload queue with IndexedDB** (5 points)
- [ ] **Add retry logic for failed uploads** (3 points)
- [ ] **Create CID mapping service** (3 points)
- [ ] **Implement local caching layer** (2 points)
- [ ] **Add progress tracking** (2 points)
- [ ] **Create hybrid storage provider** (3 points)
- [ ] **Update CAS service for IPFS features** (2 points)
- [ ] **Add share link generation** (1 point)

### Epic 3: Enhanced Features (13 story points)
- [ ] **Implement pinning service integration** (5 points)
- [ ] **Add gateway health checking** (3 points)
- [ ] **Create migration service** (3 points)
- [ ] **Add batch upload support** (2 points)
- [ ] **Implement content encryption option** (3 points)
- [ ] **Add IPFS status indicator UI** (2 points)
- [ ] **Create migration UI** (3 points)

### Epic 4: Testing & Polish (8 story points)
- [ ] **Write unit tests for all IPFS components** (3 points)
- [ ] **Create integration tests** (2 points)
- [ ] **Add E2E tests with mock IPFS** (2 points)
- [ ] **Performance testing** (1 point)
- [ ] **Documentation update** (1 point)
- [ ] **Error handling improvements** (1 point)

**Total Phase 1 Effort: 55 story points**

### Story Point Reference:
- **1 point**: Simple configuration or interface definition
- **2 points**: Basic component or service method
- **3 points**: Complex service implementation or UI component
- **5 points**: Major feature requiring multiple components
- **8 points**: Epic-level feature with significant complexity

## Code Structure

```
src/app/
├── core/
│   ├── services/
│   │   ├── ipfs/
│   │   │   ├── ipfs-client.interface.ts
│   │   │   ├── ipfs-http-client.service.ts
│   │   │   ├── ipfs-gateway-client.service.ts
│   │   │   ├── ipfs-storage.service.ts
│   │   │   ├── ipfs-storage.service.spec.ts
│   │   │   ├── upload-queue.service.ts
│   │   │   ├── upload-queue.service.spec.ts
│   │   │   ├── cid-mapping.service.ts
│   │   │   └── gateway-health.service.ts
│   │   ├── hybrid-storage.service.ts
│   │   └── storage-migration.service.ts
│   ├── domain/
│   │   └── interfaces/
│   │       ├── ipfs.interface.ts
│   │       └── ipfs-config.interface.ts
│   └── utils/
│       └── ipfs.utils.ts
├── features/
│   ├── settings/
│   │   └── ipfs-settings/
│   │       ├── ipfs-settings.component.ts
│   │       └── ipfs-settings.component.html
│   └── shared/
│       ├── ipfs-status/
│       │   ├── ipfs-status.component.ts
│       │   └── ipfs-status.component.html
│       └── share-link/
│           ├── share-link.component.ts
│           └── share-link.component.html
```

## IPFS Storage Provider

### Interface Definition

```typescript
// ipfs.interface.ts
export interface IPFSConfig {
  mode: 'gateway' | 'api' | 'auto';
  gateway: string;
  apiEndpoint?: string;
  timeout: number;
  retryAttempts: number;
  maxFileSize: number;
  enableEncryption: boolean;
  pinningService?: {
    endpoint: string;
    apiKey: string;
  };
}

export interface IPFSUploadResult {
  cid: string;
  size: number;
  timestamp: Date;
  pinned: boolean;
}

export interface UploadQueueItem {
  id: string;
  path: string;
  data: Uint8Array;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  attempts: number;
  error?: string;
  cid?: string;
  progress?: number;
}
```

### IPFS Storage Service

```typescript
// ipfs-storage.service.ts
@Injectable({
  providedIn: 'root'
})
export class IPFSStorageService implements IStorageProvider {
  private config: IPFSConfig;
  private client: IIPFSClient;
  private localCache: IndexedDbStorageService;
  private uploadQueue: UploadQueueService;
  private cidMapping: CIDMappingService;

  constructor(
    @Inject(IPFS_CONFIG) config: IPFSConfig,
    private injector: Injector
  ) {
    this.config = config;
    this.initializeClient();
    this.localCache = injector.get(IndexedDbStorageService);
    this.uploadQueue = injector.get(UploadQueueService);
    this.cidMapping = injector.get(CIDMappingService);
  }

  private initializeClient(): void {
    switch (this.config.mode) {
      case 'api':
        this.client = new IPFSHTTPClient(this.config);
        break;
      case 'gateway':
        this.client = new IPFSGatewayClient(this.config);
        break;
      case 'auto':
        this.client = new IPFSAutoClient(this.config);
        break;
    }
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    // Size check
    if (data.length > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum of ${this.config.maxFileSize} bytes`);
    }

    // Encrypt if enabled
    if (this.config.enableEncryption) {
      data = await this.encryptData(data);
    }

    // Write to local cache immediately
    await this.localCache.write(path, data);

    // Queue for IPFS upload
    const queueItem = await this.uploadQueue.enqueue({
      path,
      data,
      metadata: {
        originalSize: data.length,
        encrypted: this.config.enableEncryption
      }
    });

    // Start upload process
    this.processUpload(queueItem);
  }

  async read(path: string): Promise<Uint8Array> {
    // Try local cache first
    try {
      const cached = await this.localCache.read(path);
      return this.config.enableEncryption ? 
        await this.decryptData(cached) : cached;
    } catch (error) {
      // Fetch from IPFS
      const cid = await this.cidMapping.getCID(path);
      if (!cid) {
        throw new Error(`No CID mapping found for path: ${path}`);
      }

      const data = await this.fetchFromIPFS(cid);
      
      // Cache locally
      await this.localCache.write(path, data);
      
      return this.config.enableEncryption ? 
        await this.decryptData(data) : data;
    }
  }

  async exists(path: string): Promise<boolean> {
    // Check local cache
    if (await this.localCache.exists(path)) {
      return true;
    }
    
    // Check CID mapping
    const cid = await this.cidMapping.getCID(path);
    return !!cid;
  }

  async delete(path: string): Promise<void> {
    // Remove from local cache
    await this.localCache.delete(path);
    
    // Remove CID mapping (content remains on IPFS)
    await this.cidMapping.removePath(path);
  }

  async list(): Promise<string[]> {
    // Combine local cache and CID mappings
    const localPaths = await this.localCache.list();
    const mappedPaths = await this.cidMapping.listPaths();
    
    return [...new Set([...localPaths, ...mappedPaths])];
  }

  async getShareableLink(path: string): Promise<string> {
    const cid = await this.cidMapping.getCID(path);
    if (!cid) {
      throw new Error(`Content not found on IPFS: ${path}`);
    }
    
    return `${this.config.gateway}/ipfs/${cid}`;
  }

  async getUploadStatus(): Promise<UploadQueueStatus> {
    return this.uploadQueue.getStatus();
  }

  private async processUpload(item: UploadQueueItem): Promise<void> {
    try {
      // Update status
      await this.uploadQueue.updateStatus(item.id, 'uploading');

      // Upload to IPFS
      const cid = await this.client.add(item.data, {
        onProgress: (progress) => {
          this.uploadQueue.updateProgress(item.id, progress);
        }
      });

      // Store CID mapping
      await this.cidMapping.setCID(item.path, cid);

      // Pin if configured
      if (this.config.pinningService) {
        await this.pinContent(cid);
      }

      // Mark as completed
      await this.uploadQueue.updateStatus(item.id, 'completed', { cid });

    } catch (error) {
      await this.uploadQueue.handleError(item.id, error);
      
      // Retry if attempts remaining
      if (item.attempts < this.config.retryAttempts) {
        setTimeout(() => {
          this.uploadQueue.retry(item.id);
        }, this.calculateBackoff(item.attempts));
      }
    }
  }

  private calculateBackoff(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}
```

## Upload Queue Implementation

```typescript
// upload-queue.service.ts
@Injectable({
  providedIn: 'root'
})
export class UploadQueueService {
  private readonly DB_NAME = 'ipfs-upload-queue';
  private readonly STORE_NAME = 'uploads';
  private db: IDBDatabase;
  private uploadSubject = new Subject<UploadQueueItem>();
  private statusSubject = new BehaviorSubject<UploadQueueStatus>({
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0
  });

  constructor() {
    this.initDatabase();
    this.startQueueProcessor();
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadQueueStatus();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { 
            keyPath: 'id' 
          });
          store.createIndex('status', 'status');
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async enqueue(upload: Partial<UploadQueueItem>): Promise<UploadQueueItem> {
    const item: UploadQueueItem = {
      id: this.generateId(),
      status: 'pending',
      attempts: 0,
      timestamp: new Date(),
      ...upload
    } as UploadQueueItem;

    await this.saveItem(item);
    this.uploadSubject.next(item);
    await this.updateQueueStatus();
    
    return item;
  }

  async updateStatus(
    id: string, 
    status: UploadQueueItem['status'],
    updates?: Partial<UploadQueueItem>
  ): Promise<void> {
    const item = await this.getItem(id);
    if (!item) return;

    Object.assign(item, {
      status,
      ...updates,
      lastUpdated: new Date()
    });

    await this.saveItem(item);
    await this.updateQueueStatus();
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    const item = await this.getItem(id);
    if (!item) return;

    item.progress = progress;
    await this.saveItem(item);
  }

  async retry(id: string): Promise<void> {
    const item = await this.getItem(id);
    if (!item || item.status === 'completed') return;

    item.attempts++;
    item.status = 'pending';
    item.error = undefined;

    await this.saveItem(item);
    this.uploadSubject.next(item);
    await this.updateQueueStatus();
  }

  async handleError(id: string, error: any): Promise<void> {
    await this.updateStatus(id, 'failed', {
      error: error.message || 'Unknown error'
    });
  }

  getStatus(): Observable<UploadQueueStatus> {
    return this.statusSubject.asObservable();
  }

  private startQueueProcessor(): void {
    this.uploadSubject
      .pipe(
        filter(item => item.status === 'pending'),
        concatMap(item => this.processItem(item)),
        retry({ delay: 5000 })
      )
      .subscribe();
  }

  private async processItem(item: UploadQueueItem): Promise<void> {
    // Processing is handled by IPFSStorageService
    // This just manages the queue
  }

  private generateId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## UI Components

### IPFS Status Indicator

```typescript
// ipfs-status.component.ts
@Component({
  selector: 'app-ipfs-status',
  template: `
    <div class="ipfs-status" [class.connected]="isConnected$ | async">
      <div class="status-icon">
        <i class="fas" [class.fa-link]="isConnected$ | async" 
           [class.fa-unlink]="!(isConnected$ | async)"></i>
      </div>
      
      <div class="status-details" *ngIf="showDetails">
        <p>Gateway: {{ config.gateway }}</p>
        <p>Mode: {{ config.mode }}</p>
        
        <div class="upload-queue" *ngIf="queueStatus$ | async as status">
          <h4>Upload Queue</h4>
          <div class="queue-stats">
            <span class="stat">
              <i class="fas fa-clock"></i> 
              Pending: {{ status.pending }}
            </span>
            <span class="stat">
              <i class="fas fa-upload"></i> 
              Uploading: {{ status.uploading }}
            </span>
            <span class="stat">
              <i class="fas fa-check"></i> 
              Completed: {{ status.completed }}
            </span>
            <span class="stat" *ngIf="status.failed > 0">
              <i class="fas fa-exclamation-triangle"></i> 
              Failed: {{ status.failed }}
            </span>
          </div>
        </div>
        
        <div class="actions">
          <button (click)="retryFailed()" 
                  [disabled]="(queueStatus$ | async)?.failed === 0">
            Retry Failed
          </button>
          <button (click)="clearCompleted()">
            Clear Completed
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./ipfs-status.component.css']
})
export class IPFSStatusComponent implements OnInit {
  isConnected$: Observable<boolean>;
  queueStatus$: Observable<UploadQueueStatus>;
  showDetails = false;
  config: IPFSConfig;

  constructor(
    private ipfsService: IPFSStorageService,
    private healthService: GatewayHealthService,
    private uploadQueue: UploadQueueService
  ) {}

  ngOnInit() {
    this.isConnected$ = this.healthService.isHealthy$;
    this.queueStatus$ = this.uploadQueue.getStatus();
    this.config = this.ipfsService.getConfig();
  }

  async retryFailed() {
    await this.uploadQueue.retryAllFailed();
  }

  async clearCompleted() {
    await this.uploadQueue.clearCompleted();
  }
}
```

### Share Link Component

```typescript
// share-link.component.ts
@Component({
  selector: 'app-share-link',
  template: `
    <div class="share-link-container" *ngIf="shareLink">
      <h3>Share via IPFS</h3>
      
      <div class="link-display">
        <input [value]="shareLink" readonly #linkInput>
        <button (click)="copyLink(linkInput)" class="copy-btn">
          <i class="fas fa-copy"></i>
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      
      <div class="gateway-options">
        <label>Gateway:</label>
        <select [(ngModel)]="selectedGateway" (change)="updateLink()">
          <option *ngFor="let gw of gateways" [value]="gw.url">
            {{ gw.name }}
          </option>
        </select>
      </div>
      
      <div class="link-info">
        <p><i class="fas fa-info-circle"></i> 
           This content is distributed via IPFS and can be accessed 
           from any IPFS gateway.
        </p>
        <p class="cid">CID: {{ cid }}</p>
      </div>
      
      <div class="qr-code" *ngIf="showQR">
        <qr-code [value]="shareLink" [size]="200"></qr-code>
      </div>
    </div>
  `,
  styleUrls: ['./share-link.component.css']
})
export class ShareLinkComponent implements OnInit {
  @Input() contentHash: string;
  
  shareLink: string;
  cid: string;
  copied = false;
  showQR = false;
  selectedGateway: string;
  
  gateways = [
    { name: 'IPFS.io', url: 'https://ipfs.io' },
    { name: 'Cloudflare', url: 'https://cloudflare-ipfs.com' },
    { name: 'Pinata', url: 'https://gateway.pinata.cloud' },
    { name: 'Local', url: 'http://localhost:8080' }
  ];

  constructor(
    private casService: CasService,
    private ipfsService: IPFSStorageService
  ) {}

  async ngOnInit() {
    if (this.contentHash) {
      try {
        const path = `content/${this.contentHash}`;
        this.shareLink = await this.ipfsService.getShareableLink(path);
        this.cid = this.extractCID(this.shareLink);
        this.selectedGateway = this.ipfsService.getConfig().gateway;
      } catch (error) {
        console.error('Failed to generate share link:', error);
      }
    }
  }

  updateLink() {
    if (this.cid) {
      this.shareLink = `${this.selectedGateway}/ipfs/${this.cid}`;
    }
  }

  async copyLink(input: HTMLInputElement) {
    try {
      await navigator.clipboard.writeText(this.shareLink);
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    } catch (err) {
      // Fallback
      input.select();
      document.execCommand('copy');
    }
  }

  private extractCID(link: string): string {
    const match = link.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  }
}
```

## Testing Strategy

### Unit Tests for IPFS Storage

```typescript
// ipfs-storage.service.spec.ts
describe('IPFSStorageService', () => {
  let service: IPFSStorageService;
  let mockClient: jasmine.SpyObj<IIPFSClient>;
  let mockCache: jasmine.SpyObj<IndexedDbStorageService>;
  let mockQueue: jasmine.SpyObj<UploadQueueService>;
  let mockMapping: jasmine.SpyObj<CIDMappingService>;

  beforeEach(() => {
    const clientSpy = jasmine.createSpyObj('IIPFSClient', 
      ['add', 'cat', 'pin', 'isOnline']);
    const cacheSpy = jasmine.createSpyObj('IndexedDbStorageService',
      ['read', 'write', 'exists', 'delete', 'list']);
    const queueSpy = jasmine.createSpyObj('UploadQueueService',
      ['enqueue', 'updateStatus', 'updateProgress']);
    const mappingSpy = jasmine.createSpyObj('CIDMappingService',
      ['getCID', 'setCID', 'removePath', 'listPaths']);

    TestBed.configureTestingModule({
      providers: [
        IPFSStorageService,
        { provide: IPFS_CONFIG, useValue: testConfig },
        { provide: IIPFSClient, useValue: clientSpy },
        { provide: IndexedDbStorageService, useValue: cacheSpy },
        { provide: UploadQueueService, useValue: queueSpy },
        { provide: CIDMappingService, useValue: mappingSpy }
      ]
    });

    service = TestBed.inject(IPFSStorageService);
    mockClient = TestBed.inject(IIPFSClient) as jasmine.SpyObj<IIPFSClient>;
    mockCache = TestBed.inject(IndexedDbStorageService) as jasmine.SpyObj<IndexedDbStorageService>;
    mockQueue = TestBed.inject(UploadQueueService) as jasmine.SpyObj<UploadQueueService>;
    mockMapping = TestBed.inject(CIDMappingService) as jasmine.SpyObj<CIDMappingService>;
  });

  describe('write', () => {
    it('should write to local cache and queue for IPFS upload', async () => {
      const path = 'content/test';
      const data = new Uint8Array([1, 2, 3]);
      const queueItem = { id: 'queue123', status: 'pending' };
      
      mockCache.write.and.returnValue(Promise.resolve());
      mockQueue.enqueue.and.returnValue(Promise.resolve(queueItem));

      await service.write(path, data);

      expect(mockCache.write).toHaveBeenCalledWith(path, data);
      expect(mockQueue.enqueue).toHaveBeenCalledWith(
        jasmine.objectContaining({
          path,
          data
        })
      );
    });

    it('should reject files exceeding max size', async () => {
      const path = 'content/large';
      const data = new Uint8Array(testConfig.maxFileSize + 1);

      await expectAsync(service.write(path, data))
        .toBeRejectedWithError(/exceeds maximum/);
    });

    it('should encrypt data when encryption is enabled', async () => {
      // Test implementation
    });
  });

  describe('read', () => {
    it('should read from local cache when available', async () => {
      const path = 'content/cached';
      const data = new Uint8Array([1, 2, 3]);
      
      mockCache.read.and.returnValue(Promise.resolve(data));

      const result = await service.read(path);

      expect(result).toEqual(data);
      expect(mockCache.read).toHaveBeenCalledWith(path);
      expect(mockClient.cat).not.toHaveBeenCalled();
    });

    it('should fetch from IPFS when not in cache', async () => {
      const path = 'content/remote';
      const cid = 'QmTest123';
      const data = new Uint8Array([4, 5, 6]);
      
      mockCache.read.and.returnValue(Promise.reject('Not found'));
      mockMapping.getCID.and.returnValue(Promise.resolve(cid));
      mockClient.cat.and.returnValue(Promise.resolve(data));
      mockCache.write.and.returnValue(Promise.resolve());

      const result = await service.read(path);

      expect(result).toEqual(data);
      expect(mockMapping.getCID).toHaveBeenCalledWith(path);
      expect(mockClient.cat).toHaveBeenCalledWith(cid);
      expect(mockCache.write).toHaveBeenCalledWith(path, data);
    });
  });

  describe('getShareableLink', () => {
    it('should generate correct IPFS gateway link', async () => {
      const path = 'content/share';
      const cid = 'QmShareTest';
      
      mockMapping.getCID.and.returnValue(Promise.resolve(cid));

      const link = await service.getShareableLink(path);

      expect(link).toBe(`${testConfig.gateway}/ipfs/${cid}`);
    });
  });
});
```

### Integration Tests

```typescript
// ipfs-integration.spec.ts
describe('IPFS Integration', () => {
  let app: AppComponent;
  let casService: CasService;
  let ipfsService: IPFSStorageService;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { 
          provide: STORAGE_TYPE, 
          useValue: 'ipfs' 
        },
        {
          provide: IPFS_CONFIG,
          useValue: {
            mode: 'gateway',
            gateway: 'http://localhost:8080',
            timeout: 5000,
            retryAttempts: 3
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    casService = TestBed.inject(CasService);
    ipfsService = TestBed.inject(IPFSStorageService);
  });

  it('should upload content to IPFS and generate share link', async () => {
    const content = new TextEncoder().encode('Test IPFS content');
    
    // Upload content
    const hash = await casService.store({ 
      data: content,
      metadata: { filename: 'test.txt' }
    });

    // Wait for IPFS upload
    await waitForUploadComplete(hash);

    // Get share link
    const shareLink = await ipfsService.getShareableLink(`content/${hash.value}`);
    
    expect(shareLink).toMatch(/^http:\/\/localhost:8080\/ipfs\/Qm/);
  });

  async function waitForUploadComplete(hash: ContentHash): Promise<void> {
    // Implementation to wait for upload queue
  }
});
```

## Configuration Management

### Environment Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  ipfs: {
    mode: 'api',
    gateway: 'http://localhost:8080',
    apiEndpoint: 'http://localhost:5001/api/v0',
    timeout: 30000,
    retryAttempts: 3,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    enableEncryption: false
  }
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  ipfs: {
    mode: 'gateway',
    gateway: 'https://ipfs.io',
    timeout: 60000,
    retryAttempts: 5,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    enableEncryption: true,
    pinningService: {
      endpoint: 'https://api.pinata.cloud',
      apiKey: '${PINATA_API_KEY}' // Set via CI/CD
    }
  }
};
```

### Settings Service Update

```typescript
// settings.service.ts
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings$ = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS);

  updateStorageProvider(provider: StorageProvider) {
    const current = this.settings$.value;
    
    if (provider === 'ipfs' || provider === 'hybrid') {
      // Validate IPFS configuration
      this.validateIPFSConfig(current.ipfs);
    }
    
    this.settings$.next({
      ...current,
      storage: { ...current.storage, provider }
    });
  }

  updateIPFSConfig(config: Partial<IPFSConfig>) {
    const current = this.settings$.value;
    
    this.settings$.next({
      ...current,
      ipfs: { ...current.ipfs, ...config }
    });
  }

  private validateIPFSConfig(config: IPFSConfig) {
    if (!config.gateway) {
      throw new Error('IPFS gateway is required');
    }
    
    if (config.mode === 'api' && !config.apiEndpoint) {
      throw new Error('API endpoint is required for API mode');
    }
  }
}
```

## Error Handling

### IPFS Error Handler

```typescript
// ipfs-error-handler.ts
export class IPFSErrorHandler {
  static handle(error: any): ErrorInfo {
    if (error.code === 'ECONNREFUSED') {
      return {
        message: 'Cannot connect to IPFS node',
        suggestion: 'Ensure IPFS daemon is running',
        recoverable: true
      };
    }
    
    if (error.message?.includes('timeout')) {
      return {
        message: 'IPFS operation timed out',
        suggestion: 'Check network connection or try again',
        recoverable: true
      };
    }
    
    if (error.message?.includes('pinning')) {
      return {
        message: 'Pinning service error',
        suggestion: 'Check pinning service credentials',
        recoverable: false
      };
    }
    
    return {
      message: 'Unknown IPFS error',
      suggestion: 'Check console for details',
      recoverable: false,
      details: error
    };
  }
}

// Usage in components
export class ContentUploadComponent {
  async uploadContent() {
    try {
      const hash = await this.casService.store(this.content);
      this.showSuccess('Content uploaded successfully');
    } catch (error) {
      const errorInfo = IPFSErrorHandler.handle(error);
      this.showError(errorInfo.message, errorInfo.suggestion);
      
      if (errorInfo.recoverable) {
        this.showRetryOption();
      }
    }
  }
}
```

### Fallback Strategy

```typescript
// fallback-storage.service.ts
@Injectable({
  providedIn: 'root'
})
export class FallbackStorageService implements IStorageProvider {
  constructor(
    private primary: IPFSStorageService,
    private fallback: IndexedDbStorageService,
    private notifier: NotificationService
  ) {}

  async write(path: string, data: Uint8Array): Promise<void> {
    try {
      await this.primary.write(path, data);
    } catch (error) {
      console.warn('IPFS write failed, using fallback', error);
      
      this.notifier.warn(
        'IPFS unavailable',
        'Content saved locally and will sync when IPFS is available'
      );
      
      await this.fallback.write(path, data);
      
      // Queue for later sync
      await this.queueForSync(path, data);
    }
  }

  async read(path: string): Promise<Uint8Array> {
    try {
      return await this.primary.read(path);
    } catch (primaryError) {
      try {
        return await this.fallback.read(path);
      } catch (fallbackError) {
        throw new Error('Content not found in any storage');
      }
    }
  }

  private async queueForSync(path: string, data: Uint8Array) {
    // Implementation for offline sync queue
  }
}
```

---

[⬅️ IPFS Architecture](./phase1-ipfs-architecture.md) | [⬆️ Top](#phase-1-ipfs-implementation-guide) | [🏠 Home](../README.md) | [Roadmap ➡️](./phase1-roadmap.md)