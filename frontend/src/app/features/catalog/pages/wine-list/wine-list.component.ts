import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

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
    CardModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    SliderModule,
    ButtonModule,
    DataViewModule,
    InputIconModule,
    IconFieldModule,
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
      <p-card styleClass="filters-card">
        <div class="filters-grid">
          <!-- Search -->
          <div class="filter-item search-filter">
            <label>{{ t('catalog.search') }}</label>
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search" />
              <input
                type="text"
                pInputText
                [placeholder]="t('catalog.searchPlaceholder')"
                [(ngModel)]="searchQuery"
              />
            </p-iconField>
          </div>

          <!-- Country -->
          <div class="filter-item">
            <label>{{ t('catalog.country') }}</label>
            <p-dropdown
              [options]="countryOptions()"
              [(ngModel)]="selectedCountry"
              [placeholder]="t('common.all')"
              [showClear]="true"
              styleClass="w-full"
            />
          </div>

          <!-- Region -->
          <div class="filter-item">
            <label>{{ t('catalog.region') }}</label>
            <p-multiSelect
              [options]="regionOptions()"
              [(ngModel)]="selectedRegions"
              [placeholder]="t('common.selectRegions')"
              [maxSelectedLabels]="2"
              styleClass="w-full"
            />
          </div>

          <!-- Grape Variety -->
          <div class="filter-item">
            <label>{{ t('catalog.grapeVariety') }}</label>
            <p-multiSelect
              [options]="grapeOptions()"
              [(ngModel)]="selectedGrapes"
              [placeholder]="t('common.selectGrapes')"
              [maxSelectedLabels]="2"
              styleClass="w-full"
            />
          </div>

          <!-- Vintage -->
          <div class="filter-item">
            <label>{{ t('catalog.vintage') }}</label>
            <p-dropdown
              [options]="vintageOptions()"
              [(ngModel)]="selectedVintage"
              [placeholder]="t('common.all')"
              [showClear]="true"
              styleClass="w-full"
            />
          </div>

          <!-- Price Range -->
          <div class="filter-item price-filter">
            <label>{{ t('catalog.priceRange') }} ({{ currencySymbol() }})</label>
            <div class="price-range-display">
              <span>{{ formatPrice(priceRange()[0]) }}</span>
              <span>-</span>
              <span>{{ formatPrice(priceRange()[1]) }}</span>
            </div>
            <p-slider
              [(ngModel)]="priceRange"
              [range]="true"
              [min]="0"
              [max]="maxPrice()"
              [step]="10"
              styleClass="w-full"
            />
          </div>

          <!-- Clear Filters -->
          <div class="filter-item filter-actions">
            <p-button
              [label]="t('common.clearFilters')"
              icon="pi pi-filter-slash"
              [text]="true"
              severity="info"
              (onClick)="clearFilters()"
            />
          </div>
        </div>
      </p-card>

      <!-- Results -->
      <div class="results-section">
        <div class="results-header">
          <span class="results-count">
            {{ t('catalog.showingWines', { count: filteredWines().length, total: wines.length }) }}
          </span>
          <p-dropdown
            [options]="sortOptions"
            [(ngModel)]="selectedSort"
            styleClass="sort-dropdown"
          />
        </div>

        @if (filteredWines().length > 0) {
          <div class="wines-grid">
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
            <i class="pi pi-search"></i>
            <h3>{{ t('catalog.noResults') }}</h3>
            <p>{{ t('catalog.noResultsDescription') }}</p>
            <p-button [label]="t('common.clearFilters')" (onClick)="clearFilters()" />
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

    :host ::ng-deep .filters-card {
      margin-bottom: var(--vinheria-spacing-lg, 24px);

      .p-card-body {
        padding: var(--vinheria-spacing-lg, 24px);
      }
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

    :host ::ng-deep .sort-dropdown {
      min-width: 200px;
    }

    .wines-grid {
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

  onViewDetail(wine: WineCardData): void {
    this.router.navigate(['/catalog', wine.id]);
  }

  onAddToOrder(wine: WineCardData): void {
    // TODO: Implement add to order functionality
    console.log('Add to order:', wine);
  }
}
