# DISOT Integration Guide

## Overview

This guide explains how to integrate Decentralized Identifiers (DIDs) with the DISOT (Decentralized Immutable Source of Truth) system, replacing mock signatures with real cryptographic signatures.

## Architecture Enhancement

```
Before (Mock Signatures):
┌──────────────────┐
│  DISOT Entry     │
│  - Mock Sig      │
│  - Fake Keys     │
└──────────────────┘

After (DID Integration):
┌──────────────────┐     ┌─────────────────┐
│  DISOT Entry     │────▶│  DID Document   │
│  - Real Sig      │     │  - Public Keys  │
│  - DID Ref       │     │  - Verification │
└──────────────────┘     └─────────────────┘
```

## Implementation

### 1. Enhanced DISOT Service

Create `src/app/core/services/disot-did.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { DisotEntry, DisotEntryType } from '../domain/interfaces/disot.interface';
import { Identity } from '../domain/interfaces/identity.interface';
import { ContentHash } from '../domain/interfaces/content.interface';
import { CasService } from './cas.service';
import { IdentityStorageService } from './identity/identity-storage.service';
import { UniversalSignatureService } from './identity/universal-signature.service';

@Injectable({
  providedIn: 'root'
})
export class DisotDIDService {
  constructor(
    private casService: CasService,
    private identityStorage: IdentityStorageService,
    private signatureService: UniversalSignatureService
  ) {}
  
  async createDIDSignedEntry(
    content: ContentHash | any,
    type: DisotEntryType,
    identity: Identity,
    metadata?: Record<string, any>
  ): Promise<DisotEntry> {
    // Store content if not already a hash
    const contentHash = await this.ensureContentHash(content);
    
    // Create entry structure
    const entry: Partial<DisotEntry> = {
      id: this.generateEntryId(),
      contentHash,
      type,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        createdBy: identity.did,
        signatureMethod: identity.keys.signKey?.algorithm || identity.keys.masterKey.algorithm
      }
    };
    
    // Create signature with DID
    const signature = await this.createDIDSignature(entry, identity);
    
    // Complete entry
    const completeEntry: DisotEntry = {
      ...entry,
      signature
    } as DisotEntry;
    
    // Store entry
    await this.storeEntry(completeEntry);
    
    return completeEntry;
  }
  
  async verifyDIDSignedEntry(entry: DisotEntry): Promise<{
    valid: boolean;
    signer?: string;
    errors?: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Extract DID from metadata or signature
      const signerDID = entry.metadata?.createdBy || 
                       entry.signature.publicKey; // Legacy support
      
      if (!signerDID) {
        errors.push('No signer DID found');
        return { valid: false, errors };
      }
      
      // Resolve DID document
      const didDocument = await this.identityStorage.retrieveIdentityDocument(signerDID);
      
      if (!didDocument) {
        errors.push(`DID document not found: ${signerDID}`);
        return { valid: false, errors };
      }
      
      // Find verification method
      const verificationMethod = this.findVerificationMethod(
        didDocument,
        entry.signature.algorithm
      );
      
      if (!verificationMethod) {
        errors.push('No suitable verification method found');
        return { valid: false, errors };
      }
      
      // Verify signature
      const valid = await this.verifySignature(
        entry,
        entry.signature,
        verificationMethod
      );
      
      return {
        valid,
        signer: signerDID,
        errors: valid ? undefined : ['Signature verification failed']
      };
    } catch (error) {
      errors.push(`Verification error: ${error.message}`);
      return { valid: false, errors };
    }
  }
  
  private async createDIDSignature(
    entry: Partial<DisotEntry>,
    identity: Identity
  ): Promise<DisotEntry['signature']> {
    // Use signing key if available, otherwise master key
    const signingKey = identity.keys.signKey || identity.keys.masterKey;
    
    // Prepare data for signing
    const dataToSign = this.canonicalizeEntry(entry);
    const data = new TextEncoder().encode(dataToSign);
    
    // Sign with appropriate algorithm
    const signatureBytes = await this.signatureService.sign(
      data,
      signingKey.privateKey,
      signingKey.algorithm
    );
    
    return {
      value: base58.encode(signatureBytes),
      algorithm: signingKey.algorithm,
      publicKey: `${identity.did}#${signingKey === identity.keys.masterKey ? 'master' : 'sign'}`,
      signedAt: new Date().toISOString()
    };
  }
  
  private canonicalizeEntry(entry: Partial<DisotEntry>): string {
    // Create deterministic string representation
    const canonical = {
      id: entry.id,
      contentHash: entry.contentHash,
      type: entry.type,
      timestamp: entry.timestamp?.toISOString(),
      metadata: entry.metadata
    };
    
    return JSON.stringify(canonical, Object.keys(canonical).sort());
  }
  
  private findVerificationMethod(
    document: IdentityDocument,
    algorithm: string
  ): PublicKey | null {
    // Find key with matching algorithm
    return document.publicKey.find(key => {
      if (algorithm === 'Ed25519' && key.type === 'Ed25519VerificationKey2020') return true;
      if (algorithm === 'P-256' && key.type === 'EcdsaSecp256r1VerificationKey2019') return true;
      if (algorithm === 'secp256k1' && key.type === 'EcdsaSecp256k1VerificationKey2019') return true;
      return false;
    }) || null;
  }
}
```

### 2. Migration Service for Existing Entries

```typescript
@Injectable({
  providedIn: 'root'
})
export class DisotMigrationService {
  constructor(
    private disotService: DisotService,
    private disotDIDService: DisotDIDService,
    private identityManager: IdentityManagerService
  ) {}
  
