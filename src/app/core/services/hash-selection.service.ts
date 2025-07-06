import { Injectable } from '@angular/core';
import { CasService } from './cas.service';
import { ContentHash, ContentMetadata } from '../domain/interfaces/content.interface';

export interface HashItem {
  hash: ContentHash;
  metadata: ContentMetadata;
}

export type PreviewType = 'text' | 'json' | 'hex';

@Injectable({
  providedIn: 'root'
})
export class HashSelectionService {
  private cachedHashes: HashItem[] | null = null;

  constructor(private casService: CasService) {}

  async getAvailableHashes(): Promise<HashItem[]> {
    if (this.cachedHashes) {
      return this.cachedHashes;
    }

    try {
      const allContent = await this.casService.getAllContent();
      const hashItems: HashItem[] = [];

      for (const item of allContent) {
        const metadata = await this.casService.getMetadata(item.hash);
        hashItems.push({
          hash: item.hash,
          metadata
        });
      }

      this.cachedHashes = hashItems;
      return hashItems;
    } catch (error) {
      throw new Error(`Failed to load available hashes: ${(error as Error).message}`);
    }
  }

  async searchHashes(searchTerm: string): Promise<HashItem[]> {
    const allHashes = await this.getAvailableHashes();
    
    if (!searchTerm.trim()) {
      return allHashes;
    }

    const term = searchTerm.toLowerCase();
    return allHashes.filter(item => 
      item.hash.value.toLowerCase().includes(term) ||
      (item.metadata.contentType?.toLowerCase().includes(term) ?? false)
    );
  }

  async getHashById(hashValue: string): Promise<HashItem | null> {
    const allHashes = await this.getAvailableHashes();
    return allHashes.find(item => item.hash.value === hashValue) || null;
  }

  async getPreviewData(hash: ContentHash, previewType: PreviewType): Promise<string> {
    try {
      const content = await this.casService.retrieve(hash);
      return this.formatPreviewData(content.data, previewType);
    } catch (error) {
      throw new Error(`Failed to get preview: ${(error as Error).message}`);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  clearCache(): void {
    this.cachedHashes = null;
  }

  private formatPreviewData(data: Uint8Array, previewType: PreviewType): string {
    const maxSize = 500; // Keep it simple and small

    switch (previewType) {
      case 'text':
        return this.formatAsText(data, maxSize);
      case 'json':
        return this.formatAsJson(data, maxSize);
      case 'hex':
        return this.formatAsHex(data, maxSize);
      default:
        return 'Unsupported preview type';
    }
  }

  private formatAsText(data: Uint8Array, maxSize: number): string {
    try {
      const text = new TextDecoder().decode(data);
      return text.length > maxSize 
        ? text.substring(0, maxSize) + '...' 
        : text;
    } catch {
      return 'Unable to decode as text';
    }
  }

  private formatAsJson(data: Uint8Array, maxSize: number): string {
    try {
      const text = new TextDecoder().decode(data);
      const json = JSON.parse(text);
      const formatted = JSON.stringify(json, null, 2);
      return formatted.length > maxSize 
        ? formatted.substring(0, maxSize) + '...' 
        : formatted;
    } catch {
      return 'Invalid JSON';
    }
  }

  private formatAsHex(data: Uint8Array, maxSize: number): string {
    const bytesToShow = Math.min(data.length, Math.floor(maxSize / 3)); // 3 chars per byte (XX )
    const hex = Array.from(data.slice(0, bytesToShow))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
    
    return data.length > bytesToShow ? hex + ' ...' : hex;
  }
}