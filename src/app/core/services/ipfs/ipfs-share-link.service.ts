import { Injectable, Inject } from '@angular/core';
import { IPFSConfig } from '../../domain/interfaces/ipfs.interface';
import { IPFS_CONFIG } from './ipfs-storage.service';

export interface ShareLinkOptions {
  gateway?: string;
  filename?: string;
  download?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IPFSShareLinkService {
  private readonly publicGateways = [
    'https://ipfs.io',
    'https://gateway.ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://gateway.pinata.cloud',
    'https://ipfs.fleek.co',
    'https://ipfs.infura.io'
  ];

  constructor(
    @Inject(IPFS_CONFIG) private config: IPFSConfig
  ) {}

  /**
   * Generate a shareable IPFS link for a given CID
   */
  generateShareLink(cid: string, options: ShareLinkOptions = {}): string {
    const gateway = options.gateway || this.getDefaultGateway();
    let link = `${gateway}/ipfs/${cid}`;
    
    // Add filename parameter if provided (helps with browser downloads)
    if (options.filename) {
      link += `?filename=${encodeURIComponent(options.filename)}`;
    }
    
    // Add download parameter if requested
    if (options.download) {
      link += options.filename ? '&' : '?';
      link += 'download=true';
    }
    
    return link;
  }

  /**
   * Generate multiple share links for different gateways
   */
  generateMultipleShareLinks(cid: string, options: ShareLinkOptions = {}): string[] {
    return this.publicGateways.map(gateway => 
      this.generateShareLink(cid, { ...options, gateway })
    );
  }

  /**
   * Get a shareable link for local IPFS node
   */
  generateLocalShareLink(cid: string, options: ShareLinkOptions = {}): string {
    const localGateway = this.config.gateway || 'http://127.0.0.1:8080';
    return this.generateShareLink(cid, { ...options, gateway: localGateway });
  }

  /**
   * Check if a CID is accessible via a gateway
   */
  async checkGatewayAvailability(cid: string, gateway?: string): Promise<boolean> {
    const url = this.generateShareLink(cid, { gateway });
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Find the first available gateway for a CID
   */
  async findAvailableGateway(cid: string): Promise<string | null> {
    // Check local gateway first
    if (await this.checkGatewayAvailability(cid, this.config.gateway)) {
      return this.config.gateway || 'http://127.0.0.1:8080';
    }

    // Check public gateways
    for (const gateway of this.publicGateways) {
      if (await this.checkGatewayAvailability(cid, gateway)) {
        return gateway;
      }
    }

    return null;
  }

  /**
   * Get the default gateway based on configuration
   */
  private getDefaultGateway(): string {
    // If in gateway mode, use configured gateway
    if (this.config.mode === 'gateway' && this.config.gateway) {
      return this.config.gateway;
    }
    
    // Otherwise use a public gateway
    return this.publicGateways[0];
  }

  /**
   * Get list of available public gateways
   */
  getPublicGateways(): string[] {
    return [...this.publicGateways];
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate IPFS protocol link (for IPFS Companion browser extension)
   */
  generateProtocolLink(cid: string): string {
    return `ipfs://${cid}`;
  }

  /**
   * Generate IPNS protocol link
   */
  generateIPNSLink(name: string): string {
    return `ipns://${name}`;
  }
}