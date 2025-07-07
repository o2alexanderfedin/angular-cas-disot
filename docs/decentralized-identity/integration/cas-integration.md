# CAS Integration Guide

## Overview

This guide explains how to integrate the decentralized identity system with the existing Content-Addressable Storage (CAS) infrastructure.

## Architecture Integration

```
┌─────────────────────────────────────────────────────┐
│            Decentralized Identity Layer             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  DID Docs   │  │ Credentials  │  │Trust Graph │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
                           │
                    Stored as Content
                           ▼
┌─────────────────────────────────────────────────────┐
│                    CAS Layer                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   SHA-256   │  │   Content    │  │  Metadata  │ │
│  │   Hashing   │  │   Storage    │  │  Storage   │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Implementation

### 1. Storing Identity Documents in CAS

Create `src/app/core/services/identity/identity-storage.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { CasService } from '../cas.service';
import { ContentHash } from '../../domain/interfaces/content.interface';
import { Identity, IdentityDocument } from '../../domain/interfaces/identity.interface';

@Injectable({
  providedIn: 'root'
})
export class IdentityStorageService {
  private readonly IDENTITY_PREFIX = 'identity/';
  
  constructor(private casService: CasService) {}
  
  async storeIdentityDocument(
    document: IdentityDocument
  ): Promise<ContentHash> {
    // Serialize identity document
    const content = {
      data: new TextEncoder().encode(JSON.stringify(document, null, 2)),
      metadata: {
        type: 'application/did+json',
        created: new Date(),
        did: document.id
      }
    };
    
    // Store in CAS
    const hash = await this.casService.store(content);
    
    // Store DID -> Hash mapping
    await this.storeDIDMapping(document.id, hash);
    
    return hash;
  }
  
  async retrieveIdentityDocument(
    didOrHash: string
  ): Promise<IdentityDocument | null> {
    try {
      let hash: ContentHash;
      
      if (didOrHash.startsWith('did:')) {
        // Lookup by DID
        hash = await this.resolveDIDToHash(didOrHash);
      } else {
        // Direct hash lookup
        hash = { algorithm: 'sha256', value: didOrHash };
      }
      
      const content = await this.casService.retrieve(hash);
      const document = JSON.parse(
        new TextDecoder().decode(content.data)
      ) as IdentityDocument;
      
      return document;
    } catch (error) {
      console.error('Failed to retrieve identity document:', error);
      return null;
    }
  }
  
  private async storeDIDMapping(
    did: string,
    hash: ContentHash
  ): Promise<void> {
    const mappingKey = `${this.IDENTITY_PREFIX}${did}`;
    const mappingData = new TextEncoder().encode(hash.value);
    
    // Store mapping as metadata
    await this.casService.storeMetadata(mappingKey, {
      hash,
      type: 'did-mapping',
      did,
      created: new Date()
    });
  }
  
  private async resolveDIDToHash(did: string): Promise<ContentHash> {
    const mappingKey = `${this.IDENTITY_PREFIX}${did}`;
    const metadata = await this.casService.getMetadata(mappingKey);
    
    if (!metadata || !metadata.hash) {
      throw new Error(`No identity document found for DID: ${did}`);
    }
    
    return metadata.hash;
  }
}
```

### 2. Storing Verifiable Credentials

```typescript
@Injectable({
  providedIn: 'root'
})
export class CredentialStorageService {
  private readonly CREDENTIAL_PREFIX = 'credential/';
  
  constructor(
    private casService: CasService,
    private identityStorage: IdentityStorageService
  ) {}
  
  async storeCredential(
    credential: VerifiableCredential
  ): Promise<ContentHash> {
    // Validate credential
    if (!await this.validateCredential(credential)) {
      throw new Error('Invalid credential');
    }
    
    // Store credential
    const content = {
      data: new TextEncoder().encode(JSON.stringify(credential, null, 2)),
      metadata: {
        type: 'application/vc+json',
        issuer: credential.issuer,
        subject: credential.credentialSubject.id,
        issuanceDate: credential.issuanceDate,
        types: credential.type
      }
    };
    
    const hash = await this.casService.store(content);
    
    // Index by subject and issuer
    await this.indexCredential(credential, hash);
    
    return hash;
  }
  
  async retrieveCredential(hash: ContentHash): Promise<VerifiableCredential> {
    const content = await this.casService.retrieve(hash);
    return JSON.parse(new TextDecoder().decode(content.data));
  }
  
