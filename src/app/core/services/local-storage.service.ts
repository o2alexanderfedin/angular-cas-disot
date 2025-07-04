import { Injectable } from '@angular/core';
import { IStorageProvider } from '../domain/interfaces/storage.interface';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService implements IStorageProvider {
  private readonly storage = new Map<string, Uint8Array>();

  async write(path: string, data: Uint8Array): Promise<void> {
    this.storage.set(path, data);
  }

  async read(path: string): Promise<Uint8Array> {
    const data = this.storage.get(path);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return data;
  }

  async exists(path: string): Promise<boolean> {
    return this.storage.has(path);
  }

  async delete(path: string): Promise<void> {
    this.storage.delete(path);
  }

  async list(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getSize(): Promise<number> {
    let totalSize = 0;
    for (const data of this.storage.values()) {
      totalSize += data.length;
    }
    return totalSize;
  }
}