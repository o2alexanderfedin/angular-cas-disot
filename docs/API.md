# CAS/DISOT Application - API Documentation

## Table of Contents
1. [CAS Service API](#cas-service-api)
2. [DISOT Service API](#disot-service-api)
3. [Hash Service API](#hash-service-api)
4. [Signature Service API](#signature-service-api)
5. [Metadata Service API](#metadata-service-api)
6. [Storage Provider API](#storage-provider-api)
7. [IPFS Services API](#ipfs-services-api)
8. [Content Preview Service API](#content-preview-service-api)

## CAS Service API

The Content-Addressable Storage service manages content storage and retrieval using SHA-256 hashes.

### Methods

#### `store(content: Content): Promise<ContentHash>`
Stores content and returns its hash.
```typescript
const content = { data: new Uint8Array([1, 2, 3]) };
const hash = await casService.store(content);
// Returns: { algorithm: 'sha256', value: 'QmHash...' }
```

#### `retrieve(hash: ContentHash): Promise<Content>`
Retrieves content by its hash.
```typescript
const hash = { algorithm: 'sha256', value: 'QmHash...' };
const content = await casService.retrieve(hash);
// Returns: { data: Uint8Array, hash?: ContentHash }
```

#### `exists(hash: ContentHash): Promise<boolean>`
Checks if content exists.
```typescript
const exists = await casService.exists(hash);
// Returns: true/false
```

#### `getMetadata(hash: ContentHash): Promise<ContentMetadata>`
Gets content metadata.
```typescript
const metadata = await casService.getMetadata(hash);
// Returns: { hash, size, createdAt }
```

#### `getAllContent(): Promise<ContentWithHash[]>`
Lists all stored content.
```typescript
const allContent = await casService.getAllContent();
// Returns: Array of { content, hash }
```

## DISOT Service API

Manages Decentralized Immutable Source of Truth entries with cryptographic signatures.

### Methods

#### `createEntry(content: ContentHash | any, type: DisotEntryType, privateKey: string, metadata?: Record<string, any>): Promise<DisotEntry>`
Creates a new signed entry.
```typescript
const entry = await disotService.createEntry(
  contentHash,
  DisotEntryType.DOCUMENT,
  privateKey,
  { author: 'QmAuthor...', tags: ['important'] }
);
```

#### `getEntry(id: string): Promise<DisotEntry | undefined>`
Retrieves an entry by ID.
```typescript
const entry = await disotService.getEntry('entry-123');
```

#### `getAllEntries(): Promise<DisotEntry[]>`
Gets all entries.
```typescript
const entries = await disotService.getAllEntries();
```

#### `getEntriesByType(type: DisotEntryType): Promise<DisotEntry[]>`
Filters entries by type.
```typescript
const blogPosts = await disotService.getEntriesByType(DisotEntryType.BLOG_POST);
```

#### `verifyEntry(entry: DisotEntry): Promise<boolean>`
Verifies an entry's signature.
```typescript
const isValid = await disotService.verifyEntry(entry);
```

## Hash Service API

Provides cryptographic hashing functionality.

### Methods

#### `hash(data: Uint8Array): Promise<string>`
Generates SHA-256 hash of data.
```typescript
const data = new TextEncoder().encode('Hello World');
const hash = await hashService.hash(data);
// Returns: Base58 encoded hash string
```

#### `verify(data: Uint8Array, hash: string): Promise<boolean>`
Verifies data against a hash.
```typescript
const isValid = await hashService.verify(data, 'QmHash...');
```

## Signature Service API

Handles digital signatures (currently mock implementation).

### Methods

#### `generateKeyPair(): Promise<KeyPair>`
Generates a new key pair.
```typescript
const keyPair = await signatureService.generateKeyPair();
// Returns: { publicKey: string, privateKey: string }
```

#### `sign(data: Uint8Array, privateKey: string): Promise<string>`
Signs data with private key.
```typescript
const signature = await signatureService.sign(data, privateKey);
```

#### `verify(data: Uint8Array, signature: string, publicKey: string): Promise<boolean>`
Verifies a signature.
```typescript
const isValid = await signatureService.verify(data, signature, publicKey);
```

## Metadata Service API

Manages metadata entries that establish relationships between content.

### Methods

#### `createMetadataEntry(metadata: MetadataContent, privateKey: string): Promise<DisotEntry>`
Creates a metadata entry.
```typescript
const metadata = createMetadataContent({
  references: [{
    hash: 'QmContent...',
    mimeType: 'text/plain',
    mimeTypeSource: 'manual',
    relationship: 'main'
  }],
  authors: [{
    authorHash: 'QmAuthor...',
    role: AuthorRole.CREATOR
  }],
  version: '1.0.0'
});

const entry = await metadataService.createMetadataEntry(metadata, privateKey);
```

#### `getMetadataEntry(id: string): Promise<DisotEntry | undefined>`
Retrieves a metadata entry.
```typescript
const entry = await metadataService.getMetadataEntry('entry-123');
```

#### `parseMetadataContent(entry: DisotEntry): MetadataContent | null`
Parses metadata from an entry.
```typescript
const metadata = metadataService.parseMetadataContent(entry);
```

## Storage Provider API

Common interface for all storage implementations.

### Methods

#### `write(path: string, data: Uint8Array): Promise<void>`
Writes data to storage.
```typescript
await storageProvider.write('cas/sha256/QmHash...', data);
```

#### `read(path: string): Promise<Uint8Array>`
Reads data from storage.
```typescript
const data = await storageProvider.read('cas/sha256/QmHash...');
```

#### `exists(path: string): Promise<boolean>`
Checks if path exists.
```typescript
const exists = await storageProvider.exists('cas/sha256/QmHash...');
```

#### `delete(path: string): Promise<void>`
Deletes data at path.
```typescript
await storageProvider.delete('cas/sha256/QmHash...');
```

#### `list(): Promise<string[]>`
Lists all stored paths.
```typescript
const paths = await storageProvider.list();
// Returns: ['cas/sha256/QmHash1...', 'cas/sha256/QmHash2...']
```

## IPFS Services API

### IPFSStorageService

IPFS storage provider using HTTP API.

#### Configuration
```typescript
const ipfsService = new IPFSStorageService(
  httpClient,
  'http://localhost:5001', // API URL
  'http://localhost:8080'  // Gateway URL
);
```

### HeliaStorageService

Browser-native IPFS implementation.

#### `initialize(): Promise<void>`
Initializes Helia node.
```typescript
await heliaService.initialize();
```

### IPFSMigrationService

Migrates content between storage providers.

#### `estimateMigration(source: IStorageProvider, target: IStorageProvider): Promise<MigrationEstimate>`
Estimates migration size and count.
```typescript
const estimate = await migrationService.estimateMigration(source, target);
// Returns: { itemCount, totalSize, estimatedTime }
```

#### `migrate(source: IStorageProvider, target: IStorageProvider): Observable<MigrationProgress>`
Performs migration with progress updates.
```typescript
migrationService.migrate(source, target).subscribe(progress => {
  console.log(`${progress.completed}/${progress.total} items migrated`);
});
```

### IPFSShareLinkService

Generates shareable IPFS gateway URLs.

#### `generateShareLink(hash: ContentHash): string`
Creates a gateway URL.
```typescript
const url = shareLinkService.generateShareLink(hash);
// Returns: 'https://ipfs.io/ipfs/QmHash...'
```

## Content Preview Service API

Handles content type detection and preview generation.

### Methods

#### `detectContentType(data: Uint8Array): string`
Detects content type from data.
```typescript
const type = contentPreviewService.detectContentType(data);
// Returns: 'image/png', 'application/json', etc.
```

#### `generatePreview(data: Uint8Array, format: 'text' | 'json' | 'hex' | 'base64', maxSize?: number): string`
Generates content preview.
```typescript
const preview = contentPreviewService.generatePreview(data, 'text', 1000);
```

#### `formatFileSize(bytes: number): string`
Formats file size for display.
```typescript
const size = contentPreviewService.formatFileSize(1024);
// Returns: '1 KB'
```

#### `formatHashForDisplay(hash: string, maxLength?: number): string`
Truncates hash for display.
```typescript
const display = contentPreviewService.formatHashForDisplay('QmVeryLongHash...', 20);
// Returns: 'QmVeryLongHa...sh...'
```

## Error Handling

All services follow consistent error handling patterns:

```typescript
try {
  const content = await casService.retrieve(hash);
} catch (error) {
  if (error.message === 'Content not found') {
    // Handle missing content
  }
}
```

Common error scenarios:
- `Content not found`: CAS retrieval failures
- `Storage error`: Storage provider failures
- `Invalid signature`: Signature verification failures
- `Migration failed`: Migration process errors

## Usage Examples

### Storing and Retrieving Content
```typescript
// Store content
const content = { 
  data: new TextEncoder().encode('Hello, World!') 
};
const hash = await casService.store(content);

// Create DISOT entry
const entry = await disotService.createEntry(
  hash,
  DisotEntryType.DOCUMENT,
  privateKey
);

// Retrieve and verify
const retrieved = await casService.retrieve(hash);
const isValid = await disotService.verifyEntry(entry);
```

### Creating Metadata Relationships
```typescript
// Store main content
const mainContent = await casService.store({ data: documentData });

// Store author info
const authorContent = await casService.store({ data: authorData });

// Create metadata entry
const metadata = createMetadataContent({
  references: [{
    hash: mainContent.value,
    mimeType: 'application/pdf',
    mimeTypeSource: 'detected',
    relationship: 'main'
  }],
  authors: [{
    authorHash: authorContent.value,
    role: AuthorRole.CREATOR
  }],
  version: '1.0.0'
});

const metadataEntry = await metadataService.createMetadataEntry(
  metadata,
  privateKey
);
```

### Migrating to IPFS
```typescript
// Estimate migration
const estimate = await migrationService.estimateMigration(
  indexedDbStorage,
  ipfsStorage
);

// Perform migration
const migration$ = migrationService.migrate(
  indexedDbStorage,
  ipfsStorage
);

migration$.subscribe({
  next: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  },
  complete: () => {
    console.log('Migration complete!');
  },
  error: (error) => {
    console.error('Migration failed:', error);
  }
});
```