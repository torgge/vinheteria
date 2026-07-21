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
