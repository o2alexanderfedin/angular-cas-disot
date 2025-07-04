import { Injectable } from '@angular/core';
import { ISignatureService, KeyPair, Signature } from '../domain/interfaces/crypto.interface';
import { HashService } from './hash.service';

@Injectable({
  providedIn: 'root'
})
export class SignatureService implements ISignatureService {
  constructor(private hashService: HashService) {}

  async generateKeyPair(): Promise<KeyPair> {
    // For development, use Web Crypto API to generate keys
    // In production, you would use secp256k1 library
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );
    
    const privateKeyData = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const publicKeyData = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    
    // Create deterministic hex representation for testing
    const privateKey = this.jwkToHex(privateKeyData);
    const publicKey = this.jwkToHex(publicKeyData);
    
    return { privateKey, publicKey };
  }

  async sign(data: Uint8Array, privateKey: string): Promise<Signature> {
    const msgHash = await this.hashService.hash(data);
    
    // For testing, create a mock signature
    // In production, use proper secp256k1 signing
    const signature = await this.hashService.hash(
      new TextEncoder().encode(msgHash + privateKey)
    );
    
    // Extract public key from private key (mock)
    const publicKey = await this.hashService.hash(
      new TextEncoder().encode(privateKey + '_public')
    );
    
    return {
      value: signature,
      algorithm: 'secp256k1',
      publicKey
    };
  }

  async verify(data: Uint8Array, signature: Signature): Promise<boolean> {
    // For testing, verify by checking the signature format
    // In production, use proper secp256k1 verification
    try {
      const msgHash = await this.hashService.hash(data);
      
      // For mock implementation, just check that signature was created
      // with the same algorithm and has valid format
      return signature.algorithm === 'secp256k1' && 
             signature.value.length === 64 && // SHA-256 produces 64 hex chars
             signature.publicKey.length === 64 &&
             /^[a-f0-9]{64}$/.test(signature.value);
    } catch {
      return false;
    }
  }
  
  private jwkToHex(jwk: JsonWebKey): string {
    // Convert JWK to a deterministic hex string for testing
    const jsonString = JSON.stringify(jwk, Object.keys(jwk).sort());
    return Array.from(new TextEncoder().encode(jsonString))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}