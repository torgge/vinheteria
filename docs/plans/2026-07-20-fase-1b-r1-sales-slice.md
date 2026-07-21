# Fase 1b R1 — Sales Slice (adapter + list) Implementation Plan

> **For agentic workers:** Implement task-by-task, TDD. Steps use checkbox (`- [ ]`) syntax. Run every command inside the container: `docker compose run --rm web <cmd>` from repo root, or `cd frontend && <cmd>` if working locally with node installed. This repo uses **Jest** (jest-preset-angular), not Karma.

**Goal:** Collapse the `{BRL,PYG,USD}` display-switch triple into a single `Money` on the sales read-path, deriving BRL accounting from the frozen daily rate, proving the adapter/view pattern with minimal blast radius.

**Architecture:** A pure mapper `toSalesOrderView(order, fx)` maps the shared mock seed (triple) into a `SalesOrderView` carrying `Money` on `transactionCurrency` plus a derived BRL `accounting` block. A new presentational `<app-money-display>` renders a single `Money`. `sales-order-list` consumes the view and renders both amounts, dropping `<app-price-display>`/`selectedCurrency`. No other triple consumer is touched.

**Tech Stack:** Angular 18.2 standalone components, Angular Signals (`input.required`, `computed`), Transloco, Jest + jest-preset-angular, Angular Material 18.

## Global Constraints

- Framework: Angular 18 standalone components only — no NgModules. Verbatim.
- State: Angular Signals (`signal`/`computed`/`input`). No RxJS Subjects for component state. Do NOT introduce `@ngrx/signals` in this round (no trigger yet — simple-first).
- i18n: all new user-visible text via `*transloco`/`t()` with keys added to `src/assets/i18n/{pt-BR,es-PY,en-US}.json`.
- Money is the single source: transaction amounts on `order.transactionCurrency`; accounting is always `BRL`, derived from `ExchangeRateService.toAccounting(...)` — **never** read `seed.*.BRL`.
- Commit messages: Conventional Commits, **no emoji prefix** (project hook `scripts/hooks/validate-commit-message.sh` rejects emoji). Scope `sales` or `frontend`.
- Tests: Jest. Component specs use `provideTranslocoStub()` from the repo's transloco test setup. Mapper specs use a hand-rolled fake `ExchangeRateService`.
- Typecheck must stay clean: `tsc --noEmit -p tsconfig.app.json` exit 0.
- Branch: work on `feat/fase-1b-r1-sales-slice` (off `main`). Never commit to `main`.

## File Structure

- Create: `frontend/src/app/features/sales/sales-order.view.ts` — `SalesOrderView`/`SalesOrderItemView` types + `toSalesOrderView` pure mapper.
- Create: `frontend/src/app/features/sales/sales-order.view.spec.ts` — mapper unit tests.
- Create: `frontend/src/app/shared/components/money-display/money-display.component.ts` — presentational single-`Money` formatter.
- Create: `frontend/src/app/shared/components/money-display/money-display.component.spec.ts` — component tests.
- Modify: `frontend/src/app/features/sales/pages/sales-order-list/sales-order-list.component.ts` — consume view, render both amounts, drop price-display/CurrencyService.
- Modify: `frontend/src/app/features/sales/pages/sales-order-list/sales-order-list.component.spec.ts` — if it exists; else Create. (Check first.)
- Modify: `frontend/src/assets/i18n/{pt-BR,es-PY,en-US}.json` — add `sales.list.accountingValue` + `sales.list.carriedForward` keys.

---

### Task 1: `SalesOrderView` types + `toSalesOrderView` mapper

**Files:**
- Create: `frontend/src/app/features/sales/sales-order.view.ts`
- Test: `frontend/src/app/features/sales/sales-order.view.spec.ts`

**Interfaces:**
- Consumes: `SalesOrder`, `SalesOrderItem`, `SalesOrderStatus` from `../../mock/data`; `Money`, `SupportedCurrency` from `../../core/currency/currency.model`; `ExchangeRateService`, `ResolvedRate` from `../../core/currency/exchange-rate.service`.
  - `ExchangeRateService.toAccounting(amount: number, from: SupportedCurrency, isoDate: string): { accountingAmount: number; resolved: ResolvedRate } | null`
  - `ResolvedRate = { rate: number; date: string; source: 'MANUAL'|'FEED'|null; carriedForward: boolean }`
