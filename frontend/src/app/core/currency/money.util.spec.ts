import { moneyFrom } from './money.util';

describe('moneyFrom', () => {
  const prices = { BRL: 500, PYG: 730000, USD: 100 };

  it('extracts the BRL column as Money', () => {
    expect(moneyFrom(prices, 'BRL')).toEqual({ amount: 500, currency: 'BRL' });
  });

  it('extracts the USD column as Money', () => {
    expect(moneyFrom(prices, 'USD')).toEqual({ amount: 100, currency: 'USD' });
  });

  it('extracts the PYG column (integer guarani) as Money', () => {
    expect(moneyFrom(prices, 'PYG')).toEqual({ amount: 730000, currency: 'PYG' });
  });
});
