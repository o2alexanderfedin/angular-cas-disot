import { Injectable } from '@angular/core';
import { IDisotService, DisotEntry, DisotEntryType, DisotFilter } from '../domain/interfaces/disot.interface';
import { ContentHash } from '../domain/interfaces/content.interface';
import { CasService } from './cas.service';
import { SignatureService } from './signature.service';
import { HashService } from './hash.service';

@Injectable({
  providedIn: 'root'
})
export class DisotService implements IDisotService {
  private entries = new Map<string, DisotEntry>();

  constructor(
    private casService: CasService,
    private signatureService: SignatureService,
    private hashService: HashService
  ) {}

  async createEntry(
    content: ContentHash | any,
    type: DisotEntryType,
    privateKey: string
  ): Promise<DisotEntry> {
    const timestamp = new Date();
    
    // Handle both ContentHash and direct content (for metadata)
    let contentHash: ContentHash;
    let metadata: any;
    
    if (this.isContentHash(content)) {
      contentHash = content;
    } else {
      // For metadata and other direct content, hash it
      const contentData = new TextEncoder().encode(JSON.stringify(content));
      const hashValue = await this.hashService.hash(contentData);
      contentHash = {
        algorithm: 'sha256',
        value: hashValue
      };
      metadata = content;
    }
    
    // Create entry data to sign
    const entryData = {
      contentHash,
      type,
      timestamp: timestamp.toISOString(),
      ...(metadata && { metadata })
    };
    
    const dataToSign = new TextEncoder().encode(JSON.stringify(entryData));
    const signature = await this.signatureService.sign(dataToSign, privateKey);
    
    const entry: DisotEntry = {
      id: '', // Will be set after storing
      contentHash,
      signature,
      timestamp,
      type,
      ...(metadata && { metadata })
    };
    
    // Store the entry in CAS
    const entryContent = new TextEncoder().encode(JSON.stringify(entry));
    const entryHash = await this.casService.store({ data: entryContent });
    entry.id = entryHash.value;
    
    // Store in memory for quick access
    this.entries.set(entry.id, entry);
    
    return entry;
  }

  private isContentHash(content: any): content is ContentHash {
    return content && 
           typeof content.algorithm === 'string' && 
           typeof content.value === 'string';
  }

  async verifyEntry(entry: DisotEntry): Promise<boolean> {
    const entryData = {
      contentHash: entry.contentHash,
      type: entry.type,
      timestamp: entry.timestamp.toISOString(),
      ...(entry.metadata && { metadata: entry.metadata })
    };
    
    const dataToVerify = new TextEncoder().encode(JSON.stringify(entryData));
    return this.signatureService.verify(dataToVerify, entry.signature);
  }

  async getEntry(id: string): Promise<DisotEntry> {
    // Check memory cache first
    if (this.entries.has(id)) {
      return this.entries.get(id)!;
    }
    
    // Try to retrieve from CAS
    try {
      const content = await this.casService.retrieve({
        algorithm: 'sha256',
        value: id
      });
      
      const entryJson = new TextDecoder().decode(content.data);
      const entry = JSON.parse(entryJson) as DisotEntry;
      entry.timestamp = new Date(entry.timestamp);
      
      // Cache for future access
      this.entries.set(id, entry);
      
      return entry;
    } catch (error) {
      throw new Error('DISOT entry not found');
    }
  }

  async listEntries(filter?: DisotFilter): Promise<DisotEntry[]> {
    let entries = Array.from(this.entries.values());
    
    if (filter) {
      if (filter.type) {
        entries = entries.filter(e => e.type === filter.type);
      }
      
      if (filter.publicKey) {
        entries = entries.filter(e => e.signature.publicKey === filter.publicKey);
      }
      
      if (filter.fromDate) {
        entries = entries.filter(e => e.timestamp >= filter.fromDate!);
      }
      
      if (filter.toDate) {
        entries = entries.filter(e => e.timestamp <= filter.toDate!);
      }
    }
    
    // Sort by timestamp descending
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}