- Produces:
  - `interface SalesOrderView` and `interface SalesOrderItemView` (shapes below).
  - `function toSalesOrderView(order: SalesOrder, fx: ExchangeRateService): SalesOrderView`
  - `accounting: { totalAmount: Money; rate: ResolvedRate } | null` (null only when `toAccounting` returns null — par never seeded).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/features/sales/sales-order.view.spec.ts`:

```ts
import { toSalesOrderView } from './sales-order.view';
import { SalesOrder } from '../../mock/data';
import { ExchangeRateService } from '../../core/currency/exchange-rate.service';

function makeOrder(overrides: Partial<SalesOrder> = {}): SalesOrder {
  return {
    id: 'so-1',
    orderNumber: 'SO-0001',
    customerId: 'cust-1',
    customerName: 'Restaurante XYZ',
    transactionCurrency: 'USD',
    items: [
      {
        id: 'it-1',
        sku: 'W-001',
        wineName: 'Malbec',
        warehouseId: 'wh-sp',
        warehouseCode: 'SP-01',
        quantity: 2,
        unitPrice: { BRL: 500, PYG: 730000, USD: 100 },
        unitCost: { BRL: 300, PYG: 438000, USD: 60 },
        totalPrice: { BRL: 1000, PYG: 1460000, USD: 200 },
        marginPercentage: 40,
      },
    ],
    totalAmount: { BRL: 1000, PYG: 1460000, USD: 200 },
    totalCost: { BRL: 600, PYG: 876000, USD: 120 },
    totalMargin: { BRL: 400, PYG: 584000, USD: 80 },
    marginPercentage: 40,
    status: 'APPROVED',
    createdBy: 'seller-1',
    createdAt: '2026-07-10',
    ...overrides,
  } as SalesOrder;
}

// Fake fx: only toAccounting is consumed by the mapper.
function fakeFx(
  impl: ExchangeRateService['toAccounting'],
): ExchangeRateService {
  return { toAccounting: impl } as unknown as ExchangeRateService;
}

