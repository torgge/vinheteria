import { Injectable, computed, signal } from '@angular/core';
import {
  CURRENCIES,
  CurrencyConfig,
  EXCHANGE_RATES,
  Money,
  MultiCurrencyPrice,
  SupportedCurrency
} from './currency.model';

const CURRENCY_STORAGE_KEY = 'vinheria-currency';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  // Available currencies
  readonly currencies: CurrencyConfig[] = Object.values(CURRENCIES);

  // Selected currency signal
  private readonly _selectedCurrency = signal<SupportedCurrency>(
    this.loadCurrencyFromStorage()
  );

  // Public signals
  readonly selectedCurrency = this._selectedCurrency.asReadonly();
  readonly selectedCurrencyConfig = computed(() => CURRENCIES[this._selectedCurrency()]);
  readonly currencySymbol = computed(() => CURRENCIES[this._selectedCurrency()].symbol);
  readonly currencyLocale = computed(() => CURRENCIES[this._selectedCurrency()].locale);

  /**
   * Set the selected currency
   */
  setCurrency(currency: SupportedCurrency): void {
    this._selectedCurrency.set(currency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }

  /**
   * Format a price according to the selected currency
   */
  formatPrice(amount: number, currency?: SupportedCurrency): string {
    const curr = currency ?? this._selectedCurrency();
    const config = CURRENCIES[curr];

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(amount);
  }

  /**
   * Format a Money object
   */
  formatMoney(money: Money): string {
    return this.formatPrice(money.amount, money.currency);
  }

  /**
   * Get the price in the selected currency from a MultiCurrencyPrice
   */
  getSelectedPrice(prices: MultiCurrencyPrice): Money {
    const currency = this._selectedCurrency();
    return prices[currency];
  }

  /**
   * Format the price in the selected currency from a MultiCurrencyPrice
   */
  formatSelectedPrice(prices: MultiCurrencyPrice): string {
    const price = this.getSelectedPrice(prices);
    return this.formatMoney(price);
  }

  /**
   * Convert an amount from one currency to another
   */
  convert(amount: number, from: SupportedCurrency, to: SupportedCurrency): number {
    if (from === to) return amount;
    const rate = EXCHANGE_RATES[from][to];
    return amount * rate;
  }

  /**
   * Create a MultiCurrencyPrice from a base amount in BRL
   * BRL is the accounting currency, so all conversions start from BRL
   */
  createMultiCurrencyPrice(amountBRL: number): MultiCurrencyPrice {
    return {
      BRL: { amount: amountBRL, currency: 'BRL' },
      PYG: { amount: Math.round(this.convert(amountBRL, 'BRL', 'PYG')), currency: 'PYG' },
      USD: { amount: Number(this.convert(amountBRL, 'BRL', 'USD').toFixed(2)), currency: 'USD' }
    };
  }

  /**
   * Get the currency config for a specific currency
   */
  getCurrencyConfig(currency: SupportedCurrency): CurrencyConfig {
    return CURRENCIES[currency];
  }

  /**
   * Load currency from localStorage
   */
  private loadCurrencyFromStorage(): SupportedCurrency {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && ['BRL', 'PYG', 'USD'].includes(stored)) {
      return stored as SupportedCurrency;
    }
    return 'BRL'; // Default to BRL (accounting currency)
  }
}
