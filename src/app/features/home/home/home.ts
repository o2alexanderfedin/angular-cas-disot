import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoverageService } from '../../../core/services/coverage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
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
