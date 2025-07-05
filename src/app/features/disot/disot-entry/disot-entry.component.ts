import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { DisotService } from '../../../core/services/disot.service';
import { SignatureService } from '../../../core/services/signature.service';
import { CasService } from '../../../core/services/cas.service';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';
import { DisotEntry, DisotEntryType } from '../../../core/domain/interfaces/disot.interface';

@Component({
  selector: 'app-disot-entry',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule],
  template: `
    <div class="disot-entry">
      <h2>Create DISOT Entry</h2>
      
      <!-- Content Selection Modal -->
      <app-content-selection-modal 
        *ngIf="showContentModal"
        (contentSelected)="onContentSelected($event)"
        (closed)="showContentModal = false"
      ></app-content-selection-modal>
      
      <div class="form-section">
        <h3>Content Information</h3>
        <div *ngIf="contentHash" class="content-info">
          <p><strong>Algorithm:</strong> {{ contentHash.algorithm | uppercase }}</p>
          <p><strong>Hash:</strong> <code>{{ contentHash.value }}</code></p>
          <button (click)="clearContent()" class="clear-button">Clear Selection</button>
        </div>
        <div *ngIf="!contentHash" class="no-content">
          <p>No content selected. Please select content from the content list.</p>
          <button (click)="selectContent()" class="select-button">Select Content</button>
        </div>
      </div>

      <div class="form-section">
        <h3>Entry Type</h3>
        <select [(ngModel)]="selectedType" class="type-select">
          <option *ngFor="let type of entryTypes" [value]="type">
            {{ formatEntryType(type) }}
          </option>
        </select>
      </div>

      <div class="form-section">
        <h3>Signing Key</h3>
        <div class="key-section">
          <textarea 
            [(ngModel)]="privateKey"
            placeholder="Enter your private key..."
            rows="3"
            class="key-input"
            [disabled]="isCreating"
          ></textarea>
          <button 
            (click)="generateKeyPair()"
            [disabled]="isCreating"
            class="generate-button"
          >
            Generate New Key Pair
          </button>
          <div *ngIf="publicKey" class="public-key-display">
            <p><strong>Public Key:</strong></p>
            <code>{{ publicKey }}</code>
          </div>
        </div>
      </div>

      <div class="form-section" *ngIf="selectedType === 'blog_post'">
        <h3>Blog Post Content</h3>
        <textarea 
          [(ngModel)]="blogPostContent"
          placeholder="Enter your blog post content..."
          rows="6"
          class="blog-input"
          [disabled]="isCreating"
        ></textarea>
      </div>

      <button 
        (click)="createEntry()"
        [disabled]="!contentHash || !privateKey || isCreating"
        class="create-button"
      >
        {{ isCreating ? 'Creating...' : 'Create Entry' }}
      </button>

      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div *ngIf="createdEntry" class="success-section">
        <h3>Entry Created Successfully!</h3>
        <div class="entry-details">
          <p><strong>Entry ID:</strong> <code>{{ createdEntry.id }}</code></p>
          <p><strong>Type:</strong> {{ formatEntryType(createdEntry.type) }}</p>
          <p><strong>Timestamp:</strong> {{ createdEntry.timestamp | date:'medium' }}</p>
          <p><strong>Public Key:</strong> <code>{{ createdEntry.signature.publicKey }}</code></p>
          <p><strong>Signature:</strong> <code>{{ createdEntry.signature.value }}</code></p>
        </div>
      </div>

      <div class="entries-section" *ngIf="previousEntries.length > 0">
        <h3>Previous Entries</h3>
        <div class="entries-list">
          <div *ngFor="let entry of previousEntries" class="entry-item">
            <div class="entry-header">
              <div class="entry-info">
                <p><strong>Type:</strong> {{ formatEntryType(entry.type) }}</p>
                <p><strong>Time:</strong> {{ entry.timestamp | date:'short' }}</p>
                <p><strong>ID:</strong> <code class="small-code">{{ entry.id }}</code></p>
                <p><strong>Content Hash:</strong> <code class="small-code">{{ entry.contentHash.value }}</code></p>
              </div>
              <div class="entry-actions">
                <button 
                  (click)="toggleEntryPreview(entry)" 
                  class="preview-entry-button"
                  [disabled]="getEntryPreview(entry.id)?.isLoading"
                >
                  {{ getEntryPreview(entry.id)?.isLoading ? 'Loading...' : (getEntryPreview(entry.id)?.previewData ? 'Hide Preview' : 'Show Preview') }}
                </button>
              </div>
            </div>
            
            <div *ngIf="getEntryPreview(entry.id)?.previewData" class="entry-preview-section">
              <div class="entry-preview-controls">
                <label>Preview as: </label>
                <select [(ngModel)]="getEntryPreview(entry.id)!.previewType" (change)="updateEntryPreview(entry)" class="preview-type-select">
                  <option value="text">Text</option>
                  <option value="json">JSON</option>
                  <option value="hex">Hex</option>
                  <option value="base64">Base64</option>
                  <option value="image">Image</option>
                </select>
                <span *ngIf="getEntryPreview(entry.id)?.detectedType" class="detected-type">(Detected: {{ getEntryPreview(entry.id)?.detectedType }})</span>
              </div>
              <div class="entry-preview" [ngClass]="'preview-' + getEntryPreview(entry.id)?.previewType">
                <pre *ngIf="getEntryPreview(entry.id)?.previewType === 'json'">{{ getEntryPreview(entry.id)?.previewData }}</pre>
                <code *ngIf="getEntryPreview(entry.id)?.previewType === 'hex' || getEntryPreview(entry.id)?.previewType === 'base64'">{{ getEntryPreview(entry.id)?.previewData }}</code>
                <p *ngIf="getEntryPreview(entry.id)?.previewType === 'text'">{{ getEntryPreview(entry.id)?.previewData }}</p>
                <img *ngIf="getEntryPreview(entry.id)?.previewType === 'image'" [src]="getEntryPreview(entry.id)?.previewData" alt="Preview" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .disot-entry {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .form-section {
      margin-bottom: 25px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .form-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
    }

    .content-info, .no-content {
      padding: 15px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .content-info p {
      margin: 5px 0;
    }

    .content-info code {
      background-color: #e9ecef;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
      word-break: break-all;
    }

    .no-content {
      color: #666;
      font-style: italic;
    }

    .type-select {
      width: 100%;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
    }

    .key-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .key-input {
      width: 100%;
      padding: 10px;
      font-family: monospace;
      font-size: 14px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
    }

    .generate-button {
      align-self: flex-start;
      padding: 8px 16px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .generate-button:hover:not(:disabled) {
      background-color: #5a6268;
    }

    .clear-button, .select-button {
      margin-top: 10px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .clear-button {
      background-color: #dc3545;
      color: white;
    }

    .clear-button:hover {
      background-color: #c82333;
    }

    .select-button {
      background-color: #007bff;
      color: white;
    }

    .select-button:hover {
      background-color: #0056b3;
    }

    .public-key-display {
      margin-top: 15px;
      padding: 10px;
      background-color: #e9ecef;
      border-radius: 4px;
    }

    .public-key-display p {
      margin: 0 0 5px 0;
    }

    .public-key-display code {
      display: block;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
    }

    .blog-input {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
    }

    .create-button {
      width: 100%;
      padding: 12px;
      font-size: 18px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .create-button:hover:not(:disabled) {
      background-color: #218838;
    }

    .create-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .error-message {
      margin-top: 15px;
      padding: 15px;
      background-color: #f8d7da;
      color: #721c24;
      border-radius: 4px;
    }

    .success-section {
      margin-top: 20px;
      padding: 20px;
      background-color: #d4edda;
      border-radius: 8px;
    }

    .success-section h3 {
      margin-top: 0;
      color: #155724;
    }

    .entry-details {
      background-color: #fff;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
    }

    .entry-details p {
      margin: 8px 0;
      word-break: break-all;
    }

    .entry-details code {
      background-color: #e9ecef;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
    }

    .entries-section {
      margin-top: 30px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .entries-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
    }

    .entries-list {
      display: grid;
      gap: 10px;
    }

    .entry-item {
      background-color: #fff;
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .entry-item p {
      margin: 5px 0;
      font-size: 14px;
    }

    .small-code {
      font-size: 11px !important;
      word-break: break-all;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 15px;
    }

    .entry-info {
      flex: 1;
    }

    .entry-info p {
      margin: 5px 0;
      font-size: 14px;
    }

    .entry-actions {
      flex-shrink: 0;
    }

    .preview-entry-button {
      padding: 6px 12px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }

    .preview-entry-button:hover:not(:disabled) {
      background-color: #5a6268;
    }

    .preview-entry-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .entry-preview-section {
      margin-top: 15px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .entry-preview-controls {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .entry-preview-controls .preview-type-select {
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .entry-preview-controls .detected-type {
      color: #666;
      font-style: italic;
      font-size: 12px;
    }

    .entry-preview {
      padding: 10px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 14px;
    }

    .entry-preview pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .entry-preview code {
      display: block;
      font-family: monospace;
      word-break: break-all;
    }

    .entry-preview img {
      max-width: 100%;
      height: auto;
    }

    .entry-preview.preview-hex code, 
    .entry-preview.preview-base64 code {
      font-size: 12px;
      line-height: 1.4;
    }
  `]
})
export class DisotEntryComponent implements OnInit {
  @Input() contentHash: ContentHash | null = null;
  @Output() entryCreated = new EventEmitter<DisotEntry>();

