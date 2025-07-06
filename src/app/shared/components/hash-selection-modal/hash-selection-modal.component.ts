import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HashSelectionService, HashItem } from '../../../core/services/hash-selection.service';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';

@Component({
  selector: 'app-hash-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Select Content Hash</h2>
          <button class="close-button" (click)="close()" type="button">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Search Bar -->
          <div class="search-section">
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Search by hash or content type..."
              class="search-input"
              [disabled]="isLoading"
            />
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading hashes...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error && !isLoading" class="error-state">
            <p>{{ error }}</p>
            <button (click)="retry()" class="retry-button">Try Again</button>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && !error && hashItems.length === 0" class="empty-state">
            <p>No hashes found</p>
          </div>

          <!-- Hash List -->
          <div *ngIf="!isLoading && !error && hashItems.length > 0" class="hash-list">
            <div *ngFor="let item of hashItems; trackBy: trackByHash" class="hash-item">
              <div class="hash-info">
                <div class="hash-header">
                  <span class="algorithm">{{ item.hash.algorithm.toUpperCase() }}</span>
                  <span class="size">{{ hashSelectionService.formatFileSize(item.metadata.size || 0) }}</span>
                </div>
                
                <div class="hash-value">
                  <code>{{ formatHashForDisplay(item.hash.value) }}</code>
                </div>
                
                <div class="metadata-info">
                  <span class="date">{{ formatDate(item.metadata.createdAt) }}</span>
                  <span *ngIf="item.metadata.contentType" class="content-type">
                    • {{ item.metadata.contentType }}
                  </span>
                </div>
              </div>

              <!-- Preview Section -->
              <div *ngIf="previewStates.get(item.hash.value)" class="preview-section">
                <div class="preview-content">{{ previews.get(item.hash.value) }}</div>
              </div>

              <!-- Actions -->
              <div class="actions">
                <button 
                  (click)="selectHashAndStopPropagation(item.hash, $event)" 
                  class="select-button"
                  type="button"
                >
                  Select
                </button>
                <button 
                  (click)="togglePreview(item)" 
                  class="preview-button"
                  type="button"
                  [disabled]="loadingPreviews.has(item.hash.value)"
                >
                  {{ loadingPreviews.has(item.hash.value) ? 'Loading...' : 
                     (previewStates.get(item.hash.value) ? 'Hide Preview' : 'Show Preview') }}
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
      background: white;
      border-radius: 8px;
      max-width: 700px;
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
      font-size: 1.25rem;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
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

    .search-section {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #2196f3;
    }

    .loading-state, .error-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #2196f3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .retry-button {
      margin-top: 10px;
      padding: 8px 16px;
      background: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .hash-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .hash-item {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .hash-item:hover {
      border-color: #2196f3;
    }

    .hash-info {
      padding: 15px;
    }

    .hash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .algorithm {
      font-weight: 600;
      color: #2196f3;
      font-size: 12px;
    }

    .size {
      color: #666;
      font-size: 12px;
    }

    .hash-value {
      margin-bottom: 8px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .hash-value code {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #333;
    }

    .metadata-info {
      font-size: 12px;
      color: #666;
    }

    .content-type {
      color: #2196f3;
    }

    .preview-section {
      padding: 15px;
      background: #f9f9f9;
      border-top: 1px solid #e0e0e0;
    }

    .preview-content {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: white;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      max-height: 150px;
      overflow-y: auto;
      white-space: pre-wrap;
    }

    .actions {
      padding: 12px 15px;
      background: #f9f9f9;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 10px;
    }

    .select-button {
      padding: 6px 12px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .select-button:hover {
      background: #218838;
    }

    .preview-button {
      padding: 6px 12px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .preview-button:hover:not(:disabled) {
      background: #5a6268;
    }

    .preview-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class HashSelectionModalComponent implements OnInit {
  @Output() hashSelected = new EventEmitter<ContentHash>();
  @Output() closed = new EventEmitter<void>();

  searchTerm = '';
  hashItems: HashItem[] = [];
  isLoading = true;
  error = '';
  
  // Simple state management using Maps (KISS principle)
  previewStates = new Map<string, boolean>();
  previews = new Map<string, string>();
  loadingPreviews = new Set<string>();

  constructor(public hashSelectionService: HashSelectionService) {}

  ngOnInit(): void {
    this.loadHashes();
  }

  async onSearchChange(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    
    try {
      this.hashItems = await this.hashSelectionService.searchHashes(this.searchTerm);
    } catch (error) {
      this.error = `Failed to search hashes: ${(error as Error).message}`;
    } finally {
      this.isLoading = false;
    }
  }

  selectHash(hash: ContentHash): void {
    this.hashSelected.emit(hash);
    this.close();
  }

  selectHashAndStopPropagation(hash: ContentHash, event: Event): void {
    event.stopPropagation();
    this.selectHash(hash);
  }

  close(): void {
    this.closed.emit();
  }

  async retry(): Promise<void> {
    this.error = '';
    await this.loadHashes();
  }

  formatHashForDisplay(hashValue: string): string {
    // Show first 6 and last 8 characters for readability (KISS)
    if (hashValue.length <= 16) {
      return hashValue;
    }
    return `${hashValue.substring(0, 6)}...${hashValue.substring(hashValue.length - 8)}`;
  }

  formatDate(date?: Date): string {
    if (!date) return 'Unknown';
    return date.toLocaleDateString();
  }

  async togglePreview(item: HashItem): Promise<void> {
    const hashValue = item.hash.value;
    
    if (this.previewStates.get(hashValue)) {
      // Hide preview
      this.previewStates.set(hashValue, false);
      this.previews.set(hashValue, '');
      return;
    }

    // Show preview
    this.loadingPreviews.add(hashValue);
    
    try {
      // Default to text preview for simplicity (KISS)
      const previewData = await this.hashSelectionService.getPreviewData(item.hash, 'text');
      this.previews.set(hashValue, previewData);
      this.previewStates.set(hashValue, true);
    } catch (error) {
      this.previews.set(hashValue, 'Failed to load preview');
      this.previewStates.set(hashValue, true);
    } finally {
      this.loadingPreviews.delete(hashValue);
    }
  }

  trackByHash(_: number, item: HashItem): string {
    return item.hash.value;
  }

  private async loadHashes(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    
    try {
      this.hashItems = await this.hashSelectionService.searchHashes('');
    } catch (error) {
      this.error = `Failed to load hashes: ${(error as Error).message}`;
    } finally {
      this.isLoading = false;
    }
  }
}