  async findCredentials(filters: {
    subject?: string;
    issuer?: string;
    type?: string;
  }): Promise<CredentialSearchResult[]> {
    const allContent = await this.casService.getAllContent();
    const results: CredentialSearchResult[] = [];
    
    for (const item of allContent) {
      if (item.content.metadata?.type === 'application/vc+json') {
        const metadata = item.content.metadata;
        
        if (filters.subject && metadata.subject !== filters.subject) continue;
        if (filters.issuer && metadata.issuer !== filters.issuer) continue;
        if (filters.type && !metadata.types?.includes(filters.type)) continue;
        
        results.push({
          hash: item.hash,
          credential: await this.retrieveCredential(item.hash),
          metadata
        });
      }
    }
    
    return results;
  }
  
  private async validateCredential(
    credential: VerifiableCredential
  ): Promise<boolean> {
    // Verify issuer exists
    const issuerDoc = await this.identityStorage.retrieveIdentityDocument(
      credential.issuer
    );
    
    return issuerDoc !== null;
  }
  
  private async indexCredential(
    credential: VerifiableCredential,
    hash: ContentHash
  ): Promise<void> {
    // Index by subject
    const subjectKey = `${this.CREDENTIAL_PREFIX}subject/${credential.credentialSubject.id}`;
    await this.appendToIndex(subjectKey, hash);
    
    // Index by issuer
    const issuerKey = `${this.CREDENTIAL_PREFIX}issuer/${credential.issuer}`;
    await this.appendToIndex(issuerKey, hash);
  }
  
  private async appendToIndex(key: string, hash: ContentHash): Promise<void> {
    // Implementation depends on CAS metadata capabilities
    // This is a simplified version
    const existing = await this.casService.getMetadata(key) || { hashes: [] };
    existing.hashes.push(hash.value);
    await this.casService.storeMetadata(key, existing);
  }
}
```

### 3. Trust Network Storage

```typescript
@Injectable({
  providedIn: 'root'
})
export class TrustStorageService {
  private readonly TRUST_PREFIX = 'trust/';
  
  constructor(private casService: CasService) {}
  
  async storeTrustAssertion(
    assertion: TrustAssertion
  ): Promise<ContentHash> {
    const content = {
      data: new TextEncoder().encode(JSON.stringify(assertion)),
      metadata: {
        type: 'application/trust+json',
        issuer: assertion.issuer,
        subject: assertion.subject,
        trustLevel: assertion.trustLevel,
        context: assertion.context,
        created: new Date(assertion.created),
        expires: new Date(assertion.expires)
      }
    };
    
    const hash = await this.casService.store(content);
    
    // Build trust graph indices
    await this.updateTrustGraph(assertion, hash);
    
    return hash;
  }
  
  async getTrustAssertions(did: string): Promise<TrustAssertion[]> {
    const assertions: TrustAssertion[] = [];
    
    // Get assertions where DID is subject
    const subjectKey = `${this.TRUST_PREFIX}subject/${did}`;
    const subjectIndex = await this.casService.getMetadata(subjectKey);
    
    if (subjectIndex?.hashes) {
      for (const hashValue of subjectIndex.hashes) {
        const hash = { algorithm: 'sha256', value: hashValue };
        const content = await this.casService.retrieve(hash);
        const assertion = JSON.parse(
          new TextDecoder().decode(content.data)
        );
        assertions.push(assertion);
      }
    }
    
    return assertions;
  }
  
  async calculateTrustPath(
    from: string,
    to: string,
    maxDepth: number = 4
  ): Promise<TrustPath[]> {
    // Implementation of trust path calculation
    // This would traverse the trust graph stored in CAS
    const visited = new Set<string>();
    const paths: TrustPath[] = [];
    
    await this.findPaths(from, to, [], visited, paths, maxDepth);
    
    return paths.sort((a, b) => b.totalTrust - a.totalTrust);
  }
  
  private async updateTrustGraph(
    assertion: TrustAssertion,
    hash: ContentHash
  ): Promise<void> {
    // Update subject index
    const subjectKey = `${this.TRUST_PREFIX}subject/${assertion.subject}`;
    await this.appendToIndex(subjectKey, hash);
    
    // Update issuer index
    const issuerKey = `${this.TRUST_PREFIX}issuer/${assertion.issuer}`;
    await this.appendToIndex(issuerKey, hash);
    
    // Update context index
    const contextKey = `${this.TRUST_PREFIX}context/${assertion.context}`;
    await this.appendToIndex(contextKey, hash);
  }
}
```

### 4. Integration with Existing CAS Features

```typescript
@Injectable({
  providedIn: 'root'
})
export class EnhancedCasService extends CasService {
  constructor(
    private identityStorage: IdentityStorageService,
    private credentialStorage: CredentialStorageService
  ) {
    super();
  }
  
