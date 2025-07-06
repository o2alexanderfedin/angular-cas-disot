import { TestBed } from '@angular/core/testing';
import { CoverageService } from './coverage.service';

describe('CoverageService', () => {
  let service: CoverageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoverageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return coverage data', (done) => {
    service.getCoverageData().subscribe(data => {
      expect(data).toBeDefined();
      expect(data.statements).toBeGreaterThan(0);
      expect(data.branches).toBeGreaterThan(0);
      expect(data.functions).toBeGreaterThan(0);
      expect(data.lines).toBeGreaterThan(0);
      done();
    });
  });

  it('should return statements coverage as number', () => {
    const coverage = service.getStatementsCoverage();
    expect(typeof coverage).toBe('number');
    expect(coverage).toBeGreaterThan(0);
  });

  it('should return formatted statements coverage', () => {
    const formatted = service.getFormattedStatementsCoverage();
    expect(formatted).toMatch(/^\d+\.?\d*%$/);
    expect(formatted).toContain('%');
  });
});