import { IPFSConfig } from '../../domain/interfaces/ipfs.interface';

export const DEFAULT_IPFS_CONFIG: IPFSConfig = {
  mode: 'api',
  gateway: 'http://127.0.0.1:8081',
  apiEndpoint: '', // Use relative path to leverage Angular proxy in development
  timeout: 30000,
  retryAttempts: 3,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  enableEncryption: false
};