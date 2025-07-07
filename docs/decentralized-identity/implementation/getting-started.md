# Getting Started with Decentralized Identity

## Prerequisites

Before implementing the decentralized identity system, ensure you have:

- Node.js 20.x or 22.x
- Angular 20 application (CAS/DISOT)
- Basic understanding of cryptography concepts
- Familiarity with TypeScript

## Installation

### 1. Install Dependencies

```bash
npm install --save \
  @noble/ed25519 \
  @noble/secp256k1 \
  multiformats \
  did-resolver \
  jsonld
```

### 2. Install Development Dependencies

```bash
npm install --save-dev \
  @types/jsonld
```

## Basic Implementation

### Step 1: Create Core Interfaces

Create `src/app/core/domain/interfaces/identity.interface.ts`:

```typescript
export interface IdentityKeyPair {
  algorithm: 'Ed25519' | 'secp256k1' | 'P-256';
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  created: number;
  keyId: string;
}

export interface DecentralizedID {
  did: string;
  publicKey: string;
  created: number;
  expires?: number;
}

export interface Identity {
  did: string;
  keys: {
    masterKey: IdentityKeyPair;
    authKey?: IdentityKeyPair;
    signKey?: IdentityKeyPair;
    encryptKey?: IdentityKeyPair;
  };
  document: IdentityDocument;
}
```

### Step 2: Implement Key Generation

Create `src/app/core/services/identity/key-generator.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { base58 } from 'multiformats/bases/base58';

@Injectable({
  providedIn: 'root'
})
export class KeyGeneratorService {
  async generateEd25519KeyPair(): Promise<IdentityKeyPair> {
    try {
      // Generate random private key
      const privateKey = ed.utils.randomPrivateKey();
      const publicKey = await ed.getPublicKey(privateKey);
      
      // Create key ID from public key hash
      const keyIdBytes = sha256(publicKey);
      const keyId = base58.encode(keyIdBytes);
      
      return {
        algorithm: 'Ed25519',
        publicKey: new Uint8Array(publicKey),
        privateKey: new Uint8Array(privateKey),
        created: Date.now(),
        keyId
      };
    } catch (error) {
      // Fallback to Web Crypto API P-256 if Ed25519 fails
      return this.generateP256KeyPair();
    }
  }
  
  async generateP256KeyPair(): Promise<IdentityKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );
    
    const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    
    const keyIdBytes = await crypto.subtle.digest('SHA-256', publicKey);
    const keyId = base58.encode(new Uint8Array(keyIdBytes));
    
    return {
      algorithm: 'P-256',
      publicKey: new Uint8Array(publicKey),
      privateKey: new Uint8Array(privateKey),
      created: Date.now(),
      keyId
    };
  }
}
```

### Step 3: Create DID Service

Create `src/app/core/services/identity/did.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { base58 } from 'multiformats/bases/base58';
import * as varint from 'varint';

@Injectable({
  providedIn: 'root'
})
export class DIDService {
  createDID(publicKey: Uint8Array, algorithm: string): string {
    // Multicodec prefixes
    const prefixes = {
      'Ed25519': 0xed,
      'P-256': 0x1200,
      'secp256k1': 0xe7
    };
    
    const prefix = prefixes[algorithm] || 0xed;
    const prefixBytes = varint.encode(prefix);
    
    // Combine prefix and public key
    const multicodec = new Uint8Array(prefixBytes.length + publicKey.length);
    multicodec.set(prefixBytes);
    multicodec.set(publicKey, prefixBytes.length);
    
    // Base58 encode with multibase prefix 'z'
    const encoded = base58.encode(multicodec);
    
    return `did:key:z${encoded}`;
  }
  
  parseDID(did: string): { publicKey: Uint8Array; algorithm: string } {
    if (!did.startsWith('did:key:z')) {
      throw new Error('Invalid DID format');
    }
    
    // Remove prefix and decode
    const encoded = did.substring(9); // Remove 'did:key:z'
    const multicodec = base58.decode(encoded);
    
    // Extract codec and key
    const [codec, offset] = varint.decode(multicodec);
    const publicKey = multicodec.slice(offset);
    
    // Map codec to algorithm
    const algorithms = {
      0xed: 'Ed25519',
      0x1200: 'P-256',
      0xe7: 'secp256k1'
    };
    
    return {
      publicKey: new Uint8Array(publicKey),
      algorithm: algorithms[codec] || 'unknown'
    };
  }
}
```

