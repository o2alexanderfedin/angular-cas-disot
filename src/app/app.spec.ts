import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { STORAGE_PROVIDER, storageProviderFactory, STORAGE_TYPE, StorageType } from './core/services/storage-provider.factory';
import { LocalStorageService } from './core/services/local-storage.service';
import { IndexedDbStorageService } from './core/services/indexed-db-storage.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        LocalStorageService,
        IndexedDbStorageService,
        { provide: STORAGE_TYPE, useValue: StorageType.IN_MEMORY },
        {
          provide: STORAGE_PROVIDER,
          useFactory: storageProviderFactory,
          deps: [LocalStorageService, IndexedDbStorageService, STORAGE_TYPE]
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
});
