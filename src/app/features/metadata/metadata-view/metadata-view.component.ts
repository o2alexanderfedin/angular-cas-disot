import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MetadataService } from '../../../core/services/metadata/metadata.service';
import { DisotService } from '../../../core/services/disot.service';
import { MetadataContent, AuthorRole } from '../../../core/domain/interfaces/metadata-entry';
import { DisotEntry } from '../../../core/domain/interfaces/disot.interface';

@Component({
  selector: 'app-metadata-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './metadata-view.component.html'
})
export class MetadataViewComponent implements OnInit {
  entry: DisotEntry | null = null;
  metadata: MetadataContent | null = null;
  versionHistory: DisotEntry[] = [];
  isVerified = false;
  loading = true;
  error = '';
  
  private entryId = '';

  constructor(
    private route: ActivatedRoute,
    private metadataService: MetadataService,
    private disotService: DisotService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.entryId = params['id'];
      this.loadMetadata();
    });
  }

  private async loadMetadata() {
    this.loading = true;
    this.error = '';

    try {
      // Load the entry
      this.entry = await this.disotService.getEntry(this.entryId);
      
      // Get metadata content
      this.metadata = await this.metadataService.getMetadataContent(this.entryId);
      
      // Verify signature
      this.isVerified = await this.disotService.verifyEntry(this.entry);
      
      // Load version history
      this.versionHistory = await this.metadataService.getVersionHistory(this.entryId);
    } catch (error: any) {
      this.error = error.message || 'Failed to load metadata';
    } finally {
      this.loading = false;
    }
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleString();
  }

  getRoleDisplayName(role: AuthorRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  async refresh() {
    await this.loadMetadata();
  }
}