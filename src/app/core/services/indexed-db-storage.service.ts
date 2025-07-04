import { Injectable } from '@angular/core';
import { IStorageProvider } from '../domain/interfaces/storage.interface';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbStorageService implements IStorageProvider {
  private dbName = 'cas-storage';
  private storeName = 'content';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initializationError: Error | null = null;
  private initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.initializeDb().catch(() => {
      // Silently catch initialization errors - they will be handled in ensureDb
    });
  }

  private async initializeDb(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        const error = new Error('Failed to open IndexedDB');
        this.initializationError = error;
        reject(error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    }).catch((error) => {
      this.initializationError = error;
      throw error;
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (this.initializationError) {
      throw new Error('IndexedDB not available');
    }
    
    if (!this.db) {
      try {
        await this.initializationPromise;
      } catch (error) {
        throw new Error('IndexedDB not available');
      }
    }
    
    if (!this.db) {
      throw new Error('IndexedDB not available');
    }
    return this.db;
  }

  async read(path: string): Promise<Uint8Array> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(path);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result instanceof Uint8Array) {
          resolve(result);
        } else if (result) {
          // Handle legacy data that might be stored differently
          resolve(new Uint8Array(result));
        } else {
          reject(new Error(`Path not found: ${path}`));
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to read path: ${path}`));
      };
    });
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data, path);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to write path: ${path}`));
      };
    });
  }

  async exists(path: string): Promise<boolean> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count(path);

      request.onsuccess = () => {
        resolve(request.result > 0);
      };

      request.onerror = () => {
        reject(new Error(`Failed to check existence: ${path}`));
      };
    });
  }

  async list(): Promise<string[]> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result;
        resolve(keys.map(key => String(key)));
      };

      request.onerror = () => {
        reject(new Error('Failed to list paths'));
      };
    });
  }

  async delete(path: string): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(path);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete path: ${path}`));
      };
    });
  }

  async clear(): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear storage'));
      };
    });
  }

  async getSize(): Promise<number> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      let totalSize = 0;
      
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value instanceof Uint8Array) {
            totalSize += cursor.value.byteLength;
          }
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to calculate storage size'));
      };
    });
  }
}