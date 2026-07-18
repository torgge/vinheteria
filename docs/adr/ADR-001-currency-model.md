# ADR-001: Modelo Multi-Moeda e Gestão de Câmbio

**Status:** Proposed
**Date:** 2026-07-18

## Context

Vinheria Digital opera em região de fronteira (Brasil/Paraguai) onde vendas e compras acontecem em **BRL, PYG e USD no mesmo dia**. **BRL é a moeda contábil** (functional currency): a empresa é domiciliada no Brasil e a Receita Federal exige escrituração em BRL (IN RFB 1.585/2015), NF-e em BRL e consolidação contábil unificada. Toda transação precisa ser registrada na moeda original **e** no equivalente BRL, com a taxa de câmbio do dia da transação, para que a contabilidade funcione e os relatórios exibam duas colunas: valor na moeda da transação e valor na moeda contábil.

Três problemas motivam este ADR:

1. **Docs corretos, código divergente.** Os docs de design (`docs/04-frontend-angular-material.md` §4.8-4.9, `docs/01-visao-geral.md:83`, glossário `docs/17`) já especificam o modelo dual-amount correto (`Money`, `TransactionRecord`, `Money.toAccountingCurrency`, `FiscalReportResponse`). Mas o **frontend implementado** (mock) usa um modelo **incompatível**: cada preço é um triplo pré-cozido `{ BRL, PYG, USD }` e o usuário apenas **troca a moeda de exibição** via `CurrencyService`. Não existe "moeda da transação", nem taxa registrada. As taxas são uma matriz hardcoded `EXCHANGE_RATES` marcada "frozen for demo" (`frontend/src/app/core/currency/currency.model.ts:59`).

2. **Ninguém é dono das taxas diárias.** `ExchangeRate` existe só como Value Object + Port `ExchangeRateProvider`. Não há aggregate, não há bounded context, não há fonte de dados definida. `docs/13-bounded-contexts.md` e `docs/02-arquitetura.md` não listam câmbio em lugar nenhum. Este é o gap central: o requisito de "gestão de dados de câmbio atualizados diariamente" não tem owner.

3. **Granularidade errada nos docs.** O ADR inline em `docs/04:614` diz "taxa congelada no instante da transação (spot rate)" — intraday. O requisito real é **uma taxa por dia** atualizada de acordo com o mercado; spot intraday exige feed em tempo real e não casa com "atualizados diariamente".

## Decision

Adotar um modelo de **preço comercial independente por moeda** desacoplado da **conversão contábil dual-amount para BRL via taxa diária congelada na data da transação**, com um bounded context dedicado `exchange-rates` como dono único das taxas.

