import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { CasService } from '../../../core/services/cas.service';
import { ContentHash, ContentMetadata } from '../../../core/domain/interfaces/content.interface';

interface ContentItem {
  hash: ContentHash;
  metadata: ContentMetadata;
  previewData: string | null;
  previewType: 'text' | 'json' | 'hex' | 'base64' | 'image' | null;
  detectedType?: string;
}

@Component({
  selector: 'app-content-list',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule],
  template: `
    <div class="content-list">
      <h2>Stored Content</h2>
      
      <div class="search-bar">
        <input 
          type="text" 
          [(ngModel)]="searchTerm"
          (ngModelChange)="filterContent()"
          placeholder="Search by hash..."
          class="search-input"
        />
      </div>

      <div *ngIf="isLoading" class="loading">
        Loading content...
      </div>

      <div *ngIf="!isLoading && filteredItems.length === 0" class="empty-state">
        <p>No content found</p>
      </div>

      <div class="content-grid">
        <div *ngFor="let item of filteredItems" class="content-card">
          <div class="card-header">
            <h3>{{ item.hash.algorithm | uppercase }}</h3>
            <span class="file-size">{{ formatFileSize(item.metadata.size || 0) }}</span>
          </div>
          
          <div class="hash-value">
            <code>{{ item.hash.value }}</code>
          </div>

          <div class="metadata">
            <p>Created: {{ item.metadata.createdAt | date:'short' }}</p>
            <p *ngIf="item.metadata.contentType">Type: {{ item.metadata.contentType }}</p>
          </div>

          <div *ngIf="item.previewData" class="preview-section">
            <div class="preview-controls">
              <label>Preview as: </label>
              <select [(ngModel)]="item.previewType" (change)="updatePreview(item)" class="preview-type-select">
                <option value="text">Text</option>
                <option value="json">JSON</option>
                <option value="hex">Hex</option>
                <option value="base64">Base64</option>
                <option value="image">Image</option>
              </select>
              <span *ngIf="item.detectedType" class="detected-type">(Detected: {{ item.detectedType }})</span>
            </div>
            <div class="preview" [ngClass]="'preview-' + item.previewType">
              <pre *ngIf="item.previewType === 'json'">{{ item.previewData }}</pre>
              <code *ngIf="item.previewType === 'hex' || item.previewType === 'base64'">{{ item.previewData }}</code>
              <p *ngIf="item.previewType === 'text'">{{ item.previewData }}</p>
              <img *ngIf="item.previewType === 'image'" [src]="item.previewData" alt="Preview" />
            </div>
          </div>

          <div class="actions">
            <button (click)="selectContent(item.hash)" class="action-button">
              Select
            </button>
            <button (click)="previewContent(item)" class="action-button" [disabled]="item.previewData !== null">
              {{ item.previewData !== null ? 'Preview Loaded' : 'Load Preview' }}
            </button>
            <button (click)="downloadContent(item.hash)" class="action-button">
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .content-list {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .search-bar {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .content-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background-color: #f9f9f9;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .card-header h3 {
      margin: 0;
      color: #333;
    }

    .file-size {
      color: #666;
      font-size: 14px;
    }

    .hash-value {
      margin-bottom: 15px;
      padding: 10px;
      background-color: #e9ecef;
      border-radius: 4px;
      overflow-wrap: break-word;
    }

    .hash-value code {
      font-family: monospace;
      font-size: 12px;
    }

    .metadata {
      margin-bottom: 15px;
      font-size: 14px;
      color: #666;
    }

    .metadata p {
      margin: 5px 0;
    }

    .preview-section {
      margin-bottom: 15px;
    }

    .preview-controls {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .preview-type-select {
      padding: 5px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .detected-type {
      color: #666;
      font-style: italic;
      font-size: 12px;
    }

    .preview {
      padding: 10px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 14px;
    }

    .preview pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .preview code {
      display: block;
      font-family: monospace;
      word-break: break-all;
    }

    .preview img {
      max-width: 100%;
      height: auto;
    }

    .preview-hex code, .preview-base64 code {
      font-size: 12px;
      line-height: 1.4;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .action-button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      background-color: #007bff;
      color: white;
      transition: background-color 0.3s;
    }

    .action-button:hover {
      background-color: #0056b3;
    }
  `]
})
export class ContentListComponent implements OnInit {
  @Input() filter?: any;
  @Output() contentSelected = new EventEmitter<ContentHash>();

