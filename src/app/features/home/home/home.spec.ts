import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HomeComponent } from './home';
import { StorageType, STORAGE_TYPE, STORAGE_PROVIDER } from '../../../core/services/storage-provider.factory';
import { IStorageProvider } from '../../../core/domain/interfaces/storage.interface';
import { IPFS_CONFIG } from '../../../core/services/ipfs/ipfs-storage.service';
import { DEFAULT_IPFS_CONFIG } from '../../../core/services/ipfs/ipfs.config';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockStorageProvider: jasmine.SpyObj<IStorageProvider>;

  beforeEach(async () => {
    mockStorageProvider = jasmine.createSpyObj('IStorageProvider', ['write', 'read', 'exists', 'delete', 'list']);
    
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display hero title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.hero-title')?.textContent).toContain('CAS/DISOT System');
  });

  it('should have workflow steps', () => {
    const compiled = fixture.nativeElement;
    const steps = compiled.querySelectorAll('.workflow-step');
    expect(steps.length).toBe(3);
  });

  it('should have navigation buttons', () => {
    const compiled = fixture.nativeElement;
    const buttons = compiled.querySelectorAll('.action-button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain('Upload Files');
    expect(buttons[1].textContent).toContain('Create Entry');
    expect(buttons[2].textContent).toContain('Verify Entries');
  });
});
