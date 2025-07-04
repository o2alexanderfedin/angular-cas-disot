import { ContentHash } from './content.interface';
import { Signature } from './crypto.interface';

export interface DisotEntry {
  id: string;
  contentHash: ContentHash;
  signature: Signature;
  timestamp: Date;
  type: DisotEntryType;
  metadata?: Record<string, any>;
}

export enum DisotEntryType {
  BLOG_POST = 'blog_post',
  SIGNATURE = 'signature',
  DOCUMENT = 'document',
  IMAGE = 'image'
}

export interface IDisotService {
  createEntry(contentHash: ContentHash, type: DisotEntryType, privateKey: string): Promise<DisotEntry>;
  verifyEntry(entry: DisotEntry): Promise<boolean>;
  getEntry(id: string): Promise<DisotEntry>;
  listEntries(filter?: DisotFilter): Promise<DisotEntry[]>;
}

export interface DisotFilter {
  type?: DisotEntryType;
  publicKey?: string;
  fromDate?: Date;
  toDate?: Date;
}