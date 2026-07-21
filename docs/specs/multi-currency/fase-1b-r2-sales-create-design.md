# Fase 1b · Rodada 2 — Sales Slice: sales-order-create (write-path)

**Status:** Approved (design)
**Author:** George Bonespirito
**Date:** 2026-07-20
**Relacionado:** [ADR-001](../../adr/ADR-001-currency-model.md) · [feature-spec](./feature-spec.md) · [R1 design](./fase-1b-r1-sales-slice-design.md)

## Context

R1 migrou o **read-path** do slice sales (list) pro modelo dual-amount via `SalesOrderView`
adapter + `<app-money-display>`. R2 migra o **write-path**: `sales-order-create`.

Estado atual do create (`sales-order-create.component.ts`):
- Nenhum conceito de `transactionCurrency`. `OrderItem` local carrega o triple
  (`unitPrice/unitCost/totalPrice: SimplePrices`), copiado direto de `wine.prices`/`wine.cost`.
- `orderTotals` soma os **3** currencies em paralelo; template exibe via `<app-price-display>`
  (lê `CurrencyService.selectedCurrency`) e `formatPrice(wine.prices.BRL)` hardcoded.
- `submitOrder()` **não persiste** — só dispara toast e navega. Não escreve em `SALES_ORDERS`
  nem em store algum.

Consequência de escopo: R2 é **migração do modelo do formulário** (form-state em moeda única
+ accounting BRL), **não** escrita num modelo de mock compartilhado. Blast radius contido ao
componente de create.

## Decisões de design (aprovadas)

1. **`transactionCurrency` travada por pedido, escolhida no header.** Novo `signal<SupportedCurrency>`
   default `'BRL'` (moeda contábil), com picker (`mat-select`) no cabeçalho do pedido. Substitui
   o display-switch: o `selectedCurrency` global (browsing de catálogo) fica ortogonal e não
   governa mais o create.
2. **Preço do item derivado, não copiado.** `wine.prices`/`wine.cost` seguem triple (preço
   comercial independente por moeda — ADR dec.1, **mantido**). O item captura **uma** coluna:
   `unitPrice = moneyFrom(wine.prices, txCurrency)`. `OrderItem` deixa de armazenar o triple;
   guarda `wine`/`warehouse`/`quantity` e os `Money` são **derivados num `computed`** que reage
   ao signal `transactionCurrency`.
3. **Trocar a moeda re-mapeia os itens (aprovado).** Como os `Money` são derivados por `computed`,
   trocar `transactionCurrency` recalcula unitPrice/total/margin/accounting de todos os itens
   automaticamente — sem mutação, sem re-mapeamento manual, sem dialog.
4. **Accounting BRL do pedido em criação.** Total na `transactionCurrency` + equivalente BRL via
   `ExchangeRateService.toAccounting(totalPrice, txCurrency, hoje)`, onde `hoje = new Date()`
   normalizado a `yyyy-mm-dd` (mesma convenção da R1/fiscal-report). BRL → identidade.
5. **Margem calculada na `transactionCurrency`.** `(price[cur] − cost[cur]) / price[cur]` — margem
   reflete a moeda da transação (preços comerciais não são proporcionais entre moedas). Hoje é
   hardcoded em BRL (`calculateItemMargin`).
6. **`submitOrder` continua toast (sem persistência).** Fora de escopo construir store/persistência.
   O payload lógico do pedido passa a carregar `transactionCurrency` por coerência, mas nada é
   gravado. Fechar o loop (pedido criado aparece na list) fica pra rodada futura.

## Arquitetura

```
transactionCurrency: signal<SupportedCurrency>   (picker no header, default BRL)
        │
orderItems: signal<OrderItem[]>  (wine + warehouse + quantity, SEM triple)
        │  computed reage a (orderItems, transactionCurrency)
        ▼
itemViews():  { wine, qty, unitPrice: Money, totalPrice: Money, marginPercentage }[]
orderTotals(): { totalPrice: Money, totalMargin: Money, marginPercentage,
                 accounting: { totalAmount: Money(BRL), rate } | null }
        │
        ▼
template  ──<app-money-display>── (itens + totais + accounting BRL)
```

