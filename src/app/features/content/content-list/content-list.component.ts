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
            <span class="file-size">{{ formatFileSize(item.metadata.size) }}</span>
          </div>
          
          <div class="hash-value">
            <code>{{ item.hash.value }}</code>
          </div>

          <div class="metadata">
            <p>Created: {{ item.metadata.createdAt | date:'short' }}</p>
            <p *ngIf="item.metadata.contentType">Type: {{ item.metadata.contentType }}</p>
          </div>

          <div *ngIf="item.previewData" class="preview">
            <p>{{ item.previewData }}</p>
          </div>

          <div class="actions">
            <button (click)="selectContent(item.hash)" class="action-button">
              Select
            </button>
            <button (click)="previewContent(item.hash)" class="action-button">
              Preview
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

    .preview {
      margin-bottom: 15px;
      padding: 10px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      max-height: 100px;
      overflow-y: auto;
      font-size: 14px;
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

  loadContentItems(): void {
    // In a real implementation, this would load from storage
    // For now, we'll use the items added via addContentItem
    this.filterContent();
  }

  addContentItem(hash: ContentHash, metadata: ContentMetadata): void {
    const item: ContentItem = {
      hash,
      metadata,
      previewData: null
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

  async previewContent(hash: ContentHash): Promise<void> {
    try {
      const content = await this.casService.retrieve(hash);
      const text = new TextDecoder().decode(content.data);
      
      const item = this.contentItems.find(i => i.hash.value === hash.value);
      if (item) {
        item.previewData = text.length > 1000 
          ? text.substring(0, 1000) + '...' 
          : text;
      }
    } catch (error) {
      console.error('Failed to preview content:', error);
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