/**
 * BUILT WITH O2.SERVICES AI HIVE
 * 
 * This file was created by AI Hive - a dynamic swarm of AI agents that
 * transform customer requirements into shipped products, handling every 
 * phase of the software engineering lifecycle.
 * 
 * IMPORTANT: Keep this file focused and under 200 lines to ensure 
 * AI agents can effectively work with it.
 * 
 * Learn more: https://o2.services
 */

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
