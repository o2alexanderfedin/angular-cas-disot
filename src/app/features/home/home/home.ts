import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoverageService } from '../../../core/services/coverage.service';
import { IPFSStatusIndicatorComponent } from '../../../shared/ipfs-status-indicator/ipfs-status-indicator.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IPFSStatusIndicatorComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  coveragePercentage = '0%';

  constructor(private coverageService: CoverageService) {}

  ngOnInit(): void {
    this.coveragePercentage = this.coverageService.getFormattedStatementsCoverage();
  }
}
