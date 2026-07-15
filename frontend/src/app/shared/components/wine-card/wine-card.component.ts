import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';

import { PriceDisplayComponent, SimplePrices } from '../price-display/price-display.component';
import { StockBadgeComponent } from '../stock-badge/stock-badge.component';

export interface WineCardData {
  id: string;
  sku: string;
  name: string;
  producer: string;
  vintage: number;
  grapeVariety: string;
  region: string;
  country: string;
  prices: SimplePrices;
  imageUrl?: string;
  stockQuantity?: number;
}

@Component({
  selector: 'app-wine-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslocoModule,
    PriceDisplayComponent,
    StockBadgeComponent
  ],
  template: `
    <mat-card appearance="outlined" class="wine-card vinheria-card-elevated" *transloco="let t">
      <div class="wine-image">
        <img [src]="imageSrc()" [alt]="wine().name" (error)="onImageError()" />
        <div class="wine-badges">
          <span class="badge badge-contrast">{{ wine().vintage }}</span>
          @if (wine().stockQuantity !== undefined) {
            <app-stock-badge [quantity]="wine().stockQuantity!" [showQuantity]="false" />
          }
        </div>
      </div>

      <mat-card-content class="wine-content">
        <div class="wine-header">
          <h3 class="wine-name">{{ wine().name }}</h3>
          <span class="wine-producer">{{ wine().producer }}</span>
        </div>

        <div class="wine-details">
          <div class="wine-detail">
            <mat-icon fontIcon="location_on" />
            <span>{{ wine().region }}, {{ wine().country }}</span>
          </div>
          <div class="wine-detail">
            <mat-icon fontIcon="sell" />
            <span>{{ wine().grapeVariety }}</span>
          </div>
          <div class="wine-detail wine-sku">
            <mat-icon fontIcon="barcode_reader" />
            <span>{{ wine().sku }}</span>
          </div>
        </div>

        <div class="wine-footer">
          <app-price-display [price]="wine().prices" size="large" />
          <div class="wine-actions">
            @if (showDetailButton()) {
              <button
                mat-icon-button
                [matTooltip]="t('common.viewDetails')"
                (click)="viewDetail.emit(wine())"
                [attr.aria-label]="t('common.viewDetails')"
              >
                <mat-icon fontIcon="visibility" />
              </button>
            }
            @if (showAddButton()) {
              <button
                mat-mini-fab
                color="primary"
                [matTooltip]="t('common.addToOrder')"
                (click)="addToOrder.emit(wine())"
                [attr.aria-label]="t('common.addToOrder')"
              >
                <mat-icon fontIcon="add" />
              </button>
            }
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .wine-card {
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: transform var(--motion-fast, 0.15s), box-shadow var(--motion-fast, 0.15s);

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-level-2);
      }
    }

    .badge-contrast {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: var(--radius-full);
      font: var(--font-eyebrow);
      background: var(--color-ink);
      color: var(--color-on-primary);
      white-space: nowrap;
    }

    .wine-image {
      position: relative;
      height: 180px;
      background: var(--wine-placeholder-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        max-height: 160px;
        max-width: 100%;
        object-fit: contain;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      }
    }

    .wine-badges {
      position: absolute;
      top: var(--space-xs, 8px);
      right: var(--space-xs, 8px);
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 4px);
      align-items: flex-end;
    }

    .wine-content {
      padding: var(--space-md, 16px);
    }

    .wine-header {
      margin-bottom: var(--space-xs, 8px);
    }

    .wine-name {
      font-size: var(--font-size-md, 1rem);
      font-weight: 600;
      color: var(--color-ink);
      margin: 0 0 var(--space-xxs, 4px) 0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .wine-producer {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-ink-secondary);
    }

    .wine-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 4px);
      margin-bottom: var(--space-md, 16px);
    }

    .wine-detail {
      display: flex;
      align-items: center;
      gap: var(--space-xxs, 4px);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-ink-secondary);

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: var(--color-ink-secondary);
      }
    }

    .wine-sku {
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .wine-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: var(--space-xs, 8px);
      border-top: 1px solid var(--color-hairline);
    }

    .wine-actions {
      display: flex;
      gap: var(--space-xxs, 4px);
    }
  `]
})
export class WineCardComponent {
  /** Wine data to display */
  wine = input.required<WineCardData>();

  /** Show the detail button */
  showDetailButton = input<boolean>(true);

  /** Show the add to order button */
  showAddButton = input<boolean>(true);

  /** Emitted when view detail is clicked */
  viewDetail = output<WineCardData>();

  /** Emitted when add to order is clicked */
  addToOrder = output<WineCardData>();

  private imageFailed = signal(false);

  imageSrc = computed(() => {
    if (this.imageFailed()) {
      return 'assets/images/wine-placeholder.svg';
    }
    const wine = this.wine();
    if (wine.imageUrl) return wine.imageUrl;
    return 'assets/images/wine-placeholder.svg';
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }
}
