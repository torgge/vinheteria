import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { SupportedCurrency } from '../../../../core/currency/currency.model';
import { WineCardComponent, WineCardData } from '../../../../shared/components/wine-card/wine-card.component';
import {
  WINES,
  Wine,
  getGrapeVarieties,
  getRegions,
  getCountries,
  getVintages,
  getTotalStockBySku
} from '../../../../mock/data';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-wine-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    WineCardComponent
  ],
  template: `
    <div class="catalog-page" *transloco="let t">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('catalog.title') }}</h1>
          <p class="text-secondary">{{ t('catalog.subtitle', { count: filteredWines().length }) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <mat-card appearance="outlined" class="filters-card">
        <mat-card-content>
          <div class="filters-grid">
            <!-- Search -->
            <div class="filter-item search-filter">
              <label>{{ t('catalog.search') }}</label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-icon matPrefix fontIcon="search" />
                <input
                  matInput
                  type="text"
                  [placeholder]="t('catalog.searchPlaceholder')"
                  [(ngModel)]="searchQuery"
                />
              </mat-form-field>
            </div>

            <!-- Country -->
            <div class="filter-item">
              <label>{{ t('catalog.country') }}</label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select [(ngModel)]="selectedCountry">
                  <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                  @for (opt of countryOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Region -->
            <div class="filter-item">
              <label>{{ t('catalog.region') }}</label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select [(ngModel)]="selectedRegions" multiple>
                  @for (opt of regionOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Grape Variety -->
            <div class="filter-item">
              <label>{{ t('catalog.grapeVariety') }}</label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select [(ngModel)]="selectedGrapes" multiple>
                  @for (opt of grapeOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Vintage -->
            <div class="filter-item">
              <label>{{ t('catalog.vintage') }}</label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select [(ngModel)]="selectedVintage">
                  <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                  @for (opt of vintageOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Price Range -->
            <div class="filter-item price-filter">
              <label>{{ t('catalog.priceRange') }} ({{ currencySymbol() }})</label>
              <div class="price-range-display">
                <span>{{ formatPrice(priceRange()[0]) }}</span>
                <span>-</span>
                <span>{{ formatPrice(priceRange()[1]) }}</span>
              </div>
              <mat-slider [min]="0" [max]="maxPrice()" [step]="10">
                <input matSliderStartThumb [ngModel]="priceRange()[0]" (ngModelChange)="onPriceStartChange($event)">
                <input matSliderEndThumb [ngModel]="priceRange()[1]" (ngModelChange)="onPriceEndChange($event)">
              </mat-slider>
            </div>

            <!-- Clear Filters -->
            <div class="filter-item filter-actions">
              <button mat-stroked-button (click)="clearFilters()">
                <mat-icon fontIcon="filter_list" />
                {{ t('common.clearFilters') }}
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Results -->
      <div class="results-section">
        <div class="results-header">
          <span class="results-count">
            {{ t('catalog.showingWines', { count: filteredWines().length, total: wines.length }) }}
          </span>
          <mat-form-field appearance="outline" class="sort-dropdown">
            <mat-select [(ngModel)]="selectedSort">
              @for (opt of sortOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (filteredWines().length > 0) {
          <div class="vinheria-card-grid">
            @for (wine of sortedWines(); track wine.id) {
              <app-wine-card
                [wine]="toWineCardData(wine)"
                [showAddButton]="true"
                (viewDetail)="onViewDetail($event)"
                (addToOrder)="onAddToOrder($event)"
              />
            }
          </div>
        } @else {
          <div class="vinheria-empty-state">
            <mat-icon fontIcon="search" />
            <h3>{{ t('catalog.noResults') }}</h3>
            <p>{{ t('catalog.noResultsDescription') }}</p>
            <button mat-stroked-button (click)="clearFilters()">{{ t('common.clearFilters') }}</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      animation: fadeIn var(--vinheria-transition-normal, 0.3s);
    }

    .page-header {
      margin-bottom: var(--vinheria-spacing-lg, 24px);

      h1 {
        margin-bottom: var(--vinheria-spacing-xs, 4px);
      }
    }

    .filters-card {
      margin-bottom: var(--vinheria-spacing-lg, 24px);
    }

    .filters-grid {
      display: grid;
      gap: var(--vinheria-spacing-md, 16px);
      align-items: end;
      grid-template-columns: 1fr;

      @media (min-width: 600px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 840px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: var(--vinheria-spacing-xs, 4px);

      label {
        font-size: var(--vinheria-font-size-sm, 0.875rem);
        font-weight: 600;
        color: var(--m3-on-surface-variant);
      }
    }

    .search-filter {
      grid-column: span 2;

      @media (max-width: 599px) {
        grid-column: span 1;
      }
    }

    .price-filter {
      grid-column: span 2;

      @media (max-width: 599px) {
        grid-column: span 1;
      }
    }

    .price-range-display {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm, 8px);
      font-size: var(--vinheria-font-size-sm, 0.875rem);
      color: var(--m3-on-surface);
      font-weight: 600;
      margin-bottom: var(--vinheria-spacing-xs, 4px);
    }

    .filter-actions {
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
    }

    .w-full {
      width: 100%;
    }

    .results-section {
      margin-top: var(--vinheria-spacing-lg, 24px);
    }

    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--vinheria-spacing-md, 16px);
      flex-wrap: wrap;
      gap: var(--vinheria-spacing-sm, 8px);
    }

    .results-count {
      font-size: var(--vinheria-font-size-sm, 0.875rem);
      color: var(--m3-on-surface-variant);
    }

    .sort-dropdown {
      min-width: 200px;
    }

    .vinheria-card-grid {
      display: grid;
      gap: var(--vinheria-spacing-lg, 24px);
      grid-template-columns: 1fr;

      @media (min-width: 600px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 840px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (min-width: 1200px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .vinheria-empty-state {
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.3;
        margin-bottom: var(--vinheria-spacing-md, 16px);
        color: var(--m3-on-surface-variant);
      }
    }
  `]
})
export class WineListComponent {
  private router = inject(Router);
  private currencyService = inject(CurrencyService);