describe('toSalesOrderView', () => {
  it('maps USD order items to Money on transactionCurrency', () => {
    const fx = fakeFx(() => ({
      accountingAmount: 1066,
      resolved: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: false },
    }));

    const view = toSalesOrderView(makeOrder(), fx);

    expect(view.transactionCurrency).toBe('USD');
    expect(view.totalAmount).toEqual({ amount: 200, currency: 'USD' });
    expect(view.items[0].unitPrice).toEqual({ amount: 100, currency: 'USD' });
    expect(view.items[0].totalPrice).toEqual({ amount: 200, currency: 'USD' });
    expect(view.marginPercentage).toBe(40);
  });

  it('derives BRL accounting from fx.toAccounting on the transaction total', () => {
    const toAccounting = jest.fn().mockReturnValue({
      accountingAmount: 1066,
      resolved: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: false },
    });
    const view = toSalesOrderView(makeOrder(), fakeFx(toAccounting));

    expect(toAccounting).toHaveBeenCalledWith(200, 'USD', '2026-07-10');
    expect(view.accounting).toEqual({
      totalAmount: { amount: 1066, currency: 'BRL' },
      rate: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: false },
    });
  });

  it('ignores the seed BRL triple (accounting comes only from fx)', () => {
    // seed says BRL 1000, but fx says 950 → view must trust fx.
    const view = toSalesOrderView(
      makeOrder(),
      fakeFx(() => ({
        accountingAmount: 950,
        resolved: { rate: 4.75, date: '2026-07-10', source: 'FEED', carriedForward: false },
      })),
    );
    expect(view.accounting!.totalAmount.amount).toBe(950);
  });

  it('treats BRL orders as identity accounting', () => {
    const view = toSalesOrderView(
      makeOrder({ transactionCurrency: 'BRL' }),
      fakeFx((amount) => ({
        accountingAmount: amount,
        resolved: { rate: 1, date: '2026-07-10', source: null, carriedForward: false },
      })),
    );
    expect(view.totalAmount).toEqual({ amount: 1000, currency: 'BRL' });
    expect(view.accounting!.totalAmount).toEqual({ amount: 1000, currency: 'BRL' });
    expect(view.accounting!.rate.source).toBeNull();
  });

  it('propagates carriedForward from the resolved rate', () => {
    const view = toSalesOrderView(
      makeOrder({ createdAt: '2026-07-11' }), // a Saturday in the seed → carry-forward
      fakeFx(() => ({
        accountingAmount: 1066,
        resolved: { rate: 5.33, date: '2026-07-10', source: 'MANUAL', carriedForward: true },
      })),
    );
    expect(view.accounting!.rate.carriedForward).toBe(true);
  });

  it('sets accounting to null when fx has no rate for the pair', () => {
    const view = toSalesOrderView(makeOrder(), fakeFx(() => null));
    expect(view.accounting).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx jest sales-order.view --silent`
Expected: FAIL — `Cannot find module './sales-order.view'`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/app/features/sales/sales-order.view.ts`:

```ts
import { SalesOrder, SalesOrderItem, SalesOrderStatus } from '../../mock/data';
import { Money, SupportedCurrency } from '../../core/currency/currency.model';
import { ExchangeRateService, ResolvedRate } from '../../core/currency/exchange-rate.service';

export interface SalesOrderItemView {
  id: string;
  sku: string;
  wineName: string;
  warehouseId: string;
  warehouseCode: string;
  quantity: number;
  unitPrice: Money;
  unitCost: Money;
  totalPrice: Money;
  marginPercentage: number;
}

export interface SalesOrderView {
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
  totalAmount: Money;
  totalCost: Money;
  totalMargin: Money;
  marginPercentage: number;
  accounting: { totalAmount: Money; rate: ResolvedRate } | null;
}

/** Extract the transaction-currency column of a seed triple as a single Money. */
function pick(triple: { BRL: number; PYG: number; USD: number }, cur: SupportedCurrency): Money {
  return { amount: triple[cur], currency: cur };
}

function toItemView(item: SalesOrderItem, cur: SupportedCurrency): SalesOrderItemView {
  return {
    id: item.id,
    sku: item.sku,
    wineName: item.wineName,
    warehouseId: item.warehouseId,
    warehouseCode: item.warehouseCode,
    quantity: item.quantity,
    unitPrice: pick(item.unitPrice, cur),
    unitCost: pick(item.unitCost, cur),
    totalPrice: pick(item.totalPrice, cur),
    marginPercentage: item.marginPercentage,
  };
}

/**
 * Maps a seed SalesOrder (display-switch triple) into a SalesOrderView with a single
 * Money on transactionCurrency + BRL accounting derived from the frozen daily rate.
 * The seed's own .BRL columns are legacy and are never read for accounting.
 */
export function toSalesOrderView(order: SalesOrder, fx: ExchangeRateService): SalesOrderView {
  const cur = order.transactionCurrency;
  const acc = fx.toAccounting(order.totalAmount[cur], cur, order.createdAt);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerName: order.customerName,
    status: order.status,
    createdAt: order.createdAt,
    createdBy: order.createdBy,
    approvedBy: order.approvedBy,
    approvedAt: order.approvedAt,
    transactionCurrency: cur,
    items: order.items.map((it) => toItemView(it, cur)),
    totalAmount: pick(order.totalAmount, cur),
    totalCost: pick(order.totalCost, cur),
    totalMargin: pick(order.totalMargin, cur),
    marginPercentage: order.marginPercentage,
    accounting: acc
      ? { totalAmount: { amount: acc.accountingAmount, currency: 'BRL' }, rate: acc.resolved }
      : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx jest sales-order.view --silent`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0, no output.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/sales/sales-order.view.ts frontend/src/app/features/sales/sales-order.view.spec.ts
git commit -m "feat(sales): add SalesOrderView adapter mapping triple to single Money

Pure toSalesOrderView(order, fx) collapses the {BRL,PYG,USD} seed triple into
Money on transactionCurrency and derives BRL accounting from
ExchangeRateService.toAccounting (frozen daily rate); seed .BRL columns ignored."
```

---

### Task 2: `<app-money-display>` presentational component

**Files:**
- Create: `frontend/src/app/shared/components/money-display/money-display.component.ts`
- Test: `frontend/src/app/shared/components/money-display/money-display.component.spec.ts`

**Interfaces:**
- Consumes: `Money` from `../../../core/currency/currency.model`; `CurrencyService` from `../../../core/currency/currency.service`.
  - `CurrencyService.formatMoney(money: Money): string` (delegates to `formatPrice(amount, money.currency)` — fixed currency, locale/decimals per `CURRENCIES`).
- Produces: standalone component `MoneyDisplayComponent`, selector `app-money-display`, input `money = input.required<Money>()`, optional `size = input<'small'|'medium'|'large'>('medium')`, computed `formatted`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/money-display/money-display.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyDisplayComponent } from './money-display.component';
import { CurrencyService } from '../../../core/currency/currency.service';

describe('MoneyDisplayComponent', () => {
  let fixture: ComponentFixture<MoneyDisplayComponent>;
  let currencyService: { formatMoney: jest.Mock };

  function setup(): void {
    currencyService = { formatMoney: jest.fn() };
    TestBed.configureTestingModule({
      imports: [MoneyDisplayComponent],
      providers: [{ provide: CurrencyService, useValue: currencyService }],
    });
    fixture = TestBed.createComponent(MoneyDisplayComponent);
  }

  it('formats the money with its own fixed currency', () => {
    setup();
    currencyService.formatMoney.mockReturnValue('US$ 200.00');

    fixture.componentRef.setInput('money', { amount: 200, currency: 'USD' });
    fixture.detectChanges();

    expect(currencyService.formatMoney).toHaveBeenCalledWith({ amount: 200, currency: 'USD' });
    expect(fixture.componentInstance.formatted()).toBe('US$ 200.00');
    expect(fixture.nativeElement.textContent).toContain('US$ 200.00');
  });

  it('renders BRL money independent of any selected display currency', () => {
    setup();
    currencyService.formatMoney.mockReturnValue('R$ 1.066,00');

    fixture.componentRef.setInput('money', { amount: 1066, currency: 'BRL' });
    fixture.detectChanges();

    expect(currencyService.formatMoney).toHaveBeenCalledWith({ amount: 1066, currency: 'BRL' });
    expect(fixture.nativeElement.textContent).toContain('R$ 1.066,00');
  });

  it('applies the large size class when size is large', () => {
    setup();
    currencyService.formatMoney.mockReturnValue('R$ 10,00');
    fixture.componentRef.setInput('money', { amount: 10, currency: 'BRL' });
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.money');
    expect(el.classList).toContain('large');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx jest money-display --silent`
Expected: FAIL — `Cannot find module './money-display.component'`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/app/shared/components/money-display/money-display.component.ts`:

```ts
import { Component, computed, inject, input } from '@angular/core';

import { Money } from '../../../core/currency/currency.model';
import { CurrencyService } from '../../../core/currency/currency.service';

/**
 * Renders a single Money in its OWN currency. Unlike price-display, it never reads
 * CurrencyService.selectedCurrency — the currency is fixed by the Money value.
 */
@Component({
  selector: 'app-money-display',
  standalone: true,
  template: `
    <span class="money" [class.large]="size() === 'large'" [class.small]="size() === 'small'">
      {{ formatted() }}
    </span>
  `,
  styles: [
    `
      .money {
        font-variant-numeric: tabular-nums;
      }
      .money.large {
        font-size: var(--font-size-lg);
        font-weight: 600;
      }
      .money.small {
        font-size: var(--font-size-sm);
      }
    `,
  ],
})
export class MoneyDisplayComponent {
  private currencyService = inject(CurrencyService);

  money = input.required<Money>();
  size = input<'small' | 'medium' | 'large'>('medium');

  formatted = computed(() => this.currencyService.formatMoney(this.money()));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx jest money-display --silent`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/money-display/
git commit -m "feat(frontend): add money-display presentational component

Renders a single Money in its own fixed currency via CurrencyService.formatMoney,
without reading selectedCurrency — the counterpart to price-display for
transaction/accounting amounts."
```

---

### Task 3: Migrate `sales-order-list` to the view

**Files:**
- Modify: `frontend/src/app/features/sales/pages/sales-order-list/sales-order-list.component.ts`
- Test: `frontend/src/app/features/sales/pages/sales-order-list/sales-order-list.component.spec.ts` (check existence first; create if absent)
- Modify: `frontend/src/assets/i18n/pt-BR.json`, `es-PY.json`, `en-US.json`

**Interfaces:**
- Consumes: `toSalesOrderView`, `SalesOrderView` from `../../sales-order.view` (Task 1); `MoneyDisplayComponent` from `../../../../shared/components/money-display/money-display.component` (Task 2); `ExchangeRateService` from `../../../../core/currency/exchange-rate.service`; `SALES_ORDERS` from `../../../../mock/data`.
- Produces: the list renders `ordersView()` (a `SalesOrderView[]`), each row showing the transaction total (`app-money-display` of `totalAmount`) and the BRL accounting total (`app-money-display` of `accounting.totalAmount`).

- [ ] **Step 1: Check for an existing spec and read the component**

Run: `ls frontend/src/app/features/sales/pages/sales-order-list/*.spec.ts 2>/dev/null; echo "---"; grep -n "displayedColumns\|filteredOrders\|totalAmount\|price-display\|CurrencyService" frontend/src/app/features/sales/pages/sales-order-list/sales-order-list.component.ts`
Expected: note whether a spec exists; identify the `filteredOrders`/`processedOrders` computed and the `total` sort case (`a.totalAmount.BRL`).

- [ ] **Step 2: Write the failing test**

Create or extend `sales-order-list.component.spec.ts`. This test asserts the view wiring — the row exposes both a transaction Money and a BRL accounting Money, and sorting keys off accounting BRL. Use `provideTranslocoStub()`.

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslocoStub } from '../../../../../testing/transloco-stub'; // adjust to repo helper

import { SalesOrderListComponent } from './sales-order-list.component';

describe('SalesOrderListComponent — currency view', () => {
  let fixture: ComponentFixture<SalesOrderListComponent>;

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [SalesOrderListComponent],
      providers: [provideRouter([]), provideNoopAnimations(), provideTranslocoStub()],
    });
    fixture = TestBed.createComponent(SalesOrderListComponent);
    fixture.detectChanges();
  }

  it('exposes each order as a view with transaction Money + BRL accounting Money', () => {
    setup();
    const rows = fixture.componentInstance.ordersView();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.totalAmount.currency).toBe(row.transactionCurrency);
      if (row.accounting) {
        expect(row.accounting.totalAmount.currency).toBe('BRL');
      }
    }
  });

  it('renders the accounting BRL amount in the DOM for at least one order', () => {
    setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('R$'); // BRL accounting column is present
  });
});
```

> Note: confirm the actual transloco stub import path with `grep -rn "provideTranslocoStub\|TranslocoTestingModule" frontend/src/app frontend/src/testing 2>/dev/null | head`. Use whatever the existing specs (e.g. `status-badge.component.spec.ts`) already use, and copy that import verbatim.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx jest sales-order-list --silent`
Expected: FAIL — `ordersView` is not a function / property does not exist.