  contentItems: ContentItem[] = [];
  filteredItems: ContentItem[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(private casService: CasService) {}

  ngOnInit(): void {
    this.loadContentItems();
  }

  async loadContentItems(): Promise<void> {
    this.isLoading = true;
    try {
      const allContent = await this.casService.getAllContent();
      
      // Clear existing items and load from storage
      this.contentItems = [];
      
      for (const item of allContent) {
        const metadata = await this.casService.getMetadata(item.hash);
        this.contentItems.push({
          hash: item.hash,
          metadata,
          previewData: null,
          previewType: null
        });
      }
      
      this.filterContent();
    } catch (error) {
      console.error('Failed to load content items:', error);
    } finally {
      this.isLoading = false;
    }
  }

  addContentItem(hash: ContentHash, metadata: ContentMetadata): void {
    const item: ContentItem = {
      hash,
      metadata,
      previewData: null,
      previewType: null
    };
    this.contentItems.push(item);
    this.filterContent();
  }

  filterContent(): void {
    if (!this.searchTerm) {
      this.filteredItems = [...this.contentItems];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredItems = this.contentItems.filter(item =>
        item.hash.value.toLowerCase().includes(term)
      );
    }
  }

  selectContent(hash: ContentHash): void {
    this.contentSelected.emit(hash);
  }

  async previewContent(item: ContentItem): Promise<void> {
    if (item.previewData !== null) return;
    
    try {
      const content = await this.casService.retrieve(item.hash);
      
      // Detect content type
      const detectedType = this.detectContentType(content.data);
      item.detectedType = detectedType;
      
      // Set initial preview type based on detection
      if (!item.previewType) {
        item.previewType = this.getInitialPreviewType(detectedType, content.data);
      }
      
      // Generate preview based on type
      this.updatePreviewData(item, content.data);
    } catch (error) {
      console.error('Failed to preview content:', error);
    }
  }

  private detectContentType(data: Uint8Array): string {
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

  private getInitialPreviewType(detectedType: string, data: Uint8Array): 'text' | 'json' | 'hex' | 'base64' | 'image' {
    if (detectedType.startsWith('image/')) return 'image';
    if (detectedType === 'application/json') return 'json';
    if (detectedType === 'text/plain') return 'text';
    
    // For binary data, default to hex if small, base64 if larger
    return data.length <= 256 ? 'hex' : 'base64';
  }

  updatePreview(item: ContentItem): void {
    if (!item.previewData) return;
    
    this.casService.retrieve(item.hash).then(content => {
      this.updatePreviewData(item, content.data);
    }).catch(error => {
      console.error('Failed to update preview:', error);
    });
  }

  private updatePreviewData(item: ContentItem, data: Uint8Array): void {
    const maxSize = 1000;
    
    switch (item.previewType) {
      case 'text':
        try {
          const text = new TextDecoder().decode(data);
          item.previewData = text.length > maxSize 
            ? text.substring(0, maxSize) + '...' 
            : text;
        } catch {
          item.previewData = 'Unable to decode as text';
        }
        break;
        
      case 'json':
        try {
          const text = new TextDecoder().decode(data);
          const json = JSON.parse(text);
          item.previewData = JSON.stringify(json, null, 2);
          if (item.previewData.length > maxSize) {
            item.previewData = item.previewData.substring(0, maxSize) + '...';
          }
        } catch {
          item.previewData = 'Invalid JSON';
        }
        break;
        
      case 'hex':
        const hexBytes = Math.min(data.length, 256);
        item.previewData = Array.from(data.slice(0, hexBytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
          .toUpperCase();
        if (data.length > hexBytes) {
          item.previewData += ' ...';
        }
        break;
        
      case 'base64':
        const base64Bytes = Math.min(data.length, 1000);
        item.previewData = btoa(String.fromCharCode(...data.slice(0, base64Bytes)));
        if (data.length > base64Bytes) {
          item.previewData += '...';
        }
        break;
        
      case 'image':
        // Create data URL for image
        const blob = new Blob([data]);
        const reader = new FileReader();
        reader.onload = () => {
          item.previewData = reader.result as string;
        };
        reader.readAsDataURL(blob);
        break;
    }
  }

  async downloadContent(hash: ContentHash): Promise<void> {
    try {
      const content = await this.casService.retrieve(hash);
      this.downloadFile(content.data, hash.value);
    } catch (error) {
      console.error('Failed to download content:', error);
    }
  }

  downloadFile(data: Uint8Array, filename: string): void {
    const blob = new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}