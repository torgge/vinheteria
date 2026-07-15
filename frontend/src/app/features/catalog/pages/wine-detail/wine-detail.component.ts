import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';

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
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    PriceDisplayComponent,
    StockBadgeComponent
  ],
  template: `
    <div class="wine-detail-page" *transloco="let t">
      @if (wine()) {
        <!-- Back Button -->
        <div class="back-nav">
          <button mat-stroked-button (click)="goBack()">
            <mat-icon fontIcon="arrow_back" />
            {{ t('common.backToCatalog') }}
          </button>
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
                <span class="badge badge-contrast">{{ wine()!.vintage }}</span>
                <span class="badge badge-secondary">{{ wine()!.grapeVariety }}</span>
                <span class="badge badge-info">{{ wine()!.country }}</span>
              </div>
              <h1>{{ wine()!.name }}</h1>
              <p class="wine-producer">{{ wine()!.producer }}</p>
            </div>

            <mat-divider />

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

            <mat-divider />

            <!-- Wine Details -->
            <div class="wine-details-grid">
              <div class="detail-item">
                <mat-icon fontIcon="location_on" />
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.region') }}</span>
                  <span class="detail-value">{{ wine()!.region }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon fontIcon="language" />
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.country') }}</span>
                  <span class="detail-value">{{ wine()!.country }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon fontIcon="sell" />
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.grapeVariety') }}</span>
                  <span class="detail-value">{{ wine()!.grapeVariety }}</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon fontIcon="percent" />
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.alcohol') }}</span>
                  <span class="detail-value">{{ wine()!.alcoholContent }}%</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon fontIcon="inventory_2" />
                <div class="detail-content">
                  <span class="detail-label">{{ t('catalog.bottleSize') }}</span>
                  <span class="detail-value">{{ wine()!.bottleSize }}ml</span>
                </div>
              </div>
              <div class="detail-item">
                <mat-icon fontIcon="barcode_reader" />
                <div class="detail-content">
                  <span class="detail-label">SKU</span>
                  <span class="detail-value sku">{{ wine()!.sku }}</span>
                </div>
              </div>
            </div>

            <mat-divider />

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
        <mat-card appearance="outlined" class="stock-card">
          <mat-card-header>
            <mat-card-title>{{ t('catalog.stockByWarehouse') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="stockInfo()" style="min-width: 50rem">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>{{ t('warehouse.code') }}</th>
                <td mat-cell *matCellDef="let stock"><strong>{{ stock.warehouse.code }}</strong></td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>{{ t('warehouse.name') }}</th>
                <td mat-cell *matCellDef="let stock">{{ stock.warehouse.name }}</td>
              </ng-container>

              <ng-container matColumnDef="location">
                <th mat-header-cell *matHeaderCellDef>{{ t('warehouse.location') }}</th>
                <td mat-cell *matCellDef="let stock">{{ stock.warehouse.city }}, {{ stock.warehouse.country }}</td>
              </ng-container>

              <ng-container matColumnDef="available">
                <th mat-header-cell *matHeaderCellDef>{{ t('catalog.available') }}</th>
                <td mat-cell *matCellDef="let stock">
                  <span class="quantity">{{ stock.availableQuantity }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="reserved">
                <th mat-header-cell *matHeaderCellDef>{{ t('catalog.reserved') }}</th>
                <td mat-cell *matCellDef="let stock">
                  <span class="quantity reserved">{{ stock.reservedQuantity }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>{{ t('catalog.status') }}</th>
                <td mat-cell *matCellDef="let stock">
                  <app-stock-badge [quantity]="stock.availableQuantity" />
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.actions') }}</th>
                <td mat-cell *matCellDef="let stock">
                  <button mat-mini-fab color="primary" [disabled]="stock.availableQuantity === 0">
                    <mat-icon fontIcon="add" />
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr mat-no-data-row>
                <td [attr.colspan]="displayedColumns.length" class="text-center p-4">
                  {{ t('catalog.noStockAvailable') }}
                </td>
              </tr>
            </table>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Not Found -->
        <div class="not-found">
          <mat-icon fontIcon="search" />
          <h2>{{ t('catalog.wineNotFound') }}</h2>
          <p>{{ t('catalog.wineNotFoundDescription') }}</p>
          <button mat-stroked-button (click)="goBack()">{{ t('common.backToCatalog') }}</button>
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

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: var(--radius-full);
      font: var(--font-eyebrow);
      white-space: nowrap;
      color: var(--color-on-primary);
    }

    .badge-contrast {
      background: var(--color-ink);
    }

    .badge-secondary {
      background: var(--color-ink-muted);
    }

    .badge-info {
      background: var(--color-primary);
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

      mat-icon {
        color: var(--m3-primary);
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
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

    .stock-card {
      margin-top: var(--vinheria-spacing-xl, 32px);
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

      mat-icon {
        font-size: 5rem;
        width: 5rem;
        height: 5rem;
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

  displayedColumns = ['code', 'name', 'location', 'available', 'reserved', 'status', 'actions'];

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
