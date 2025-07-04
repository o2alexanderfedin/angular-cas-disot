import { Routes } from '@angular/router';
import { ContentListComponent } from './features/content/content-list/content-list.component';
import { ContentUploadComponent } from './features/content/content-upload/content-upload.component';
import { DisotEntryComponent } from './features/disot/disot-entry/disot-entry.component';
import { SignatureVerificationComponent } from './features/disot/signature-verification/signature-verification.component';
import { StorageSettingsComponent } from './features/settings/storage-settings/storage-settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/content', pathMatch: 'full' },
  { path: 'content', component: ContentListComponent },
  { path: 'upload', component: ContentUploadComponent },
  { path: 'disot/create', component: DisotEntryComponent },
  { path: 'disot/verify', component: SignatureVerificationComponent },
  { path: 'settings', component: StorageSettingsComponent }
];
