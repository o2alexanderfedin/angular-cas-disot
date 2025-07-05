import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CasService } from '../../../core/services/cas.service';
import { ContentHash, ContentMetadata } from '../../../core/domain/interfaces/content.interface';

interface ContentItem {
  hash: ContentHash;
  metadata: ContentMetadata;
  previewData: string | null;
  previewType: 'text' | 'json' | 'hex' | 'base64' | 'image' | null;
  detectedType?: string;
  isLoadingPreview?: boolean;
}

@Component({
  selector: 'app-content-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Select Content for DISOT Entry</h2>
          <button class="close-button" (click)="close()">×</button>
        </div>
        
        <div class="modal-body">
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

          <div class="content-list">
            <div *ngFor="let item of filteredItems" class="content-item">
              <div class="item-clickable">
                <div class="item-header">
                  <span class="algorithm">{{ item.hash.algorithm | uppercase }}</span>
                  <span class="size">{{ formatFileSize(item.metadata.size || 0) }}</span>
                </div>
                <div class="hash-value">
                  <code>{{ item.hash.value }}</code>
                </div>
                <div class="metadata">
                  <span>{{ item.metadata.createdAt | date:'short' }}</span>
                  <span *ngIf="item.metadata.contentType">• {{ item.metadata.contentType }}</span>
                </div>
              </div>
              
              <div class="preview-section" *ngIf="item.previewData">
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
              
              <div class="item-actions">
                <button 
                  (click)="selectContent(item.hash); $event.stopPropagation()" 
                  class="select-button"
                >
                  Select
                </button>
                <button 
                  (click)="togglePreview(item); $event.stopPropagation()" 
                  class="preview-button"
                  [disabled]="item.isLoadingPreview"
                >
                  {{ item.isLoadingPreview ? 'Loading...' : (item.previewData ? 'Hide Preview' : 'Show Preview') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: white;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 30px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      color: #333;
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
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

    .content-list {
      display: grid;
      gap: 10px;
    }

    .content-item {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      transition: all 0.2s;
      background-color: #f9f9f9;
      overflow: hidden;
    }

    .item-clickable {
      padding: 15px;
    }

    .content-item:hover .item-clickable {
      background-color: #e3f2fd;
    }

    .content-item:hover {
      border-color: #2196f3;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .algorithm {
      font-weight: 600;
      color: #2196f3;
      font-size: 14px;
    }

    .size {
      color: #666;
      font-size: 14px;
    }

    .hash-value {
      margin-bottom: 8px;
      padding: 8px;
      background-color: #fff;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .hash-value code {
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
      color: #333;
    }

    .metadata {
      font-size: 12px;
      color: #666;
      display: flex;
      gap: 10px;
    }

    .preview-section {
      padding: 15px;
      background-color: #f5f5f5;
      border-top: 1px solid #e0e0e0;
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

    .item-actions {
      padding: 10px 15px;
      background-color: #f9f9f9;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 10px;
    }

    .select-button {
      padding: 6px 12px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .select-button:hover {
      background-color: #218838;
    }

    .preview-button {
      padding: 6px 12px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .preview-button:hover:not(:disabled) {
      background-color: #5a6268;
    }

    .preview-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ContentSelectionModalComponent {
  @Output() contentSelected = new EventEmitter<ContentHash>();
  @Output() closed = new EventEmitter<void>();

  contentItems: ContentItem[] = [];
  filteredItems: ContentItem[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(private casService: CasService) {
    this.loadContent();
  }

  async loadContent(): Promise<void> {
    this.isLoading = true;
    try {
      const allContent = await this.casService.getAllContent();
      
      this.contentItems = [];
      for (const item of allContent) {
        const metadata = await this.casService.getMetadata(item.hash);
        this.contentItems.push({
          hash: item.hash,
          metadata,
          previewData: null,
          previewType: null,
          isLoadingPreview: false
        });
      }
      
      this.filterContent();
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      this.isLoading = false;
    }
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
    this.close();
  }

  close(): void {
    this.closed.emit();
  }

  async togglePreview(item: ContentItem): Promise<void> {
    if (item.previewData) {
      // Hide preview
      item.previewData = null;
      item.previewType = null;
      item.detectedType = undefined;
    } else {
      // Load preview
      await this.loadPreview(item);
    }
  }

  async loadPreview(item: ContentItem): Promise<void> {
    if (item.isLoadingPreview) return;
    
    item.isLoadingPreview = true;
    try {
      const content = await this.casService.retrieve(item.hash);
      
      // Detect content type
      const detectedType = this.detectContentType(content.data);
      item.detectedType = detectedType;
      
      // Set initial preview type based on detection
      item.previewType = this.getInitialPreviewType(detectedType, content.data);
      
      // Generate preview based on type
      this.updatePreviewData(item, content.data);
    } catch (error) {
      console.error('Failed to preview content:', error);
    } finally {
      item.isLoadingPreview = false;
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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}