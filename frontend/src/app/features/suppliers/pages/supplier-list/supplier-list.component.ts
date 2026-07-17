import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { PriceDisplayComponent } from '../../../../shared/components/price-display/price-display.component';
import {
  SUPPLIERS,
  Supplier,
  SupplierStatus
} from '../../../../mock/data';

interface FilterOption<T> {
  label: string;
  value: T | null;
}

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    DialogModule,
    TooltipModule,
    ChipModule,
    PriceDisplayComponent
  ],
  template: `
    <div class="suppliers-page" *transloco="let t">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('suppliers.title') }}</h1>
          <p class="text-secondary">{{ t('suppliers.subtitle') }}</p>
        </div>
        <div class="header-actions">
          <p-button
            [label]="t('suppliers.addSupplier')"
            icon="pi pi-plus"
            (onClick)="addSupplier()"
          />
        </div>
      </div>

      <!-- Filters -->
      <p-card styleClass="filters-card">
        <div class="filters-row">
          <!-- Search -->
          <div class="filter-item search-filter">
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search" />
              <input
                type="text"
                pInputText
                [placeholder]="t('common.search')"
                [(ngModel)]="searchQuery"
              />
            </p-iconField>
          </div>

          <!-- Country Filter -->
          <div class="filter-item">
            <p-dropdown
              [options]="countryOptions"
              [(ngModel)]="selectedCountry"
              optionLabel="label"
              [placeholder]="t('catalog.country')"
              [showClear]="true"
              styleClass="country-dropdown"
            />
          </div>

          <!-- Status Filter -->
          <div class="filter-item">
            <p-dropdown
              [options]="statusOptions"
              [(ngModel)]="selectedStatus"
              optionLabel="label"
              [placeholder]="t('common.status')"
              [showClear]="true"
              styleClass="status-dropdown"
            />
          </div>

          <!-- Clear Filters -->
          <div class="filter-item">
            <p-button
              icon="pi pi-filter-slash"
              [text]="true"
              severity="info"
              [pTooltip]="t('common.clearFilters')"
              (onClick)="clearFilters()"
            />
          </div>
        </div>
      </p-card>

      <!-- Suppliers Table -->
      <p-card>
        <p-table
          [value]="filteredSuppliers()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [tableStyle]="{ 'min-width': '80rem' }"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="tradeName">
                {{ t('suppliers.name') }}
                <p-sortIcon field="tradeName" />
              </th>
              <th>{{ t('suppliers.contact') }}</th>
              <th>{{ t('suppliers.wineRegions') }}</th>
              <th pSortableColumn="purchaseCondition.minimumOrderValue.BRL">
                {{ t('suppliers.minimumOrder') }}
                <p-sortIcon field="purchaseCondition.minimumOrderValue.BRL" />
              </th>
              <th pSortableColumn="purchaseCondition.leadTimeDays">
                {{ t('suppliers.leadTime') }}
                <p-sortIcon field="purchaseCondition.leadTimeDays" />
              </th>
              <th>{{ t('suppliers.paymentTerms') }}</th>
              <th pSortableColumn="status">
                {{ t('common.status') }}
                <p-sortIcon field="status" />
              </th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-supplier>
            <tr>
              <td>
                <div class="supplier-name">
                  <strong>{{ supplier.tradeName }}</strong>
                  <span class="company-name">{{ supplier.companyName }}</span>
                  <span class="location">{{ supplier.city }}, {{ supplier.country }}</span>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <span class="contact-person">{{ supplier.contactPerson }}</span>
                  <span class="email">{{ supplier.email }}</span>
                </div>
              </td>
              <td>
                <div class="regions">
                  @for (region of supplier.wineRegions.slice(0, 3); track region) {
                    <p-chip [label]="region" styleClass="region-chip" />
                  }
                  @if (supplier.wineRegions.length > 3) {
                    <span class="more-regions">+{{ supplier.wineRegions.length - 3 }}</span>
                  }
                </div>
              </td>
              <td>
                <app-price-display [price]="supplier.purchaseCondition.minimumOrderValue" />
              </td>
              <td>
                <span class="lead-time">
                  {{ supplier.purchaseCondition.leadTimeDays }} {{ t('suppliers.days') }}
                </span>
              </td>
              <td>
                <span class="payment-terms">
                  {{ supplier.purchaseCondition.paymentTermDays }} {{ t('suppliers.days') }}
                  @if (supplier.purchaseCondition.discountPercentage > 0) {
                    <span class="discount">({{ supplier.purchaseCondition.discountPercentage }}% disc.)</span>
                  }
                </span>
              </td>
              <td>
                <p-tag
                  [value]="supplier.status === 'ACTIVE' ? t('customers.status.ACTIVE') : t('customers.status.INACTIVE')"
                  [severity]="supplier.status === 'ACTIVE' ? 'success' : 'secondary'"
                />
              </td>
              <td>
                <div class="actions">
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    [pTooltip]="t('common.view')"
                    (onClick)="viewSupplier(supplier)"
                  />
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="warning"
                    [pTooltip]="t('common.edit')"
                    (onClick)="editSupplier(supplier)"
                  />
                  <p-button
                    icon="pi pi-shopping-cart"
                    [rounded]="true"
                    [text]="true"
                    [pTooltip]="t('suppliers.createOrder')"
                    (onClick)="createOrderForSupplier(supplier)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8">
                <div class="vinheria-empty-state">
                  <i class="pi pi-truck"></i>
                  <h3>{{ t('suppliers.noSuppliers') }}</h3>
                  <p>{{ t('suppliers.noSuppliersDescription') }}</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Supplier Detail Dialog -->
      <p-dialog
        [(visible)]="showDetailDialog"
        [header]="selectedSupplier()?.tradeName || ''"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
        @if (selectedSupplier()) {
          <div class="supplier-detail">
            <div class="detail-section">
              <h4>{{ t('suppliers.companyInfo') }}</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.companyName') }}:</span>
                  <span>{{ selectedSupplier()!.companyName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.taxId') }}:</span>
                  <code>{{ selectedSupplier()!.taxId }}</code>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.location') }}:</span>
                  <span>{{ selectedSupplier()!.city }}, {{ selectedSupplier()!.state }}, {{ selectedSupplier()!.country }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>{{ t('suppliers.contact') }}</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.contactPerson') }}:</span>
                  <span>{{ selectedSupplier()!.contactPerson }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('users.email') }}:</span>
                  <span>{{ selectedSupplier()!.email }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.phone') }}:</span>
                  <span>{{ selectedSupplier()!.phone }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>{{ t('suppliers.purchaseConditions') }}</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.minimumOrder') }}:</span>
                  <app-price-display [price]="selectedSupplier()!.purchaseCondition.minimumOrderValue" />
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.paymentTerms') }}:</span>
                  <span>{{ selectedSupplier()!.purchaseCondition.paymentTermDays }} days</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.leadTime') }}:</span>
                  <span>{{ selectedSupplier()!.purchaseCondition.leadTimeDays }} days</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('suppliers.discount') }}:</span>
                  <span>{{ selectedSupplier()!.purchaseCondition.discountPercentage }}%</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>{{ t('suppliers.wineRegions') }}</h4>
              <div class="regions-list">
                @for (region of selectedSupplier()!.wineRegions; track region) {
                  <p-chip [label]="region" />
                }
              </div>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <p-button
            [label]="t('common.close')"
            [text]="true"
            (onClick)="showDetailDialog = false"
          />
          <p-button
            [label]="t('suppliers.createOrder')"
            icon="pi pi-shopping-cart"
            (onClick)="createOrderForSupplier(selectedSupplier()!); showDetailDialog = false"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .suppliers-page {
      animation: fadeIn var(--vinheria-transition-normal, 0.3s);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--vinheria-spacing-lg, 24px);
      flex-wrap: wrap;
      gap: var(--vinheria-spacing-md, 16px);

      h1 {
        margin-bottom: var(--vinheria-spacing-xs, 4px);
      }
    }

    :host ::ng-deep .filters-card {
      margin-bottom: var(--vinheria-spacing-lg, 24px);

      .p-card-body {
        padding: var(--vinheria-spacing-md, 16px);
      }
    }

    .filters-row {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md, 16px);
      flex-wrap: wrap;
    }

    .filter-item {
      &.search-filter {
        flex: 1;
        min-width: 250px;

        input {
          width: 100%;
        }
      }
    }

    :host ::ng-deep .country-dropdown,
    :host ::ng-deep .status-dropdown {
      min-width: 150px;
    }

    .supplier-name {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: var(--m3-on-surface);
      }

      .company-name, .location {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .contact-person {
        font-weight: 500;
      }

      .email {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .regions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--vinheria-spacing-xs, 4px);
      align-items: center;

      .more-regions {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    :host ::ng-deep .region-chip .p-chip {
      font-size: var(--vinheria-font-size-xs, 0.75rem);
      padding: 2px 8px;
    }

    .lead-time, .payment-terms {
      .discount {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--vinheria-success, #2e7d32);
        font-weight: 600;
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm, 8px);
    }

    .supplier-detail {
      .detail-section {
        margin-bottom: var(--vinheria-spacing-lg, 24px);

        &:last-child {
          margin-bottom: 0;
        }

        h4 {
          margin: 0 0 var(--vinheria-spacing-sm, 8px) 0;
          color: var(--m3-primary);
          font-size: var(--vinheria-font-size-sm, 0.875rem);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .detail-grid {
        display: flex;
        flex-direction: column;
        gap: var(--vinheria-spacing-xs, 4px);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--vinheria-spacing-xs, 4px) var(--vinheria-spacing-sm, 8px);
        background: var(--p-surface-50);
        border-radius: var(--vinheria-radius-sm, 4px);

        .label {
          color: var(--m3-on-surface-variant);
          font-size: var(--vinheria-font-size-sm, 0.875rem);
        }
      }

      .regions-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--vinheria-spacing-xs, 4px);
      }
    }


  `]
})
export class SupplierListComponent {
  private currencyService = inject(CurrencyService);

