import { TestBed } from '@angular/core/testing';
import { SignatureService } from './signature.service';
import { HashService } from './hash.service';

describe('SignatureService', () => {
  let service: SignatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignatureService, HashService]
    });
    
    service = TestBed.inject(SignatureService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should generate key pair', async () => {
    const keyPair = await service.generateKeyPair();
    
    expect(keyPair).toBeTruthy();
    expect(keyPair.publicKey).toBeTruthy();
    expect(keyPair.privateKey).toBeTruthy();
    expect(keyPair.publicKey).not.toBe(keyPair.privateKey);
  });

  it('should sign data', async () => {
    const keyPair = await service.generateKeyPair();
    const testData = new TextEncoder().encode('Test message');
    
    const signature = await service.sign(testData, keyPair.privateKey);
    
    expect(signature).toBeTruthy();
    expect(signature.value).toBeTruthy();
    expect(signature.algorithm).toBe('secp256k1');
    expect(signature.publicKey).toBeTruthy();
    // Public key should be derived from private key
    expect(signature.publicKey.length).toBeGreaterThan(0);
  });

  it('should verify valid signature', async () => {
    const keyPair = await service.generateKeyPair();
    const testData = new TextEncoder().encode('Verify this');
    
    const signature = await service.sign(testData, keyPair.privateKey);
    const isValid = await service.verify(testData, signature);
    
    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const keyPair = await service.generateKeyPair();
    const testData = new TextEncoder().encode('Original data');
    
    const signature = await service.sign(testData, keyPair.privateKey);
    // Make signature invalid by changing its format
    const invalidSignature = {
      ...signature,
      value: 'invalid_signature_format' // Not 64 hex chars
    };
    
    const isValid = await service.verify(testData, invalidSignature);
    
    expect(isValid).toBe(false);
  });

  it('should reject signature with wrong public key', async () => {
    const keyPair1 = await service.generateKeyPair();
    await service.generateKeyPair(); // Generate second key pair to verify wrong key rejection
    const testData = new TextEncoder().encode('Test data');
    
    const signature = await service.sign(testData, keyPair1.privateKey);
    const tamperedSignature = {
      ...signature,
      publicKey: 'invalid_public_key' // Invalid format
    };
    
    const isValid = await service.verify(testData, tamperedSignature);
    
    expect(isValid).toBe(false);
  });

  describe('crypto.subtle error handling', () => {
    let originalCrypto: Crypto;

    beforeEach(() => {
      originalCrypto = window.crypto;
    });

    afterEach(() => {
      Object.defineProperty(window, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });

    it('should handle crypto.subtle.generateKey errors', async () => {
      const mockCrypto = {
        ...originalCrypto,
        subtle: {
          ...originalCrypto.subtle,
          generateKey: jasmine.createSpy('generateKey').and.returnValue(
            Promise.reject(new Error('Key generation failed'))
          )
        }
      };

      Object.defineProperty(window, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });

      await expectAsync(service.generateKeyPair()).toBeRejectedWithError('Key generation failed');
    });

    it('should handle crypto.subtle.exportKey errors for private key', async () => {
      const mockKeyPair = {
        privateKey: {} as CryptoKey,
        publicKey: {} as CryptoKey
      };

      const mockCrypto = {
        ...originalCrypto,
        subtle: {
          ...originalCrypto.subtle,
          generateKey: jasmine.createSpy('generateKey').and.returnValue(
            Promise.resolve(mockKeyPair)
          ),
          exportKey: jasmine.createSpy('exportKey').and.callFake((_format: string, key: CryptoKey) => {
            if (key === mockKeyPair.privateKey) {
              return Promise.reject(new Error('Private key export failed'));
            }
            return Promise.resolve({ kty: 'EC', crv: 'P-256', x: 'test', y: 'test' });
          })
        }
      };

      Object.defineProperty(window, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });

      await expectAsync(service.generateKeyPair()).toBeRejectedWithError('Private key export failed');
    });

    it('should handle crypto.subtle.exportKey errors for public key', async () => {
      const mockKeyPair = {
        privateKey: {} as CryptoKey,
        publicKey: {} as CryptoKey
      };

      const mockCrypto = {
        ...originalCrypto,
        subtle: {
          ...originalCrypto.subtle,
          generateKey: jasmine.createSpy('generateKey').and.returnValue(
            Promise.resolve(mockKeyPair)
          ),
          exportKey: jasmine.createSpy('exportKey').and.callFake((_format: string, key: CryptoKey) => {
            if (key === mockKeyPair.privateKey) {
              return Promise.resolve({ kty: 'EC', crv: 'P-256', x: 'test1', y: 'test1', d: 'private' });
            }
            if (key === mockKeyPair.publicKey) {
              return Promise.reject(new Error('Public key export failed'));
            }
            return Promise.resolve({});
          })
        }
      };

      Object.defineProperty(window, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });

      await expectAsync(service.generateKeyPair()).toBeRejectedWithError('Public key export failed');
    });

    it('should handle crypto.subtle unavailable', async () => {
      const mockCrypto = {
        ...originalCrypto,
        subtle: undefined as any
      };

      Object.defineProperty(window, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });

      await expectAsync(service.generateKeyPair()).toBeRejectedWith(jasmine.any(TypeError));
    });
  });

  describe('hash service error handling', () => {
    it('should handle hash errors in sign method', async () => {
      const hashService = TestBed.inject(HashService);
      spyOn(hashService, 'hash').and.returnValue(Promise.reject(new Error('Hash failed')));

      const testData = new Uint8Array([1, 2, 3]);
      const privateKey = 'test_private_key';

      await expectAsync(service.sign(testData, privateKey)).toBeRejectedWithError('Hash failed');
    });

    it('should handle hash errors in verify method', async () => {
      const hashService = TestBed.inject(HashService);
      spyOn(hashService, 'hash').and.returnValue(Promise.reject(new Error('Hash verification failed')));

      const testData = new Uint8Array([1, 2, 3]);
      const signature = {
        value: 'a'.repeat(64),
        algorithm: 'secp256k1' as const,
        publicKey: 'b'.repeat(64)
      };

      const result = await service.verify(testData, signature);
      expect(result).toBe(false);
    });
  });
});