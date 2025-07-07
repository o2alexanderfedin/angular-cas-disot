import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MetadataService } from '../../../core/services/metadata/metadata.service';
import { SignatureService } from '../../../core/services/signature.service';
import { CasService } from '../../../core/services/cas.service';
import { ContentPreviewService } from '../../../core/services/content-preview.service';
import { createMetadataContent, AuthorRole } from '../../../core/domain/interfaces/metadata-entry';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';
import { ContentSelectionModalComponent } from '../../../shared/components/content-selection-modal/content-selection-modal.component';

@Component({
  selector: 'app-metadata-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentSelectionModalComponent],
  templateUrl: './metadata-entry.component.html'
})
export class MetadataEntryComponent implements OnInit {
  metadataForm!: FormGroup;
  keyPair: { publicKey: string; privateKey: string } | null = null;
  error: string = '';
  submitting = false;
  showHashSelectionModal = false;
  showAuthorHashModal = false;
  showPreviousVersionModal = false;
  currentReferenceIndex = -1;
  currentAuthorIndex = -1;

  authorRoles = Object.values(AuthorRole);

  constructor(
    private fb: FormBuilder,
    private metadataService: MetadataService,
    private signatureService: SignatureService,
    private casService: CasService,
    private contentPreviewService: ContentPreviewService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.metadataForm = this.fb.group({
      references: this.fb.array([this.createReferenceGroup()]),
      authors: this.fb.array([this.createAuthorGroup()]),
      version: this.fb.group({
        version: ['1.0.0', Validators.required],
        previousVersion: [''],
        changeDescription: ['']
      })
    });
  }

  private createReferenceGroup(): FormGroup {
    return this.fb.group({
      hash: ['', Validators.required],
      mimeType: ['', Validators.required],
      mimeTypeSource: ['manual', Validators.required],
      relationship: ['']
    });
  }

  private createAuthorGroup(): FormGroup {
    return this.fb.group({
      authorHash: ['', Validators.required],
      role: [AuthorRole.CREATOR, Validators.required]
    });
  }

  get references(): FormArray {
    return this.metadataForm.get('references') as FormArray;
  }

  get authors(): FormArray {
    return this.metadataForm.get('authors') as FormArray;
  }

  addReference() {
    this.references.push(this.createReferenceGroup());
  }

  removeReference(index: number) {
    this.references.removeAt(index);
  }

  addAuthor() {
    this.authors.push(this.createAuthorGroup());
  }

  removeAuthor(index: number) {
    this.authors.removeAt(index);
  }

  async generateKeyPair() {
    try {
      this.keyPair = await this.signatureService.generateKeyPair();
    } catch (error) {
      this.error = 'Failed to generate key pair';
    }
  }

  openHashSelector(referenceIndex: number) {
    this.currentReferenceIndex = referenceIndex;
    this.showHashSelectionModal = true;
  }

  closeHashSelector() {
    this.showHashSelectionModal = false;
    this.currentReferenceIndex = -1;
  }

  openAuthorHashSelector(authorIndex: number) {
    this.currentAuthorIndex = authorIndex;
    this.showAuthorHashModal = true;
  }

  closeAuthorHashSelector() {
    this.showAuthorHashModal = false;
    this.currentAuthorIndex = -1;
  }

  onAuthorHashSelected(hash: ContentHash) {
    if (this.currentAuthorIndex >= 0) {
      const authorControl = this.authors.at(this.currentAuthorIndex);
      authorControl.patchValue({
        authorHash: hash.value
      });
    }
    this.closeAuthorHashSelector();
  }

  openPreviousVersionSelector() {
    this.showPreviousVersionModal = true;
  }

  closePreviousVersionSelector() {
    this.showPreviousVersionModal = false;
  }

  onPreviousVersionSelected(hash: ContentHash) {
    const versionControl = this.metadataForm.get('version');
    if (versionControl) {
      versionControl.patchValue({
        previousVersion: hash.value
      });
    }
    this.closePreviousVersionSelector();
  }

  async onHashSelected(hash: ContentHash) {
    if (this.currentReferenceIndex >= 0) {
      const referenceControl = this.references.at(this.currentReferenceIndex);
      referenceControl.patchValue({
        hash: hash.value
      });
      
      // Try to detect MIME type from the selected content
      try {
        const content = await this.casService.retrieve(hash);
        const detectedType = this.contentPreviewService.detectContentType(content.data);
        
        // Map detected content types to standard MIME types
        const mimeTypeMap: { [key: string]: string } = {
          'image/png': 'image/png',
          'image/jpeg': 'image/jpeg',
          'image/gif': 'image/gif',
          'application/pdf': 'application/pdf',
          'application/json': 'application/json',
          'text/plain': 'text/plain',
          'application/octet-stream': 'application/octet-stream'
        };
        
        const mimeType = mimeTypeMap[detectedType] || 'application/octet-stream';
        
        referenceControl.patchValue({
          mimeType: mimeType,
          mimeTypeSource: 'detected'
        });
      } catch (error) {
        console.error('Failed to detect MIME type:', error);
        // Keep manual entry if detection fails
      }
    }
    this.closeHashSelector();
  }

  async onSubmit() {
    if (!this.metadataForm.valid) {
      return;
    }

    if (!this.keyPair) {
      this.error = 'Please generate a key pair first';
      return;
    }

    this.submitting = true;
    this.error = '';

    try {
      const formValue = this.metadataForm.value;
      const metadata = createMetadataContent({
        references: formValue.references,
        authors: formValue.authors,
        version: formValue.version.version,
        previousVersion: formValue.version.previousVersion || undefined,
        changeDescription: formValue.version.changeDescription || undefined
      });

      const entry = await this.metadataService.createMetadataEntry(
        metadata,
        this.keyPair.privateKey
      );

      await this.router.navigate(['/metadata/view', entry.id]);
    } catch (error: any) {
      this.error = error.message || 'Failed to create metadata entry';
    } finally {
      this.submitting = false;
    }
  }
}