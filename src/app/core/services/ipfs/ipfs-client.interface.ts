import { Observable } from 'rxjs';
import { IPFSUploadResult } from '../../domain/interfaces/ipfs.interface';

export interface IIPFSClient {
  /**
   * Add content to IPFS
   * @param data The data to add
   * @returns Observable of upload result
   */
  add(data: Uint8Array): Observable<IPFSUploadResult>;

  /**
   * Get content from IPFS
   * @param cid Content identifier
   * @returns Observable of content data
   */
  get(cid: string): Observable<Uint8Array>;

  /**
   * Pin content to ensure it stays available
   * @param cid Content identifier
   * @returns Observable of success status
   */
  pin(cid: string): Observable<boolean>;

  /**
   * Unpin content
   * @param cid Content identifier
   * @returns Observable of success status
   */
  unpin(cid: string): Observable<boolean>;

  /**
   * Check if client is connected and healthy
   * @returns Observable of health status
   */
  isHealthy(): Observable<boolean>;

  /**
   * Get client type
   * @returns Client type identifier
   */
  getType(): string;
}