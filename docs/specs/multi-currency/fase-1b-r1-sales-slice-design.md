# Fase 1b · Rodada 1 — Sales Slice: adapter + sales-order-list

**Status:** Approved (design)
**Author:** George Bonespirito
**Date:** 2026-07-20
**Relacionado:** [ADR-001](../../adr/ADR-001-currency-model.md) · [feature-spec](./feature-spec.md)

## Context

O ADR-001 (decisão 2) trava **uma** `transactionCurrency` por pedido e substitui o
modelo "display-switch". A Fase 1 (PR #76) adicionou `transactionCurrency` ao
`SalesOrder` e o `ExchangeRateService` (dono da verdade contábil, congelada na data),
mas de forma **aditiva** — o modelo antigo segue vivo em paralelo:

- `SalesOrderItem`/`SalesOrder` ainda carregam preços como triple `{ BRL, PYG, USD }`
  pré-cozido pela matriz **`EXCHANGE_RATES` hardcoded** (`currency.model.ts:59`), que
  **diverge** das `DailyRates`.
- `sales-order-list` renderiza via `<app-price-display>`, que lê
  `CurrencyService.selectedCurrency()` — o display-switch.

O triple mora na **interface de mock compartilhada**, consumida por ~10 telas
(list, detail, dashboards, approvals, purchases…). Migrar a interface direto seria
big-bang. Esta rodada prova o padrão de isolamento com blast radius mínimo:
**read-path do slice sales**.

## Decisões de design (aprovadas)

1. **Adapter/view layer, não big-bang.** O mock cru mantém o triple como *seed*. Um
   mapper puro expõe um `SalesOrderView` com `Money` único (na `transactionCurrency`)
   + accounting BRL derivado. Sales consome a view; os outros consumidores do triple
   ficam intocados até migrarem um a um (rodadas futuras).
2. **Accounting é derivado, seed BRL é legado.** O adapter **ignora**
   `seed.totalAmount.BRL` (cozido pelo `EXCHANGE_RATES` hardcoded) e deriva o contábil
   via `ExchangeRateService.toAccounting(amount, txCurrency, createdAt)` — taxa diária
   **congelada na data do pedido**. Divergência entre seed.BRL e o derivado é esperada
   e é o ponto do refactor.
3. **Escopo R1 = read-path.** Só adapter + `sales-order-list`. `create` (currency
   picker, write-path) fica R2; `detail` (stub, 11 linhas) e os demais consumidores
   do triple, rodadas seguintes.
4. **TDD, não characterization.** O display muda de propósito (triple-switch → 2
   colunas). Não caracterizo comportamento que vou deletar; TDD só do que nasce.

## Arquitetura

```
SALES_ORDERS (seed, triple)
        │  toSalesOrderView(order, fx)      ← função pura, testável isolada
        ▼
   SalesOrderView { totalAmount: Money, accounting: { totalAmount: Money(BRL), rate } }
        │
        ▼
 sales-order-list  ──renderiza 2 colunas──▶  <app-money-display [money]>  (×2)
```

### Unidade 1 — `toSalesOrderView` mapper

**Arquivo:** `features/sales/sales-order.view.ts` (+ `.spec.ts`)
**Assinatura:** `toSalesOrderView(order: SalesOrder, fx: ExchangeRateService): SalesOrderView`

Função pura (recebe `fx` por parâmetro — sem `inject`, testável com fake). Não é
signalStore nem serviço.

```ts
interface SalesOrderView {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: SalesOrderStatus;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  transactionCurrency: SupportedCurrency;
  items: SalesOrderItemView[];
  totalAmount: Money;          // txCurrency
  totalCost: Money;            // txCurrency
  totalMargin: Money;          // txCurrency
  marginPercentage: number;
  accounting: {
    totalAmount: Money;        // sempre BRL — verdade contábil
    rate: ResolvedRate;        // taxa congelada na data (identidade quando txCurrency = BRL)
  };
}

interface SalesOrderItemView {
  id: string;
  sku: string;
  wineName: string;
  warehouseId: string;
  warehouseCode: string;
  quantity: number;
  unitPrice: Money;            // txCurrency
  unitCost: Money;             // txCurrency
  totalPrice: Money;           // txCurrency
  marginPercentage: number;
}
```

**Mapeamento:**
- `cur = order.transactionCurrency`.
- Cada `Money` = `{ amount: seed.<field>[cur], currency: cur }` — extrai a coluna da
  moeda da transação do triple.
- `accounting.rate = fx.getRateForDate(cur, order.createdAt)`; `accounting.totalAmount
  = { amount: fx.toAccounting(order.totalAmount[cur], cur, createdAt).accountingAmount,
  currency: 'BRL' }`.
- `marginPercentage` copiado do seed (invariante — independe de moeda).

**Edge:** se `fx.toAccounting` retornar `null` (par sem taxa base — só no bootstrap),
`accounting.totalAmount` = `null` e a view marca o pedido como "sem taxa". Não trava a
listagem. (Não deve ocorrer com as seeds atuais; documentado por completude.)

### Unidade 2 — `<app-money-display>`

**Arquivo:** `shared/components/money-display/money-display.component.ts`
Presentational puro: `money = input.required<Money>()`. Formata via
`CurrencyService.formatMoney(money)` — helper já existente que chama
`formatPrice(amount, money.currency)` com a `currency` **fixa** do próprio `Money`
(locale/símbolo/decimais — PYG 0 casas). **Não** lê `selectedCurrency`.
`price-display` fica intocado (segue válido pro browsing de catálogo).

### Unidade 3 — `sales-order-list` (migração)

- `ordersView = computed(() => SALES_ORDERS.map(o => toSalesOrderView(o, this.fx)))`.
- Tabela: coluna "Total" vira **duas** — `money-display` do `totalAmount` (moeda da
  transação) + `money-display` do `accounting.totalAmount` (BRL contábil), com chip de
  `transactionCurrency` e indicador quando `accounting.rate.carriedForward`.
- Sort de "total": passa a comparar `accounting.totalAmount.amount` (BRL comparável
  entre moedas distintas — antes usava `totalAmount.BRL` do triple).
- Remove `<app-price-display [price]="order.totalAmount">` e o `inject(CurrencyService)`
  desta tela. `selectedOrder`/detalhe inline seguem a mesma view.

## Testes

| Suíte | Casos |
|---|---|
| `sales-order.view.spec` | USD → `Money{USD}` + accounting BRL via taxa conhecida · BRL → accounting = transação, `rate` identidade (`source:null`) · PYG → 0 decimais, accounting via taxa guaraní · `carriedForward` propagado quando data cai em fim de semana · `marginPercentage` preservado · `totalAmount = Σ itens` · `toAccounting` null → view sem taxa, não lança |
| `sales-order-list.spec` | renderiza as 2 colunas (transação + BRL) · ordena por BRL contábil · filtro/status inalterados |

**Isolamento de FX no teste do mapper:** fake `ExchangeRateService` com taxas fixas
conhecidas (ex.: USD→BRL 5.00, PYG→BRL 0.0007) e datas próprias — **não** depender das
~40 seeds geradas por `generateDailyRates()` (que dependem de "hoje").
`sales-order-list.spec` usa `provideTranslocoStub`.

## Fora de escopo (R1)

- `sales-order-create` (currency picker, write-path) → R2.
- `sales-order-detail` (stub) e migração dos outros ~9 consumidores do triple.
- Remoção do `EXCHANGE_RATES` hardcoded e do shape triple das interfaces de mock
  (só quando o último consumidor migrar).
- Introdução de `@ngrx/signals` Signal Store (sem gatilho real ainda — simple-first).

## Verificação (definition of done R1)

- `docker compose run --rm web pnpm test` verde (mapper + list specs incluídos).
- `tsc --noEmit -p tsconfig.app.json` exit 0.
- `sales-order-list` renderiza 2 colunas com dados reais das `DailyRates` (não do
  triple), incluindo ao menos um pedido em cada moeda.
- `price-display` e demais telas **não** regridem (não tocadas).
- Nenhuma leitura de `selectedCurrency` restante em `sales-order-list`.
