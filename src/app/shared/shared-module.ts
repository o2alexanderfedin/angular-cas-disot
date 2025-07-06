import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentSelectionModalComponent } from './components/content-selection-modal/content-selection-modal.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ContentSelectionModalComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ContentSelectionModalComponent
  ]
})
export class SharedModule { }
