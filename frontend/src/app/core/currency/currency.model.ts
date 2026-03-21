// Vinheria Digital — Currency Models

export type SupportedCurrency = 'BRL' | 'PYG' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
  flag: string;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    locale: 'pt-BR',
    decimals: 2,
    flag: '🇧🇷'
  },
  PYG: {
    code: 'PYG',
    symbol: '₲',
    name: 'Guaraní Paraguayo',
    locale: 'es-PY',
    decimals: 0,
    flag: '🇵🇾'
  },
  USD: {
    code: 'USD',
    symbol: 'US$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
    flag: '🇺🇸'
  }
};

export interface Money {
  amount: number;
  currency: SupportedCurrency;
}

export interface MultiCurrencyPrice {
  BRL: Money;
  PYG: Money;
  USD: Money;
}

// Mock exchange rates (frozen for demo)
export const EXCHANGE_RATES: Record<SupportedCurrency, Record<SupportedCurrency, number>> = {
  BRL: {
    BRL: 1,
    PYG: 1492.50,    // 1 BRL = 1492.50 PYG
    USD: 0.1875      // 1 BRL = 0.1875 USD
  },
  PYG: {
    BRL: 0.00067,    // 1 PYG = 0.00067 BRL
    PYG: 1,
    USD: 0.000126    // 1 PYG = 0.000126 USD
  },
  USD: {
    BRL: 5.33,       // 1 USD = 5.33 BRL
    PYG: 7960,       // 1 USD = 7960 PYG
    USD: 1
  }
};