  wines = WINES;

  // Filter state
  searchQuery = signal('');
  selectedCountry = signal<string | null>(null);
  selectedRegions = signal<string[]>([]);
  selectedGrapes = signal<string[]>([]);
  selectedVintage = signal<number | null>(null);
  priceRange = signal<[number, number]>([0, 1500]);
  selectedSort = signal('name-asc');

  // Filter options
  countryOptions = computed<FilterOption[]>(() =>
    getCountries().map(c => ({ label: c, value: c }))
  );

  regionOptions = computed<FilterOption[]>(() =>
    getRegions().map(r => ({ label: r, value: r }))
  );

  grapeOptions = computed<FilterOption[]>(() =>
    getGrapeVarieties().map(g => ({ label: g, value: g }))
  );

  vintageOptions = computed<FilterOption[]>(() =>
    getVintages().map(v => ({ label: v.toString(), value: v.toString() }))
  );

  sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Name (Z-A)', value: 'name-desc' },
    { label: 'Price (Low-High)', value: 'price-asc' },
    { label: 'Price (High-Low)', value: 'price-desc' },
    { label: 'Vintage (Newest)', value: 'vintage-desc' },
    { label: 'Vintage (Oldest)', value: 'vintage-asc' }
  ];

  maxPrice = computed(() => {
    const currency = this.currencyService.selectedCurrency();
    const prices = this.wines.map(w => w.prices[currency]);
    return Math.ceil(Math.max(...prices) / 100) * 100;
  });

  currencySymbol = computed(() => {
    const currency = this.currencyService.selectedCurrency();
    return { BRL: 'R$', PYG: '₲', USD: '$' }[currency];
  });

  // Filtered wines
  filteredWines = computed(() => {
    const currency = this.currencyService.selectedCurrency();
    const search = this.searchQuery().toLowerCase();
    const country = this.selectedCountry();
    const regions = this.selectedRegions();
    const grapes = this.selectedGrapes();
    const vintage = this.selectedVintage();
    const [minPrice, maxPrice] = this.priceRange();

    return this.wines.filter(wine => {
      // Search filter
      if (search) {
        const searchFields = [
          wine.name,
          wine.producer,
          wine.grapeVariety,
          wine.region,
          wine.country,
          wine.sku
        ].join(' ').toLowerCase();
        if (!searchFields.includes(search)) return false;
      }

      // Country filter
      if (country && wine.country !== country) return false;

      // Regions filter
      if (regions.length > 0 && !regions.includes(wine.region)) return false;

      // Grapes filter
      if (grapes.length > 0 && !grapes.some(g => wine.grapeVariety.includes(g))) return false;

      // Vintage filter
      if (vintage && wine.vintage !== vintage) return false;

      // Price filter
      const price = wine.prices[currency];
      if (price < minPrice || price > maxPrice) return false;

      return true;
    });
  });

  // Sorted wines
  sortedWines = computed(() => {
    const wines = [...this.filteredWines()];
    const sort = this.selectedSort();
    const currency = this.currencyService.selectedCurrency();

    switch (sort) {
      case 'name-asc':
        return wines.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return wines.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return wines.sort((a, b) => a.prices[currency] - b.prices[currency]);
      case 'price-desc':
        return wines.sort((a, b) => b.prices[currency] - a.prices[currency]);
      case 'vintage-desc':
        return wines.sort((a, b) => b.vintage - a.vintage);
      case 'vintage-asc':
        return wines.sort((a, b) => a.vintage - b.vintage);
      default:
        return wines;
    }
  });

  toWineCardData(wine: Wine): WineCardData {
    return {
      id: wine.id,
      sku: wine.sku,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      grapeVariety: wine.grapeVariety,
      region: wine.region,
      country: wine.country,
      prices: wine.prices,
      imageUrl: wine.imageUrl,
      stockQuantity: getTotalStockBySku(wine.sku)
    };
  }

  formatPrice(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCountry.set(null);
    this.selectedRegions.set([]);
    this.selectedGrapes.set([]);
    this.selectedVintage.set(null);
    this.priceRange.set([0, this.maxPrice()]);
  }

  onPriceStartChange(value: number): void {
    this.priceRange.set([value, this.priceRange()[1]]);
  }

  onPriceEndChange(value: number): void {
    this.priceRange.set([this.priceRange()[0], value]);
  }

  onViewDetail(wine: WineCardData): void {
    this.router.navigate(['/catalog', wine.id]);
  }

  onAddToOrder(wine: WineCardData): void {
    // TODO: Implement add to order functionality
    console.log('Add to order:', wine);
  }
}
