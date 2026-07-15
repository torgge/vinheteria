import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyService } from '../../../core/currency/currency.service';
import { SupportedCurrency } from '../../../core/currency/currency.model';

export interface SimplePrices {
  BRL: number;
  PYG: number;
  USD: number;
}

@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="price" [class.large]="size() === 'large'" [class.small]="size() === 'small'">
      {{ formattedPrice() }}
    </span>
  `,
  styles: [`
    .price {
      font-weight: 600;
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
    }

    .price.large {
      font-size: var(--font-size-xl, 1.25rem);
    }

    .price.small {
      font-size: var(--font-size-sm, 0.875rem);
    }
  `]
})
export class PriceDisplayComponent {
  private currencyService = inject(CurrencyService);

  /** The price object with all currencies */
  price = input.required<SimplePrices | number>();

  /** Size variant */
  size = input<'small' | 'medium' | 'large'>('medium');

  formattedPrice = computed(() => {
    const priceValue = this.price();

    if (typeof priceValue === 'number') {
      return this.currencyService.formatPrice(priceValue);
    }

    const currency: SupportedCurrency = this.currencyService.selectedCurrency();
    const amount = priceValue[currency];
    return this.currencyService.formatPrice(amount);
  });
}
