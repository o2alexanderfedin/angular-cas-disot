import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentSelectionModalComponent } from './components/content-selection-modal/content-selection-modal.component';
import { IPFSStatusIndicatorComponent } from './ipfs-status-indicator/ipfs-status-indicator.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ContentSelectionModalComponent,
    IPFSStatusIndicatorComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ContentSelectionModalComponent,
    IPFSStatusIndicatorComponent
  ]
})
export class SharedModule { }
