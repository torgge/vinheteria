import { Money, SupportedCurrency } from './currency.model';

/**
 * Extrai uma coluna de moeda de um triplo de precos por moeda como um unico Money.
 * O catalogo guarda precos comerciais independentemente por moeda (ADR-001 dec.1);
 * um pedido trava uma das colunas como seu valor de transacao.
 *
 * Generaliza o `pick` privado de sales-order.view (R1); R1 pode adotar este helper
 * depois (nao-bloqueante).
 */
export function moneyFrom(
  prices: Record<SupportedCurrency, number>,
  currency: SupportedCurrency,
): Money {
  return { amount: prices[currency], currency };
}
