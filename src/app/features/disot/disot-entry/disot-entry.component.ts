import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { DisotService } from '../../../core/services/disot.service';
import { SignatureService } from '../../../core/services/signature.service';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';
import { DisotEntry, DisotEntryType } from '../../../core/domain/interfaces/disot.interface';

@Component({
  selector: 'app-disot-entry',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule],
  template: `
    <div class="disot-entry">
      <h2>Create DISOT Entry</h2>
      
      <div class="form-section">
        <h3>Content Information</h3>
        <div *ngIf="contentHash" class="content-info">
          <p><strong>Algorithm:</strong> {{ contentHash.algorithm | uppercase }}</p>
          <p><strong>Hash:</strong> <code>{{ contentHash.value }}</code></p>
        </div>
        <div *ngIf="!contentHash" class="no-content">
          <p>No content selected. Please select content from the content list.</p>
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
        </div>
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
  `]
})
export class DisotEntryComponent {
  @Input() contentHash: ContentHash | null = null;
  @Output() entryCreated = new EventEmitter<DisotEntry>();

  selectedType = DisotEntryType.DOCUMENT;
  privateKey = '';
  isCreating = false;
  errorMessage = '';
  createdEntry: DisotEntry | null = null;

  entryTypes = [
    DisotEntryType.BLOG_POST,
    DisotEntryType.DOCUMENT,
    DisotEntryType.IMAGE,
    DisotEntryType.SIGNATURE
  ];

  constructor(
    private disotService: DisotService,
    private signatureService: SignatureService
  ) {}

  async generateKeyPair(): Promise<void> {
    try {
      const keyPair = await this.signatureService.generateKeyPair();
      this.privateKey = keyPair.privateKey;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to generate key pair';
    }
  }

  async createEntry(): Promise<void> {
    if (!this.contentHash) {
      this.errorMessage = 'Please select content first';
      return;
    }

    if (!this.privateKey) {
      this.errorMessage = 'Please enter or generate a private key';
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';

    try {
      this.createdEntry = await this.disotService.createEntry(
        this.contentHash,
        this.selectedType,
        this.privateKey
      );
      this.entryCreated.emit(this.createdEntry);
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
}