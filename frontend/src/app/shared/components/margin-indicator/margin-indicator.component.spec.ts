import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarginIndicatorComponent } from './margin-indicator.component';

describe('MarginIndicatorComponent', () => {
  let fixture: ComponentFixture<MarginIndicatorComponent>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [MarginIndicatorComponent],
    });
    fixture = TestBed.createComponent(MarginIndicatorComponent);
  }

  describe('marginClass', () => {
    it('returns margin-negative for negative margins', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', -5);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-negative');
    });

    it('returns margin-high when margin is at or above highThreshold (default 30)', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 35);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-high');

      fixture.componentRef.setInput('marginPercentage', 30);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-high');
    });

    it('returns margin-medium when margin is between mediumThreshold and highThreshold', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 20);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-medium');

      fixture.componentRef.setInput('marginPercentage', 15);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-medium');
    });

    it('returns margin-low when margin is below mediumThreshold but non-negative', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 5);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-low');

      fixture.componentRef.setInput('marginPercentage', 0);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-low');
    });

    it('honours custom highThreshold and mediumThreshold', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 25);
      fixture.componentRef.setInput('highThreshold', 50);
      fixture.componentRef.setInput('mediumThreshold', 20);
      fixture.detectChanges();
      expect(fixture.componentInstance.marginClass()).toBe('margin-medium');
    });
  });

  describe('iconName', () => {
    it('returns arrow_downward for negative margins', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', -10);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('arrow_downward');
    });

    it('returns arrow_upward for high margins', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 40);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('arrow_upward');
    });

    it('returns remove for medium margins', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 18);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('remove');
    });

    it('returns arrow_downward for low margins', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 10);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('arrow_downward');
    });
  });

  describe('DOM rendering', () => {
    it('applies the margin CSS class to the root span', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 45);
      fixture.detectChanges();

      const indicator: HTMLElement = fixture.nativeElement.querySelector('.margin-indicator');
      expect(indicator.classList).toContain('margin-high');
    });

    it('renders the formatted margin percentage with one decimal place', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 27.456);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('27.5%');
    });

    it('renders the correct Material icon for high margin', () => {
      setup();
      fixture.componentRef.setInput('marginPercentage', 30);
      fixture.detectChanges();

      const icon: HTMLElement = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.getAttribute('ng-reflect-font-icon')).toBe('arrow_upward');
    });
  });
});