- [ ] **Step 4: Implement — swap data source to the view**

In `sales-order-list.component.ts`:

1. Update imports — remove `PriceDisplayComponent` and `CurrencyService`; add:

```ts
import { ExchangeRateService } from '../../../../core/currency/exchange-rate.service';
import { MoneyDisplayComponent } from '../../../../shared/components/money-display/money-display.component';
import { toSalesOrderView, SalesOrderView } from '../../sales-order.view';
```

2. In the `@Component.imports` array, replace `PriceDisplayComponent` with `MoneyDisplayComponent`.

3. In the class, inject fx and build the view; keep `orders = SALES_ORDERS` as the raw seed but derive the view:

```ts
private fx = inject(ExchangeRateService);

ordersView = computed<SalesOrderView[]>(() =>
  SALES_ORDERS.map((o) => toSalesOrderView(o, this.fx)),
);
```

4. Repoint `filteredOrders` (and any `selectedOrder`/sort logic) to operate on `ordersView()` instead of `orders`. For the `total` sort case, replace `a.totalAmount.BRL`/`b.totalAmount.BRL` with the accounting BRL (fallback to 0 when null):

```ts
case 'total':
  aVal = a.accounting?.totalAmount.amount ?? 0;
  bVal = b.accounting?.totalAmount.amount ?? 0;
  break;
```

