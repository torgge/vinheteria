# Fase 1b R2 — Sales Create (write-path) Implementation Plan

> **For agentic workers:** Implement task-by-task, TDD. Steps use checkbox (`- [ ]`) syntax. Run commands from `frontend/` (`cd frontend && npx jest ...`); Jest, not Karma. A fresh git worktree needs `npm ci` first (node_modules is git-ignored).

**Goal:** Migrate `sales-order-create` from the `{BRL,PYG,USD}` display-switch to a single `transactionCurrency` per order, with item prices and totals derived in that currency + BRL accounting, reusing R1's money-display.

**Architecture:** A `transactionCurrency` signal (picker in the order header) drives `computed` derivations: `itemViews` maps each stored `OrderItem` (wine+warehouse+quantity) to `Money` via `moneyFrom(wine.prices, cur)`, and `orderTotals` sums in that currency + derives BRL accounting via `ExchangeRateService`. Switching currency re-derives everything automatically. No persistence (submit stays a toast).

**Tech Stack:** Angular 18.2 standalone, Angular Signals, Transloco, Jest, Angular Material 18.

## Global Constraints

- Standalone components only; Angular Signals (no RxJS Subjects); do NOT add `@ngrx/signals`.
- All new user-visible text via `*transloco`/`t()` with keys in the 3 lang JSONs.
- Amounts: single Money on `transactionCurrency`; accounting is BRL from `ExchangeRateService.toAccounting`. Never read `selectedCurrency` in create.
- `wine.prices`/`wine.cost` stay `SimplePrices` triples (catalog price per currency — ADR-001 dec.1). Only the ORDER collapses to one currency.
- Commit messages: Conventional Commits, NO emoji prefix (repo hook). Scope `sales`/`frontend`/`shared`.
- Tests: Jest. Page-level specs use `TranslocoTestingModule.forRoot(...)` (the `*transloco` directive needs a real service — the translate-only stub can't drive it; see R1's sales-order-list.spec).
- `tsc --noEmit -p tsconfig.app.json` must stay exit 0.
- Branch: `feat/fase-1b-r2-sales-create` off `main`. Never commit to `main`.
- Reuse R1: `MoneyDisplayComponent` (`shared/components/money-display`), `ExchangeRateService` (`core/currency`).

## File Structure

- Create: `frontend/src/app/core/currency/money.util.ts` — `moneyFrom(prices, currency): Money`.
- Create: `frontend/src/app/core/currency/money.util.spec.ts`.
- Modify: `frontend/src/app/features/sales/pages/sales-order-create/sales-order-create.component.ts` — currency picker, derived views, template swaps.
- Create: `frontend/src/app/features/sales/pages/sales-order-create/sales-order-create.component.spec.ts`.
- Modify: `frontend/src/assets/i18n/{pt-BR,es-PY,en-US}.json` — `sales.create.transactionCurrency` label (reuse `sales.list.accountingValue`/`carriedForward` from R1).

---

### Task 1: `moneyFrom` shared util

**Files:**
- Create: `frontend/src/app/core/currency/money.util.ts`
- Test: `frontend/src/app/core/currency/money.util.spec.ts`

**Interfaces:**
- Consumes: `Money`, `SupportedCurrency` from `./currency.model`.
- Produces: `function moneyFrom(prices: Record<SupportedCurrency, number>, currency: SupportedCurrency): Money`.

- [ ] **Step 1: Write the failing test**

Create `money.util.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx jest money.util --silent`
Expected: FAIL — `Cannot find module './money.util'`.

- [ ] **Step 3: Write minimal implementation**

Create `money.util.ts`:

```ts
import { Money, SupportedCurrency } from './currency.model';

/**
 * Extracts one currency column from a per-currency price triple as a single Money.
 * The catalog stores commercial prices independently per currency (ADR-001 dec.1);
 * an order locks one of them as its transaction amount.
 */
export function moneyFrom(
  prices: Record<SupportedCurrency, number>,
  currency: SupportedCurrency,
): Money {
  return { amount: prices[currency], currency };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx jest money.util --silent`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/currency/money.util.ts frontend/src/app/core/currency/money.util.spec.ts
