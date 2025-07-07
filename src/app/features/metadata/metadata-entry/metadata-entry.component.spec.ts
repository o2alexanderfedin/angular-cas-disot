import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { MetadataEntryComponent } from './metadata-entry.component';
import { MetadataService } from '../../../core/services/metadata/metadata.service';
import { SignatureService } from '../../../core/services/signature.service';
import { CasService } from '../../../core/services/cas.service';
import { ContentPreviewService } from '../../../core/services/content-preview.service';
import { AuthorRole } from '../../../core/domain/interfaces/metadata-entry';
import { DisotEntry, DisotEntryType } from '../../../core/domain/interfaces/disot.interface';
import { ContentHash, Content } from '../../../core/domain/interfaces/content.interface';

describe('MetadataEntryComponent', () => {
  let component: MetadataEntryComponent;
  let fixture: ComponentFixture<MetadataEntryComponent>;
  let metadataService: jasmine.SpyObj<MetadataService>;
  let signatureService: jasmine.SpyObj<SignatureService>;
  let casService: jasmine.SpyObj<CasService>;
  let contentPreviewService: jasmine.SpyObj<ContentPreviewService>;
  let router: Router;

  beforeEach(async () => {
    const metadataSpy = jasmine.createSpyObj('MetadataService', ['createMetadataEntry']);
    const signatureSpy = jasmine.createSpyObj('SignatureService', ['generateKeyPair']);
    const casSpy = jasmine.createSpyObj('CasService', ['retrieve']);
    const previewSpy = jasmine.createSpyObj('ContentPreviewService', ['detectContentType']);

    await TestBed.configureTestingModule({
      imports: [
        MetadataEntryComponent,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: MetadataService, useValue: metadataSpy },
        { provide: SignatureService, useValue: signatureSpy },
        { provide: CasService, useValue: casSpy },
        { provide: ContentPreviewService, useValue: previewSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetadataEntryComponent);
    component = fixture.componentInstance;
    metadataService = TestBed.inject(MetadataService) as jasmine.SpyObj<MetadataService>;
    signatureService = TestBed.inject(SignatureService) as jasmine.SpyObj<SignatureService>;
    casService = TestBed.inject(CasService) as jasmine.SpyObj<CasService>;
    contentPreviewService = TestBed.inject(ContentPreviewService) as jasmine.SpyObj<ContentPreviewService>;
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.metadataForm).toBeDefined();
    expect(component.metadataForm.get('version')?.value).toEqual({
      version: '1.0.0',
      previousVersion: '',
      changeDescription: ''
    });
  });

  it('should have at least one reference field', () => {
    expect(component.references.length).toBe(1);
  });

  it('should have at least one author field', () => {
    expect(component.authors.length).toBe(1);
  });

  it('should add new reference field', () => {
    const initialLength = component.references.length;
    component.addReference();
    expect(component.references.length).toBe(initialLength + 1);
  });

  it('should add new author field', () => {
    const initialLength = component.authors.length;
    component.addAuthor();
    expect(component.authors.length).toBe(initialLength + 1);
  });

  it('should remove reference field', () => {
    component.addReference(); // Ensure we have at least 2
    const initialLength = component.references.length;
    component.removeReference(0);
    expect(component.references.length).toBe(initialLength - 1);
  });

  it('should remove author field', () => {
    component.addAuthor(); // Ensure we have at least 2
    const initialLength = component.authors.length;
    component.removeAuthor(0);
    expect(component.authors.length).toBe(initialLength - 1);
  });

  it('should generate key pair when requested', async () => {
    const mockKeyPair = {
      publicKey: 'pubkey123',
      privateKey: 'privkey123'
    };
    signatureService.generateKeyPair.and.returnValue(Promise.resolve(mockKeyPair));

    await component.generateKeyPair();

    expect(signatureService.generateKeyPair).toHaveBeenCalled();
    expect(component.keyPair).toEqual(mockKeyPair);
  });

  it('should submit form with valid data', async () => {
    // Setup form data
    component.references.at(0).patchValue({
      hash: 'QmTest123',
      mimeType: 'text/plain',
      mimeTypeSource: 'manual',
      relationship: 'main'
    });

    component.authors.at(0).patchValue({
      authorHash: 'QmAuthor456',
      role: AuthorRole.CREATOR
    });

    component.keyPair = {
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

    metadataService.createMetadataEntry.and.returnValue(Promise.resolve(mockEntry));
    spyOn(router, 'navigate');

    await component.onSubmit();

    expect(metadataService.createMetadataEntry).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/metadata/view', 'entry-123']);
  });

  it('should not submit if form is invalid', async () => {
    // Leave form empty/invalid
    component.references.at(0).patchValue({
      hash: '', // Required field empty
      mimeType: 'text/plain',
      mimeTypeSource: 'manual'
    });

    await component.onSubmit();

    expect(metadataService.createMetadataEntry).not.toHaveBeenCalled();
  });

  it('should not submit without key pair', async () => {
    // Setup valid form
    component.references.at(0).patchValue({
      hash: 'QmTest123',
      mimeType: 'text/plain',
      mimeTypeSource: 'manual'
    });

    component.authors.at(0).patchValue({
      authorHash: 'QmAuthor456',
      role: AuthorRole.CREATOR
    });

    // No key pair set
    component.keyPair = null;

    await component.onSubmit();

    expect(metadataService.createMetadataEntry).not.toHaveBeenCalled();
  });

  it('should display error message on submission failure', async () => {
    // Setup valid form and key pair
    component.references.at(0).patchValue({
      hash: 'QmTest123',
      mimeType: 'text/plain',
      mimeTypeSource: 'manual'
    });

    component.authors.at(0).patchValue({
      authorHash: 'QmAuthor456',
      role: AuthorRole.CREATOR
    });

    component.keyPair = {
      publicKey: 'pubkey123',
      privateKey: 'privkey123'
    };

    metadataService.createMetadataEntry.and.returnValue(
      Promise.reject(new Error('Creation failed'))
    );

    await component.onSubmit();

    expect(component.error).toBe('Creation failed');
  });

  describe('Hash Selection', () => {
    it('should open hash selection modal', () => {
      // Act
      component.openHashSelector(0);

      // Assert
      expect(component.showHashSelectionModal).toBe(true);
      expect(component.currentReferenceIndex).toBe(0);
    });

    it('should close hash selection modal', () => {
      // Arrange
      component.showHashSelectionModal = true;
      component.currentReferenceIndex = 0;

      // Act
      component.closeHashSelector();

      // Assert
      expect(component.showHashSelectionModal).toBe(false);
      expect(component.currentReferenceIndex).toBe(-1);
    });

    it('should populate hash field when hash is selected', async () => {
      // Arrange
      const mockHash: ContentHash = {
        algorithm: 'sha256',
        value: 'abc123def456'
      };
      component.currentReferenceIndex = 0;

      // Act
      await component.onHashSelected(mockHash);

      // Assert
      const referenceControl = component.references.at(0);
      expect(referenceControl.get('hash')?.value).toBe('abc123def456');
      expect(component.showHashSelectionModal).toBe(false);
      expect(component.currentReferenceIndex).toBe(-1);
    });

    it('should detect and set MIME type when hash is selected', async () => {
      // Arrange
      const mockHash: ContentHash = {
        algorithm: 'sha256',
        value: 'abc123def456'
      };
      const mockContent: Content = {
        data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) // PNG header
      };
      component.currentReferenceIndex = 0;
      
      casService.retrieve.and.returnValue(Promise.resolve(mockContent));
      contentPreviewService.detectContentType.and.returnValue('image/png');

      // Act
      await component.onHashSelected(mockHash);

      // Assert
      const referenceControl = component.references.at(0);
      expect(referenceControl.get('mimeType')?.value).toBe('image/png');
      expect(referenceControl.get('mimeTypeSource')?.value).toBe('detected');
      expect(casService.retrieve).toHaveBeenCalledWith(mockHash);
      expect(contentPreviewService.detectContentType).toHaveBeenCalledWith(mockContent.data);
    });

    it('should not populate hash field if no reference index is set', async () => {
      // Arrange
      const mockHash: ContentHash = {
        algorithm: 'sha256',
        value: 'abc123def456'
      };
      component.currentReferenceIndex = -1;
      const originalValue = component.references.at(0).get('hash')?.value;

      // Act
      await component.onHashSelected(mockHash);

      // Assert
      const referenceControl = component.references.at(0);
      expect(referenceControl.get('hash')?.value).toBe(originalValue);
    });
  });

  describe('Author Hash Selection', () => {
    it('should open author hash selection modal', () => {
      component.openAuthorHashSelector(0);
      
      expect(component.showAuthorHashModal).toBe(true);
      expect(component.currentAuthorIndex).toBe(0);
    });

    it('should close author hash selection modal', () => {
      component.showAuthorHashModal = true;
      component.currentAuthorIndex = 0;

      component.closeAuthorHashSelector();

      expect(component.showAuthorHashModal).toBe(false);
      expect(component.currentAuthorIndex).toBe(-1);
    });

    it('should populate author hash field when selected', () => {
      const mockHash: ContentHash = {
        algorithm: 'sha256',
        value: 'author123hash'
      };
      component.currentAuthorIndex = 0;

      component.onAuthorHashSelected(mockHash);

      const authorControl = component.authors.at(0);
      expect(authorControl.get('authorHash')?.value).toBe('author123hash');
      expect(component.showAuthorHashModal).toBe(false);
    });
  });

  describe('Previous Version Selection', () => {
    it('should open previous version selection modal', () => {
      component.openPreviousVersionSelector();
      
      expect(component.showPreviousVersionModal).toBe(true);
    });

    it('should close previous version selection modal', () => {
      component.showPreviousVersionModal = true;

      component.closePreviousVersionSelector();

      expect(component.showPreviousVersionModal).toBe(false);
    });

    it('should populate previous version field when selected', () => {
      const mockHash: ContentHash = {
        algorithm: 'sha256',
        value: 'prevversion123'
      };

      component.onPreviousVersionSelected(mockHash);

      const versionControl = component.metadataForm.get('version');
      expect(versionControl?.get('previousVersion')?.value).toBe('prevversion123');
      expect(component.showPreviousVersionModal).toBe(false);
    });
  });
});