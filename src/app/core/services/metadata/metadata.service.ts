import { Injectable } from '@angular/core';
import { DisotService } from '../disot.service';
import { 
  MetadataContent, 
  isMetadataContent 
} from '../../domain/interfaces/metadata-entry';
import { DisotEntry, DisotEntryType } from '../../domain/interfaces/disot.interface';

/**
 * Service for managing metadata entries
 * Follows Single Responsibility Principle - only handles metadata operations
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  constructor(private readonly disotService: DisotService) {}

  /**
   * Creates a new metadata entry
   * @param content The metadata content
   * @param privateKey Private key for signing
   * @returns The created DISOT entry
   */
  async createMetadataEntry(
    content: MetadataContent,
    privateKey: string
  ): Promise<DisotEntry> {
    // Validate metadata before creating
    if (!isMetadataContent(content)) {
      throw new Error('Invalid metadata content');
    }

    return this.disotService.createEntry(
      content,
      DisotEntryType.METADATA,
      privateKey
    );
  }

  /**
   * Retrieves metadata content from an entry
   * @param entryId ID of the metadata entry
   * @returns The metadata content
   */
  async getMetadataContent(entryId: string): Promise<MetadataContent> {
    const entry = await this.disotService.getEntry(entryId);
    
    if (entry.type !== DisotEntryType.METADATA) {
      throw new Error('Entry is not a metadata entry');
    }
    
    const metadata = entry.metadata as MetadataContent;
    
    if (!isMetadataContent(metadata)) {
      throw new Error('Invalid metadata content');
    }
    
    return metadata;
  }

  /**
   * Updates metadata by creating a new version
   * @param previousId ID of the previous version
   * @param updates Partial updates to apply
   * @param privateKey Private key for signing
   * @returns The new metadata entry
   */
  async updateMetadataEntry(
    previousId: string,
    updates: Partial<MetadataContent>,
    privateKey: string
  ): Promise<DisotEntry> {
    const previousContent = await this.getMetadataContent(previousId);
    
    const newContent: MetadataContent = {
      ...previousContent,
      ...updates,
      timestamp: Date.now(),
      version: {
        ...previousContent.version,
        ...updates.version,
        previousVersion: previousId
      }
    };
    
    return this.createMetadataEntry(newContent, privateKey);
  }

  /**
   * Finds metadata entries that reference a specific content hash
   * @param contentHash The content hash to search for
   * @returns Array of entries containing the reference
   */
  async findByReference(contentHash: string): Promise<DisotEntry[]> {
    const entries = await this.disotService.listEntries({ 
      type: DisotEntryType.METADATA 
    });
    
    return entries.filter(entry => {
      const metadata = entry.metadata as MetadataContent;
      return metadata?.references?.some(ref => ref.hash === contentHash) ?? false;
    });
  }

  /**
   * Finds metadata entries by author
   * @param authorHash The author hash to search for
   * @returns Array of entries by the author
   */
  async findByAuthor(authorHash: string): Promise<DisotEntry[]> {
    const entries = await this.disotService.listEntries({ 
      type: DisotEntryType.METADATA 
    });
    
    return entries.filter(entry => {
      const metadata = entry.metadata as MetadataContent;
      return metadata?.authors?.some(author => author.authorHash === authorHash) ?? false;
    });
  }

  /**
   * Gets the complete version history of a metadata entry
   * @param metadataId ID of any entry in the version chain
   * @returns Array of entries from newest to oldest
   */
  async getVersionHistory(metadataId: string): Promise<DisotEntry[]> {
    const history: DisotEntry[] = [];
    let currentId = metadataId;
    
    while (currentId) {
      try {
        const entry = await this.disotService.getEntry(currentId);
        history.push(entry);
        
        const metadata = entry.metadata as MetadataContent;
        currentId = metadata?.version?.previousVersion || '';
      } catch {
        // End of chain or error
        break;
      }
    }
    
    return history;
  }
}