import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [KpiCardComponent],
    });
    fixture = TestBed.createComponent(KpiCardComponent);
    fixture.detectChanges();
  }

  describe('iconName', () => {
    it('returns the icon input unchanged when it does not start with "pi "', () => {
      setup();
      fixture.componentRef.setInput('icon', 'attach_money');
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('attach_money');
    });

    it('falls back to bar_chart when icon starts with "pi "', () => {
      setup();
      fixture.componentRef.setInput('icon', 'pi payments');
      fixture.detectChanges();
      expect(fixture.componentInstance.iconName()).toBe('bar_chart');
    });

    it('defaults to bar_chart when icon is not set', () => {
      setup();
      expect(fixture.componentInstance.iconName()).toBe('bar_chart');
    });
  });

  describe('trendIconName', () => {
    it('returns arrow_upward for up trend', () => {
      setup();
      fixture.componentRef.setInput('trendDirection', 'up');
      fixture.detectChanges();
      expect(fixture.componentInstance.trendIconName()).toBe('arrow_upward');
    });

    it('returns arrow_downward for down trend', () => {
      setup();
      fixture.componentRef.setInput('trendDirection', 'down');
      fixture.detectChanges();
      expect(fixture.componentInstance.trendIconName()).toBe('arrow_downward');
    });

    it('returns remove for neutral trend (default)', () => {
      setup();
      expect(fixture.componentInstance.trendIconName()).toBe('remove');
    });
  });

  describe('DOM rendering', () => {
    it('renders the value and label in the DOM', () => {
      setup();
      fixture.componentRef.setInput('value', 'R$ 12.450,00');
      fixture.componentRef.setInput('label', 'Revenue');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.kpi-value')?.textContent).toBe('R$ 12.450,00');
      expect(el.querySelector('.kpi-label')?.textContent).toBe('Revenue');
    });

    it('does not render trend element when trend is null', () => {
      setup();
      fixture.componentRef.setInput('value', '150');
      fixture.componentRef.setInput('label', 'Orders');
      fixture.componentRef.setInput('trend', null);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.kpi-trend')).toBeNull();
    });

    it('renders the trend with the correct direction CSS class', () => {
      setup();
      fixture.componentRef.setInput('value', '200');
      fixture.componentRef.setInput('label', 'Sales');
      fixture.componentRef.setInput('trend', '+15%');
      fixture.componentRef.setInput('trendDirection', 'up');
      fixture.detectChanges();

      const trendEl: HTMLElement = fixture.nativeElement.querySelector('.kpi-trend');
      expect(trendEl.classList).toContain('trend-up');
      expect(trendEl.textContent).toContain('+15%');
    });

    it('applies the variant CSS class to the card', () => {
      setup();
      fixture.componentRef.setInput('value', '10');
      fixture.componentRef.setInput('label', 'Pending');
      fixture.componentRef.setInput('variant', 'warning');
      fixture.detectChanges();

      const card: HTMLElement = fixture.nativeElement.querySelector('.kpi-card');
      expect(card.classList).toContain('kpi-card--warning');
    });

    it('applies the icon background CSS class', () => {
      setup();
      fixture.componentRef.setInput('value', '50');
      fixture.componentRef.setInput('label', 'Active');
      fixture.componentRef.setInput('iconBgClass', 'kpi-icon--success');
      fixture.detectChanges();

      const iconWrapper: HTMLElement = fixture.nativeElement.querySelector('.kpi-icon');
      expect(iconWrapper.classList).toContain('kpi-icon--success');
    });
  });
});