  async migrateToRealSignatures(
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      total: 0,
      migrated: 0,
      failed: 0,
      errors: []
    };
    
    // Get all existing entries
    const entries = await this.disotService.getAllEntries();
    result.total = entries.length;
    
    // Create or use provided identity for migration
    const migrationIdentity = options.identity || 
                            await this.identityManager.createIdentity();
    
    for (const entry of entries) {
      try {
        // Check if already has real signature
        if (await this.hasRealSignature(entry)) {
          console.log(`Entry ${entry.id} already has real signature`);
          continue;
        }
        
        // Create new signed version
        const migratedEntry = await this.migrateEntry(
          entry,
          migrationIdentity,
          options
        );
        
        // Store migration record
        await this.storeMigrationRecord(entry, migratedEntry);
        
        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          entryId: entry.id,
          error: error.message
        });
      }
    }
    
    return result;
  }
  
  private async migrateEntry(
    oldEntry: DisotEntry,
    identity: Identity,
    options: MigrationOptions
  ): Promise<DisotEntry> {
    // Preserve original metadata
    const metadata = {
      ...oldEntry.metadata,
      migrated: true,
      migrationDate: new Date().toISOString(),
      originalId: oldEntry.id,
      originalSignature: oldEntry.signature
    };
    
    // Create new entry with real signature
    const newEntry = await this.disotDIDService.createDIDSignedEntry(
      oldEntry.contentHash,
      oldEntry.type,
      identity,
      metadata
    );
    
    // Optionally preserve original ID
    if (options.preserveIds) {
      newEntry.id = oldEntry.id;
    }
    
    return newEntry;
  }
  
  private async hasRealSignature(entry: DisotEntry): Promise<boolean> {
    const result = await this.disotDIDService.verifyDIDSignedEntry(entry);
    return result.valid;
  }
}
```

### 3. Enhanced DISOT Entry Component

Update the existing DISOT entry component to use DIDs:

```typescript
@Component({
  selector: 'app-disot-entry',
  template: `
    <div class="disot-entry-form">
      <h2>Create DISOT Entry</h2>
      
      <!-- Identity Selection -->
      <div class="identity-section">
        <h3>Select Identity</h3>
        <div *ngIf="!currentIdentity">
          <button (click)="createNewIdentity()">Create New Identity</button>
          <button (click)="loadExistingIdentity()">Load Existing</button>
        </div>
        <div *ngIf="currentIdentity" class="identity-info">
          <p><strong>DID:</strong> {{ currentIdentity.did }}</p>
          <p><strong>Algorithm:</strong> {{ currentIdentity.keys.masterKey.algorithm }}</p>
          <button (click)="changeIdentity()">Change Identity</button>
        </div>
      </div>
      
      <!-- Entry Creation Form -->
      <form [formGroup]="entryForm" (ngSubmit)="createEntry()">
        <!-- Content Selection -->
        <div class="form-group">
          <label>Content</label>
          <app-content-selection-modal
            [(selectedHash)]="selectedContentHash"
            [title]="'Select Content for DISOT Entry'"
          ></app-content-selection-modal>
        </div>
        
        <!-- Entry Type -->
        <div class="form-group">
          <label>Entry Type</label>
          <select formControlName="type">
            <option value="BLOG_POST">Blog Post</option>
            <option value="DOCUMENT">Document</option>
            <option value="IMAGE">Image</option>
            <option value="METADATA">Metadata</option>
          </select>
        </div>
        
        <!-- Additional Metadata -->
        <div class="form-group">
          <label>Title</label>
          <input type="text" formControlName="title">
        </div>
        
        <div class="form-group">
          <label>Description</label>
          <textarea formControlName="description"></textarea>
        </div>
        
        <button type="submit" [disabled]="!entryForm.valid || !currentIdentity">
          Create Signed Entry
        </button>
      </form>
      
      <!-- Created Entry Display -->
      <div *ngIf="createdEntry" class="entry-result">
        <h3>Entry Created Successfully!</h3>
        <div class="entry-details">
          <p><strong>Entry ID:</strong> {{ createdEntry.id }}</p>
          <p><strong>Signer DID:</strong> {{ createdEntry.metadata.createdBy }}</p>
          <p><strong>Signature:</strong> {{ createdEntry.signature.value | truncate:20 }}</p>
          <p><strong>Algorithm:</strong> {{ createdEntry.signature.algorithm }}</p>
          <p><strong>Timestamp:</strong> {{ createdEntry.timestamp | date }}</p>
        </div>
        <button (click)="verifyEntry()">Verify Signature</button>
      </div>
    </div>
  `
})
export class EnhancedDisotEntryComponent {
  currentIdentity?: Identity;
  entryForm: FormGroup;
  selectedContentHash?: ContentHash;
  createdEntry?: DisotEntry;
  
