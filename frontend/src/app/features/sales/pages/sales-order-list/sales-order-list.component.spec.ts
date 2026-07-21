import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { SalesOrderListComponent } from './sales-order-list.component';

// This page uses the *transloco structural directive, which needs a real
// TranslocoService (config + loader) — the translate()-only stub can't drive it.
// Translations are irrelevant to these assertions (amounts come from money-display),
// so an empty lang is enough.
function provideTranslocoTesting() {
  return TranslocoTestingModule.forRoot({
    langs: { 'pt-BR': {} },
    translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
    preloadLangs: true,
  });
}

describe('SalesOrderListComponent — currency view', () => {
  let fixture: ComponentFixture<SalesOrderListComponent>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [SalesOrderListComponent, provideTranslocoTesting()],
      providers: [provideRouter([]), provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(SalesOrderListComponent);
    fixture.detectChanges();
  }

  it('exposes each order as a view with transaction Money + BRL accounting Money', () => {
    setup();
    const rows = fixture.componentInstance.ordersView();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.totalAmount.currency).toBe(row.transactionCurrency);
      if (row.accounting) {
        expect(row.accounting.totalAmount.currency).toBe('BRL');
      }
    }
  });

  it('renders the accounting BRL amount in the DOM for at least one order', () => {
    setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('R$'); // BRL accounting column is present
  });

  it('hides the accounting row for BRL orders (identity, no duplicate R$)', () => {
    setup();
    const rendered = fixture.componentInstance.filteredOrders();
    const expected = rendered.filter(
      (r) => r.accounting && r.transactionCurrency !== 'BRL',
    ).length;
    const accountingEls = fixture.nativeElement.querySelectorAll('.amount-accounting');
    expect(accountingEls.length).toBe(expected);
  });

  it('sorts by the BRL accounting amount for the total column', () => {
    setup();
    fixture.componentInstance.onSortChange({ active: 'total', direction: 'asc' });
    const rows = fixture.componentInstance.filteredOrders();
    const brl = rows.map((r) => r.accounting?.totalAmount.amount ?? 0);
    const sorted = [...brl].sort((a, b) => a - b);
    expect(brl).toEqual(sorted);
  });
});