  selectedType = DisotEntryType.DOCUMENT;
  privateKey = '';
  publicKey = '';
  blogPostContent = '';
  isCreating = false;
  errorMessage = '';
  createdEntry: DisotEntry | null = null;
  previousEntries: DisotEntry[] = [];
  showContentModal = false;
  entryPreviews = new Map<string, {
    previewData: string | null;
    previewType: 'text' | 'json' | 'hex' | 'base64' | 'image' | null;
    detectedType?: string;
    isLoading?: boolean;
  }>();

  entryTypes = [
    DisotEntryType.BLOG_POST,
    DisotEntryType.DOCUMENT,
    DisotEntryType.IMAGE,
    DisotEntryType.SIGNATURE
  ];

  constructor(
    private disotService: DisotService,
    private signatureService: SignatureService,
    private casService: CasService
  ) {}

  ngOnInit(): void {
    this.loadPreviousEntries();
  }

  async generateKeyPair(): Promise<void> {
    try {
      const keyPair = await this.signatureService.generateKeyPair();
      this.privateKey = keyPair.privateKey;
      this.publicKey = keyPair.publicKey;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to generate key pair';
    }
  }

  async createEntry(): Promise<void> {
    if (!this.privateKey) {
      this.errorMessage = 'Please enter or generate a private key';
      return;
    }

    // For blog posts, we need to create the content first
    if (this.selectedType === DisotEntryType.BLOG_POST) {
      if (!this.blogPostContent.trim()) {
        this.errorMessage = 'Please enter blog post content';
        return;
      }
      // Blog posts don't need existing content, they create their own
    } else {
      // Other types need existing content
      if (!this.contentHash) {
        this.errorMessage = 'Please select content first';
        return;
      }
    }

    this.isCreating = true;
    this.errorMessage = '';

    try {
      let hashToUse = this.contentHash;
      
      // For blog posts, create the content first
      if (this.selectedType === DisotEntryType.BLOG_POST) {
        const blogData = {
          blogPost: this.blogPostContent
        };
        const jsonContent = JSON.stringify(blogData);
        const contentData = new TextEncoder().encode(jsonContent);
        
        // Store the blog post content
        hashToUse = await this.casService.store({ data: contentData });
      }

      if (!hashToUse) {
        throw new Error('No content hash available');
      }

      this.createdEntry = await this.disotService.createEntry(
        hashToUse,
        this.selectedType,
        this.privateKey
      );
      this.entryCreated.emit(this.createdEntry);
      
      // Reload previous entries
      await this.loadPreviousEntries();
    } catch (error) {
      this.errorMessage = `Failed to create entry: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.createdEntry = null;
    } finally {
      this.isCreating = false;
    }
  }

  formatEntryType(type: DisotEntryType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  clearContent(): void {
    this.contentHash = null;
  }

  selectContent(): void {
    // Show content selection modal
    this.showContentModal = true;
  }

  onContentSelected(hash: ContentHash): void {
    this.contentHash = hash;
    this.showContentModal = false;
  }

  async loadPreviousEntries(): Promise<void> {
    try {
      this.previousEntries = await this.disotService.listEntries();
    } catch (error) {
      console.error('Failed to load previous entries:', error);
    }
  }

  getEntryPreview(entryId: string) {
    return this.entryPreviews.get(entryId);
  }

  async toggleEntryPreview(entry: DisotEntry): Promise<void> {
    const preview = this.entryPreviews.get(entry.id);
    
    if (preview?.previewData) {
      // Hide preview
      this.entryPreviews.delete(entry.id);
    } else {
      // Load preview
      await this.loadEntryPreview(entry);
    }
  }

  async loadEntryPreview(entry: DisotEntry): Promise<void> {
    const preview = this.entryPreviews.get(entry.id) || {
      previewData: null,
      previewType: null,
      isLoading: false
    };

    if (preview.isLoading) return;
    
    preview.isLoading = true;
    this.entryPreviews.set(entry.id, preview);

    try {
      const content = await this.casService.retrieve(entry.contentHash);
      
      // Detect content type
      const detectedType = this.detectContentType(content.data);
      preview.detectedType = detectedType;
      
      // Set initial preview type based on detection
      preview.previewType = this.getInitialPreviewType(detectedType, content.data);
      
      // Generate preview based on type
      this.updateEntryPreviewData(entry.id, content.data);
    } catch (error) {
      console.error('Failed to preview entry content:', error);
      preview.previewData = 'Failed to load content';
      preview.previewType = 'text';
    } finally {
      preview.isLoading = false;
      this.entryPreviews.set(entry.id, preview);
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

  updateEntryPreview(entry: DisotEntry): void {
    const preview = this.entryPreviews.get(entry.id);
    if (!preview?.previewData) return;
    
    this.casService.retrieve(entry.contentHash).then(content => {
      this.updateEntryPreviewData(entry.id, content.data);
    }).catch(error => {
      console.error('Failed to update entry preview:', error);
    });
  }

  private updateEntryPreviewData(entryId: string, data: Uint8Array): void {
    const preview = this.entryPreviews.get(entryId);
    if (!preview) return;

    const maxSize = 1000;
    
    switch (preview.previewType) {
      case 'text':
        try {
          const text = new TextDecoder().decode(data);
          preview.previewData = text.length > maxSize 
            ? text.substring(0, maxSize) + '...' 
            : text;
        } catch {
          preview.previewData = 'Unable to decode as text';
        }
        break;
        
      case 'json':
        try {
          const text = new TextDecoder().decode(data);
          const json = JSON.parse(text);
          preview.previewData = JSON.stringify(json, null, 2);
          if (preview.previewData.length > maxSize) {
            preview.previewData = preview.previewData.substring(0, maxSize) + '...';
          }
        } catch {
          preview.previewData = 'Invalid JSON';
        }
        break;
        
      case 'hex':
        const hexBytes = Math.min(data.length, 256);
        preview.previewData = Array.from(data.slice(0, hexBytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
          .toUpperCase();
        if (data.length > hexBytes) {
          preview.previewData += ' ...';
        }
        break;
        
      case 'base64':
        const base64Bytes = Math.min(data.length, 1000);
        preview.previewData = btoa(String.fromCharCode(...data.slice(0, base64Bytes)));
        if (data.length > base64Bytes) {
          preview.previewData += '...';
        }
        break;
        
      case 'image':
        // Create data URL for image
        const blob = new Blob([data]);
        const reader = new FileReader();
        reader.onload = () => {
          preview.previewData = reader.result as string;
          this.entryPreviews.set(entryId, preview);
        };
        reader.readAsDataURL(blob);
        return; // Don't set the preview here, it will be set in the FileReader callback
    }
    
    this.entryPreviews.set(entryId, preview);
  }
}