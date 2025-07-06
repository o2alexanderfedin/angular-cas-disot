import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoverageService {
  private coverageData = {
    statements: 73.81,
    branches: 53.1,
    functions: 83.13,
    lines: 75.5
  };

  getCoverageData(): Observable<any> {
    return of(this.coverageData);
  }

  getStatementsCoverage(): number {
    return this.coverageData.statements;
  }

  getFormattedStatementsCoverage(): string {
    return `${this.coverageData.statements}%`;
  }
}