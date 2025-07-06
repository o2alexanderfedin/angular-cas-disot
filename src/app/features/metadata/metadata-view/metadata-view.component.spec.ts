import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MetadataViewComponent } from './metadata-view.component';
import { MetadataService } from '../../../core/services/metadata/metadata.service';
import { DisotService } from '../../../core/services/disot.service';
import { 
  MetadataContent, 
  AuthorRole, 
  createMetadataContent 
} from '../../../core/domain/interfaces/metadata-entry';
import { DisotEntry, DisotEntryType } from '../../../core/domain/interfaces/disot.interface';

describe('MetadataViewComponent', () => {
  let component: MetadataViewComponent;
  let fixture: ComponentFixture<MetadataViewComponent>;
  let metadataService: jasmine.SpyObj<MetadataService>;
  let disotService: jasmine.SpyObj<DisotService>;

  const mockMetadata: MetadataContent = createMetadataContent({
    references: [
      {
        hash: 'QmRef123',
        mimeType: 'text/plain',
        mimeTypeSource: 'detected',
        relationship: 'main'
      },
      {
        hash: 'QmRef456',
        mimeType: 'image/jpeg',
        mimeTypeSource: 'manual'
      }
    ],
    authors: [
      {
        authorHash: 'QmAuthor1',
        role: AuthorRole.CREATOR
      },
      {
        authorHash: 'QmAuthor2',
        role: AuthorRole.EDITOR
      }
    ],
    version: '2.0.0',
    previousVersion: 'entry-prev-123',
    changeDescription: 'Updated references'
  });

  const mockEntry: DisotEntry = {
    id: 'entry-123',
    contentHash: { algorithm: 'sha256', value: 'hash123' },
    type: DisotEntryType.METADATA,
    signature: {
      value: 'sig123',
      algorithm: 'secp256k1',
      publicKey: 'pubkey123'
    },
    timestamp: new Date('2024-01-01T10:00:00Z'),
    metadata: mockMetadata
  };

  beforeEach(async () => {
    const metadataSpy = jasmine.createSpyObj('MetadataService', [
      'getMetadataContent',
      'getVersionHistory'
    ]);
    const disotSpy = jasmine.createSpyObj('DisotService', [
      'getEntry',
      'verifyEntry'
    ]);

    await TestBed.configureTestingModule({
      imports: [MetadataViewComponent],
      providers: [
        { provide: MetadataService, useValue: metadataSpy },
        { provide: DisotService, useValue: disotSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'entry-123' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetadataViewComponent);
    component = fixture.componentInstance;
    metadataService = TestBed.inject(MetadataService) as jasmine.SpyObj<MetadataService>;
    disotService = TestBed.inject(DisotService) as jasmine.SpyObj<DisotService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load metadata entry on init', async () => {
    disotService.getEntry.and.returnValue(Promise.resolve(mockEntry));
    metadataService.getMetadataContent.and.returnValue(Promise.resolve(mockMetadata));
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(disotService.getEntry).toHaveBeenCalledWith('entry-123');
    expect(component.entry).toEqual(mockEntry);
    expect(component.metadata).toEqual(mockMetadata);
    expect(component.isVerified).toBe(true);
    expect(component.loading).toBe(false);
  });

  it('should handle entry not found', async () => {
    disotService.getEntry.and.returnValue(Promise.reject(new Error('Entry not found')));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error).toBe('Entry not found');
    expect(component.loading).toBe(false);
  });

  it('should handle invalid metadata', async () => {
    disotService.getEntry.and.returnValue(Promise.resolve(mockEntry));
    metadataService.getMetadataContent.and.returnValue(
      Promise.reject(new Error('Invalid metadata content'))
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error).toBe('Invalid metadata content');
    expect(component.loading).toBe(false);
  });

  it('should handle signature verification failure', async () => {
    disotService.getEntry.and.returnValue(Promise.resolve(mockEntry));
    metadataService.getMetadataContent.and.returnValue(Promise.resolve(mockMetadata));
    disotService.verifyEntry.and.returnValue(Promise.resolve(false));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isVerified).toBe(false);
  });

  it('should load version history', async () => {
    const versionHistory = [
      { ...mockEntry, id: 'entry-123' },
      { ...mockEntry, id: 'entry-prev-123', metadata: { ...mockMetadata, version: { version: '1.0.0' } } }
    ];

    disotService.getEntry.and.returnValue(Promise.resolve(mockEntry));
    metadataService.getMetadataContent.and.returnValue(Promise.resolve(mockMetadata));
    metadataService.getVersionHistory.and.returnValue(Promise.resolve(versionHistory));
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(metadataService.getVersionHistory).toHaveBeenCalledWith('entry-123');
    expect(component.versionHistory).toEqual(versionHistory);
  });

  it('should format timestamp correctly', () => {
    const timestamp = new Date('2024-01-01T10:00:00Z');
    const formatted = component.formatTimestamp(timestamp);
    expect(formatted).toContain('2024');
  });

  it('should get role display name', () => {
    expect(component.getRoleDisplayName(AuthorRole.CREATOR)).toBe('Creator');
    expect(component.getRoleDisplayName(AuthorRole.EDITOR)).toBe('Editor');
    expect(component.getRoleDisplayName(AuthorRole.CONTRIBUTOR)).toBe('Contributor');
    expect(component.getRoleDisplayName(AuthorRole.REVIEWER)).toBe('Reviewer');
  });

  it('should refresh data when requested', async () => {
    disotService.getEntry.and.returnValue(Promise.resolve(mockEntry));
    metadataService.getMetadataContent.and.returnValue(Promise.resolve(mockMetadata));
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));

    fixture.detectChanges();
    await fixture.whenStable();

    // Reset spy calls
    disotService.getEntry.calls.reset();
    
    await component.refresh();

    expect(disotService.getEntry).toHaveBeenCalledWith('entry-123');
  });

  it('should handle empty references array', async () => {
    const metadataNoRefs = { ...mockMetadata, references: [] };
    const entryNoRefs = { ...mockEntry, metadata: metadataNoRefs };

    disotService.getEntry.and.returnValue(Promise.resolve(entryNoRefs));
    metadataService.getMetadataContent.and.returnValue(Promise.resolve(metadataNoRefs));
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.metadata?.references.length).toBe(0);
  });

  it('should handle empty authors array', async () => {
    const metadataNoAuthors = { ...mockMetadata, authors: [] };
    const entryNoAuthors = { ...mockEntry, metadata: metadataNoAuthors };

    disotService.getEntry.and.returnValue(Promise.resolve(entryNoAuthors));
    metadataService.getMetadataContent.and.returnValue(Promise.resolve(metadataNoAuthors));
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.metadata?.authors.length).toBe(0);
  });
});