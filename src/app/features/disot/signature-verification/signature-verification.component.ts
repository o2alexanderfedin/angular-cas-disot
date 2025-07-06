import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { DisotService } from '../../../core/services/disot.service';
import { DisotEntry } from '../../../core/domain/interfaces/disot.interface';

@Component({
  selector: 'app-signature-verification',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule],
  template: `
    <div class="signature-verification">
      <h2>Signature Verification</h2>
      
      <div class="lookup-section">
        <h3>Verify by Entry ID</h3>
        <div class="id-input-group">
          <input 
            type="text" 
            #entryIdInput
            placeholder="Enter DISOT entry ID..."
            class="id-input"
            [disabled]="isVerifying"
          />
          <button 
            (click)="verifyById(entryIdInput.value)"
            [disabled]="isVerifying"
            class="lookup-button"
          >
            Load & Verify
          </button>
        </div>
      </div>

      <div *ngIf="disotEntry" class="entry-section">
        <h3>Entry Details</h3>
        <div class="entry-info">
          <div class="info-row">
            <span class="label">Entry ID:</span>
            <code>{{ disotEntry.id }}</code>
          </div>
          <div class="info-row">
            <span class="label">Type:</span>
            <span>{{ formatEntryType(disotEntry.type) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Timestamp:</span>
            <span>{{ formatTimestamp(disotEntry.timestamp) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Content Hash:</span>
            <code>{{ disotEntry.contentHash.value }}</code>
          </div>
          <div class="info-row">
            <span class="label">Public Key:</span>
            <code>{{ disotEntry.signature.publicKey }}</code>
          </div>
          <div class="info-row">
            <span class="label">Signature:</span>
            <code>{{ disotEntry.signature.value }}</code>
          </div>
        </div>

        <button 
          (click)="verifySignature()"
          [disabled]="isVerifying"
          class="verify-button"
        >
          {{ isVerifying ? 'Verifying...' : 'Verify Signature' }}
        </button>
      </div>

      <div *ngIf="!disotEntry && !errorMessage" class="no-entry">
        <p>No entry loaded. Enter an entry ID above or select an entry from the list.</p>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div *ngIf="verificationResult !== null" class="verification-result" 
           [class.valid]="verificationResult" 
           [class.invalid]="!verificationResult">
        <div class="result-icon">
          <span *ngIf="verificationResult">✓</span>
          <span *ngIf="!verificationResult">✗</span>
        </div>
        <div class="result-text">
          <h3>{{ verificationResult ? 'Signature Valid' : 'Signature Invalid' }}</h3>
          <p>{{ verificationResult 
            ? 'The signature has been successfully verified.' 
            : 'The signature verification failed. The entry may have been tampered with.' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .signature-verification {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .lookup-section, .entry-section {
      margin-bottom: 25px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .lookup-section h3, .entry-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
    }

    .id-input-group {
      display: flex;
      gap: 10px;
    }

    .id-input {
      flex: 1;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .lookup-button {
      padding: 10px 20px;
      background-color: #17a2b8;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
    }

    .lookup-button:hover:not(:disabled) {
      background-color: #138496;
    }

    .entry-info {
      background-color: white;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      margin-bottom: 10px;
      align-items: flex-start;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: bold;
      min-width: 120px;
      margin-right: 10px;
    }

    .info-row code {
      background-color: #e9ecef;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }

    .verify-button {
      width: 100%;
      padding: 12px;
      font-size: 18px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .verify-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .verify-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .no-entry {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
    }

    .error-message {
      padding: 15px;
      background-color: #f8d7da;
      color: #721c24;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .verification-result {
      padding: 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .verification-result.valid {
      background-color: #d4edda;
      color: #155724;
    }

    .verification-result.invalid {
      background-color: #f8d7da;
      color: #721c24;
    }

    .result-icon {
      font-size: 48px;
      font-weight: bold;
    }

    .result-text h3 {
      margin: 0 0 10px 0;
    }

    .result-text p {
      margin: 0;
    }
  `]
})
export class SignatureVerificationComponent {
  @Input() disotEntry: DisotEntry | null = null;

  isVerifying = false;
  verificationResult: boolean | null = null;
  errorMessage = '';

  constructor(private disotService: DisotService) {}

  async verifyById(entryId: string): Promise<void> {
    if (!entryId.trim()) {
      this.errorMessage = 'Please enter an entry ID';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.verificationResult = null;

    try {
      this.disotEntry = await this.disotService.getEntry(entryId);
      await this.verifySignature();
    } catch (error) {
      this.errorMessage = `Failed to load entry: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.disotEntry = null;
    } finally {
      this.isVerifying = false;
    }
  }

  async verifySignature(): Promise<void> {
    if (!this.disotEntry) {
      this.errorMessage = 'No entry to verify';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.verificationResult = null;

    try {
      this.verificationResult = await this.disotService.verifyEntry(this.disotEntry);
    } catch (error) {
      this.errorMessage = `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.verificationResult = null;
    } finally {
      this.isVerifying = false;
    }
  }

  formatEntryType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatTimestamp(date: Date): string {
    return new Date(date).toLocaleString();
  }
}