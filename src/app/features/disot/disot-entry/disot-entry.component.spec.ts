import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisotEntryComponent } from './disot-entry.component';
import { DisotService } from '../../../core/services/disot.service';
import { SignatureService } from '../../../core/services/signature.service';
import { SharedModule } from '../../../shared/shared-module';
import { ContentHash } from '../../../core/domain/interfaces/content.interface';
import { DisotEntry, DisotEntryType } from '../../../core/domain/interfaces/disot.interface';
import { KeyPair } from '../../../core/domain/interfaces/crypto.interface';

describe('DisotEntryComponent', () => {
  let component: DisotEntryComponent;
  let fixture: ComponentFixture<DisotEntryComponent>;
  let disotService: jasmine.SpyObj<DisotService>;
  let signatureService: jasmine.SpyObj<SignatureService>;

  beforeEach(async () => {
    const disotSpy = jasmine.createSpyObj('DisotService', ['createEntry', 'verifyEntry']);
    const signatureSpy = jasmine.createSpyObj('SignatureService', ['generateKeyPair']);

    await TestBed.configureTestingModule({
      imports: [DisotEntryComponent, SharedModule],
      providers: [
        { provide: DisotService, useValue: disotSpy },
        { provide: SignatureService, useValue: signatureSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DisotEntryComponent);
    component = fixture.componentInstance;
    disotService = TestBed.inject(DisotService) as jasmine.SpyObj<DisotService>;
    signatureService = TestBed.inject(SignatureService) as jasmine.SpyObj<SignatureService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.selectedType).toBe(DisotEntryType.DOCUMENT);
    expect(component.privateKey).toBe('');
    expect(component.isCreating).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(component.createdEntry).toBeNull();
  });

  it('should set content hash from input', () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'testhash' };
    
    component.contentHash = mockHash;
    fixture.detectChanges();
    
    expect(component.contentHash).toEqual(mockHash);
  });

  it('should generate key pair', async () => {
    const mockKeyPair: KeyPair = {
      privateKey: 'private123',
      publicKey: 'public123'
    };
    
    signatureService.generateKeyPair.and.returnValue(Promise.resolve(mockKeyPair));
    
    await component.generateKeyPair();
    
    expect(signatureService.generateKeyPair).toHaveBeenCalled();
    expect(component.privateKey).toBe(mockKeyPair.privateKey);
  });

  it('should create DISOT entry', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'content123' };
    const mockEntry: DisotEntry = {
      id: 'entry123',
      contentHash: mockHash,
      signature: {
        value: 'sig123',
        algorithm: 'secp256k1',
        publicKey: 'pubkey123'
      },
      timestamp: new Date(),
      type: DisotEntryType.BLOG_POST
    };
    
    component.contentHash = mockHash;
    component.selectedType = DisotEntryType.BLOG_POST;
    component.privateKey = 'privkey123';
    
    disotService.createEntry.and.returnValue(Promise.resolve(mockEntry));
    
    await component.createEntry();
    
    expect(disotService.createEntry).toHaveBeenCalledWith(
      mockHash,
      DisotEntryType.BLOG_POST,
      'privkey123'
    );
    expect(component.createdEntry).toEqual(mockEntry);
    expect(component.isCreating).toBe(false);
  });

  it('should emit entryCreated event', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'content456' };
    const mockEntry: DisotEntry = {
      id: 'entry456',
      contentHash: mockHash,
      signature: {
        value: 'sig456',
        algorithm: 'secp256k1',
        publicKey: 'pubkey456'
      },
      timestamp: new Date(),
      type: DisotEntryType.IMAGE
    };
    
    component.contentHash = mockHash;
    component.privateKey = 'privkey456';
    
    disotService.createEntry.and.returnValue(Promise.resolve(mockEntry));
    spyOn(component.entryCreated, 'emit');
    
    await component.createEntry();
    
    expect(component.entryCreated.emit).toHaveBeenCalledWith(mockEntry);
  });

  it('should handle creation errors', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'error123' };
    
    component.contentHash = mockHash;
    component.privateKey = 'privkey';
    
    disotService.createEntry.and.returnValue(Promise.reject(new Error('Creation failed')));
    
    await component.createEntry();
    
    expect(component.errorMessage).toBe('Failed to create entry: Creation failed');
    expect(component.isCreating).toBe(false);
    expect(component.createdEntry).toBeNull();
  });

  it('should require content hash to create entry', async () => {
    component.contentHash = null;
    component.privateKey = 'privkey';
    
    await component.createEntry();
    
    expect(disotService.createEntry).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Please select content first');
  });

  it('should require private key to create entry', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'needkey' };
    
    component.contentHash = mockHash;
    component.privateKey = '';
    
    await component.createEntry();
    
    expect(disotService.createEntry).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Please enter or generate a private key');
  });

  it('should show creating state', async () => {
    const mockHash: ContentHash = { algorithm: 'sha256', value: 'loading' };
    component.contentHash = mockHash;
    component.privateKey = 'key';
    
    let resolveCreate: (value: DisotEntry) => void;
    const createPromise = new Promise<DisotEntry>((resolve) => {
      resolveCreate = resolve;
    });
    
    disotService.createEntry.and.returnValue(createPromise);
    
    const createCall = component.createEntry();
    expect(component.isCreating).toBe(true);
    
    resolveCreate!({
      id: 'test',
      contentHash: mockHash,
      signature: { value: 'sig', algorithm: 'secp256k1', publicKey: 'pub' },
      timestamp: new Date(),
      type: DisotEntryType.DOCUMENT
    });
    
    await createCall;
    expect(component.isCreating).toBe(false);
  });

  it('should have entry type options', () => {
    expect(component.entryTypes).toContain(DisotEntryType.BLOG_POST);
    expect(component.entryTypes).toContain(DisotEntryType.DOCUMENT);
    expect(component.entryTypes).toContain(DisotEntryType.IMAGE);
    expect(component.entryTypes).toContain(DisotEntryType.SIGNATURE);
  });
});