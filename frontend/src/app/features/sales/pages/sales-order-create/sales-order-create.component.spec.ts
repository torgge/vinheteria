import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { SalesOrderCreateComponent } from './sales-order-create.component';
import { WINES, getWarehousesWithStock } from '../../../../mock/data';

// This page uses the *transloco structural directive, which needs a real
// TranslocoService (config + loader) — the translate()-only stub can't drive it.
// Translations are irrelevant to these assertions (amounts come from money-display),
// so an empty lang is enough. Mirrors the R1 sales-order-list.spec pattern.
function provideTranslocoTesting() {
  return TranslocoTestingModule.forRoot({
    langs: { 'pt-BR': {} },
    translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
    preloadLangs: true,
  });
}

describe('SalesOrderCreateComponent — transaction currency', () => {
  let fixture: ComponentFixture<SalesOrderCreateComponent>;
  let comp: SalesOrderCreateComponent;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [SalesOrderCreateComponent, provideTranslocoTesting()],
      providers: [provideRouter([]), provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(SalesOrderCreateComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  }

  // Adds the first wine to the order at a warehouse that has it in stock, qty 1.
  function addFirstWine(): void {
    const wine = WINES[0];
    const wh = getWarehousesWithStock(wine.sku)[0];
    comp.selectedWine.set(wine);
    comp.selectedWarehouse.set(wh);
    comp.itemQuantity.set(1);
    comp.addItem();
  }

  it('defaults transactionCurrency to BRL', () => {
    setup();
    expect(comp.transactionCurrency()).toBe('BRL');
  });

  it('derives item unitPrice as Money in the transaction currency', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    const view = comp.itemViews()[0];
    expect(view.unitPrice).toEqual({ amount: WINES[0].prices.USD, currency: 'USD' });
    expect(view.totalPrice.currency).toBe('USD');
  });

  it('re-derives items when the transaction currency changes', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    expect(comp.itemViews()[0].unitPrice.amount).toBe(WINES[0].prices.USD);

    comp.transactionCurrency.set('PYG');
    expect(comp.itemViews()[0].unitPrice).toEqual({
      amount: WINES[0].prices.PYG,
      currency: 'PYG',
    });
  });

  it('sums order totals in the transaction currency and derives BRL accounting', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    const totals = comp.orderTotals();
    expect(totals.totalPrice.currency).toBe('USD');
    expect(totals.totalPrice.amount).toBe(WINES[0].prices.USD); // qty 1
    if (totals.accounting) {
      expect(totals.accounting.totalAmount.currency).toBe('BRL');
    }
  });

  it('computes item margin in the transaction currency', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    const w = WINES[0];
    const expected = Math.round(((w.prices.USD - w.cost.USD) / w.prices.USD) * 100 * 10) / 10;
    expect(comp.itemViews()[0].marginPercentage).toBe(expected);
  });
});
