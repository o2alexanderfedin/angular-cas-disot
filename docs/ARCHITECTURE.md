# CAS/DISOT Angular Application - Technical Architecture

## Table of Contents
1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Project Structure](#project-structure)
4. [Core Domain Model](#core-domain-model)
5. [Service Layer Architecture](#service-layer-architecture)
6. [Feature Modules](#feature-modules)
7. [Storage Architecture](#storage-architecture)
8. [Security & Cryptography](#security--cryptography)
9. [Testing Strategy](#testing-strategy)
10. [Build & Deployment](#build--deployment)

## Overview

The CAS/DISOT Angular application is a decentralized content management system that implements:
- **CAS (Content-Addressable Storage)**: Storage system using content hashes as identifiers
- **DISOT (Decentralized Immutable Source of Truth)**: Cryptographically signed, timestamped entries

The application is built with Angular 20 and follows clean architecture principles with clear separation of concerns.

## Architecture Principles

### 1. **Clean Architecture**
- Clear separation between UI, business logic, and infrastructure
- Dependencies point inward (UI → Services → Domain)
- Domain layer has no external dependencies

### 2. **Interface-Based Design**
- All major services implement interfaces
- Storage providers follow a common interface
- Enables easy testing and swapping implementations

### 3. **Dependency Injection**
- Leverages Angular's DI container
- Services are loosely coupled
- Configuration-based provider selection

### 4. **Progressive Enhancement**
- Started with browser-based storage
- Added distributed storage options
- Backward compatible design

## Project Structure

```
src/app/
├── core/                           # Core business logic
│   ├── domain/                     # Domain layer
│   │   └── interfaces/             # Domain interfaces
│   │       ├── content.interface.ts
│   │       ├── disot.interface.ts
│   │       ├── metadata-entry.ts
│   │       └── storage.interface.ts
│   └── services/                   # Service layer
│       ├── cas.service.ts          # Content storage
│       ├── disot.service.ts        # DISOT entries
│       ├── hash.service.ts         # Hashing
│       ├── signature.service.ts    # Digital signatures
│       ├── metadata/               # Metadata services
│       ├── ipfs/                   # IPFS integration
│       └── helia/                  # Helia integration
├── features/                       # Feature modules
│   ├── content/                    # Content management
│   ├── disot/                      # DISOT features
│   ├── metadata/                   # Metadata features
│   ├── settings/                   # Application settings
│   └── home/                       # Landing page
├── shared/                         # Shared components
│   └── components/
│       ├── content-selection-modal/
│       └── ipfs-status-indicator/
└── app.*                          # Root application files
```

## Core Domain Model

### Content Model
```typescript
interface ContentHash {
  algorithm: string;  // 'sha256'
  value: string;      // Base58 encoded hash
}

interface Content {
  data: Uint8Array;
  hash?: ContentHash;
  metadata?: ContentMetadata;
}

interface ContentMetadata {
  hash: ContentHash;
  size: number;
  createdAt: Date;
}
```

### DISOT Model
```typescript
interface DisotEntry {
  id: string;
  contentHash: ContentHash;
  type: DisotEntryType;
  signature: {
    value: string;
    algorithm: string;
    publicKey: string;
  };
  timestamp: Date;
  metadata: Record<string, any>;
}

enum DisotEntryType {
  BLOG_POST = 'BLOG_POST',
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  SIGNATURE = 'SIGNATURE',
  METADATA = 'METADATA'
}
```

### Metadata Model
```typescript
interface MetadataContent {
  references: ContentReference[];
  authors: AuthorReference[];
  version: string;
  previousVersion?: string;
  changeDescription?: string;
  timestamp: string;
}

interface ContentReference {
  hash: string;
  mimeType: string;
  mimeTypeSource: 'manual' | 'detected';
  relationship?: string;
}
```

## Service Layer Architecture

### Core Services

#### CasService
- **Purpose**: Implements Content-Addressable Storage
- **Responsibilities**:
  - Store content with automatic hash generation
  - Retrieve content by hash
  - Content deduplication
  - Metadata management
- **Dependencies**: HashService, StorageProvider

#### DisotService
- **Purpose**: Manages DISOT entries
- **Responsibilities**:
  - Create signed entries
  - Verify signatures
  - Query and filter entries
  - Entry persistence
- **Dependencies**: CasService, SignatureService

#### HashService
- **Purpose**: Cryptographic hashing
- **Implementation**: Web Crypto API for SHA-256
- **Output**: Base58 encoded hashes

#### SignatureService
- **Purpose**: Digital signatures
- **Current**: Mock implementation
- **TODO**: Replace with secp256k1 library for production

### Storage Services

#### Storage Provider Interface
```typescript
interface IStorageProvider {
  write(path: string, data: Uint8Array): Promise<void>;
  read(path: string): Promise<Uint8Array>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  list(): Promise<string[]>;
}
```

#### Available Providers
1. **LocalStorageService**: In-memory storage
2. **IndexedDbStorageService**: Browser persistent storage
3. **IPFSStorageService**: External IPFS node integration
4. **HeliaStorageService**: Browser-native IPFS

### Specialized Services

#### MetadataService
- Creates metadata entries
- Handles content relationships
- Version tracking

#### ContentPreviewService
- Content type detection
- Preview generation (text, JSON, hex, base64)
- MIME type mapping

#### IPFSMigrationService
- Bulk content migration
- Progress tracking
- Error handling with retry

## Feature Modules

### Content Module
- **ContentListComponent**: Browse and search content
- **ContentUploadComponent**: Drag-and-drop file upload
- **Features**:
  - Multiple file upload
  - Content preview
  - Search by hash
  - Download functionality

### DISOT Module
- **DisotEntryComponent**: Create signed entries
- **SignatureVerificationComponent**: Verify signatures
- **Features**:
  - Key pair generation
  - Multiple entry types
  - Hash selection modal
  - Previous entry preview

### Metadata Module
- **MetadataEntryComponent**: Create metadata entries
- **MetadataViewComponent**: Display metadata
- **Features**:
  - Content reference management
  - Author tracking
  - Version control
  - Automatic MIME type detection

### Settings Module
- **StorageSettingsComponent**: Configure storage
- **MigrationComponent**: Migrate content
- **Features**:
  - Storage provider selection
  - Health status indicators
  - Bulk migration tools

## Storage Architecture

### Storage Factory Pattern
```typescript
@Injectable()
export class StorageProviderFactory {
  create(type: StorageType): IStorageProvider {
    switch(type) {
      case StorageType.IN_MEMORY:
        return new LocalStorageService();
      case StorageType.INDEXED_DB:
        return new IndexedDbStorageService();
      case StorageType.IPFS:
        return new IPFSStorageService();
      case StorageType.HELIA:
        return new HeliaStorageService();
    }
  }
}
```

### Storage Hierarchy
```
cas/
├── sha256/
│   ├── QmHash1...
│   ├── QmHash2...
│   └── ...
└── metadata/
    └── entries.json
```

### IPFS Integration
- **IPFSStorageService**: HTTP API client for external node
- **HeliaStorageService**: Browser-native implementation
- **IPFSShareLinkService**: Gateway URL generation
- **CID Mapping**: Tracks IPFS CIDs for content

## Security & Cryptography

### Hashing
- **Algorithm**: SHA-256
- **Implementation**: Web Crypto API
- **Encoding**: Base58 (Bitcoin alphabet)

### Digital Signatures
- **Current**: Mock implementation for development
- **Production**: Requires secp256k1 implementation
- **Storage**: Public keys stored with entries

### Content Integrity
- All content is addressed by its hash
- Hashes are verified on retrieval
- Signatures ensure authorship

## Testing Strategy

### Test Organization
- Unit tests co-located with source files (`.spec.ts`)
- Integration tests for complex workflows
- 492 tests total

### Coverage Metrics
- **Overall**: 78.08%
- **Statements**: 86.48%
- **Branches**: 75.67%
- **Functions**: 86.88%
- **Lines**: 87.6%

### Testing Tools
- **Runner**: Karma
- **Framework**: Jasmine
- **Browser**: ChromeHeadless
- **Commands**:
  - `npm test`: Run all tests
  - `npm test:coverage`: Generate coverage report

## Build & Deployment

### Build Configuration
- **Framework**: Angular 20
- **Build Tool**: Angular CLI with ESBuild
- **TypeScript**: Strict mode enabled
- **Budget**: 2MB (increased for Helia)

### Environments
- **Development**: `http://localhost:4200`
- **Staging**: `https://o2alexanderfedin.github.io/angular-cas-disot/staging/`
- **Production**: `https://o2alexanderfedin.github.io/angular-cas-disot/`

### CI/CD Pipeline
- **Platform**: GitHub Actions
- **Test Matrix**: Node.js 20.x and 22.x
- **Deployment**: GitHub Pages
- **Workflow**:
  1. Run tests on both Node versions
  2. Build staging and production
  3. Deploy to respective environments
  4. Send deployment notifications

### Development Commands
```bash
npm start              # Development server
npm test              # Run tests
npm test:coverage     # Coverage report
npm run build:staging # Build for staging
npm run build:production # Build for production
```

## Recent Enhancements

### Version 3.3.0
- Automatic MIME type detection for content references
- Author and previous version hash selection
- Enhanced metadata entry UX

### Version 3.0.0
- IPFS and Helia integration
- Content migration tools
- Share link generation
- Storage health monitoring

### Version 2.5.0
- TypeScript strict mode
- Dynamic coverage display
- Improved CI/CD pipeline

## Future Considerations

1. **Production Cryptography**: Replace mock signature service
2. **Performance**: Implement content caching strategy
3. **Scalability**: Consider pagination for large content lists
4. **Security**: Add content encryption options
5. **Interoperability**: Support additional hash algorithms