import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CIDMapping {
  cid: string;
  path: string;
  hash: string;
  timestamp: Date;
  size?: number;
  mimeType?: string;
  pinned?: boolean;
}

export interface CIDMappingStats {
  totalMappings: number;
  totalSize: number;
  pinnedCount: number;
  oldestMapping?: Date;
  newestMapping?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class IPFSCIDMappingService {
  private mappings = new Map<string, CIDMapping>();
  private mappingsByPath = new Map<string, string>(); // path -> cid
  private mappingsByHash = new Map<string, string>(); // hash -> cid
  
  private mappingsSubject = new BehaviorSubject<CIDMapping[]>([]);
  private statsSubject = new BehaviorSubject<CIDMappingStats>({
    totalMappings: 0,
    totalSize: 0,
    pinnedCount: 0
  });

  mappings$ = this.mappingsSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor() {
    this.loadMappings();
  }

  /**
   * Add a new CID mapping
   */
  addMapping(mapping: CIDMapping): void {
    this.mappings.set(mapping.cid, mapping);
    this.mappingsByPath.set(mapping.path, mapping.cid);
    this.mappingsByHash.set(mapping.hash, mapping.cid);
    
    this.saveMappings();
    this.updateState();
  }

  /**
   * Get mapping by CID
   */
  getMappingByCID(cid: string): CIDMapping | undefined {
    return this.mappings.get(cid);
  }

  /**
   * Get mapping by path
   */
  getMappingByPath(path: string): CIDMapping | undefined {
    const cid = this.mappingsByPath.get(path);
    return cid ? this.mappings.get(cid) : undefined;
  }

  /**
   * Get mapping by content hash
   */
  getMappingByHash(hash: string): CIDMapping | undefined {
    const cid = this.mappingsByHash.get(hash);
    return cid ? this.mappings.get(cid) : undefined;
  }

  /**
   * Update mapping information
   */
  updateMapping(cid: string, updates: Partial<CIDMapping>): void {
    const mapping = this.mappings.get(cid);
    if (mapping) {
      Object.assign(mapping, updates);
      this.saveMappings();
      this.updateState();
    }
  }

  /**
   * Remove a mapping
   */
  removeMapping(cid: string): void {
    const mapping = this.mappings.get(cid);
    if (mapping) {
      this.mappings.delete(cid);
      this.mappingsByPath.delete(mapping.path);
      this.mappingsByHash.delete(mapping.hash);
      
      this.saveMappings();
      this.updateState();
    }
  }

  /**
   * Search mappings by various criteria
   */
  searchMappings(query: string): Observable<CIDMapping[]> {
    const lowerQuery = query.toLowerCase();
    
    return this.mappings$.pipe(
      map(mappings => mappings.filter(mapping => 
        mapping.cid.toLowerCase().includes(lowerQuery) ||
        mapping.path.toLowerCase().includes(lowerQuery) ||
        mapping.hash.toLowerCase().includes(lowerQuery) ||
        (mapping.mimeType && mapping.mimeType.toLowerCase().includes(lowerQuery))
      ))
    );
  }

  /**
   * Get mappings by date range
   */
  getMappingsByDateRange(startDate: Date, endDate: Date): Observable<CIDMapping[]> {
    return this.mappings$.pipe(
      map(mappings => mappings.filter(mapping => 
        mapping.timestamp >= startDate && mapping.timestamp <= endDate
      ))
    );
  }

  /**
   * Get pinned mappings
   */
  getPinnedMappings(): Observable<CIDMapping[]> {
    return this.mappings$.pipe(
      map(mappings => mappings.filter(mapping => mapping.pinned))
    );
  }

  /**
   * Export mappings as JSON
   */
  exportMappings(): string {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      mappings: Array.from(this.mappings.values())
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import mappings from JSON
   */
  importMappings(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.mappings && Array.isArray(data.mappings)) {
        data.mappings.forEach((mapping: any) => {
          if (mapping.cid && mapping.path && mapping.hash) {
            this.addMapping({
              ...mapping,
              timestamp: new Date(mapping.timestamp)
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to import mappings:', error);
      throw new Error('Invalid mapping data format');
    }
  }

  /**
   * Clear all mappings
   */
  clearMappings(): void {
    this.mappings.clear();
    this.mappingsByPath.clear();
    this.mappingsByHash.clear();
    
    this.saveMappings();
    this.updateState();
  }

  private loadMappings(): void {
    try {
      const savedData = localStorage.getItem('ipfs-cid-mappings');
      if (savedData) {
        const data = JSON.parse(savedData);
        data.mappings.forEach((mapping: any) => {
          const mappingObj: CIDMapping = {
            ...mapping,
            timestamp: new Date(mapping.timestamp)
          };
          this.mappings.set(mappingObj.cid, mappingObj);
          this.mappingsByPath.set(mappingObj.path, mappingObj.cid);
          this.mappingsByHash.set(mappingObj.hash, mappingObj.cid);
        });
        this.updateState();
      }
    } catch (error) {
      console.error('Failed to load CID mappings:', error);
    }
  }

  private saveMappings(): void {
    try {
      const data = {
        version: '1.0',
        mappings: Array.from(this.mappings.values())
      };
      localStorage.setItem('ipfs-cid-mappings', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save CID mappings:', error);
    }
  }

  private updateState(): void {
    const mappingsArray = Array.from(this.mappings.values());
    this.mappingsSubject.next(mappingsArray);
    
    const stats: CIDMappingStats = {
      totalMappings: mappingsArray.length,
      totalSize: mappingsArray.reduce((sum, m) => sum + (m.size || 0), 0),
      pinnedCount: mappingsArray.filter(m => m.pinned).length
    };

    if (mappingsArray.length > 0) {
      const timestamps = mappingsArray.map(m => m.timestamp);
      stats.oldestMapping = new Date(Math.min(...timestamps.map(d => d.getTime())));
      stats.newestMapping = new Date(Math.max(...timestamps.map(d => d.getTime())));
    }

    this.statsSubject.next(stats);
  }
}