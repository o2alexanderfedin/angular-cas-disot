# Browser Compatibility Guide

## Overview

Ed25519 support in Web Crypto API is not universal across browsers. This guide provides solutions for cross-browser compatibility.

## Browser Support Matrix

| Browser | Ed25519 Support | Fallback Required |
|---------|----------------|-------------------|
| Chrome | ⚠️ Partial | Sometimes |
| Firefox | ❌ No | Yes |
| Safari | ✅ Yes | No |
| Edge | ⚠️ Partial | Sometimes |
| Node.js | ✅ Yes | No |

## Implementation Strategy

### 1. Feature Detection

```typescript
export class CryptoCompatibilityService {
  private ed25519Supported?: boolean;
  
  async checkEd25519Support(): Promise<boolean> {
    if (this.ed25519Supported !== undefined) {
      return this.ed25519Supported;
    }
    
    try {
      // Try to generate an Ed25519 key
      await crypto.subtle.generateKey(
        {
          name: 'Ed25519',
          namedCurve: 'Ed25519'
        },
        false,
        ['sign', 'verify']
      );
      this.ed25519Supported = true;
    } catch {
      this.ed25519Supported = false;
    }
    
    return this.ed25519Supported;
  }
}
```

### 2. Unified Key Generation

```typescript
import { Injectable } from '@angular/core';
import * as ed from '@noble/ed25519';
import * as secp from '@noble/secp256k1';

@Injectable({
  providedIn: 'root'
})
export class UniversalKeyService {
  async generateKeyPair(
    preferredAlgorithm: 'Ed25519' | 'P-256' | 'secp256k1' = 'Ed25519'
  ): Promise<IdentityKeyPair> {
    // Try preferred algorithm first
    try {
      switch (preferredAlgorithm) {
        case 'Ed25519':
          return await this.generateEd25519();
        case 'P-256':
          return await this.generateP256();
        case 'secp256k1':
          return await this.generateSecp256k1();
      }
    } catch (error) {
      console.warn(`Failed to generate ${preferredAlgorithm} key:`, error);
    }
    
    // Fallback chain
    const fallbacks = ['P-256', 'secp256k1'];
    for (const algorithm of fallbacks) {
      try {
        if (algorithm === 'P-256') {
          return await this.generateP256();
        } else {
          return await this.generateSecp256k1();
        }
      } catch (error) {
        console.warn(`Fallback ${algorithm} failed:`, error);
      }
    }
    
    throw new Error('No supported cryptographic algorithms available');
  }
  
  private async generateEd25519(): Promise<IdentityKeyPair> {
    // Use Noble library for consistent behavior
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKey(privateKey);
    
    return this.formatKeyPair(
      new Uint8Array(publicKey),
      new Uint8Array(privateKey),
      'Ed25519'
    );
  }
  
  private async generateP256(): Promise<IdentityKeyPair> {
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
    
    return this.formatKeyPair(
      new Uint8Array(publicKey),
      new Uint8Array(privateKey),
      'P-256'
    );
  }
  
  private async generateSecp256k1(): Promise<IdentityKeyPair> {
    const privateKey = secp.utils.randomPrivateKey();
    const publicKey = secp.getPublicKey(privateKey);
    
    return this.formatKeyPair(
      new Uint8Array(publicKey),
      new Uint8Array(privateKey),
      'secp256k1'
    );
  }
  
  private async formatKeyPair(
    publicKey: Uint8Array,
    privateKey: Uint8Array,
    algorithm: string
  ): Promise<IdentityKeyPair> {
    const keyIdBytes = await crypto.subtle.digest('SHA-256', publicKey);
    const keyId = base58.encode(new Uint8Array(keyIdBytes));
    
    return {
      algorithm,
      publicKey,
      privateKey,
      created: Date.now(),
      keyId
    };
  }
}
```

### 3. Unified Signing Service