  constructor(
    private fb: FormBuilder,
    private identityManager: IdentityManagerService,
    private identityWallet: IdentityWalletService,
    private disotDIDService: DisotDIDService
  ) {
    this.entryForm = this.fb.group({
      type: ['DOCUMENT', Validators.required],
      title: ['', Validators.required],
      description: ['']
    });
  }
  
  async createNewIdentity() {
    try {
      this.currentIdentity = await this.identityManager.createIdentity();
      
      // Optionally save to wallet
      const save = await this.confirmDialog('Save identity to wallet?');
      if (save) {
        const passphrase = await this.promptPassphrase();
        await this.identityWallet.store(this.currentIdentity, passphrase);
      }
    } catch (error) {
      console.error('Failed to create identity:', error);
    }
  }
  
  async createEntry() {
    if (!this.currentIdentity || !this.selectedContentHash) return;
    
    try {
      const metadata = {
        title: this.entryForm.get('title')?.value,
        description: this.entryForm.get('description')?.value
      };
      
      this.createdEntry = await this.disotDIDService.createDIDSignedEntry(
        this.selectedContentHash,
        this.entryForm.get('type')?.value as DisotEntryType,
        this.currentIdentity,
        metadata
      );
      
      this.showSuccess('DISOT entry created with DID signature!');
    } catch (error) {
      this.showError('Failed to create entry: ' + error.message);
    }
  }
  
