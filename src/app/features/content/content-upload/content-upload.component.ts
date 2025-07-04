import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared-module';
import { CasService } from '../../../core/services/cas.service';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';

@Component({
  selector: 'app-content-upload',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <div class="content-upload">
      <h2>Upload Content to CAS</h2>
      
      <div class="upload-area">
        <input 
          type="file" 
          #fileInput
          (change)="onFileSelected($event)"
          [disabled]="isUploading"
          class="file-input"
        />
        
        <div *ngIf="selectedFile" class="file-info">
          <p>Selected: {{ selectedFile.name }}</p>
          <p>Size: {{ formatFileSize(selectedFile.size) }}</p>
          <p>Type: {{ selectedFile.type || 'Unknown' }}</p>
        </div>

        <button 
          (click)="uploadFile()"
          [disabled]="!selectedFile || isUploading"
          class="upload-button"
        >
          {{ isUploading ? 'Uploading...' : 'Upload to CAS' }}
        </button>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div *ngIf="uploadedHash" class="success-message">
          <h3>Content Stored Successfully!</h3>
          <p>Algorithm: {{ uploadedHash.algorithm }}</p>
          <p>Hash: <code>{{ uploadedHash.value }}</code></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .content-upload {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      background-color: #f9f9f9;
    }

    .file-input {
      margin-bottom: 20px;
    }

    .file-info {
      margin: 20px 0;
      padding: 15px;
      background-color: #e9ecef;
      border-radius: 4px;
      text-align: left;
    }

    .file-info p {
      margin: 5px 0;
    }

    .upload-button {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }

    .upload-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .error-message {
      color: #dc3545;
      margin-top: 15px;
      padding: 10px;
      background-color: #f8d7da;
      border-radius: 4px;
    }

    .success-message {
      color: #155724;
      margin-top: 15px;
      padding: 15px;
      background-color: #d4edda;
      border-radius: 4px;
      text-align: left;
    }

    .success-message code {
      background-color: #e9ecef;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
      word-break: break-all;
    }
  `]
})
export class ContentUploadComponent {
  @Output() contentStored = new EventEmitter<ContentHash>();

  selectedFile: File | null = null;
  uploadedHash: ContentHash | null = null;
  isUploading = false;
  errorMessage = '';

  constructor(private casService: CasService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.errorMessage = '';
      this.uploadedHash = null;
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    try {
      const fileData = await this.readFileAsArrayBuffer(this.selectedFile);
      const content = { data: new Uint8Array(fileData) };
      
      this.uploadedHash = await this.casService.store(content);
      this.contentStored.emit(this.uploadedHash);
    } catch (error) {
      this.errorMessage = `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      this.isUploading = false;
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}