- [ ] **Step 5: Implement — template: render both amounts**

In the `total` column cell, replace:

```html
<td mat-cell *matCellDef="let order">
  <app-price-display [price]="order.totalAmount" />
</td>
```

with a stacked transaction + accounting render:

```html
<td mat-cell *matCellDef="let order">
  <div class="amount-transaction">
    <app-money-display [money]="order.totalAmount" />
    <span class="currency-chip">{{ order.transactionCurrency }}</span>
  </div>
  @if (order.accounting) {
    <div class="amount-accounting">
      <app-money-display [money]="order.accounting.totalAmount" size="small" />
      @if (order.accounting.rate.carriedForward) {
        <mat-icon
          class="carry-icon"
          [matTooltip]="t('sales.list.carriedForward')"
          >event_busy</mat-icon
        >
      }
    </div>
  }
</td>
```

Add scoped styles for `.amount-accounting` (muted, `color: var(--color-ink-soft)`) and `.currency-chip`. Ensure the `*matCellDef` iterates the view rows (from `filteredOrders`/`ordersView`), so `order` is a `SalesOrderView`.

- [ ] **Step 6: Add i18n keys**

Add to `frontend/src/assets/i18n/pt-BR.json` under `sales.list`:

```json
"accountingValue": "Valor contábil (BRL)",
"carriedForward": "Taxa do último dia útil (sem cotação na data)"
```

