import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HomeComponent } from './home';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display hero title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.hero-title')?.textContent).toContain('CAS/DISOT System');
  });

  it('should have workflow steps', () => {
    const compiled = fixture.nativeElement;
    const steps = compiled.querySelectorAll('.workflow-step');
    expect(steps.length).toBe(3);
  });

  it('should have navigation buttons', () => {
    const compiled = fixture.nativeElement;
    const buttons = compiled.querySelectorAll('.action-button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain('Upload Files');
    expect(buttons[1].textContent).toContain('Create Entry');
    expect(buttons[2].textContent).toContain('Verify Entries');
  });
});
