import { Injectable } from '@angular/core';
import { IHashService } from '../domain/interfaces/crypto.interface';

@Injectable({
  providedIn: 'root'
})
export class HashService implements IHashService {
  async hash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async verify(data: Uint8Array, hash: string): Promise<boolean> {
    const computedHash = await this.hash(data);
    return computedHash === hash;
  }
}