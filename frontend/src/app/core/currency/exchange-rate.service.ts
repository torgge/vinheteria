import { Injectable, computed, signal } from '@angular/core';
import { SupportedCurrency } from './currency.model';
import { DAILY_RATES, DailyRate, RateSource } from '../../mock/data/exchange-rates.mock';

/** Resultado de uma resolução de taxa para uma data. */
export interface ResolvedRate {
  rate: number;              // taxa fromCurrency → BRL (1 quando from é BRL)
  date: string;              // data efetiva da taxa aplicada
  source: RateSource | null; // null quando from é BRL (sem conversão)
  carriedForward: boolean;   // true quando não havia taxa no dia exato
}

/**
 * Dono das taxas de câmbio diárias (ADR-001 decisão 4 / feature-spec `exchange-rates`).
 *
 * Estado em memória (mock): não persiste. `selectedCurrency` do CurrencyService é
 * preferência de EXIBIÇÃO e é ortogonal a isto — aqui vive a verdade contábil.
 */
@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private readonly _rates = signal<DailyRate[]>([...DAILY_RATES]);

  /** Todas as taxas, mais recentes primeiro. */
  readonly rates = computed(() =>
    [...this._rates()].sort((a, b) => b.date.localeCompare(a.date))
  );

  /** Última taxa conhecida por par (para exibição "taxa atual"). */
  readonly latestByPair = computed<DailyRate[]>(() => {
    const seen = new Map<string, DailyRate>();
    for (const r of this.rates()) {
      const key = `${r.fromCurrency}->${r.toCurrency}`;
      if (!seen.has(key)) seen.set(key, r);
    }
    return [...seen.values()];
  });

  /**
   * Resolve a taxa fromCurrency→BRL para uma data.
   * BRL → identidade. Sem taxa no dia exato → carry-forward da última útil anterior.
   * Retorna null só quando nunca houve taxa para o par (bootstrap).
   */
  getRateForDate(from: SupportedCurrency, isoDate: string): ResolvedRate | null {
    if (from === 'BRL') {
      return { rate: 1, date: isoDate, source: null, carriedForward: false };
    }
    const forPair = this._rates()
      .filter(r => r.fromCurrency === from && r.toCurrency === 'BRL')
      .sort((a, b) => b.date.localeCompare(a.date));

    const exact = forPair.find(r => r.date === isoDate);
    if (exact) {
      return { rate: exact.rate, date: exact.date, source: exact.source, carriedForward: false };
    }
    const previous = forPair.find(r => r.date < isoDate);
    if (previous) {
      return { rate: previous.rate, date: previous.date, source: previous.source, carriedForward: true };
    }
    return null;
  }

  /**
   * Converte um valor da moeda da transação para BRL (moeda contábil) na data dada.
   * Retorna null se não há taxa base (par nunca cadastrado).
   */
  toAccounting(amount: number, from: SupportedCurrency, isoDate: string):
    { accountingAmount: number; resolved: ResolvedRate } | null {
    const resolved = this.getRateForDate(from, isoDate);
    if (!resolved) return null;
    return {
      accountingAmount: Math.round(amount * resolved.rate * 100) / 100,
      resolved
    };
  }

  /**
   * Insere/atualiza (override) a taxa de um par numa data. Override manual vence o feed.
   * Invariante: no máximo uma taxa por (from, to=BRL, date).
   */
  upsertRate(from: SupportedCurrency, isoDate: string, rate: number): void {
    if (from === 'BRL') throw new Error('BRL->BRL rate is identity, not stored');
    if (rate <= 0) throw new Error('Rate must be positive');

    this._rates.update(list => {
      const filtered = list.filter(
        r => !(r.fromCurrency === from && r.toCurrency === 'BRL' && r.date === isoDate)
      );
      return [
        ...filtered,
        {
          id: `dr-${from}-${isoDate}`,
          fromCurrency: from,
          toCurrency: 'BRL',
          date: isoDate,
          rate,
          source: 'MANUAL' as RateSource
        }
      ];
    });
  }
}
