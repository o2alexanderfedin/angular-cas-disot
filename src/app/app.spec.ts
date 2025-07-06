import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { STORAGE_PROVIDER, storageProviderFactory, STORAGE_TYPE, StorageType } from './core/services/storage-provider.factory';
import { LocalStorageService } from './core/services/local-storage.service';
import { IndexedDbStorageService } from './core/services/indexed-db-storage.service';
import { IPFSStorageService, IPFS_CONFIG } from './core/services/ipfs/ipfs-storage.service';
import { HeliaStorageService } from './core/services/helia/helia-storage.service';
import { DEFAULT_IPFS_CONFIG } from './core/services/ipfs/ipfs.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        LocalStorageService,
        IndexedDbStorageService,
        IPFSStorageService,
        HeliaStorageService,
        { provide: IPFS_CONFIG, useValue: DEFAULT_IPFS_CONFIG },
        { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
        {
          provide: STORAGE_PROVIDER,
          useFactory: storageProviderFactory,
          deps: [LocalStorageService, IndexedDbStorageService, IPFSStorageService, HeliaStorageService, STORAGE_TYPE]
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('CAS/DISOT System');
  });

  it('should have navigation links', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.main-nav a');
    
    expect(navLinks.length).toBe(6);
    expect(navLinks[0].textContent).toContain('Home');
    expect(navLinks[1].textContent).toContain('Content List');
    expect(navLinks[2].textContent).toContain('Upload');
    expect(navLinks[3].textContent).toContain('Create Entry');
    expect(navLinks[4].textContent).toContain('Verify');
    expect(navLinks[5].textContent).toContain('Settings');
  });

  it('should have router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    
    expect(routerOutlet).toBeTruthy();
  });

  it('should have footer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('.app-footer');
    
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain('Decentralized Content Management System');
  });

  it('should have correct href attributes on nav links', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.main-nav a') as NodeListOf<HTMLAnchorElement>;
    
    expect(navLinks[0].getAttribute('routerLink')).toBe('/');
    expect(navLinks[1].getAttribute('routerLink')).toBe('/content');
    expect(navLinks[2].getAttribute('routerLink')).toBe('/content/upload');
    expect(navLinks[3].getAttribute('routerLink')).toBe('/disot/create');
    expect(navLinks[4].getAttribute('routerLink')).toBe('/disot/verify');
    expect(navLinks[5].getAttribute('routerLink')).toBe('/settings');
  });

  it('should have protected title property', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect((app as any).title).toBe('cas-app');
  });
});
