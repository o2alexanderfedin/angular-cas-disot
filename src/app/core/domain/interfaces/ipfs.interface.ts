export interface IPFSConfig {
  mode: 'gateway' | 'api' | 'auto';
  gateway: string;
  apiEndpoint?: string;
  timeout: number;
  retryAttempts: number;
  maxFileSize: number;
  enableEncryption: boolean;
  pinningService?: {
    endpoint: string;
    apiKey: string;
  };
}

export interface IPFSUploadResult {
  cid: string;
  size: number;
  timestamp: Date;
  pinned: boolean;
}

export interface UploadQueueItem {
  id: string;
  path: string;
  data: Uint8Array;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  attempts: number;
  error?: string;
  cid?: string;
  progress?: number;
}

export interface IPFSGatewayInfo {
  url: string;
  isPublic: boolean;
  isHealthy: boolean;
  lastChecked: Date;
  latency?: number;
}

export interface CIDMapping {
  hash: string;
  cid: string;
  timestamp: Date;
  size: number;
}