### Unidade 1 — `moneyFrom` util (shared)

**Arquivo:** `core/currency/money.util.ts` (+ `.spec.ts`)
`moneyFrom(prices: SimplePrices, currency: SupportedCurrency): Money` — extrai a coluna da
moeda como `Money`. Generaliza o `pick` privado da R1 (`sales-order.view.ts`); R1 pode adotar
este helper depois (não-bloqueante). `SimplePrices` é reexportado ou tipado localmente para
evitar dependência de `price-display`.

### Unidade 2 — `sales-order-create` (migração)

- **State novo:** `transactionCurrency = signal<SupportedCurrency>('BRL')`; `currencyOptions`
  (BRL/PYG/USD de `CURRENCIES`).
- **`OrderItem`:** remove `unitPrice/unitCost/totalPrice: SimplePrices`; mantém
  `id/wine/warehouse/quantity/availableStock`. Margem também derivada (não armazenada).
- **`itemViews = computed()`:** mapeia `orderItems()` → Money na `transactionCurrency()` corrente
  (`moneyFrom(wine.prices, cur)`, `moneyFrom(wine.cost, cur)`, total = unit × qty, margem =
  `(price−cost)/price`).
- **`orderTotals = computed()`:** soma `itemViews` na moeda corrente (single Money) + margem;
  `accounting = fx.toAccounting(totalPrice.amount, cur, todayIso)` → `{ totalAmount: Money(BRL),
  rate }` ou `null`.
- **`addItem`:** deixa de pré-computar triple; só empurra `{ id, wine, warehouse, quantity,
  availableStock }`. `updateItemQuantity` só muda `quantity` (o computed re-deriva o total).
- **Template:**
  - Picker de moeda no header do pedido (`mat-select` bind em `transactionCurrency`).
  - `<app-price-display>` → `<app-money-display>` nos itens (unitPrice/total) e nos totais
    (`orderTotals().totalPrice`, `totalMargin`), mais linha de accounting BRL (chip de moeda +
    `carriedForward` tooltip, igual R1) — suprimida quando `transactionCurrency === 'BRL'`.
  - `formatPrice(wine.prices.BRL)` no dropdown de vinho → preço na `transactionCurrency`
    (`money-display` ou `formatPrice(wine.prices[cur], cur)`).
  - `calculateItemMargin` passa a receber a moeda corrente.
- **Sai desta tela:** `PriceDisplayComponent`, e o acoplamento a `selectedCurrency`.

## Testes (TDD, não characterization)

| Suíte | Casos |
|---|---|
| `money.util.spec` | extrai BRL/PYG/USD; PYG inteiro; retorna `{amount,currency}` |
| `sales-order-create.spec` | add item em USD → itemViews Money USD · trocar `transactionCurrency` p/ PYG re-deriva unitPrice/total (de `wine.prices.PYG`) · `orderTotals.totalPrice` soma na moeda corrente · `accounting.totalAmount` = BRL via `toAccounting` · margem calculada na moeda corrente · BRL → accounting identidade e linha suprimida |

`sales-order-create.spec` usa `TranslocoTestingModule` (página com `*transloco`, igual R1) +
`ExchangeRateService`/`CurrencyService` reais (root). FX determinístico: injetar fake ou usar
datas dentro da janela.

## Fora de escopo (R2)

- Persistência do pedido criado / aparecer na list (submit segue toast).
- `sales-order-detail` (stub) e migração dos demais consumidores do triple.
- Remoção do `EXCHANGE_RATES` hardcoded e do shape triple das interfaces de mock.
- `@ngrx/signals` Signal Store (sem gatilho — simple-first).

## Verificação (definition of done R2)

- `docker compose run --rm web pnpm test` verde (util + create specs).
- `tsc --noEmit -p tsconfig.app.json` exit 0.
- Trocar o picker de moeda no create re-deriva itens e totais na tela, com accounting BRL
  coerente; margem recalcula por moeda.
- `price-display` e demais telas intactas.
- Nenhuma leitura de `selectedCurrency` restante em `sales-order-create`.
