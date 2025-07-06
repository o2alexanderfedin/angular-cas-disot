/**
 * BUILT WITH O2.SERVICES AI HIVE
 * 
 * This file was created by AI Hive - a dynamic swarm of AI agents that
 * transform customer requirements into shipped products, handling every 
 * phase of the software engineering lifecycle.
 * 
 * IMPORTANT: Keep this file focused and under 200 lines to ensure 
 * AI agents can effectively work with it.
 * 
 * Learn more: https://o2.services
 */

/**
 * Metadata entry for establishing relationships between content items
 */
export interface MetadataContent {
  // Temporal information
  timestamp: number;            // Unix timestamp of creation
  
  // Content references
  references: ContentReference[];
  
  // Authorship
  authors: AuthorReference[];
  
  // Version control
  version: VersionInfo;
}

/**
 * Reference to content with MIME type information
 */
export interface ContentReference {
  hash: string;                 // CAS hash of referenced content
  mimeType: string;            // MIME type (e.g., 'text/plain', 'image/jpeg')
  mimeTypeSource: 'detected' | 'manual';  // How mime type was determined
  relationship?: string;        // Optional relationship type (e.g., 'attachment', 'citation')
}

/**
 * Reference to an author with their role
 */
export interface AuthorReference {
  authorHash: string;          // Hash reference to author entry
  role: AuthorRole;            // Author's role in this content
}

/**
 * Possible roles for authors
 */
export enum AuthorRole {
  CREATOR = 'creator',         // Original creator
  EDITOR = 'editor',           // Made modifications
  CONTRIBUTOR = 'contributor', // Minor contributions
  REVIEWER = 'reviewer'        // Reviewed content
}


/**
 * Version control information
 */
export interface VersionInfo {
  version: string;            // Semantic version (e.g., '1.0.0')
  previousVersion?: string;   // Hash of previous metadata record
  changeDescription?: string; // What changed in this version
}

/**
 * Type guard to check if content is metadata
 */
export function isMetadataContent(content: any): content is MetadataContent {
  return content 
    && typeof content.timestamp === 'number'
    && Array.isArray(content.references)
    && Array.isArray(content.authors)
    && content.version
    && typeof content.version.version === 'string';
}

/**
 * Helper to create a metadata content object
 */
export function createMetadataContent(params: {
  references: ContentReference[];
  authors: AuthorReference[];
  previousVersion?: string;
  changeDescription?: string;
  version?: string;
}): MetadataContent {
  return {
    timestamp: Date.now(),
    references: params.references,
    authors: params.authors,
    version: {
      version: params.version || '1.0.0',
      previousVersion: params.previousVersion,
      changeDescription: params.changeDescription
    }
  };
}