  async storeWithIdentity(
    content: Content,
    signerIdentity: Identity
  ): Promise<{
    contentHash: ContentHash;
    signedMetadata: SignedMetadata;
  }> {
    // Store content
    const contentHash = await this.store(content);
    
    // Create signed metadata
    const metadata = {
      contentHash: contentHash.value,
      signer: signerIdentity.did,
      timestamp: new Date().toISOString(),
      contentType: content.metadata?.type || 'application/octet-stream'
    };
    
    // Sign metadata
    const signature = await this.signMetadata(metadata, signerIdentity);
    
    const signedMetadata = {
      ...metadata,
      signature
    };
    
    // Store signed metadata
    await this.storeMetadata(`signed/${contentHash.value}`, signedMetadata);
    
    return { contentHash, signedMetadata };
  }
  
  async verifyContentSigner(
    hash: ContentHash
  ): Promise<VerificationResult> {
    try {
      // Retrieve signed metadata
      const metadata = await this.getMetadata(`signed/${hash.value}`);
      
      if (!metadata || !metadata.signature) {
        return { verified: false, reason: 'No signature found' };
      }
      
      // Retrieve signer's identity document
      const signerDoc = await this.identityStorage.retrieveIdentityDocument(
        metadata.signer
      );
      
      if (!signerDoc) {
        return { verified: false, reason: 'Signer identity not found' };
      }
      
      // Verify signature
      const verified = await this.verifySignature(
        metadata,
        metadata.signature,
        signerDoc
      );
      
      return {
        verified,
        signer: metadata.signer,
        timestamp: metadata.timestamp
      };
    } catch (error) {
      return {
        verified: false,
        reason: error.message
      };
    }
  }
}
```

## Usage Examples

### Storing an Identity

```typescript
// Create identity
const identity = await identityManager.createIdentity();

// Store identity document in CAS
const docHash = await identityStorage.storeIdentityDocument(identity.document);

console.log(`Identity document stored with hash: ${docHash.value}`);
console.log(`DID ${identity.did} now resolvable from CAS`);
```

### Creating and Storing Credentials

```typescript
// Issue a credential
const credential = await credentialManager.issueCredential(
  subjectDID,
  {
    name: 'Alice Smith',
    email: 'alice@example.com',
    verified: true
  },
  issuerIdentity
);

// Store in CAS
const credHash = await credentialStorage.storeCredential(credential);

// Find all credentials for a subject
const aliceCredentials = await credentialStorage.findCredentials({
  subject: subjectDID
});
```

### Building Trust Networks

```typescript
// Create trust assertion
const trustAssertion = await trustManager.createTrustAssertion(
  trustedDID,
  80, // trust level
  'professional', // context
  myIdentity
);

// Store in CAS
await trustStorage.storeTrustAssertion(trustAssertion);

// Calculate trust paths
const paths = await trustStorage.calculateTrustPath(
  myIdentity.did,
  unknownDID
);

if (paths.length > 0) {
  console.log(`Trust path found with score: ${paths[0].totalTrust}`);
}
```

## Benefits

1. **Immutable Identity Records**: Identity documents cannot be tampered with
2. **Content Deduplication**: Same identity stored once
3. **Efficient Lookups**: Hash-based retrieval
4. **Verifiable History**: All versions preserved
5. **Integrated Storage**: Single storage layer for all data

## Migration Guide

For existing CAS content:

```typescript
export class CASIdentityMigration {
  async addIdentityToExistingContent(
    contentHash: ContentHash,
    signerIdentity: Identity
  ): Promise<void> {
    // Create retroactive signature
    const content = await this.casService.retrieve(contentHash);
    
    const signature = await this.createSignature(
      content,
      signerIdentity
    );
    
    // Store identity association
    await this.casService.storeMetadata(
      `identity-migration/${contentHash.value}`,
      {
        originalHash: contentHash,
        signerDID: signerIdentity.did,
        signature,
        migratedAt: new Date()
      }
    );
  }
}
```

## Next Steps

1. [DISOT Integration](./disot-integration.md) - Using DIDs with DISOT entries
2. [Migration Guide](./migration-guide.md) - Migrating existing data
3. [Performance Optimization](../implementation/performance.md) - Scaling considerations