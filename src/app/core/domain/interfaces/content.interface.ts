export interface ContentHash {
  algorithm: 'sha256';
  value: string;
}

export interface Content {
  data: Uint8Array;
  hash?: ContentHash;
}

export interface ContentMetadata {
  hash: ContentHash;
  size: number;
  createdAt: Date;
  contentType?: string;
}