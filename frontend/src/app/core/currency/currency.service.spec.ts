import { TestBed } from '@angular/core/testing';

import { CurrencyService } from './currency.service';
import { MultiCurrencyPrice, SupportedCurrency } from './currency.model';

const CURRENCY_STORAGE_KEY = 'vinheria-currency';

describe('CurrencyService', () => {
  let service: CurrencyService;

  function createService(): CurrencyService {
    return TestBed.inject(CurrencyService);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  describe('initialization', () => {
    it('defaults to BRL when localStorage is empty', () => {
      service = createService();
      expect(service.selectedCurrency()).toBe('BRL');
    });

    it('restores saved currency from localStorage', () => {
      localStorage.setItem(CURRENCY_STORAGE_KEY, 'USD');
      service = createService();
      expect(service.selectedCurrency()).toBe('USD');
    });

    it('ignores an invalid currency in localStorage and defaults to BRL', () => {
      localStorage.setItem(CURRENCY_STORAGE_KEY, 'EUR');
      service = createService();
      expect(service.selectedCurrency()).toBe('BRL');
    });
  });

  describe('setCurrency', () => {
    beforeEach(() => {
      service = createService();
    });

    it('updates the selected currency signal', () => {
      service.setCurrency('USD');
      expect(service.selectedCurrency()).toBe('USD');
    });

    it('persists the selection to localStorage', () => {
      service.setCurrency('PYG');
      expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('PYG');
    });
  });

  describe('derived signals', () => {
    beforeEach(() => {
      service = createService();
    });

    it('currencySymbol returns the symbol of the selected currency', () => {
      expect(service.currencySymbol()).toBe('R$');
      service.setCurrency('USD');
      expect(service.currencySymbol()).toBe('US$');
    });

    it('currencyLocale returns the locale of the selected currency', () => {
      expect(service.currencyLocale()).toBe('pt-BR');
      service.setCurrency('PYG');
      expect(service.currencyLocale()).toBe('es-PY');
    });
  });

  describe('formatPrice', () => {
    beforeEach(() => {
      service = createService();
    });

    it('formats BRL with 2 decimal places and R$ symbol', () => {
      const result = service.formatPrice(150.99);
      expect(result).toContain('150,99');
    });

    it('formats PYG with 0 decimal places', () => {
      const result = service.formatPrice(50000, 'PYG');
      expect(result).toContain('50.000');
    });

    it('formats USD with 2 decimal places and $ symbol', () => {
      const result = service.formatPrice(19.99, 'USD');
      expect(result).toContain('19.99');
    });
  });

  describe('formatMoney', () => {
    beforeEach(() => {
      service = createService();
    });

    it('delegates to formatPrice with the Money amount and currency', () => {
      const result = service.formatMoney({ amount: 299.9, currency: 'BRL' });
      expect(result).toContain('299,90');
    });
  });

  describe('getSelectedPrice', () => {
    beforeEach(() => {
      service = createService();
    });

    it('picks the Money object for the selected currency', () => {
      const prices: MultiCurrencyPrice = {
        BRL: { amount: 100, currency: 'BRL' },
        PYG: { amount: 149250, currency: 'PYG' },
        USD: { amount: 18.75, currency: 'USD' },
      };
      const selected = service.getSelectedPrice(prices);
      expect(selected.amount).toBe(100);
      expect(selected.currency).toBe('BRL');

      service.setCurrency('USD');
      expect(service.getSelectedPrice(prices).amount).toBe(18.75);
    });
  });

  describe('formatSelectedPrice', () => {
    beforeEach(() => {
      service = createService();
    });

    it('formats the price in the selected currency', () => {
      const prices: MultiCurrencyPrice = {
        BRL: { amount: 150, currency: 'BRL' },
        PYG: { amount: 223875, currency: 'PYG' },
        USD: { amount: 28.13, currency: 'USD' },
      };
      const result = service.formatSelectedPrice(prices);
      expect(result).toContain('150,00');
    });
  });

  describe('convert', () => {
    beforeEach(() => {
      service = createService();
    });

    it('returns the same amount when converting to the same currency', () => {
      expect(service.convert(100, 'BRL', 'BRL')).toBe(100);
    });

    it('converts BRL to USD using the exchange rate', () => {
      const usd = service.convert(100, 'BRL', 'USD');
      expect(usd).toBe(18.75);
    });

    it('converts BRL to PYG using the exchange rate', () => {
      const pyg = service.convert(100, 'BRL', 'PYG');
      expect(pyg).toBe(149250);
    });
  });

  describe('createMultiCurrencyPrice', () => {
    beforeEach(() => {
      service = createService();
    });

    it('creates a price object with all three currencies from a BRL amount', () => {
      const prices = service.createMultiCurrencyPrice(200);
      expect(prices.BRL.amount).toBe(200);
      expect(prices.PYG.amount).toBe(298500);
      expect(prices.USD.amount).toBe(37.5);
    });
  });

  describe('getCurrencyConfig', () => {
    beforeEach(() => {
      service = createService();
    });

    it('returns the full config for a given currency', () => {
      const config = service.getCurrencyConfig('USD');
      expect(config.symbol).toBe('US$');
      expect(config.locale).toBe('en-US');
      expect(config.decimals).toBe(2);
    });
  });
});
