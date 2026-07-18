/**
 * Mock daily exchange rates for the Vinheria Digital demo.
 *
 * Modelo: uma taxa por par de moedas por dia (ADR-001 decisão 4).
 * `toCurrency` é sempre BRL (moeda contábil). `fromCurrency` nunca é BRL
 * (BRL→BRL é identidade, não armazenado).
 *
 * Fins de semana são propositalmente pulados para exercitar o carry-forward
 * (venda de sábado usa a taxa de sexta) — ver ExchangeRateService.
 */

import { SupportedCurrency } from '../../core/currency/currency.model';

export type RateSource = 'MANUAL' | 'FEED';

export interface DailyRate {
  id: string;
  fromCurrency: SupportedCurrency; // USD | PYG (nunca BRL)
  toCurrency: SupportedCurrency;   // sempre BRL
  date: string;                    // ISO date (yyyy-mm-dd)
  rate: number;
  source: RateSource;
}

// Base de mercado (âncora) por par → BRL
const RATE_BASE: Record<'USD' | 'PYG', number> = {
  USD: 5.33,      // 1 USD ≈ 5.33 BRL
  PYG: 0.00067    // 1 PYG ≈ 0.00067 BRL
};

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Gera ~40 dias de taxas, pulando sábados/domingos (carry-forward no fim de semana). */
function generateDailyRates(): DailyRate[] {
  const rates: DailyRate[] = [];
  const pairs: ('USD' | 'PYG')[] = ['USD', 'PYG'];
  const today = new Date();

  for (let daysAgo = 40; daysAgo >= 0; daysAgo--) {
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) continue; // sem taxa no fim de semana

    for (const from of pairs) {
      const base = RATE_BASE[from];
      // caminhada suave ±2.5% em torno da âncora
      const drift = 1 + (Math.sin(daysAgo / 3) * 0.02) + (Math.random() - 0.5) * 0.01;
      const raw = base * drift;
      // preserva a escala do par (USD 4 casas, PYG 8 casas)
      const rate = from === 'USD'
        ? Math.round(raw * 10000) / 10000
        : Math.round(raw * 100000000) / 100000000;

      rates.push({
        id: `dr-${from}-${toIsoDate(date)}`,
        fromCurrency: from,
        toCurrency: 'BRL',
        date: toIsoDate(date),
        rate,
        source: 'FEED'
      });
    }
  }

  return rates;
}

export const DAILY_RATES: DailyRate[] = generateDailyRates();
