import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MetadataService } from '../../../core/services/metadata/metadata.service';
import { SignatureService } from '../../../core/services/signature.service';
import { createMetadataContent, AuthorRole } from '../../../core/domain/interfaces/metadata-entry';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';
import { HashSelectionModalComponent } from '../../../shared/components/hash-selection-modal/hash-selection-modal.component';

@Component({
  selector: 'app-metadata-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HashSelectionModalComponent],
  templateUrl: './metadata-entry.component.html'
})
export class MetadataEntryComponent implements OnInit {
  metadataForm!: FormGroup;
  keyPair: { publicKey: string; privateKey: string } | null = null;
  error: string = '';
  submitting = false;
  showHashSelectionModal = false;
  currentReferenceIndex = -1;

  authorRoles = Object.values(AuthorRole);

  constructor(
    private fb: FormBuilder,
    private metadataService: MetadataService,
    private signatureService: SignatureService,
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

  onHashSelected(hash: ContentHash) {
    if (this.currentReferenceIndex >= 0) {
      const referenceControl = this.references.at(this.currentReferenceIndex);
      referenceControl.patchValue({
        hash: hash.value
      });
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