git commit -m "feat(shared): add moneyFrom util extracting a currency column as Money"
```

---

### Task 2: Migrate `sales-order-create` to transactionCurrency

**Files:**
- Modify: `frontend/src/app/features/sales/pages/sales-order-create/sales-order-create.component.ts`
- Test: `frontend/src/app/features/sales/pages/sales-order-create/sales-order-create.component.spec.ts`
- Modify: `frontend/src/assets/i18n/{pt-BR,es-PY,en-US}.json`

**Interfaces:**
- Consumes: `moneyFrom` (Task 1); `MoneyDisplayComponent`, `ExchangeRateService`, `Money`, `SupportedCurrency`, `CURRENCIES`, `ResolvedRate`.
- Produces (public for tests): `transactionCurrency: WritableSignal<SupportedCurrency>`, `itemViews(): ItemView[]`, `orderTotals(): { totalPrice: Money; totalMargin: Money; marginPercentage: number; accounting: { totalAmount: Money; rate: ResolvedRate } | null }`.

- [ ] **Step 1: Read the current component**

Run: `grep -n "OrderItem\|orderTotals\|addItem\|updateItemQuantity\|calculateItemMargin\|price-display\|PriceDisplayComponent\|SimplePrices\|CurrencyService\|selectedCurrency" frontend/src/app/features/sales/pages/sales-order-create/sales-order-create.component.ts`
Note: `OrderItem` (interface ~L35) stores `unitPrice/unitCost/totalPrice: SimplePrices`; `orderTotals` (~L668) sums the triple; template uses `<app-price-display>` at the item price/total cells and the summary totals; `formatPrice(wine.prices.BRL)` in the wine dropdown (~L221).

- [ ] **Step 2: Write the failing test**

Create `sales-order-create.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { SalesOrderCreateComponent } from './sales-order-create.component';
import { WINES } from '../../../../mock/data';
import { getWarehousesWithStock } from '../../../../mock/data';

function provideTranslocoTesting() {
  return TranslocoTestingModule.forRoot({
    langs: { 'pt-BR': {} },
    translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
    preloadLangs: true,
  });
}

