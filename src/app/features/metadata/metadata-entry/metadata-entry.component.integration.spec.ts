import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { MetadataEntryComponent } from './metadata-entry.component';
import { MetadataService } from '../../../core/services/metadata/metadata.service';
import { SignatureService } from '../../../core/services/signature.service';
import { HashSelectionService } from '../../../core/services/hash-selection.service';
import { AuthorRole } from '../../../core/domain/interfaces/metadata-entry';
import { DisotEntry, DisotEntryType } from '../../../core/domain/interfaces/disot.interface';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';

describe('MetadataEntryComponent Integration Tests', () => {
  let component: MetadataEntryComponent;
  let fixture: ComponentFixture<MetadataEntryComponent>;
  let metadataService: jasmine.SpyObj<MetadataService>;
  let signatureService: jasmine.SpyObj<SignatureService>;
  let hashSelectionService: jasmine.SpyObj<HashSelectionService>;
  let router: Router;

  beforeEach(async () => {
    const metadataSpy = jasmine.createSpyObj('MetadataService', ['createMetadataEntry']);
    const signatureSpy = jasmine.createSpyObj('SignatureService', ['generateKeyPair']);
    const hashSpy = jasmine.createSpyObj('HashSelectionService', [
      'getAvailableHashes',
      'searchHashes',
      'formatFileSize',
      'getPreviewData'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        MetadataEntryComponent,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: MetadataService, useValue: metadataSpy },
        { provide: SignatureService, useValue: signatureSpy },
        { provide: HashSelectionService, useValue: hashSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetadataEntryComponent);
    component = fixture.componentInstance;
    metadataService = TestBed.inject(MetadataService) as jasmine.SpyObj<MetadataService>;
    signatureService = TestBed.inject(SignatureService) as jasmine.SpyObj<SignatureService>;
    hashSelectionService = TestBed.inject(HashSelectionService) as jasmine.SpyObj<HashSelectionService>;
    router = TestBed.inject(Router);
    
    // Setup default mock responses
    hashSelectionService.searchHashes.and.returnValue(Promise.resolve([]));
    hashSelectionService.formatFileSize.and.callFake((size: number) => `${size} bytes`);
    
    fixture.detectChanges();
  });

  it('should integrate hash selection with form submission workflow', async () => {
    // Arrange - Setup a complete workflow
    const mockHash: ContentHash = {
      algorithm: 'sha256',
      value: 'QmTestHash123456789'
    };

    const mockKeyPair = {
      publicKey: 'pubkey123',
      privateKey: 'privkey123'
    };

    const mockEntry: DisotEntry = {
      id: 'entry-123',
      contentHash: { algorithm: 'sha256', value: 'hash123' },
      type: DisotEntryType.METADATA,
      signature: { 
        value: 'sig123',
        algorithm: 'secp256k1',
        publicKey: 'pubkey123'
      },
      timestamp: new Date(),
      metadata: {}
    };

    signatureService.generateKeyPair.and.returnValue(Promise.resolve(mockKeyPair));
    metadataService.createMetadataEntry.and.returnValue(Promise.resolve(mockEntry));
    spyOn(router, 'navigate');

    // Act 1: Generate key pair
    await component.generateKeyPair();
    expect(component.keyPair).toEqual(mockKeyPair);

    // Act 2: Open hash selector and select hash
    component.openHashSelector(0);
    expect(component.showHashSelectionModal).toBe(true);
    expect(component.currentReferenceIndex).toBe(0);

    component.onHashSelected(mockHash);
    expect(component.references.at(0).get('hash')?.value).toBe('QmTestHash123456789');
    expect(component.showHashSelectionModal).toBe(false);

    // Act 3: Complete form and submit
    component.references.at(0).patchValue({
      mimeType: 'text/plain',
      mimeTypeSource: 'manual',
      relationship: 'main'
    });

    component.authors.at(0).patchValue({
      authorHash: 'QmAuthor456',
      role: AuthorRole.CREATOR
    });

    await component.onSubmit();

    // Assert
    expect(metadataService.createMetadataEntry).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/metadata/view', 'entry-123']);
  });

  it('should handle multiple reference hash selections correctly', async () => {
    // Arrange
    const mockHash1: ContentHash = {
      algorithm: 'sha256',
      value: 'QmFirstHash123'
    };
    const mockHash2: ContentHash = {
      algorithm: 'sha256',
      value: 'QmSecondHash456'
    };

    // Add a second reference
    component.addReference();
    expect(component.references.length).toBe(2);

    // Act 1: Select hash for first reference
    component.openHashSelector(0);
    component.onHashSelected(mockHash1);
    
    // Act 2: Select hash for second reference
    component.openHashSelector(1);
    component.onHashSelected(mockHash2);

    // Assert
    expect(component.references.at(0).get('hash')?.value).toBe('QmFirstHash123');
    expect(component.references.at(1).get('hash')?.value).toBe('QmSecondHash456');
    expect(component.showHashSelectionModal).toBe(false);
    expect(component.currentReferenceIndex).toBe(-1);
  });

  it('should preserve existing form data when using hash selection', async () => {
    // Arrange
    const existingData = {
      mimeType: 'application/json',
      mimeTypeSource: 'detected',
      relationship: 'attachment'
    };

    component.references.at(0).patchValue(existingData);
    
    const mockHash: ContentHash = {
      algorithm: 'sha256',
      value: 'QmNewHash789'
    };

    // Act
    component.openHashSelector(0);
    component.onHashSelected(mockHash);

    // Assert - Hash should be updated, other fields preserved
    const referenceControl = component.references.at(0);
    expect(referenceControl.get('hash')?.value).toBe('QmNewHash789');
    expect(referenceControl.get('mimeType')?.value).toBe('application/json');
    expect(referenceControl.get('mimeTypeSource')?.value).toBe('detected');
    expect(referenceControl.get('relationship')?.value).toBe('attachment');
  });

  it('should handle hash selection modal errors gracefully', async () => {
    // Arrange
    hashSelectionService.searchHashes.and.returnValue(
      Promise.reject(new Error('Service unavailable'))
    );

    // Act
    component.openHashSelector(0);
    expect(component.showHashSelectionModal).toBe(true);

    // The modal should handle the error internally
    // and not affect the main component's state

    component.closeHashSelector();

    // Assert
    expect(component.showHashSelectionModal).toBe(false);
    expect(component.currentReferenceIndex).toBe(-1);
    expect(component.error).toBe(''); // Main component error should be empty
  });

  it('should maintain form validation during hash selection workflow', async () => {
    // Arrange
    const mockHash: ContentHash = {
      algorithm: 'sha256',
      value: 'QmValidHash123'
    };

    // Act 1: Form should be invalid initially (missing required fields)
    expect(component.metadataForm.valid).toBe(false);

    // Act 2: Select hash
    component.openHashSelector(0);
    component.onHashSelected(mockHash);

    // Act 3: Form should still be invalid (missing MIME type)
    expect(component.metadataForm.valid).toBe(false);

    // Act 4: Complete required fields
    component.references.at(0).patchValue({
      mimeType: 'text/plain',
      mimeTypeSource: 'manual'
    });

    component.authors.at(0).patchValue({
      authorHash: 'QmAuthor456',
      role: AuthorRole.CREATOR
    });

    // Assert
    expect(component.metadataForm.valid).toBe(true);
  });

  it('should cancel hash selection without affecting form', async () => {
    // Arrange
    const originalHash = 'QmOriginalHash';
    component.references.at(0).patchValue({ hash: originalHash });

    // Act
    component.openHashSelector(0);
    expect(component.showHashSelectionModal).toBe(true);

    // Close without selecting
    component.closeHashSelector();

    // Assert
    expect(component.showHashSelectionModal).toBe(false);
    expect(component.currentReferenceIndex).toBe(-1);
    expect(component.references.at(0).get('hash')?.value).toBe(originalHash);
  });

  it('should handle rapid hash selection operations', async () => {
    // Arrange
    const mockHash1: ContentHash = { algorithm: 'sha256', value: 'QmHash1' };
    const mockHash2: ContentHash = { algorithm: 'sha256', value: 'QmHash2' };

    // Act - Rapid operations
    component.openHashSelector(0);
    component.onHashSelected(mockHash1);
    
    // Immediately open for same reference
    component.openHashSelector(0);
    component.onHashSelected(mockHash2);

    // Assert - Latest selection should win
    expect(component.references.at(0).get('hash')?.value).toBe('QmHash2');
    expect(component.showHashSelectionModal).toBe(false);
  });
});