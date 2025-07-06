import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ContentPreviewService {
  
  detectContentType(data: Uint8Array): string {
    // Check for common file signatures
    if (data.length >= 4) {
      const header = Array.from(data.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // PNG
      if (header === '89504e47') return 'image/png';
      // JPEG
      if (header.startsWith('ffd8ff')) return 'image/jpeg';
      // GIF
      if (header.startsWith('47494638')) return 'image/gif';
      // PDF
      if (header === '25504446') return 'application/pdf';
    }
    
    // Try to decode as text
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(data.slice(0, 1000));
      
      // Check if it's JSON
      try {
        JSON.parse(text);
        return 'application/json';
      } catch {
        // Not JSON, but is text
        return 'text/plain';
      }
    } catch {
      // Not valid UTF-8, treat as binary
      return 'application/octet-stream';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatHashForDisplay(hashValue: string, maxLength = 16): string {
    if (hashValue.length <= maxLength) {
      return hashValue;
    }
    const prefixLength = 6;
    const suffixLength = 8;
    return `${hashValue.substring(0, prefixLength)}...${hashValue.substring(hashValue.length - suffixLength)}`;
  }

  generatePreview(data: Uint8Array, format: 'text' | 'json' | 'hex' | 'base64', maxSize = 1000): string {
    switch (format) {
      case 'text':
        try {
          const text = new TextDecoder('utf-8', { fatal: true }).decode(data);
          return text.length > maxSize 
            ? text.substring(0, maxSize) + '...' 
            : text;
        } catch {
          return 'Unable to decode as text';
        }
        
      case 'json':
        try {
          const text = new TextDecoder().decode(data);
          const json = JSON.parse(text);
          const formatted = JSON.stringify(json, null, 2);
          return formatted.length > maxSize
            ? formatted.substring(0, maxSize) + '...'
            : formatted;
        } catch {
          return 'Invalid JSON';
        }
        
      case 'hex':
        const hexBytes = Math.min(data.length, 256);
        let hex = Array.from(data.slice(0, hexBytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
          .toUpperCase();
        if (data.length > hexBytes) {
          hex += ' ...';
        }
        return hex;
        
      case 'base64':
        const base64Bytes = Math.min(data.length, 1000);
        let base64 = btoa(String.fromCharCode(...data.slice(0, base64Bytes)));
        if (data.length > base64Bytes) {
          base64 += '...';
        }
        return base64;
        
      default:
        return 'Unsupported format';
    }
  }
}