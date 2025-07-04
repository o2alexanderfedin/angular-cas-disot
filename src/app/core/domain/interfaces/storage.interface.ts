import { ContentHash, Content, ContentMetadata, ContentWithHash } from './content.interface';

export interface IContentStorage {
  store(content: Content): Promise<ContentHash>;
  retrieve(hash: ContentHash): Promise<Content>;
  exists(hash: ContentHash): Promise<boolean>;
  getMetadata(hash: ContentHash): Promise<ContentMetadata>;
  getAllContent(): Promise<ContentWithHash[]>;
}

export interface IStorageProvider {
  write(path: string, data: Uint8Array): Promise<void>;
  read(path: string): Promise<Uint8Array>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  list(): Promise<string[]>;
}