describe('SalesOrderCreateComponent — transaction currency', () => {
  let fixture: ComponentFixture<SalesOrderCreateComponent>;
  let comp: SalesOrderCreateComponent;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [SalesOrderCreateComponent, provideTranslocoTesting()],
      providers: [provideRouter([]), provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(SalesOrderCreateComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  }

  // Adds the first wine to the order at a chosen warehouse, qty 1.
  function addFirstWine(): void {
    const wine = WINES[0];
    const wh = getWarehousesWithStock(wine.sku)[0];
    comp.selectedWine.set(wine);
    comp.selectedWarehouse.set(wh);
    comp.itemQuantity.set(1);
    comp.addItem();
  }

  it('defaults transactionCurrency to BRL', () => {
    setup();
    expect(comp.transactionCurrency()).toBe('BRL');
  });

  it('derives item unitPrice as Money in the transaction currency', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    const view = comp.itemViews()[0];
    expect(view.unitPrice).toEqual({ amount: WINES[0].prices.USD, currency: 'USD' });
    expect(view.totalPrice.currency).toBe('USD');
  });

  it('re-derives items when the transaction currency changes', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    expect(comp.itemViews()[0].unitPrice.amount).toBe(WINES[0].prices.USD);

    comp.transactionCurrency.set('PYG');
    expect(comp.itemViews()[0].unitPrice).toEqual({
      amount: WINES[0].prices.PYG,
      currency: 'PYG',
    });
  });

  it('sums order totals in the transaction currency and derives BRL accounting', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    const totals = comp.orderTotals();
    expect(totals.totalPrice.currency).toBe('USD');
    expect(totals.totalPrice.amount).toBe(WINES[0].prices.USD); // qty 1
    if (totals.accounting) {
      expect(totals.accounting.totalAmount.currency).toBe('BRL');
    }
  });

  it('computes item margin in the transaction currency', () => {
    setup();
    comp.transactionCurrency.set('USD');
    addFirstWine();
    const w = WINES[0];
    const expected = Math.round(((w.prices.USD - w.cost.USD) / w.prices.USD) * 100 * 10) / 10;
    expect(comp.itemViews()[0].marginPercentage).toBe(expected);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx jest sales-order-create --silent`
Expected: FAIL — `transactionCurrency`/`itemViews` not a function.

- [ ] **Step 4: Implement — imports**

In `sales-order-create.component.ts`, update imports:

```ts
// remove:
//   import { CurrencyService } from '../../../../core/currency/currency.service';
//   import { PriceDisplayComponent, SimplePrices } from '../../../../shared/components/price-display/price-display.component';
// add:
import { ExchangeRateService, ResolvedRate } from '../../../../core/currency/exchange-rate.service';
import { Money, SupportedCurrency, CURRENCIES } from '../../../../core/currency/currency.model';
import { moneyFrom } from '../../../../core/currency/money.util';
import { MoneyDisplayComponent } from '../../../../shared/components/money-display/money-display.component';
```

> `SimplePrices` was only used for the removed triple math; `wine.prices`/`wine.cost` are typed by the `Wine` model. If any residual `SimplePrices` reference remains after the edits below, replace its type with `Record<SupportedCurrency, number>`.

In `@Component.imports`, replace `PriceDisplayComponent` with `MoneyDisplayComponent`.

- [ ] **Step 5: Implement — OrderItem + state**

Simplify `OrderItem` (drop the triple + stored margin):

```ts
interface OrderItem {
  id: string;
  wine: Wine;
  warehouse: Warehouse;
  quantity: number;
  availableStock: number;
}

interface ItemView {
  item: OrderItem;
  unitPrice: Money;
  totalPrice: Money;
  marginPercentage: number;
}
```

In the class, replace `private currencyService = inject(CurrencyService);` with:

```ts
private fx = inject(ExchangeRateService);
```

Add currency state (near the other signals):

```ts
transactionCurrency = signal<SupportedCurrency>('BRL');
currencyOptions = Object.keys(CURRENCIES) as SupportedCurrency[];
```

- [ ] **Step 6: Implement — derived views**

Add `itemViews` and rewrite `orderTotals`:

```ts
itemViews = computed<ItemView[]>(() => {
  const cur = this.transactionCurrency();
  return this.orderItems().map(item => {
    const unitPrice = moneyFrom(item.wine.prices, cur);
    const unitCost = moneyFrom(item.wine.cost, cur);
    const totalPrice: Money = { amount: unitPrice.amount * item.quantity, currency: cur };
    const marginPercentage =
      unitPrice.amount > 0
        ? Math.round(((unitPrice.amount - unitCost.amount) / unitPrice.amount) * 100 * 10) / 10
        : 0;
    return { item, unitPrice, totalPrice, marginPercentage };
  });
});

orderTotals = computed(() => {
  const cur = this.transactionCurrency();
  const views = this.itemViews();

  let price = 0;
  let cost = 0;
  for (const v of views) {
    price += v.totalPrice.amount;
    cost += moneyFrom(v.item.wine.cost, cur).amount * v.item.quantity;
  }
  const totalPrice: Money = { amount: price, currency: cur };
  const totalMargin: Money = { amount: price - cost, currency: cur };
  const marginPercentage = price > 0 ? Math.round(((price - cost) / price) * 100 * 10) / 10 : 0;

  const todayIso = new Date().toISOString().split('T')[0];
  const acc = this.fx.toAccounting(price, cur, todayIso);
  const accounting = acc
    ? { totalAmount: { amount: acc.accountingAmount, currency: 'BRL' as SupportedCurrency }, rate: acc.resolved }
    : null;

  return { totalPrice, totalMargin, marginPercentage, accounting };
});
```

- [ ] **Step 7: Implement — addItem / updateItemQuantity / margin**

Rewrite `addItem` to store the raw item only:

```ts
addItem(): void {
  const wine = this.selectedWine();
  const warehouse = this.selectedWarehouse();
  const quantity = this.itemQuantity();
  if (!wine || !warehouse) return;

  const stock = getStockPosition(warehouse.id, wine.sku);
  const newItem: OrderItem = {
    id: `item-${Date.now()}`,
    wine,
    warehouse,
    quantity,
    availableStock: stock?.availableQuantity ?? 0,
  };
  this.orderItems.update(items => [...items, newItem]);

  this.selectedWine.set(null);
  this.selectedWarehouse.set(null);
  this.itemQuantity.set(1);
  this.searchText.set('');

  this.notificationService.add({
    severity: 'success',
    summary: this.transloco.translate('common.success'),
    detail: this.transloco.translate('notifications.itemAdded', { name: wine.name }),
  });
}
```

`updateItemQuantity` — only mutate quantity (totals re-derive):

```ts
updateItemQuantity(index: number, quantity: number): void {
  this.orderItems.update(items => {
    const next = [...items];
    next[index] = { ...next[index], quantity };
    return next;
  });
}
```

`calculateItemMargin` — take the current currency:

```ts
calculateItemMargin(wine: Wine): number {
  const cur = this.transactionCurrency();
  return ((wine.prices[cur] - wine.cost[cur]) / wine.prices[cur]) * 100;
}
```

`formatPrice` stays (used for credit limit / dropdown). For the wine dropdown price, format in the current currency — see Step 8.

- [ ] **Step 8: Implement — template**

1. Add a currency picker in the order header (near the customer/summary block):

```html
<mat-form-field appearance="outline">
  <mat-label>{{ t('sales.create.transactionCurrency') }}</mat-label>
  <mat-select [(ngModel)]="transactionCurrency">
    @for (c of currencyOptions; track c) {
      <mat-option [value]="c">{{ c }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

2. Order summary totals — swap price-display for money-display + accounting:

```html
<app-money-display [money]="orderTotals().totalPrice" size="large" />
```
and for margin total:
```html
<app-money-display [money]="orderTotals().totalMargin" size="medium" />
```
Add the accounting line (suppressed for BRL, like R1):
```html
@if (orderTotals().accounting && transactionCurrency() !== 'BRL') {
  <div class="summary-row">
    <span class="summary-label">{{ t('sales.list.accountingValue') }}</span>
    <app-money-display [money]="orderTotals().accounting!.totalAmount" />
  </div>
}
```

3. Items table — bind to `itemViews()` instead of `orderItems()`; the cells become:

```html
<td mat-cell *matCellDef="let v"><app-money-display [money]="v.unitPrice" /></td>
```
```html
<td mat-cell *matCellDef="let v"><app-money-display [money]="v.totalPrice" /></td>
```
```html
<td mat-cell *matCellDef="let v"><app-margin-indicator [marginPercentage]="v.marginPercentage" /></td>
```
Update the table `[dataSource]` to `itemViews()`, and any `removeItem`/quantity handlers to use `v.item` (e.g. `removeItem` by index still works via `$index`; the quantity input binds to `v.item.quantity`).

4. Wine dropdown price (`formatPrice(wine.prices.BRL)`) → current currency:

```html
<span class="wine-price">{{ formatPrice(wine.prices[transactionCurrency()], transactionCurrency()) }}</span>
```

> `CurrencyService.formatPrice(amount, currency?)` already accepts an explicit currency.
> The credit-limit line (`formatPrice(selectedCustomer()!.salesCondition.creditLimit.BRL)`) is BRL by nature — leave it, or pass `'BRL'` explicitly.

- [ ] **Step 9: Add i18n keys**

Add `sales.create.transactionCurrency` to each lang (reuse `sales.list.accountingValue`/`carriedForward` from R1):

- pt-BR: `"transactionCurrency": "Moeda da transação"`
- es-PY: `"transactionCurrency": "Moneda de la transacción"`
- en-US: `"transactionCurrency": "Transaction currency"`

Insert inside a `sales.create` object (create it if absent; do not duplicate `sales`).

- [ ] **Step 10: Run tests + typecheck**

Run: `cd frontend && npx jest sales-order-create --silent && npx tsc --noEmit -p tsconfig.app.json`
Expected: PASS + exit 0. Fix any residual `SimplePrices`/`price-display`/`currencyService` references the compiler flags.

- [ ] **Step 11: Full suite (no regressions)**

Run: `cd frontend && npx jest --silent`
Expected: all green (R1 list/mapper/money-display untouched and passing).

- [ ] **Step 12: Commit**

```bash
git add frontend/src/app/features/sales/pages/sales-order-create/ frontend/src/assets/i18n/
git commit -m "feat(sales): migrate sales-order-create to a single transaction currency

Order header picks transactionCurrency (default BRL); item prices, totals and
margin derive in that currency via moneyFrom + computed, with BRL accounting from
the daily rate. Switching currency re-derives everything. Drops
price-display/selectedCurrency. Submit stays a toast (no persistence, out of scope)."
```

---

## Self-Review

**Spec coverage:**
- Unit 1 (moneyFrom) → Task 1. ✓
- Unit 2 (create migration: picker, itemViews, orderTotals, addItem, margin, template, i18n) → Task 2. ✓
- Decision 3 (re-map on currency change) → Task 2 Step 6 (`itemViews` computed reacts to `transactionCurrency`) + spec "re-derives items when the transaction currency changes". ✓
- Decision 4 (accounting from today's rate) → Step 6 `todayIso`. ✓
- Decision 5 (margin per currency) → Step 6/7 + spec "computes item margin in the transaction currency". ✓
- Decision 6 (submit stays toast) → untouched `submitOrder`. ✓
- DoD (jest green, tsc 0, re-derive on picker, no selectedCurrency) → Steps 10-11 + Global Constraints. ✓

**Placeholder scan:** No TBD/TODO. The `SimplePrices`-residual and template-handler notes are explicit "the compiler will flag; replace with X" instructions, not hand-waves.

**Type consistency:** `moneyFrom(prices, currency): Money`, `Money{amount,currency}`, `ItemView{item,unitPrice,totalPrice,marginPercentage}`, `orderTotals().accounting: {...}|null` used identically across tasks. `transactionCurrency`/`itemViews`/`orderTotals` names match between produce (Task 2) and the spec.

## Notes for the executor / known repo gotchas

- `new Date()` in `orderTotals` is fine in app runtime; in the spec it yields the test-run day, which is inside the seeded ~40-day rate window, so `accounting` resolves — assert `.currency === 'BRL'`, not an exact BRL amount (rate varies by run day).
- Reuse R1's TranslocoTestingModule pattern for the page spec; the translate-only stub cannot drive `*transloco`.
- Do NOT touch `price-display` (still used by unmigrated screens) or the mock interfaces.
- `formatDate` off-by-one in `date.utils` is out of scope.
