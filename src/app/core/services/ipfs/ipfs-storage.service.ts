import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IStorageProvider } from '../../domain/interfaces/storage.interface';
import { IPFSConfig } from '../../domain/interfaces/ipfs.interface';
import { IPFSClient } from './ipfs-client.service';
import { IndexedDbStorageService } from '../indexed-db-storage.service';

export const IPFS_CONFIG = 'IPFS_CONFIG';

@Injectable({
  providedIn: 'root'
})
export class IPFSStorageService implements IStorageProvider {
  private ipfsClient: IPFSClient;
  private localCache: IndexedDbStorageService;
  private cidToPathMap = new Map<string, string>();
  private pathToCidMap = new Map<string, string>();

  constructor(
    @Inject(IPFS_CONFIG) config: IPFSConfig,
    http: HttpClient,
    localCache: IndexedDbStorageService
  ) {
    this.ipfsClient = new IPFSClient(http, config);
    this.localCache = localCache;
    this.loadCidMappings();
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    try {
      // Write to local cache first for immediate availability
      await this.localCache.write(path, data);

      // Upload to IPFS
      const result = await firstValueFrom(this.ipfsClient.add(data));
      
      // Store CID mapping
      this.cidToPathMap.set(result.cid, path);
      this.pathToCidMap.set(path, result.cid);
      await this.saveCidMappings();

      console.log(`Stored ${path} with CID: ${result.cid}`);
    } catch (error) {
      console.error('Failed to write to IPFS:', error);
      // Local cache still has the data, so operation is partially successful
      throw error;
    }
  }

  async read(path: string): Promise<Uint8Array> {
    try {
      // Try local cache first
      if (await this.localCache.exists(path)) {
        return await this.localCache.read(path);
      }

      // If not in cache, try IPFS
      const cid = this.pathToCidMap.get(path);
      if (!cid) {
        throw new Error(`No CID mapping found for path: ${path}`);
      }

      const data = await firstValueFrom(this.ipfsClient.get(cid));
      
      // Cache locally for future reads
      await this.localCache.write(path, data);
      
      return data;
    } catch (error) {
      console.error('Failed to read from IPFS:', error);
      throw error;
    }
  }

  async exists(path: string): Promise<boolean> {
    // Check local cache first
    if (await this.localCache.exists(path)) {
      return true;
    }

    // Check if we have a CID mapping
    return this.pathToCidMap.has(path);
  }

  async delete(path: string): Promise<void> {
    // Delete from local cache
    await this.localCache.delete(path);

    // Remove CID mapping (but don't unpin from IPFS as others might use it)
    const cid = this.pathToCidMap.get(path);
    if (cid) {
      this.pathToCidMap.delete(path);
      this.cidToPathMap.delete(cid);
      await this.saveCidMappings();
    }
  }

  async list(): Promise<string[]> {
    // Return paths from both local cache and CID mappings
    const localPaths = await this.localCache.list();
    const ipfsPaths = Array.from(this.pathToCidMap.keys());
    
    // Combine and deduplicate
    return Array.from(new Set([...localPaths, ...ipfsPaths]));
  }

  private async loadCidMappings(): Promise<void> {
    try {
      const mappingsData = await this.localCache.read('_ipfs_mappings');
      const mappings = JSON.parse(new TextDecoder().decode(mappingsData));
      
      this.cidToPathMap = new Map(mappings.cidToPath);
      this.pathToCidMap = new Map(mappings.pathToCid);
    } catch (error) {
      // No mappings yet, start fresh
      console.log('No existing CID mappings found');
    }
  }

  private async saveCidMappings(): Promise<void> {
    const mappings = {
      cidToPath: Array.from(this.cidToPathMap.entries()),
      pathToCid: Array.from(this.pathToCidMap.entries())
    };
    
    const data = new TextEncoder().encode(JSON.stringify(mappings));
    await this.localCache.write('_ipfs_mappings', data);
  }

  /**
   * Get the CID for a given path
   */
  getCidForPath(path: string): string | undefined {
    return this.pathToCidMap.get(path);
  }

  /**
   * Check if IPFS client is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      return await firstValueFrom(this.ipfsClient.isHealthy());
    } catch {
      return false;
    }
  }
}