  async verifyEntry() {
    if (!this.createdEntry) return;
    
    const result = await this.disotDIDService.verifyDIDSignedEntry(
      this.createdEntry
    );
    
    if (result.valid) {
      this.showSuccess(`Signature verified! Signer: ${result.signer}`);
    } else {
      this.showError(`Verification failed: ${result.errors?.join(', ')}`);
    }
  }
}
```

### 4. Verification Component Enhancement

```typescript
@Component({
  selector: 'app-signature-verification',
  template: `
    <div class="verification-container">
      <h2>Verify DISOT Entry Signature</h2>
      
      <div class="input-section">
        <label>Entry ID or Hash</label>
        <input 
          type="text" 
          [(ngModel)]="entryId" 
          placeholder="Enter DISOT entry ID or content hash"
        >
        <button (click)="loadAndVerify()">Load & Verify</button>
      </div>
      
      <div *ngIf="verificationResult" class="result-section">
        <h3>Verification Result</h3>
        
        <div class="status" [class.valid]="verificationResult.valid">
          <span class="icon">{{ verificationResult.valid ? '✓' : '✗' }}</span>
          <span>{{ verificationResult.valid ? 'Valid Signature' : 'Invalid Signature' }}</span>
        </div>
        
        <div *ngIf="verificationResult.signer" class="signer-info">
          <h4>Signer Information</h4>
          <p><strong>DID:</strong> {{ verificationResult.signer }}</p>
          
          <div *ngIf="signerDocument" class="did-document">
            <h5>Identity Document</h5>
            <pre>{{ signerDocument | json }}</pre>
          </div>
          
          <div *ngIf="trustScore !== null" class="trust-info">
            <h5>Trust Score</h5>
            <div class="trust-meter">
              <div class="trust-bar" [style.width.%]="trustScore"></div>
            </div>
            <p>{{ trustScore }}% trusted</p>
          </div>
        </div>
        
        <div *ngIf="verificationResult.errors" class="errors">
          <h4>Errors</h4>
          <ul>
            <li *ngFor="let error of verificationResult.errors">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class EnhancedVerificationComponent {
  entryId: string = '';
  verificationResult?: VerificationResult;
  signerDocument?: IdentityDocument;
  trustScore: number | null = null;
  
  constructor(
    private disotService: DisotService,
    private disotDIDService: DisotDIDService,
    private identityStorage: IdentityStorageService,
    private trustService: TrustService
  ) {}
  
  async loadAndVerify() {
    try {
      // Load entry
      const entry = await this.loadEntry(this.entryId);
      
      if (!entry) {
        this.showError('Entry not found');
        return;
      }
      
      // Verify with DID
      this.verificationResult = await this.disotDIDService.verifyDIDSignedEntry(entry);
      
      // Load additional signer information
      if (this.verificationResult.signer) {
        await this.loadSignerInfo(this.verificationResult.signer);
      }
    } catch (error) {
      this.showError('Verification failed: ' + error.message);
    }
  }
  
  private async loadSignerInfo(signerDID: string) {
    // Load DID document
    this.signerDocument = await this.identityStorage.retrieveIdentityDocument(signerDID);
    
    // Calculate trust score
    if (this.currentUserDID) {
      this.trustScore = await this.trustService.calculateTrustScore(
        this.currentUserDID,
        signerDID
      );
    }
  }
}
```

## Benefits of DID Integration

### 1. Real Cryptographic Security
- Replace mock signatures with actual cryptographic proofs
- Verifiable authorship and integrity
- Standards-compliant signatures

### 2. Decentralized Trust
- No central authority for key management
- Self-sovereign identity control
- Web of trust for reputation

### 3. Enhanced Features
- Multi-signature support
- Delegated signing
- Time-stamped proofs
- Revocation support

### 4. Interoperability
- W3C standards compliance
- Compatible with other DID systems
- Export/import capabilities

## Migration Strategy

### Phase 1: Dual Support
```typescript
// Support both old and new signatures
if (entry.signature.algorithm === 'mock') {
  return this.verifyMockSignature(entry);
} else {
  return this.verifyDIDSignature(entry);
}
```

### Phase 2: Migration Tools
```typescript
// Bulk migration with progress tracking
const migration = await migrationService.migrateToRealSignatures({
  batchSize: 100,
  preserveIds: true,
  onProgress: (progress) => {
    console.log(`Migrated ${progress.current}/${progress.total}`);
  }
});
```

### Phase 3: Deprecation
- Mark mock signature methods as deprecated
- Add warnings for old signature usage
- Provide migration deadline

## Testing

```typescript
describe('DISOT DID Integration', () => {
  it('should create entry with real signature', async () => {
    const identity = await identityManager.createIdentity();
    const content = { data: new TextEncoder().encode('Test content') };
    
    const entry = await disotDIDService.createDIDSignedEntry(
      content,
      DisotEntryType.DOCUMENT,
      identity
    );
    
    expect(entry.signature.algorithm).not.toBe('mock');
    expect(entry.metadata.createdBy).toBe(identity.did);
  });
  
  it('should verify DID-signed entries', async () => {
    const entry = await createTestEntry();
    const result = await disotDIDService.verifyDIDSignedEntry(entry);
    
    expect(result.valid).toBe(true);
    expect(result.signer).toBeDefined();
  });
});
```

## Next Steps

1. [Migration Guide](./migration-guide.md) - Detailed migration process
2. [Trust Network Setup](../implementation/trust-network.md) - Building trust relationships
3. [Advanced Features](../implementation/advanced-features.md) - Multi-sig, delegation, etc.