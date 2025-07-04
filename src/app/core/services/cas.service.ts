import { Injectable } from '@angular/core';
import { IContentStorage } from '../domain/interfaces/storage.interface';
import { Content, ContentHash, ContentMetadata } from '../domain/interfaces/content.interface';
import { HashService } from './hash.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class CasService implements IContentStorage {
  constructor(
    private hashService: HashService,
    private storageService: LocalStorageService
  ) {}

  async store(content: Content): Promise<ContentHash> {
    const hashValue = await this.hashService.hash(content.data);
    const contentHash: ContentHash = {
      algorithm: 'sha256',
      value: hashValue
    };

    const path = this.getPath(contentHash);
    const exists = await this.storageService.exists(path);

    if (!exists) {
      await this.storageService.write(path, content.data);
    }

    return contentHash;
  }

  async retrieve(hash: ContentHash): Promise<Content> {
    const path = this.getPath(hash);
    
    try {
      const data = await this.storageService.read(path);
      return {
        data,
        hash
      };
    } catch (error) {
      throw new Error('Content not found');
    }
  }

  async exists(hash: ContentHash): Promise<boolean> {
    const path = this.getPath(hash);
    return this.storageService.exists(path);
  }

  async getMetadata(hash: ContentHash): Promise<ContentMetadata> {
    const content = await this.retrieve(hash);
    
    return {
      hash,
      size: content.data.length,
      createdAt: new Date()
    };
  }

  private getPath(hash: ContentHash): string {
    return `cas/${hash.algorithm}/${hash.value}`;
  }
}