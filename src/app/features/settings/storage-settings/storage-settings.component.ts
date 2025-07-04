import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { StorageType, STORAGE_TYPE } from '../../../core/services/storage-provider.factory';
import { Router } from '@angular/router';

@Component({
  selector: 'app-storage-settings',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule],
  template: `
    <div class="storage-settings">
      <h2>Storage Settings</h2>
      
      <div class="settings-section">
        <h3>Storage Provider</h3>
        <p class="description">
          Choose how your content is stored. In-memory storage is faster but data is lost when you close the browser. 
          IndexedDB provides persistent storage across browser sessions.
        </p>
        
        <div class="storage-options">
          <label class="storage-option">
            <input 
              type="radio" 
              name="storageType" 
              [value]="StorageType.IN_MEMORY"
              [(ngModel)]="selectedStorageType"
              (change)="onStorageTypeChange()"
            />
            <div class="option-content">
              <strong>In-Memory Storage</strong>
              <p>Fast, temporary storage. Data is lost when browser closes.</p>
            </div>
          </label>
          
          <label class="storage-option" [class.disabled]="!indexedDbAvailable">
            <input 
              type="radio" 
              name="storageType" 
              [value]="StorageType.INDEXED_DB"
              [(ngModel)]="selectedStorageType"
              (change)="onStorageTypeChange()"
              [disabled]="!indexedDbAvailable"
            />
            <div class="option-content">
              <strong>IndexedDB Storage</strong>
              <p>Persistent storage. Data is saved across browser sessions.</p>
              <p *ngIf="!indexedDbAvailable" class="warning">
                IndexedDB is not available in your browser.
              </p>
            </div>
          </label>
        </div>
        
        <div *ngIf="storageChanged" class="info-message">
          <p>
            <strong>Important:</strong> Changing storage type will require a page reload. 
            Your current in-memory data will be lost unless you're switching to IndexedDB.
          </p>
          <button (click)="applyChanges()" class="apply-button">
            Apply Changes & Reload
          </button>
          <button (click)="cancelChanges()" class="cancel-button">
            Cancel
          </button>
        </div>
      </div>
      
      <div class="settings-section" *ngIf="currentStorageType === StorageType.INDEXED_DB">
        <h3>Storage Management</h3>
        <div class="storage-info">
          <p>Current storage provider: <strong>IndexedDB</strong></p>
          <button (click)="clearStorage()" class="danger-button">
            Clear All Stored Data
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .storage-settings {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .settings-section {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .settings-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
    }

    .description {
      color: #666;
      margin-bottom: 20px;
    }

    .storage-options {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .storage-option {
      display: flex;
      align-items: flex-start;
      padding: 15px;
      background-color: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .storage-option:hover:not(.disabled) {
      border-color: #3498db;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .storage-option.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .storage-option input[type="radio"] {
      margin-right: 15px;
      margin-top: 5px;
    }

    .option-content {
      flex: 1;
    }

    .option-content strong {
      display: block;
      margin-bottom: 5px;
      color: #333;
    }

    .option-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .warning {
      color: #e74c3c !important;
      font-style: italic;
      margin-top: 5px !important;
    }

    .info-message {
      margin-top: 20px;
      padding: 15px;
      background-color: #e8f4fd;
      border: 1px solid #3498db;
      border-radius: 4px;
    }

    .info-message p {
      margin: 0 0 15px 0;
      color: #2c3e50;
    }

    .apply-button, .cancel-button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }

    .apply-button {
      background-color: #3498db;
      color: white;
    }

    .apply-button:hover {
      background-color: #2980b9;
    }

    .cancel-button {
      background-color: #95a5a6;
      color: white;
    }

    .cancel-button:hover {
      background-color: #7f8c8d;
    }

    .storage-info {
      background-color: white;
      padding: 15px;
      border-radius: 4px;
    }

    .storage-info p {
      margin: 0 0 15px 0;
    }

    .danger-button {
      padding: 10px 20px;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .danger-button:hover {
      background-color: #c0392b;
    }
  `]
})
export class StorageSettingsComponent implements OnInit {
  StorageType = StorageType;
  selectedStorageType: StorageType;
  currentStorageType: StorageType;
  indexedDbAvailable = false;
  storageChanged = false;

  constructor(
    @Inject(STORAGE_TYPE) private storageType: StorageType,
    private router: Router
  ) {
    this.currentStorageType = this.storageType;
    this.selectedStorageType = this.storageType;
  }

  ngOnInit() {
    this.checkIndexedDbAvailability();
  }

  checkIndexedDbAvailability() {
    this.indexedDbAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
  }

  onStorageTypeChange() {
    this.storageChanged = this.selectedStorageType !== this.currentStorageType;
  }

  applyChanges() {
    if (this.selectedStorageType !== this.currentStorageType) {
      // Save the preference
      localStorage.setItem('cas-storage-type', this.selectedStorageType);
      
      // Reload the page to apply changes
      this.reloadPage();
    }
  }

  reloadPage() {
    window.location.reload();
  }

  cancelChanges() {
    this.selectedStorageType = this.currentStorageType;
    this.storageChanged = false;
  }

  async clearStorage() {
    if (confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      try {
        if (this.currentStorageType === StorageType.INDEXED_DB) {
          // Clear IndexedDB
          await indexedDB.deleteDatabase('cas-storage');
          alert('Storage cleared successfully. The page will reload.');
          this.reloadPage();
        }
      } catch (error) {
        console.error('Error clearing storage:', error);
        alert('Failed to clear storage. Please try again.');
      }
    }
  }
}