`es-PY.json`:

```json
"accountingValue": "Valor contable (BRL)",
"carriedForward": "Tasa del último día hábil (sin cotización en la fecha)"
```

`en-US.json`:

```json
"accountingValue": "Accounting value (BRL)",
"carriedForward": "Last business-day rate (no quote on the date)"
```

> Insert the keys inside the existing `sales.list` object; do not duplicate the object. Verify with `npx jest` transloco loading if the repo validates key parity.

- [ ] **Step 7: Run tests + typecheck**

Run: `cd frontend && npx jest sales-order-list --silent && npx tsc --noEmit -p tsconfig.app.json`
Expected: PASS + exit 0.

- [ ] **Step 8: Full frontend suite (no regressions elsewhere)**

Run: `cd frontend && npx jest --silent`
Expected: all green. If `price-display` specs still pass and dashboards/approvals are untouched, the isolation held.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/app/features/sales/pages/sales-order-list/ frontend/src/assets/i18n/
git commit -m "feat(sales): render sales-order-list from SalesOrderView with dual amounts

List now shows the transaction total in its own currency plus the BRL accounting
total derived from the frozen daily rate, dropping price-display/selectedCurrency.
Sort keys off accounting BRL for cross-currency comparability."
```

---

## Self-Review

**Spec coverage:**
- Unit 1 (mapper) → Task 1. ✓
- Unit 2 (money-display) → Task 2. ✓
- Unit 3 (list migration, 2 amounts, sort by BRL, drop price-display/selectedCurrency) → Task 3. ✓
- Test matrix (USD/BRL/PYG/carry-forward/margin/Σ/null; list 2 cols + sort) → Task 1 spec (6 cases incl. PYG covered by the pick() extraction being currency-agnostic; add an explicit PYG case if desired) + Task 3 spec. ✓
- DoD (jest green, tsc 0, both amounts, no regressions, no selectedCurrency in list) → Task 3 Steps 7-8 + Global Constraints. ✓

**Placeholder scan:** No TBD/TODO. Two verification asides (transloco stub import path, i18n key parity) are explicit "confirm-in-repo" instructions with the exact grep to run, not hand-waves — the executor must match the repo's existing helper rather than invent one.

**Type consistency:** `toSalesOrderView(order, fx)`, `SalesOrderView.accounting: {...}|null`, `Money{amount,currency}`, `formatMoney(money)` used identically across Tasks 1-3. `ordersView`/`SalesOrderView` names match between Task 1 (produce) and Task 3 (consume).

## Notes for the executor / known repo gotchas

- `formatDate` in `shared/utils/date.utils` has a known off-by-one in TZ behind UTC — out of scope here, do not touch.
- Jest date seeds: `generateDailyRates()` builds ~40 days ending "today"; the mapper spec uses a **fake** fx, so it is immune. Do not rely on real `DAILY_RATES` in unit tests.
- The `total` matColumnDef stays a single column with two stacked values (transaction over accounting) — do NOT add a new column to `displayedColumns` unless the header layout requires it; keeps the diff surgical.
