import { toSalesOrderView } from './sales-order.view';
import { SalesOrder } from '../../mock/data';
import { ExchangeRateService } from '../../core/currency/exchange-rate.service';

function makeOrder(overrides: Partial<SalesOrder> = {}): SalesOrder {
  return {
    id: 'so-1',
    orderNumber: 'SO-0001',
    customerId: 'cust-1',
    customerName: 'Restaurante XYZ',
    transactionCurrency: 'USD',
    items: [
      {
        id: 'it-1',
        sku: 'W-001',
        wineName: 'Malbec',
        warehouseId: 'wh-sp',
        warehouseCode: 'SP-01',
        quantity: 2,
        unitPrice: { BRL: 500, PYG: 730000, USD: 100 },
        unitCost: { BRL: 300, PYG: 438000, USD: 60 },
        totalPrice: { BRL: 1000, PYG: 1460000, USD: 200 },
        marginPercentage: 40,
      },
    ],
    totalAmount: { BRL: 1000, PYG: 1460000, USD: 200 },
    totalCost: { BRL: 600, PYG: 876000, USD: 120 },
    totalMargin: { BRL: 400, PYG: 584000, USD: 80 },
    marginPercentage: 40,
    status: 'APPROVED',
    createdBy: 'seller-1',
    createdAt: '2026-07-10',
    ...overrides,
  } as SalesOrder;
}

// Fake fx: only toAccounting is consumed by the mapper.
function fakeFx(impl: ExchangeRateService['toAccounting']): ExchangeRateService {
  return { toAccounting: impl } as unknown as ExchangeRateService;
}

describe('toSalesOrderView', () => {
  it('maps USD order items to Money on transactionCurrency', () => {
    const fx = fakeFx(() => ({
      accountingAmount: 1066,
      resolved: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: false },
    }));

    const view = toSalesOrderView(makeOrder(), fx);

    expect(view.transactionCurrency).toBe('USD');
    expect(view.totalAmount).toEqual({ amount: 200, currency: 'USD' });
    expect(view.items[0].unitPrice).toEqual({ amount: 100, currency: 'USD' });
    expect(view.items[0].totalPrice).toEqual({ amount: 200, currency: 'USD' });
    expect(view.marginPercentage).toBe(40);
  });

  it('derives BRL accounting from fx.toAccounting on the transaction total', () => {
    const toAccounting = jest.fn().mockReturnValue({
      accountingAmount: 1066,
      resolved: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: false },
    });
    const view = toSalesOrderView(makeOrder(), fakeFx(toAccounting));

    expect(toAccounting).toHaveBeenCalledWith(200, 'USD', '2026-07-10');
    expect(view.accounting).toEqual({
      totalAmount: { amount: 1066, currency: 'BRL' },
      rate: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: false },
    });
  });

  it('ignores the seed BRL triple (accounting comes only from fx)', () => {
    // seed says BRL 1000, but fx says 950 -> view must trust fx.
    const view = toSalesOrderView(
      makeOrder(),
      fakeFx(() => ({
        accountingAmount: 950,
        resolved: { rate: 4.75, date: '2026-07-10', source: 'FEED', carriedForward: false },
      })),
    );
    expect(view.accounting!.totalAmount.amount).toBe(950);
  });

  it('treats BRL orders as identity accounting', () => {
    const view = toSalesOrderView(
      makeOrder({ transactionCurrency: 'BRL' }),
      fakeFx((amount) => ({
        accountingAmount: amount,
        resolved: { rate: 1, date: '2026-07-10', source: null, carriedForward: false },
      })),
    );
    expect(view.totalAmount).toEqual({ amount: 1000, currency: 'BRL' });
    expect(view.accounting!.totalAmount).toEqual({ amount: 1000, currency: 'BRL' });
    expect(view.accounting!.rate.source).toBeNull();
  });

  it('maps PYG orders with the guarani column and derives accounting', () => {
    const view = toSalesOrderView(
      makeOrder({ transactionCurrency: 'PYG' }),
      fakeFx(() => ({
        accountingAmount: 978.2,
        resolved: { rate: 0.00067, date: '2026-07-10', source: 'MANUAL', carriedForward: false },
      })),
    );
    expect(view.totalAmount).toEqual({ amount: 1460000, currency: 'PYG' });
    expect(view.items[0].unitPrice).toEqual({ amount: 730000, currency: 'PYG' });
    expect(view.accounting!.totalAmount).toEqual({ amount: 978.2, currency: 'BRL' });
  });

  it('propagates carriedForward from the resolved rate', () => {
    const view = toSalesOrderView(
      makeOrder({ createdAt: '2026-07-11' }), // weekend in the seed -> carry-forward
      fakeFx(() => ({
        accountingAmount: 1066,
        resolved: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: true },
      })),
    );
    expect(view.accounting!.rate.carriedForward).toBe(true);
  });

  it('sets accounting to null when fx has no rate for the pair', () => {
    const view = toSalesOrderView(makeOrder(), fakeFx(() => null));
    expect(view.accounting).toBeNull();
  });
});
