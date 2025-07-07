# IPFS Integration Features 🌐

[⬅️ Features](./README.md) | [🏠 Documentation Home](../../)

## Overview

The IPFS (InterPlanetary File System) integration in CAS/DISOT provides distributed storage capabilities, enabling content to be stored and retrieved from a global peer-to-peer network. This integration was implemented in Phase 1 of the project roadmap.

## Implementation Status: ✅ Fully Implemented

## Core Features

### 1. Multiple Storage Providers

#### IPFSStorageService
- Integrates with external IPFS nodes via HTTP API
- Supports standard Kubo (go-ipfs) nodes
- Configurable API endpoints
- Full IPFS functionality access

```typescript
interface IPFSStorageConfig {
  apiUrl: string;        // Default: 'http://localhost:5001'
  gatewayUrl: string;    // Default: 'http://localhost:8080'
  timeout?: number;
  headers?: Record<string, string>;
}
```

#### HeliaStorageService
- Browser-native IPFS implementation
- No external node required
- Uses IndexedDB for block storage
- Lighter weight for browser environments

```typescript
interface HeliaConfig {
  enableGateway: boolean;
  bootstrapNodes?: string[];
  blockstore?: 'memory' | 'indexeddb';
}
```

#### Hybrid Storage
- Combines local caching with IPFS persistence
- Improved performance for frequently accessed content
- Automatic fallback mechanisms

### 2. Content Management

#### Store Operations
```typescript
async store(content: Content): Promise<ContentHash> {
  // Stores content in IPFS
  // Returns CID (Content Identifier)
  // Automatically pins content
}
```

#### Retrieve Operations
```typescript
async retrieve(hash: ContentHash): Promise<Content> {
  // Retrieves content by CID
  // Handles various content types
  // Automatic retry on failure
}
```

#### Pin Management
- Pin content to ensure persistence
- Unpin to allow garbage collection
- List pinned content
- Pin status checking

### 3. Upload Queue System

#### Features
- **Persistent Queue**: Survives browser refreshes
- **Retry Logic**: Automatic retry with exponential backoff
- **Progress Tracking**: Real-time upload progress
- **Background Processing**: Non-blocking uploads

#### Implementation
```typescript
interface QueueItem {
  id: string;
  content: Content;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}
```

### 4. Share Link Generation

#### IPFSShareLinkService
- Generate gateway URLs for content
- Support multiple gateway providers
- Automatic gateway selection
- URL validation

```typescript
generateShareLink(cid: string): string {
  // Returns: https://ipfs.io/ipfs/QmXxx...
  // Or custom gateway URL
}
```

#### Supported Gateways
- IPFS.io (default public gateway)
- Cloudflare IPFS
- Pinata Gateway
- Custom configured gateways

### 5. Content Migration

#### Migration Service Features
- Migrate from local storage to IPFS
- Bulk migration support
- Progress tracking
- Selective migration
- Rollback capability

#### Migration UI
- Visual progress indicators
- Pause/resume functionality
- Error handling and retry
- Migration statistics

### 6. Health Monitoring

#### Node Health Checks
```typescript
interface HealthStatus {
  online: boolean;
  version?: string;
  peers?: number;
  repoSize?: bigint;
  storageMax?: bigint;
}
```

#### Monitoring Features
- Real-time connection status
- Peer count tracking
- Storage usage metrics
- API availability checks
- Automatic reconnection

### 7. Development Support

#### Proxy Configuration
```javascript
// angular.json proxy config
"/api/v0": {
  "target": "http://localhost:5001",
  "changeOrigin": true,
  "secure": false
}
```

#### CORS Support
- Development proxy for API access
- Production CORS configuration
- Custom header support

## Configuration

### Settings UI Integration
- Storage provider selection
- IPFS node configuration
- Gateway selection
- Health status display

### Environment Configuration
```typescript
interface IPFSEnvironment {
  useIPFS: boolean;
  ipfsApiUrl: string;
  ipfsGatewayUrl: string;
  heliaEnabled: boolean;
  defaultProvider: 'ipfs' | 'helia' | 'hybrid';
}
```

## Benefits

### 1. **Distributed Storage**
- No single point of failure
- Global content availability
- Censorship resistance

### 2. **Content Addressing**
- Immutable content references
- Automatic deduplication
- Integrity verification

### 3. **Performance**
- Local caching
- Parallel chunk downloads
- Proximity-based routing

### 4. **Cost Efficiency**
- Reduced storage costs
- Bandwidth sharing
- Community infrastructure

## API Reference

### CasService Integration
```typescript
class CasService {
  constructor(
    private storageProvider: IStorageProvider,
    private ipfsService?: IPFSStorageService
  ) {}
  
  async store(content: Content): Promise<ContentHash> {
    // Stores in selected provider
    // Returns unified hash
  }
}
```

### Direct IPFS Access
```typescript
class IPFSStorageService implements IStorageProvider {
  async add(content: Uint8Array): Promise<CID>
  async get(cid: CID): Promise<Uint8Array>
  async pin(cid: CID): Promise<void>
  async unpin(cid: CID): Promise<void>
  async ls(): Promise<CID[]>
}
```

## Testing

### Unit Tests
- Mock IPFS HTTP client
- Helia in-memory testing
- Queue persistence tests
- Migration scenarios

### Integration Tests
- Real IPFS node testing
- Gateway availability
- Content round-trip
- Multi-provider scenarios

## Troubleshooting

### Common Issues

1. **IPFS Node Offline**
   - Check node is running: `ipfs daemon`
   - Verify API port: default 5001
   - Check firewall settings

2. **CORS Errors**
   - Use development proxy
   - Configure IPFS CORS headers
   - Check gateway CORS policy

3. **Slow Uploads**
   - Check network connectivity
   - Verify IPFS peer connections
   - Consider chunk size optimization

4. **Gateway Timeouts**
   - Try alternative gateways
   - Check content availability
   - Ensure content is pinned

---

[⬅️ Features](./README.md) | [⬆️ Top](#ipfs-integration-features-) | [🏠 Documentation Home](../../)