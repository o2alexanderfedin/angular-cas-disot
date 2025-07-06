import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home/home';
import { ContentListComponent } from './features/content/content-list/content-list.component';
import { ContentUploadComponent } from './features/content/content-upload/content-upload.component';
import { DisotEntryComponent } from './features/disot/disot-entry/disot-entry.component';
import { SignatureVerificationComponent } from './features/disot/signature-verification/signature-verification.component';
import { StorageSettingsComponent } from './features/settings/storage-settings/storage-settings.component';
import { MigrationComponent } from './features/settings/migration/migration.component';
import { MetadataEntryComponent } from './features/metadata/metadata-entry/metadata-entry.component';
import { MetadataViewComponent } from './features/metadata/metadata-view/metadata-view.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'content', component: ContentListComponent },
  { path: 'content/upload', component: ContentUploadComponent },
  { path: 'upload', redirectTo: '/content/upload', pathMatch: 'full' },
  { path: 'disot/create', component: DisotEntryComponent },
  { path: 'disot/verify', component: SignatureVerificationComponent },
  { path: 'settings', component: StorageSettingsComponent },
  { path: 'settings/migration', component: MigrationComponent },
  { path: 'metadata', redirectTo: '/metadata/create', pathMatch: 'full' },
  { path: 'metadata/create', component: MetadataEntryComponent },
  { path: 'metadata/view/:id', component: MetadataViewComponent }
];
