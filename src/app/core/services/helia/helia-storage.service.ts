import { Injectable, OnDestroy } from '@angular/core';
import { createHelia, type Helia } from 'helia';
import { unixfs, type UnixFS } from '@helia/unixfs';
import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';
import itAll from 'it-all';
import { IStorageProvider } from '../../domain/interfaces/storage.interface';

@Injectable({
  providedIn: 'root'
})
export class HeliaStorageService implements IStorageProvider, OnDestroy {
  private helia?: Helia;
  private fs?: UnixFS;
  private initialized = false;
  private initPromise?: Promise<void>;
  
  // Path to CID mapping stored in IndexedDB
  private pathToCidStore?: IDBDatabase;
  private readonly PATH_CID_DB = 'helia-path-mappings';
  private readonly PATH_CID_STORE = 'pathCidMappings';

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initialize();
    await this.initPromise;
  }

  private async initialize(): Promise<void> {
    try {
      // Create separate IndexedDB stores for Helia
      const blockstore = new IDBBlockstore('helia-blocks');
      const datastore = new IDBDatastore('helia-data');

      // Open both stores
      await blockstore.open();
      await datastore.open();

      // Create Helia instance
      this.helia = await createHelia({
        blockstore,
        datastore
        // libp2p is optional and defaults to creating a new node
      });

      // Create UnixFS instance
      this.fs = unixfs(this.helia);

      // Initialize path-to-CID mapping database
      await this.initializePathCidStore();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Helia:', error);
      throw new Error('Helia initialization failed');
    }
  }

  private async initializePathCidStore(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.PATH_CID_DB, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.pathToCidStore = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.PATH_CID_STORE)) {
          const store = db.createObjectStore(this.PATH_CID_STORE, { keyPath: 'path' });
          store.createIndex('cid', 'cid', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    await this.ensureInitialized();
    if (!this.fs) throw new Error('Helia not initialized');

    try {
      // Add content to Helia
      const cid = await this.fs.addBytes(data);
      
      // Store path-to-CID mapping
      await this.savePathCidMapping(path, cid.toString());
      
      console.log(`Stored ${path} in Helia with CID: ${cid}`);
    } catch (error) {
      console.error('Failed to write to Helia:', error);
      throw error;
    }
  }

  async read(path: string): Promise<Uint8Array> {
    await this.ensureInitialized();
    if (!this.fs) throw new Error('Helia not initialized');

    try {
      // Get CID from path mapping
      const cidString = await this.getCidForPath(path);
      if (!cidString) {
        throw new Error(`No content found for path: ${path}`);
      }

      // Convert string back to CID
      const { CID } = await import('multiformats/cid');
      const cid = CID.parse(cidString);

      // Read content from Helia
      const chunks = await itAll(this.fs.cat(cid));
      
      // Concatenate chunks into single Uint8Array
      const totalLength = chunks.reduce((sum: number, chunk: Uint8Array) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    } catch (error) {
      console.error('Failed to read from Helia:', error);
      throw error;
    }
  }

  async exists(path: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const cidString = await this.getCidForPath(path);
    return cidString !== null;
  }

  async delete(path: string): Promise<void> {
    await this.ensureInitialized();
    
    // Remove path mapping
    await this.deletePathCidMapping(path);
    
    // Note: We don't delete the actual block from Helia
    // as it might be referenced by other paths or needed for deduplication
  }

  async list(): Promise<string[]> {
    await this.ensureInitialized();
    if (!this.pathToCidStore) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.pathToCidStore!.transaction([this.PATH_CID_STORE], 'readonly');
      const store = transaction.objectStore(this.PATH_CID_STORE);
      const request = store.getAllKeys();
      
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Path-to-CID mapping methods
  private async savePathCidMapping(path: string, cid: string): Promise<void> {
    if (!this.pathToCidStore) throw new Error('Path-CID store not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.pathToCidStore!.transaction([this.PATH_CID_STORE], 'readwrite');
      const store = transaction.objectStore(this.PATH_CID_STORE);
      
      const request = store.put({
        path,
        cid,
        timestamp: new Date().toISOString()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getCidForPath(path: string): Promise<string | null> {
    if (!this.pathToCidStore) throw new Error('Path-CID store not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.pathToCidStore!.transaction([this.PATH_CID_STORE], 'readonly');
      const store = transaction.objectStore(this.PATH_CID_STORE);
      const request = store.get(path);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.cid : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async deletePathCidMapping(path: string): Promise<void> {
    if (!this.pathToCidStore) throw new Error('Path-CID store not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.pathToCidStore!.transaction([this.PATH_CID_STORE], 'readwrite');
      const store = transaction.objectStore(this.PATH_CID_STORE);
      const request = store.delete(path);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    blockCount: number;
    totalSize: number;
    pathCount: number;
  }> {
    await this.ensureInitialized();
    
    const pathCount = (await this.list()).length;
    
    // Note: Getting accurate block count and size from Helia/IDB is complex
    // This is a simplified version
    return {
      blockCount: 0, // Would need to query IDB blockstore
      totalSize: 0,  // Would need to sum all block sizes
      pathCount
    };
  }

  /**
   * Check if Helia is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      return this.initialized && this.helia !== undefined;
    } catch {
      return false;
    }
  }

  ngOnDestroy(): void {
    // Close Helia node when service is destroyed
    if (this.helia) {
      this.helia.stop().catch(error => {
        console.error('Error stopping Helia:', error);
      });
    }
    
    // Close path-CID database
    if (this.pathToCidStore) {
      this.pathToCidStore.close();
    }
  }
}