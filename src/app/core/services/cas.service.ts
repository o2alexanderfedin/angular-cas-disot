import { Injectable, Inject } from '@angular/core';
import { IContentStorage, IStorageProvider } from '../domain/interfaces/storage.interface';
import { Content, ContentHash, ContentMetadata, ContentWithHash } from '../domain/interfaces/content.interface';
import { HashService } from './hash.service';
import { STORAGE_PROVIDER } from './storage-provider.factory';

@Injectable({
  providedIn: 'root'
})
export class CasService implements IContentStorage {
  constructor(
    private hashService: HashService,
    @Inject(STORAGE_PROVIDER) private storageService: IStorageProvider
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

  async getAllContent(): Promise<ContentWithHash[]> {
    const paths = await this.storageService.list();
    const casPrefix = 'cas/';
    
    const contentPromises = paths
      .filter((path: string) => path.startsWith(casPrefix))
      .map(async (path: string) => {
        try {
          const data = await this.storageService.read(path);
          const parts = path.split('/');
          if (parts.length >= 3) {
            const algorithm = parts[1];
            const value = parts[2];
            const hash: ContentHash = { algorithm, value };
            
            return {
              content: { data },
              hash
            };
          }
          return null;
        } catch (error) {
          console.error(`Error reading path ${path}:`, error);
          return null;
        }
      });
    
    const results = await Promise.all(contentPromises);
    return results.filter((item: ContentWithHash | null): item is ContentWithHash => item !== null);
  }

  private getPath(hash: ContentHash): string {
    return `cas/${hash.algorithm}/${hash.value}`;
  }
}