import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockBadgeComponent } from './stock-badge.component';
import { provideTranslocoStub } from '../../../../testing/transloco-testing';

describe('StockBadgeComponent', () => {
  let fixture: ComponentFixture<StockBadgeComponent>;

  function setup(translations: Record<string, string> = {}): void {
    TestBed.configureTestingModule({
      imports: [StockBadgeComponent],
      providers: [provideTranslocoStub(translations)],
    });
    fixture = TestBed.createComponent(StockBadgeComponent);
  }

  describe('severity', () => {
    it('returns danger when quantity is zero or below', () => {
      setup();
      fixture.componentRef.setInput('quantity', 0);
      fixture.detectChanges();
      expect(fixture.componentInstance.severity()).toBe('danger');

      fixture.componentRef.setInput('quantity', -5);
      fixture.detectChanges();
      expect(fixture.componentInstance.severity()).toBe('danger');
    });

    it('returns danger when quantity is at or below criticalThreshold', () => {
      setup();
      fixture.componentRef.setInput('quantity', 3);
      fixture.componentRef.setInput('criticalThreshold', 5);
      fixture.detectChanges();
      expect(fixture.componentInstance.severity()).toBe('danger');
    });

    it('returns warning when quantity is between criticalThreshold and lowThreshold', () => {
      setup();
      fixture.componentRef.setInput('quantity', 7);
      fixture.componentRef.setInput('criticalThreshold', 5);
      fixture.componentRef.setInput('lowThreshold', 10);
      fixture.detectChanges();
      expect(fixture.componentInstance.severity()).toBe('warning');
    });

    it('returns success when quantity is above lowThreshold', () => {
      setup();
      fixture.componentRef.setInput('quantity', 15);
      fixture.componentRef.setInput('lowThreshold', 10);
      fixture.detectChanges();
      expect(fixture.componentInstance.severity()).toBe('success');
    });
  });

  describe('iconName', () => {
    it('returns cancel for zero or negative quantity', () => {
      setup();
      fixture.componentRef.setInput('quantity', 0);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('cancel');
    });

    it('returns error for critical stock', () => {
      setup();
      fixture.componentRef.setInput('quantity', 2);
      fixture.componentRef.setInput('criticalThreshold', 3);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('error');
    });

    it('returns warning for low stock', () => {
      setup();
      fixture.componentRef.setInput('quantity', 8);
      fixture.componentRef.setInput('criticalThreshold', 5);
      fixture.componentRef.setInput('lowThreshold', 10);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('warning');
    });

    it('returns check_circle for in-stock', () => {
      setup();
      fixture.componentRef.setInput('quantity', 20);
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('check_circle');
    });
  });

  describe('displayLabel', () => {
    it('shows out-of-stock translation when quantity is zero', () => {
      setup({ 'catalog.wine.outOfStock': 'Fora de estoque' });
      fixture.componentRef.setInput('quantity', 0);
      fixture.detectChanges();
      expect(fixture.componentInstance.displayLabel()).toBe('Fora de estoque');
    });

    it('shows the quantity number when showQuantity is true (default)', () => {
      setup();
      fixture.componentRef.setInput('quantity', 42);
      fixture.detectChanges();
      expect(fixture.componentInstance.displayLabel()).toBe('42 units');
    });

    it('shows low-stock translation when showQuantity is false and stock is low', () => {
      setup({ 'catalog.wine.lowStock': 'Estoque baixo' });
      fixture.componentRef.setInput('quantity', 3);
      fixture.componentRef.setInput('criticalThreshold', 5);
      fixture.componentRef.setInput('showQuantity', false);
      fixture.detectChanges();
      expect(fixture.componentInstance.displayLabel()).toBe('Estoque baixo');
    });

    it('shows in-stock translation when showQuantity is false and stock is sufficient', () => {
      setup({ 'catalog.wine.inStock': 'Em estoque' });
      fixture.componentRef.setInput('quantity', 20);
      fixture.componentRef.setInput('showQuantity', false);
      fixture.detectChanges();
      expect(fixture.componentInstance.displayLabel()).toBe('Em estoque');
    });
  });

  describe('DOM rendering', () => {
    it('applies the correct severity CSS class', () => {
      setup();
      fixture.componentRef.setInput('quantity', 3);
      fixture.componentRef.setInput('criticalThreshold', 5);
      fixture.detectChanges();

      const badge: HTMLElement = fixture.nativeElement.querySelector('.badge');
      expect(badge.classList).toContain('badge-danger');
    });

    it('renders the translated label in the DOM', () => {
      setup({ 'catalog.wine.lowStock': 'Estoque baixo' });
      fixture.componentRef.setInput('quantity', 6);
      fixture.componentRef.setInput('lowThreshold', 10);
      fixture.componentRef.setInput('showQuantity', false);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Estoque baixo');
    });
  });
});
