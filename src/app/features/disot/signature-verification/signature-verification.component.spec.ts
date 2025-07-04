import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignatureVerificationComponent } from './signature-verification.component';
import { DisotService } from '../../../core/services/disot.service';
import { SharedModule } from '../../../shared/shared-module';
import { DisotEntry, DisotEntryType } from '../../../core/domain/interfaces/disot.interface';

describe('SignatureVerificationComponent', () => {
  let component: SignatureVerificationComponent;
  let fixture: ComponentFixture<SignatureVerificationComponent>;
  let disotService: jasmine.SpyObj<DisotService>;

  beforeEach(async () => {
    const disotSpy = jasmine.createSpyObj('DisotService', ['verifyEntry', 'getEntry']);

    await TestBed.configureTestingModule({
      imports: [SignatureVerificationComponent, SharedModule],
      providers: [
        { provide: DisotService, useValue: disotSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignatureVerificationComponent);
    component = fixture.componentInstance;
    disotService = TestBed.inject(DisotService) as jasmine.SpyObj<DisotService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isVerifying).toBe(false);
    expect(component.verificationResult).toBeNull();
    expect(component.errorMessage).toBe('');
  });

  it('should accept DISOT entry as input', () => {
    const mockEntry: DisotEntry = {
      id: 'test123',
      contentHash: { algorithm: 'sha256', value: 'hash123' },
      signature: {
        value: 'sig123',
        algorithm: 'secp256k1',
        publicKey: 'pub123'
      },
      timestamp: new Date(),
      type: DisotEntryType.DOCUMENT
    };

    component.disotEntry = mockEntry;
    fixture.detectChanges();

    expect(component.disotEntry).toEqual(mockEntry);
  });

  it('should verify valid entry', async () => {
    const mockEntry: DisotEntry = {
      id: 'valid123',
      contentHash: { algorithm: 'sha256', value: 'validhash' },
      signature: {
        value: 'validsig',
        algorithm: 'secp256k1',
        publicKey: 'validpub'
      },
      timestamp: new Date(),
      type: DisotEntryType.BLOG_POST
    };

    component.disotEntry = mockEntry;
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));

    await component.verifySignature();

    expect(disotService.verifyEntry).toHaveBeenCalledWith(mockEntry);
    expect(component.verificationResult).toBe(true);
    expect(component.errorMessage).toBe('');
  });

  it('should handle invalid entry', async () => {
    const mockEntry: DisotEntry = {
      id: 'invalid123',
      contentHash: { algorithm: 'sha256', value: 'invalidhash' },
      signature: {
        value: 'invalidsig',
        algorithm: 'secp256k1',
        publicKey: 'invalidpub'
      },
      timestamp: new Date(),
      type: DisotEntryType.IMAGE
    };

    component.disotEntry = mockEntry;
    disotService.verifyEntry.and.returnValue(Promise.resolve(false));

    await component.verifySignature();

    expect(component.verificationResult).toBe(false);
  });

  it('should emit verificationComplete event', async () => {
    const mockEntry: DisotEntry = {
      id: 'emit123',
      contentHash: { algorithm: 'sha256', value: 'emithash' },
      signature: {
        value: 'emitsig',
        algorithm: 'secp256k1',
        publicKey: 'emitpub'
      },
      timestamp: new Date(),
      type: DisotEntryType.SIGNATURE
    };

    component.disotEntry = mockEntry;
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));
    
    spyOn(component.verificationComplete, 'emit');

    await component.verifySignature();

    expect(component.verificationComplete.emit).toHaveBeenCalledWith({
      entry: mockEntry,
      isValid: true
    });
  });

  it('should handle verification errors', async () => {
    const mockEntry: DisotEntry = {
      id: 'error123',
      contentHash: { algorithm: 'sha256', value: 'errorhash' },
      signature: {
        value: 'errorsig',
        algorithm: 'secp256k1',
        publicKey: 'errorpub'
      },
      timestamp: new Date(),
      type: DisotEntryType.DOCUMENT
    };

    component.disotEntry = mockEntry;
    disotService.verifyEntry.and.returnValue(Promise.reject(new Error('Verification failed')));

    await component.verifySignature();

    expect(component.errorMessage).toBe('Verification failed: Verification failed');
    expect(component.verificationResult).toBeNull();
  });

  it('should require entry to verify', async () => {
    component.disotEntry = null;

    await component.verifySignature();

    expect(disotService.verifyEntry).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('No entry to verify');
  });

  it('should verify entry by ID', async () => {
    const entryId = 'lookup123';
    const mockEntry: DisotEntry = {
      id: entryId,
      contentHash: { algorithm: 'sha256', value: 'lookuphash' },
      signature: {
        value: 'lookupsig',
        algorithm: 'secp256k1',
        publicKey: 'lookuppub'
      },
      timestamp: new Date(),
      type: DisotEntryType.BLOG_POST
    };

    disotService.getEntry.and.returnValue(Promise.resolve(mockEntry));
    disotService.verifyEntry.and.returnValue(Promise.resolve(true));

    await component.verifyById(entryId);

    expect(disotService.getEntry).toHaveBeenCalledWith(entryId);
    expect(component.disotEntry).toEqual(mockEntry);
    expect(component.verificationResult).toBe(true);
  });

  it('should handle entry not found', async () => {
    const entryId = 'notfound123';

    disotService.getEntry.and.returnValue(Promise.reject(new Error('Entry not found')));

    await component.verifyById(entryId);

    expect(component.errorMessage).toBe('Failed to load entry: Entry not found');
    expect(component.disotEntry).toBeNull();
  });

  it('should show verifying state', async () => {
    const mockEntry: DisotEntry = {
      id: 'loading123',
      contentHash: { algorithm: 'sha256', value: 'loadhash' },
      signature: {
        value: 'loadsig',
        algorithm: 'secp256k1',
        publicKey: 'loadpub'
      },
      timestamp: new Date(),
      type: DisotEntryType.DOCUMENT
    };

    component.disotEntry = mockEntry;

    let resolveVerify: (value: boolean) => void;
    const verifyPromise = new Promise<boolean>((resolve) => {
      resolveVerify = resolve;
    });

    disotService.verifyEntry.and.returnValue(verifyPromise);

    const verifyCall = component.verifySignature();
    expect(component.isVerifying).toBe(true);

    resolveVerify!(true);
    await verifyCall;

    expect(component.isVerifying).toBe(false);
  });

  it('should format timestamp correctly', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    const formatted = component.formatTimestamp(testDate);
    
    // The exact format depends on locale, so just check it's a non-empty string
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });
});