```typescript
@Injectable({
  providedIn: 'root'
})
export class UniversalSignatureService {
  async sign(
    data: Uint8Array,
    privateKey: Uint8Array,
    algorithm: string
  ): Promise<Uint8Array> {
    switch (algorithm) {
      case 'Ed25519':
        return await this.signEd25519(data, privateKey);
      case 'P-256':
        return await this.signP256(data, privateKey);
      case 'secp256k1':
        return await this.signSecp256k1(data, privateKey);
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }
  
  async verify(
    data: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
    algorithm: string
  ): Promise<boolean> {
    switch (algorithm) {
      case 'Ed25519':
        return await this.verifyEd25519(data, signature, publicKey);
      case 'P-256':
        return await this.verifyP256(data, signature, publicKey);
      case 'secp256k1':
        return await this.verifySecp256k1(data, signature, publicKey);
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }
  
  private async signEd25519(
    data: Uint8Array,
    privateKey: Uint8Array
  ): Promise<Uint8Array> {
    return await ed.sign(data, privateKey);
  }
  
  private async signP256(
    data: Uint8Array,
    privateKey: Uint8Array
  ): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKey,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      key,
      data
    );
    
    return new Uint8Array(signature);
  }
  
  private async signSecp256k1(
    data: Uint8Array,
    privateKey: Uint8Array
  ): Promise<Uint8Array> {
    const msgHash = await crypto.subtle.digest('SHA-256', data);
    const signature = await secp.sign(
      new Uint8Array(msgHash),
      privateKey
    );
    return signature;
  }
}
```

### 4. DID Format Compatibility

```typescript
export class MultiAlgorithmDIDService {
  createDID(publicKey: Uint8Array, algorithm: string): string {
    const codecs = {
      'Ed25519': { prefix: 0xed, type: 'Ed25519VerificationKey2020' },
      'P-256': { prefix: 0x1200, type: 'EcdsaSecp256r1VerificationKey2019' },
      'secp256k1': { prefix: 0xe7, type: 'EcdsaSecp256k1VerificationKey2019' }
    };
    
    const codec = codecs[algorithm];
    if (!codec) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    // Create multicodec
    const prefix = varint.encode(codec.prefix);
    const multicodec = new Uint8Array(prefix.length + publicKey.length);
    multicodec.set(prefix);
    multicodec.set(publicKey, prefix.length);
    
    // Create DID
    return `did:key:z${base58.encode(multicodec)}`;
  }
  
  getVerificationMethodType(algorithm: string): string {
    const types = {
      'Ed25519': 'Ed25519VerificationKey2020',
      'P-256': 'EcdsaSecp256r1VerificationKey2019',
      'secp256k1': 'EcdsaSecp256k1VerificationKey2019'
    };
    
    return types[algorithm] || 'GenericVerificationKey';
  }
}
```

## Polyfill Solutions

### 1. Using @peculiar/webcrypto

For Node.js environments or browsers lacking support:

```bash
npm install @peculiar/webcrypto
```

```typescript
import { Crypto } from '@peculiar/webcrypto';

// Polyfill if needed
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = new Crypto();
}
```

### 2. Pure JavaScript Implementation

Using Noble libraries for consistent cross-platform behavior:

```typescript
export class PureJSCryptoService {
  private useNativeWhenAvailable = true;
  
  async generateKey(algorithm: string): Promise<CryptoKeyPair | KeyPair> {
    if (this.useNativeWhenAvailable && await this.isNativeSupported(algorithm)) {
      return this.generateNativeKey(algorithm);
    }
    
    return this.generatePureJSKey(algorithm);
  }
  
  private async generatePureJSKey(algorithm: string): Promise<KeyPair> {
    switch (algorithm) {
      case 'Ed25519':
        const edPrivate = ed.utils.randomPrivateKey();
        const edPublic = await ed.getPublicKey(edPrivate);
        return { privateKey: edPrivate, publicKey: edPublic };
        
      case 'secp256k1':
        const secpPrivate = secp.utils.randomPrivateKey();
        const secpPublic = secp.getPublicKey(secpPrivate);
        return { privateKey: secpPrivate, publicKey: secpPublic };
        
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }
}
```

## Best Practices

### 1. Algorithm Negotiation

```typescript
export class AlgorithmNegotiator {
  async negotiateAlgorithm(
    peerCapabilities: string[],
    myPreferences: string[]
  ): Promise<string> {
    // Find first matching algorithm
    for (const pref of myPreferences) {
      if (peerCapabilities.includes(pref)) {
        return pref;
      }
    }
    
    // Default fallback
    return 'P-256';
  }
}
```

