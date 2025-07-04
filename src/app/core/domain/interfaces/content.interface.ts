export interface ContentHash {
  algorithm: string;
  value: string;
}

export interface Content {
  data: Uint8Array;
  hash?: ContentHash;
  metadata?: ContentMetadata;
}

export interface ContentMetadata {
  hash?: ContentHash;
  size?: number;
  createdAt?: Date;
  contentType?: string;
  name?: string;
  [key: string]: any;
}

export interface ContentWithHash {
  content: Content;
  hash: ContentHash;
}