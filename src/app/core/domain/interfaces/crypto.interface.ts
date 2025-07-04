export interface IHashService {
  hash(data: Uint8Array): Promise<string>;
  verify(data: Uint8Array, hash: string): Promise<boolean>;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface Signature {
  value: string;
  algorithm: 'secp256k1';
  publicKey: string;
}

export interface ISignatureService {
  generateKeyPair(): Promise<KeyPair>;
  sign(data: Uint8Array, privateKey: string): Promise<Signature>;
  verify(data: Uint8Array, signature: Signature): Promise<boolean>;
}