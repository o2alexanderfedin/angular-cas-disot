import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { IIPFSClient } from './ipfs-client.interface';
import { IPFSConfig, IPFSUploadResult } from '../../domain/interfaces/ipfs.interface';
import { IPFS_CONFIG } from './ipfs-storage.service';

@Injectable()
export class IPFSClient implements IIPFSClient {
  private config: IPFSConfig;
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(IPFS_CONFIG) config: IPFSConfig
  ) {
    this.config = config;
    
    // Validate configuration
    if (config.mode === 'api') {
      // API mode can use proxy (empty apiEndpoint) or explicit endpoint
      this.baseUrl = config.apiEndpoint ? config.apiEndpoint + '/api/v0' : '/api/v0';
    } else if (config.mode === 'gateway') {
      // Gateway mode - read only
      if (!config.gateway) {
        throw new Error('Invalid IPFS configuration: gateway URL required for gateway mode');
      }
      this.baseUrl = config.gateway;
    } else {
      throw new Error('Invalid IPFS configuration: unsupported mode');
    }
  }

  add(data: Uint8Array): Observable<IPFSUploadResult> {
    if (this.config.mode === 'gateway') {
      return throwError(() => new Error('Gateway mode does not support uploads'));
    }

    const formData = new FormData();
    const blob = new Blob([data], { type: 'application/octet-stream' });
    formData.append('file', blob);

    return this.http.post<any>(`${this.baseUrl}/add`, formData, {
      params: { pin: 'true' },
      headers: {
        // Let browser handle Content-Type for FormData
      }
    }).pipe(
      timeout(this.config.timeout),
      map(response => ({
        cid: response.Hash,
        size: response.Size || data.length,
        timestamp: new Date(),
        pinned: true
      })),
      catchError(error => {
        console.error('IPFS add failed:', error);
        return throwError(() => new Error(`Failed to add to IPFS: ${error.message}`));
      })
    );
  }

  get(cid: string): Observable<Uint8Array> {
    let url: string;
    
    if (this.config.mode === 'api') {
      // Use API endpoint
      return this.http.post(`${this.baseUrl}/cat`, null, {
        params: { arg: cid },
        responseType: 'arraybuffer'
      }).pipe(
        timeout(this.config.timeout),
        map(buffer => new Uint8Array(buffer)),
        catchError(error => {
          console.error('IPFS get failed:', error);
          return throwError(() => new Error(`Failed to get from IPFS: ${error.message}`));
        })
      );
    } else {
      // Use gateway
      url = `${this.config.gateway}/ipfs/${cid}`;
      return this.http.get(url, {
        responseType: 'arraybuffer'
      }).pipe(
        timeout(this.config.timeout),
        map(buffer => new Uint8Array(buffer)),
        catchError(error => {
          console.error('IPFS gateway get failed:', error);
          return throwError(() => new Error(`Failed to get from IPFS gateway: ${error.message}`));
        })
      );
    }
  }

  pin(cid: string): Observable<boolean> {
    if (this.config.mode === 'gateway') {
      return throwError(() => new Error('Gateway mode does not support pinning'));
    }

    return this.http.post<any>(`${this.baseUrl}/pin/add`, null, {
      params: { arg: cid }
    }).pipe(
      timeout(this.config.timeout),
      map(() => true),
      catchError(error => {
        console.error('IPFS pin failed:', error);
        return of(false);
      })
    );
  }

  unpin(cid: string): Observable<boolean> {
    if (this.config.mode === 'gateway') {
      return throwError(() => new Error('Gateway mode does not support unpinning'));
    }

    return this.http.post<any>(`${this.baseUrl}/pin/rm`, null, {
      params: { arg: cid }
    }).pipe(
      timeout(this.config.timeout),
      map(() => true),
      catchError(error => {
        console.error('IPFS unpin failed:', error);
        return of(false);
      })
    );
  }

  isHealthy(): Observable<boolean> {
    if (this.config.mode === 'api') {
      return this.http.post<any>(`${this.baseUrl}/version`, null, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).pipe(
        timeout(5000),
        map(() => true),
        catchError((error) => {
          console.error('IPFS health check failed:', error);
          return of(false);
        })
      );
    } else {
      // For gateway, just check if we can reach it
      return this.http.head(this.config.gateway).pipe(
        timeout(5000),
        map(() => true),
        catchError(() => of(false))
      );
    }
  }

  getType(): string {
    return this.config.mode;
  }
}