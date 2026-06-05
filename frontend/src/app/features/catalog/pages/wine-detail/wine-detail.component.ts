import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { PriceDisplayComponent } from '../../../../shared/components/price-display/price-display.component';
import { StockBadgeComponent } from '../../../../shared/components/stock-badge/stock-badge.component';
import {
  Wine,
  getWineById,
  getStockBySku,
  StockPosition,
  WAREHOUSES,
  Warehouse
} from '../../../../mock/data';

interface StockInfo extends StockPosition {
  warehouse: Warehouse;
}

@Component({
  selector: 'app-wine-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    DividerModule,
    PriceDisplayComponent,
    StockBadgeComponent
  ],
  template: `
    <div class="wine-detail-page" *transloco="let t">
      @if (wine()) {
        <!-- Back Button -->
        <div class="back-nav">
          <p-button
            icon="pi pi-arrow-left"
            [label]="t('common.backToCatalog')"
            [text]="true"
            (onClick)="goBack()"
          />
        </div>

        <div class="wine-detail-grid">
          <!-- Wine Image -->
          <div class="wine-image-section">
            <div class="wine-image-container">
              <img [src]="imageSrc()" [alt]="wine()!.name" (error)="onImageError()" />
            </div>
          </div>

          <!-- Wine Info -->
          <div class="wine-info-section">
            <div class="wine-header">
              <div class="wine-badges">
                <p-tag [value]="wine()!.vintage.toString()" severity="contrast" />
                <p-tag [value]="wine()!.grapeVariety" severity="secondary" />
                <p-tag [value]="wine()!.country" severity="info" />
              </div>
              <h1>{{ wine()!.name }}</h1>
              <p class="wine-producer">{{ wine()!.producer }}</p>
            </div>

            <p-divider />

            <!-- Pricing -->
            <div class="wine-pricing">
              <div class="price-main">
                <span class="price-label">{{ t('catalog.price') }}</span>
                <app-price-display [price]="wine()!.prices" size="large" />
              </div>
              <div class="price-currencies">
                <div class="currency-item">
                  <span class="currency-code">BRL</span>
                  <span class="currency-value">R$ {{ wine()!.prices.BRL | number:'1.2-2' }}</span>
                </div>
                <div class="currency-item">
                  <span class="currency-code">PYG</span>
                  <span class="currency-value">{{ wine()!.prices.PYG | number:'1.0-0' }}</span>
                </div>
                <div class="currency-item">
                  <span class="currency-code">USD</span>
                  <span class="currency-value">$ {{ wine()!.prices.USD | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <p-divider />

            <!-- Wine Details -->
            <div class="wine-details-grid">
              <div class="detail-item">
                <i class="pi pi-map-marker"></i>
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.region') }}</span>
                  <span class="detail-value">{{ wine()!.region }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-globe"></i>
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.country') }}</span>
                  <span class="detail-value">{{ wine()!.country }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-tag"></i>
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.grapeVariety') }}</span>
                  <span class="detail-value">{{ wine()!.grapeVariety }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-percentage"></i>
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.alcohol') }}</span>
                  <span class="detail-value">{{ wine()!.alcoholContent }}%</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-box"></i>
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.bottleSize') }}</span>
                  <span class="detail-value">{{ wine()!.bottleSize }}ml</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-barcode"></i>
                <div class="detail-content">
                  <span class="detail-label">SKU</span>
                  <span class="detail-value sku">{{ wine()!.sku }}</span>
                </div>
              </div>
            </div>

            <p-divider />

            <!-- Description -->
            <div class="wine-description">
              <h3>{{ t('catalog.description') }}</h3>
              <p>{{ wine()!.description }}</p>
            </div>

            <div class="wine-tasting">
              <h3>{{ t('catalog.tastingNotes') }}</h3>
              <p>{{ wine()!.tastingNotes }}</p>
            </div>
          </div>
        </div>

        <!-- Stock by Warehouse -->
        <p-card [header]="t('catalog.stockByWarehouse')" styleClass="stock-card">
          <p-table [value]="stockInfo()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ t('warehouse.code') }}</th>
                <th>{{ t('warehouse.name') }}</th>
                <th>{{ t('warehouse.location') }}</th>
                <th>{{ t('catalog.available') }}</th>
                <th>{{ t('catalog.reserved') }}</th>
                <th>{{ t('catalog.status') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-stock>
              <tr>
                <td><strong>{{ stock.warehouse.code }}</strong></td>
                <td>{{ stock.warehouse.name }}</td>
                <td>{{ stock.warehouse.city }}, {{ stock.warehouse.country }}</td>
                <td>
                  <span class="quantity">{{ stock.availableQuantity }}</span>
                </td>
                <td>
                  <span class="quantity reserved">{{ stock.reservedQuantity }}</span>
                </td>
                <td>
                  <app-stock-badge [quantity]="stock.availableQuantity" />
                </td>
                <td>
                  <p-button
                    icon="pi pi-plus"
                    [label]="t('common.addToOrder')"
                    [disabled]="stock.availableQuantity === 0"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="text-center p-4">
                  {{ t('catalog.noStockAvailable') }}
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      } @else {
        <!-- Not Found -->
        <div class="not-found">
          <i class="pi pi-search"></i>
          <h2>{{ t('catalog.wineNotFound') }}</h2>
          <p>{{ t('catalog.wineNotFoundDescription') }}</p>
          <p-button [label]="t('common.backToCatalog')" (onClick)="goBack()" />
        </div>
      }
    </div>
  `,
  styles: [`
    .wine-detail-page {
      animation: fadeIn var(--vinheria-transition-normal, 0.3s);
    }

    .back-nav {
      margin-bottom: var(--vinheria-spacing-lg, 24px);
    }

    .wine-detail-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--vinheria-spacing-xl, 32px);
      margin-bottom: var(--vinheria-spacing-xl, 32px);

      @media (min-width: 840px) {
        grid-template-columns: minmax(300px, 400px) 1fr;
      }
    }

    .wine-image-section {
      position: sticky;
      top: var(--vinheria-spacing-lg, 24px);
      height: fit-content;

      @media (max-width: 839px) {
        position: relative;
        top: 0;
      }
    }

    .wine-image-container {
      background: var(--vinheria-wine-image-gradient);
      border-radius: var(--vinheria-radius-lg, 12px);
      padding: var(--vinheria-spacing-xl, 32px);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;

      img {
        max-height: 350px;
        max-width: 100%;
        object-fit: contain;
        filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
      }
    }

    .wine-info-section {
      background: var(--m3-surface);
      border-radius: var(--vinheria-radius-lg, 12px);
      padding: var(--vinheria-spacing-xl, 32px);
      box-shadow: var(--p-card-shadow);
    }

    .wine-header {
      margin-bottom: var(--vinheria-spacing-md, 16px);
    }

    .wine-badges {
      display: flex;
      gap: var(--vinheria-spacing-sm, 8px);
      margin-bottom: var(--vinheria-spacing-md, 16px);
      flex-wrap: wrap;
    }

    .wine-header h1 {
      font-size: var(--vinheria-font-size-2xl, 1.5rem);
      margin-bottom: var(--vinheria-spacing-xs, 4px);
    }

    .wine-producer {
      font-size: var(--vinheria-font-size-md, 1rem);
      color: var(--m3-on-surface-variant);
    }

    .wine-pricing {
      display: flex;
      flex-direction: column;
      gap: var(--vinheria-spacing-md, 16px);
    }

    .price-main {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md, 16px);
    }

    .price-label {
      font-size: var(--vinheria-font-size-sm, 0.875rem);
      color: var(--m3-on-surface-variant);
    }

    .price-currencies {
      display: flex;
      gap: var(--vinheria-spacing-lg, 24px);
      flex-wrap: wrap;
    }

    .currency-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .currency-code {
      font-size: var(--vinheria-font-size-xs, 0.75rem);
      color: var(--m3-on-surface-variant);
      font-weight: 600;
    }

    .currency-value {
      font-family: var(--vinheria-font-mono, 'JetBrains Mono', monospace);
      font-size: var(--vinheria-font-size-sm, 0.875rem);
    }

    .wine-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--vinheria-spacing-md, 16px);
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: var(--vinheria-spacing-sm, 8px);

      i {
        color: var(--m3-primary);
        font-size: 1rem;
        margin-top: 2px;
      }
    }

    .detail-content {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: var(--vinheria-font-size-xs, 0.75rem);
      color: var(--m3-on-surface-variant);
    }

    .detail-value {
      font-weight: 600;

      &.sku {
        font-family: var(--vinheria-font-mono, 'JetBrains Mono', monospace);
      }
    }

    .wine-description,
    .wine-tasting {
      h3 {
        font-size: var(--vinheria-font-size-md, 1rem);
        margin-bottom: var(--vinheria-spacing-sm, 8px);
      }

      p {
        color: var(--m3-on-surface-variant);
        line-height: 1.6;
      }
    }

    .wine-tasting {
      margin-top: var(--vinheria-spacing-md, 16px);
    }

    :host ::ng-deep .stock-card {
      .p-card-body {
        padding: var(--vinheria-spacing-lg, 24px);
      }
    }

    .quantity {
      font-weight: 600;
      font-family: var(--vinheria-font-mono, 'JetBrains Mono', monospace);

      &.reserved {
        color: var(--vinheria-warning, #ed6c02);
      }
    }

    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--vinheria-spacing-3xl, 64px);
      text-align: center;

      i {
        font-size: 5rem;
        color: var(--m3-on-surface-variant);
        opacity: 0.3;
        margin-bottom: var(--vinheria-spacing-lg, 24px);
      }

      h2 {
        margin-bottom: var(--vinheria-spacing-sm, 8px);
      }

      p {
        color: var(--m3-on-surface-variant);
        margin-bottom: var(--vinheria-spacing-lg, 24px);
      }
    }


  `]
})
export class WineDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private currencyService = inject(CurrencyService);

  wine = signal<Wine | null>(null);

  stockInfo = computed<StockInfo[]>(() => {
    const wine = this.wine();
    if (!wine) return [];

    const stockPositions = getStockBySku(wine.sku);
    return stockPositions.map(sp => ({
      ...sp,
      warehouse: WAREHOUSES.find(w => w.id === sp.warehouseId)!
    })).filter(si => si.warehouse);
  });

  private imageFailed = signal(false);

  imageSrc = computed(() => {
    if (this.imageFailed()) {
      return 'assets/images/wine-placeholder.svg';
    }
    const wine = this.wine();
    if (wine?.imageUrl) return wine.imageUrl;
    return 'assets/images/wine-placeholder.svg';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const wine = getWineById(id);
      this.wine.set(wine || null);
    }
  }

  goBack(): void {
    this.router.navigate(['/catalog']);
  }

  onImageError(): void {
    this.imageFailed.set(true);
  }
}