### Decisões detalhadas

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | **Preço comercial independente por moeda.** Preço de catálogo é setado comercialmente em cada moeda (BRL, PYG, USD), estável. Câmbio **não** deriva preço comercial. | Preço de venda em USD/PYG é decisão comercial, não deve flutuar diariamente com o câmbio. Realista para operação de fronteira. |
| 2 | **Transaction currency única por pedido.** `SalesOrder`/`PurchaseOrder` trava **uma** moeda na criação; cada item tem `unitPrice: Money` nessa moeda única. | Uma transação ocorre em uma moeda. O modelo antigo "display switch" (3 moedas simultâneas) não representa uma transação real e impossibilita contabilidade. |
| 3 | **Dual-amount recording.** Toda transação grava `TransactionRecord` com `transactionAmount` (moeda original) + `accountingAmount` (sempre BRL) + `exchangeRateUsed` + `occurredAt` + `fiscalPeriod`. | Compliance fiscal (IN RFB 1.585/2015), NF-e em BRL, consolidação contábil. |
| 4 | **Taxa diária congelada na data, imutável.** A conversão usa a taxa **do dia da transação**. Uma vez gravada no registro, **nunca muda** — vendas futuras usam a taxa do seu próprio dia. | Integridade contábil: o lançamento histórico é imutável. Diferenças posteriores viram ganho/perda cambial explícito, não reescrita silenciosa. |
| 5 | **Câmbio é bounded context próprio: `exchange-rates`.** Aggregate `DailyRate` keyed por `(par de moedas, data)`, **uma taxa por par por dia**. | Fonte única, auditável, com ciclo de vida próprio (atualização diária). Não polui Pricing (preço comercial) com responsabilidade de FX. |
| 6 | **Fonte das taxas: manual + feed.** Feed automático é o alvo (USD→BRL via BCB PTAX; PYG→BRL via cross-rate/BCP — não há PTAX oficial para guaraní). Entrada manual ADMIN é a fase 1 e o override sempre vence o feed. | PYG não tem feed oficial trivial → manual desbloqueia o MVP. Override manual cobre divergência de mercado e falha de feed. |
| 7 | **Relatórios com duas colunas** por período fiscal: valor na moeda da transação + valor contábil BRL. | Requisito direto de contabilidade/financeiro. |

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| **A — manter "display switch" (triplo `{BRL,PYG,USD}`, troca de exibição)** | Já implementado; simples | Não registra moeda da transação nem taxa; contabilidade impossível; câmbio hardcoded | Não atende ao requisito fiscal — é o modelo que este ADR deprecia |
| **B — preço base BRL, demais moedas derivadas da taxa do dia** | Uma fonte de verdade de preço | Preço comercial em USD/PYG flutua diariamente com o câmbio; expõe preço à volatilidade | Preço comercial não deve variar com FX (decisão 1) |
| **C — taxa spot intraday (o que `docs/04:614` diz hoje)** | Máxima precisão temporal | Exige feed em tempo real; não casa com "atualizados diariamente"; PYG sem feed | Complexidade injustificada; contradiz o requisito de taxa diária |
| **D — FX dentro do context Pricing** | Menos serviços | Mistura preço comercial e câmbio no mesmo bounded context | FX tem ciclo de vida próprio (atualização diária) — merece context dedicado (decisão 5) |
| **E (chosen) — preço independente por moeda + dual-amount + taxa diária congelada + slice `exchange-rates`** | Contabilidade correta; preço comercial estável; FX auditável e isolado | Exige refactor do mock + novo slice | — |

## Consequences

**Fica mais fácil:**
- Contabilidade e relatórios fiscais tornam-se possíveis (dual-amount + período fiscal).
- Auditoria de câmbio: histórico de taxas por dia, com origem (manual/feed).
- Preço comercial estável, independente de volatilidade cambial.

**Fica mais difícil / trabalho gerado:**
- **Refactor do frontend mock** (rodada futura): `SalesOrder`/`PurchaseOrder` ganham `transactionCurrency`; item passa de triplo para `Money` único; remover a matriz hardcoded `EXCHANGE_RATES` e o shape `{ BRL, PYG, USD }` dos preços de order (`frontend/src/app/mock/data/orders.mock.ts`).
- **`CurrencyService` muda de semântica**: `selectedCurrency` deixa de ter significado transacional e vira apenas preferência de exibição de catálogo (browsing), ortogonal à moeda da transação.
- **Novo bounded context `exchange-rates`** (backend futuro): adicionar a `docs/13-bounded-contexts.md` e `docs/02-arquitetura.md` (hoje não listado).

**Correções de documentação exigidas por este ADR:**
- `docs/04-frontend-angular-material.md:614` — trocar "taxa congelada no instante da transação (spot rate)" por **taxa diária congelada na data da transação**.
- `docs/04:596-601` — `ExchangeRate` passa a ser keyed por `date` (não `Instant`).
- `docs/13` / `docs/02` — adicionar o bounded context `exchange-rates` (aggregate `DailyRate`) e o evento `DailyRateUpdated`.

**Migration path:** ver `docs/specs/multi-currency/feature-spec.md` (faseamento: modelo + rates manuais + relatório 2 colunas → feed automático → ganho/perda cambial).