### Step 4: Create Identity Manager

Create `src/app/core/services/identity/identity-manager.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { KeyGeneratorService } from './key-generator.service';
import { DIDService } from './did.service';
import { SignatureService } from '../signature.service';

@Injectable({
  providedIn: 'root'
})
export class IdentityManagerService {
  constructor(
    private keyGenerator: KeyGeneratorService,
    private didService: DIDService,
    private signatureService: SignatureService
  ) {}
  
  async createIdentity(): Promise<Identity> {
    // Generate master key
    const masterKey = await this.keyGenerator.generateEd25519KeyPair();
    
    // Create DID from master key
    const did = this.didService.createDID(
      masterKey.publicKey,
      masterKey.algorithm
    );
    
    // Create identity document
    const document: IdentityDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: did,
      publicKey: [{
        id: `${did}#master`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: `z${base58.encode(masterKey.publicKey)}`
      }],
      authentication: [`${did}#master`],
      created: new Date().toISOString()
    };
    
    // Self-sign the document
    const signature = await this.signDocument(document, masterKey);
    document.proof = signature;
    
    return {
      did,
      keys: { masterKey },
      document
    };
  }
  
  private async signDocument(
    document: any,
    keyPair: IdentityKeyPair
  ): Promise<Proof> {
    // Create a copy without proof
    const docCopy = { ...document };
    delete docCopy.proof;
    
    // Canonicalize (simplified - use jsonld library in production)
    const canonical = JSON.stringify(docCopy, Object.keys(docCopy).sort());
    const data = new TextEncoder().encode(canonical);
    
    // Sign
    const signature = await this.signatureService.sign(
      data,
      keyPair.privateKey,
      keyPair.algorithm
    );
    
    return {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${document.id}#master`,
      proofPurpose: 'assertionMethod',
      proofValue: base58.encode(signature)
    };
  }
}
```

## Usage Example

### Creating an Identity

```typescript
import { Component } from '@angular/core';
import { IdentityManagerService } from './core/services/identity/identity-manager.service';

@Component({
  selector: 'app-identity-demo',
  template: `
    <button (click)="createIdentity()">Create Identity</button>
    <div *ngIf="identity">
      <h3>Your DID:</h3>
      <code>{{ identity.did }}</code>
      <h3>Identity Document:</h3>
      <pre>{{ identity.document | json }}</pre>
    </div>
  `
})
export class IdentityDemoComponent {
  identity?: Identity;
  
  constructor(private identityManager: IdentityManagerService) {}
  
  async createIdentity() {
    try {
      this.identity = await this.identityManager.createIdentity();
      console.log('Identity created:', this.identity);
    } catch (error) {
      console.error('Failed to create identity:', error);
    }
  }
}
```

## Testing

Create `src/app/core/services/identity/identity-manager.service.spec.ts`:

```typescript
describe('IdentityManagerService', () => {
  let service: IdentityManagerService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdentityManagerService);
  });
  
  it('should create a valid identity', async () => {
    const identity = await service.createIdentity();
    
    expect(identity.did).toMatch(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/);
    expect(identity.document['@context']).toContain('https://www.w3.org/ns/did/v1');
    expect(identity.document.proof).toBeDefined();
  });
  
  it('should create unique identities', async () => {
    const id1 = await service.createIdentity();
    const id2 = await service.createIdentity();
    
    expect(id1.did).not.toEqual(id2.did);
  });
});
```

## Next Steps

1. [Implement Core Components](./core-components.md)
2. [Handle Browser Compatibility](./browser-compatibility.md)
3. [Integrate with CAS/DISOT](../integration/cas-integration.md)
4. [Add Trust Network](./trust-network.md)
5. [Implement Credentials](./verifiable-credentials.md)

## Troubleshooting

### Common Issues

1. **Ed25519 not supported in browser**
   - Solution: The code automatically falls back to P-256
   
2. **Module not found errors**
   - Solution: Ensure all dependencies are installed
   
3. **TypeScript errors**
   - Solution: Update TypeScript to latest version

### Debug Mode

Enable debug logging:

```typescript
localStorage.setItem('DID_DEBUG', 'true');
```

## Resources

- [W3C DID Specification](https://www.w3.org/TR/did-core/)
- [DID Method Registry](https://www.w3.org/TR/did-spec-registries/)
- [Noble Cryptography Libraries](https://github.com/paulmillr/noble-ed25519)
- [Multiformats Documentation](https://multiformats.io/)