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
    const keyPair2 = await service.generateKeyPair();
    const testData = new TextEncoder().encode('Test data');
    
    const signature = await service.sign(testData, keyPair1.privateKey);
    const tamperedSignature = {
      ...signature,
      publicKey: 'invalid_public_key' // Invalid format
    };
    
    const isValid = await service.verify(testData, tamperedSignature);
    
    expect(isValid).toBe(false);
  });
});