### 2. Progressive Enhancement

```typescript
@Component({
  selector: 'app-identity-creator',
  template: `
    <div class="algorithm-selector">
      <label>Preferred Algorithm:</label>
      <select [(ngModel)]="selectedAlgorithm">
        <option value="auto">Auto-detect (Recommended)</option>
        <option value="Ed25519" [disabled]="!algorithms.ed25519">
          Ed25519 {{ !algorithms.ed25519 ? '(Not supported)' : '' }}
        </option>
        <option value="P-256">P-256 (Universal)</option>
        <option value="secp256k1">secp256k1</option>
      </select>
    </div>
  `
})
export class IdentityCreatorComponent implements OnInit {
  selectedAlgorithm = 'auto';
  algorithms = {
    ed25519: false,
    p256: true,
    secp256k1: true
  };
  
  async ngOnInit() {
    this.algorithms.ed25519 = await this.checkEd25519Support();
  }
}
```

### 3. Error Handling

```typescript
export class RobustIdentityService {
  async createIdentity(options?: IdentityOptions): Promise<Identity> {
    const errors: Error[] = [];
    
    // Try algorithms in order of preference
    const algorithms = options?.algorithms || ['Ed25519', 'P-256', 'secp256k1'];
    
    for (const algorithm of algorithms) {
      try {
        return await this.createIdentityWithAlgorithm(algorithm);
      } catch (error) {
        errors.push(new Error(`${algorithm} failed: ${error.message}`));
      }
    }
    
    // All algorithms failed
    throw new AggregateError(errors, 'Failed to create identity with any algorithm');
  }
}
```

## Testing Across Browsers

### 1. Feature Detection Tests

```typescript
describe('Browser Compatibility', () => {
  it('should detect Ed25519 support correctly', async () => {
    const supported = await service.checkEd25519Support();
    
    // Check matches expected browser behavior
    if (navigator.userAgent.includes('Firefox')) {
      expect(supported).toBe(false);
    } else if (navigator.userAgent.includes('Safari')) {
      expect(supported).toBe(true);
    }
  });
  
  it('should fall back gracefully when Ed25519 not supported', async () => {
    spyOn(service, 'checkEd25519Support').and.returnValue(Promise.resolve(false));
    
    const identity = await service.createIdentity();
    expect(['P-256', 'secp256k1']).toContain(identity.keys.masterKey.algorithm);
  });
});
```

### 2. Cross-Browser Test Matrix

```typescript
const testCases = [
  { browser: 'Chrome', algorithm: 'P-256', expected: true },
  { browser: 'Firefox', algorithm: 'Ed25519', expected: false },
  { browser: 'Safari', algorithm: 'Ed25519', expected: true },
];

testCases.forEach(({ browser, algorithm, expected }) => {
  it(`should handle ${algorithm} in ${browser}`, async () => {
    // Mock browser environment
    const result = await service.testAlgorithm(algorithm);
    expect(result.supported).toBe(expected);
  });
});
```

## Migration Strategy

For existing implementations using Web Crypto Ed25519:

```typescript
export class IdentityMigrationService {
  async migrateIdentity(oldIdentity: LegacyIdentity): Promise<Identity> {
    // Check if old algorithm still supported
    const oldAlgorithmSupported = await this.checkSupport(oldIdentity.algorithm);
    
    if (oldAlgorithmSupported) {
      // No migration needed
      return this.convertFormat(oldIdentity);
    }
    
    // Create new identity with fallback algorithm
    const newIdentity = await this.createNewIdentity();
    
    // Link old and new identities
    await this.createMigrationCredential(oldIdentity, newIdentity);
    
    return newIdentity;
  }
}
```

## Resources

- [Web Crypto API Browser Support](https://caniuse.com/mdn-api_subtlecrypto_sign_ed25519)
- [Noble Cryptography Libraries](https://github.com/paulmillr/noble-curves)
- [Webcrypto Polyfill](https://github.com/PeculiarVentures/webcrypto)
- [DID Method Specification](https://w3c-ccg.github.io/did-method-key/)