  // State
  searchQuery = signal('');
  selectedCountry = signal<FilterOption<string> | null>(null);
  selectedStatus = signal<FilterOption<SupplierStatus> | null>(null);
  selectedSupplier = signal<Supplier | null>(null);
  showDetailDialog = false;

  // Filter options
  countryOptions: FilterOption<string>[] = [
    { label: 'Brazil', value: 'Brazil' },
    { label: 'Paraguay', value: 'Paraguay' },
    { label: 'Uruguay', value: 'Uruguay' },
    { label: 'USA', value: 'USA' }
  ];

  statusOptions: FilterOption<SupplierStatus>[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
  ];

  // Filtered suppliers
  filteredSuppliers = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const country = this.selectedCountry();
    const status = this.selectedStatus();

    return SUPPLIERS.filter(supplier => {
      // Search filter
      if (search) {
        const searchFields = [
          supplier.companyName,
          supplier.tradeName,
          supplier.contactPerson,
          supplier.email,
          ...supplier.wineRegions
        ].join(' ').toLowerCase();
        if (!searchFields.includes(search)) {
          return false;
        }
      }

      // Country filter
      if (country && supplier.country !== country.value) {
        return false;
      }

      // Status filter
      if (status && supplier.status !== status.value) {
        return false;
      }

      return true;
    });
  });

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCountry.set(null);
    this.selectedStatus.set(null);
  }

  addSupplier(): void {
    console.log('Add supplier');
    // In real app, would navigate to create supplier form
  }

  viewSupplier(supplier: Supplier): void {
    this.selectedSupplier.set(supplier);
    this.showDetailDialog = true;
  }

  editSupplier(supplier: Supplier): void {
    console.log('Edit supplier:', supplier);
    // In real app, would navigate to edit supplier form
  }

  createOrderForSupplier(supplier: Supplier): void {
    console.log('Create order for supplier:', supplier);
    // In real app, would navigate to purchase order create with supplier pre-selected
  }
}
