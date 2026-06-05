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

import { CurrencyService } from '../../../../core/currency/currency.service';
import { PriceDisplayComponent } from '../../../../shared/components/price-display/price-display.component';
import {
  CUSTOMERS,
  Customer,
  CustomerStatus,
  CustomerType
} from '../../../../mock/data';

interface FilterOption<T> {
  label: string;
  value: T | null;
}

@Component({
  selector: 'app-customer-list',
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
    PriceDisplayComponent
  ],
  template: `
    <div class="customers-page" *transloco="let t">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('customers.title') }}</h1>
          <p class="text-secondary">{{ t('customers.subtitle') }}</p>
        </div>
        <div class="header-actions">
          <p-button
            [label]="t('customers.addCustomer')"
            icon="pi pi-plus"
            (onClick)="addCustomer()"
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

          <!-- Type Filter -->
          <div class="filter-item">
            <p-dropdown
              [options]="typeOptions"
              [(ngModel)]="selectedType"
              optionLabel="label"
              optionValue="value"
              [placeholder]="t('customers.type')"
              [showClear]="true"
              styleClass="type-dropdown"
            />
          </div>

          <!-- Status Filter -->
          <div class="filter-item">
            <p-dropdown
              [options]="statusOptions"
              [(ngModel)]="selectedStatus"
              optionLabel="label"
              optionValue="value"
              [placeholder]="t('common.status')"
              [showClear]="true"
              styleClass="status-dropdown"
            />
          </div>

          <!-- Country Filter -->
          <div class="filter-item">
            <p-dropdown
              [options]="countryOptions"
              [(ngModel)]="selectedCountry"
              optionLabel="label"
              optionValue="value"
              [placeholder]="t('catalog.country')"
              [showClear]="true"
              styleClass="country-dropdown"
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

      <!-- Customers Table -->
      <p-card>
        <p-table
          [value]="filteredCustomers()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [tableStyle]="{ 'min-width': '80rem' }"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="tradeName">
                {{ t('customers.companyName') }}
                <p-sortIcon field="tradeName" />
              </th>
              <th>{{ t('customers.taxId') }}</th>
              <th pSortableColumn="type">
                {{ t('customers.type') }}
                <p-sortIcon field="type" />
              </th>
              <th>{{ t('customers.location') }}</th>
              <th>{{ t('customers.priceTable') }}</th>
              <th pSortableColumn="salesCondition.creditLimit.BRL">
                {{ t('customers.creditLimit') }}
                <p-sortIcon field="salesCondition.creditLimit.BRL" />
              </th>
              <th>{{ t('customers.paymentTerms') }}</th>
              <th pSortableColumn="status">
                {{ t('common.status') }}
                <p-sortIcon field="status" />
              </th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-customer>
            <tr>
              <td>
                <div class="customer-name">
                  <strong>{{ customer.tradeName }}</strong>
                  <span class="company-name">{{ customer.companyName }}</span>
                </div>
              </td>
              <td>
                <code class="tax-id">{{ customer.taxId }}</code>
              </td>
              <td>
                <p-tag
                  [value]="getTypeLabel(customer.type)"
                  [severity]="getTypeSeverity(customer.type)"
                />
              </td>
              <td>
                <div class="location">
                  <span>{{ customer.city }}, {{ customer.state }}</span>
                  <span class="country">{{ customer.country }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="customer.salesCondition.priceTableName" severity="secondary" />
              </td>
              <td>
                <app-price-display [price]="customer.salesCondition.creditLimit" />
              </td>
              <td>
                <span class="payment-terms">
                  {{ customer.salesCondition.paymentTermDays }} {{ t('customers.days') }}
                  @if (customer.salesCondition.discountPercentage > 0) {
                    <span class="discount">({{ customer.salesCondition.discountPercentage }}% {{ t('customers.discount') }})</span>
                  }
                </span>
              </td>
              <td>
                <p-tag
                  [value]="t('customers.status.' + customer.status)"
                  [severity]="getStatusSeverity(customer.status)"
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
                    (onClick)="viewCustomer(customer)"
                  />
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="warning"
                    [pTooltip]="t('common.edit')"
                    (onClick)="editCustomer(customer)"
                  />
                  <p-button
                    icon="pi pi-shopping-cart"
                    [rounded]="true"
                    [text]="true"
                    [pTooltip]="t('customers.createOrder')"
                    (onClick)="createOrderForCustomer(customer)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9">
                <div class="vinheria-empty-state">
                  <i class="pi pi-users"></i>
                  <h3>{{ t('customers.noCustomers') }}</h3>
                  <p>{{ t('customers.noCustomersDescription') }}</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Customer Detail Dialog -->
      <p-dialog
        [(visible)]="showDetailDialog"
        [header]="selectedCustomer()?.tradeName || ''"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
        @if (selectedCustomer()) {
          <div class="customer-detail">
            <div class="detail-section">
              <h4>{{ t('customers.companyInfo') }}</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">{{ t('customers.companyName') }}:</span>
                  <span>{{ selectedCustomer()!.companyName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.tradeName') }}:</span>
                  <span>{{ selectedCustomer()!.tradeName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.taxId') }}:</span>
                  <code>{{ selectedCustomer()!.taxId }}</code>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.type') }}:</span>
                  <p-tag [value]="getTypeLabel(selectedCustomer()!.type)" />
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>{{ t('customers.contact') }}</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">{{ t('users.email') }}:</span>
                  <span>{{ selectedCustomer()!.email }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.phone') }}:</span>
                  <span>{{ selectedCustomer()!.phone }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.address') }}:</span>
                  <span>{{ selectedCustomer()!.address }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.location') }}:</span>
                  <span>{{ selectedCustomer()!.city }}, {{ selectedCustomer()!.state }}, {{ selectedCustomer()!.country }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>{{ t('customers.salesConditions') }}</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">{{ t('customers.priceTable') }}:</span>
                  <p-tag [value]="selectedCustomer()!.salesCondition.priceTableName" severity="secondary" />
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.paymentTerms') }}:</span>
                  <span>{{ selectedCustomer()!.salesCondition.paymentTermDays }} days</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.discount') }}:</span>
                  <span>{{ selectedCustomer()!.salesCondition.discountPercentage }}%</span>
                </div>
                <div class="detail-row">
                  <span class="label">{{ t('customers.creditLimit') }}:</span>
                  <app-price-display [price]="selectedCustomer()!.salesCondition.creditLimit" />
                </div>
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
            [label]="t('customers.createOrder')"
            icon="pi pi-shopping-cart"
            (onClick)="createOrderForCustomer(selectedCustomer()!); showDetailDialog = false"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .customers-page {
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

    :host ::ng-deep .type-dropdown,
    :host ::ng-deep .status-dropdown,
    :host ::ng-deep .country-dropdown {
      min-width: 150px;
    }

    .customer-name {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: var(--m3-on-surface);
      }

      .company-name {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .tax-id {
      font-family: var(--vinheria-font-mono, monospace);
      font-size: var(--vinheria-font-size-sm, 0.875rem);
      color: var(--m3-on-surface-variant);
    }

    .location {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .country {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .payment-terms {
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

    .customer-detail {
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
    }


  `]
})
export class CustomerListComponent {
  private currencyService = inject(CurrencyService);

  // State
  searchQuery = signal('');
  selectedType = signal<CustomerType | null>(null);
  selectedStatus = signal<CustomerStatus | null>(null);
  selectedCountry = signal<string | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  showDetailDialog = false;

  // Filter options
  typeOptions: FilterOption<CustomerType>[] = [
    { label: 'Restaurant', value: 'RESTAURANT' },
    { label: 'Wine Shop', value: 'WINE_SHOP' },
    { label: 'Hotel', value: 'HOTEL' },
    { label: 'Distributor', value: 'DISTRIBUTOR' },
    { label: 'Bar', value: 'BAR' }
  ];

  statusOptions: FilterOption<CustomerStatus>[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Blocked', value: 'BLOCKED' }
  ];

  countryOptions: FilterOption<string>[] = [
    { label: 'Brazil', value: 'Brazil' },
    { label: 'Paraguay', value: 'Paraguay' }
  ];

  // Filtered customers
  filteredCustomers = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const type = this.selectedType();
    const status = this.selectedStatus();
    const country = this.selectedCountry();

    return CUSTOMERS.filter(customer => {
      // Search filter
      if (search) {
        const searchFields = [
          customer.companyName,
          customer.tradeName,
          customer.taxId,
          customer.city,
          customer.email
        ].join(' ').toLowerCase();
        if (!searchFields.includes(search)) {
          return false;
        }
      }

      // Type filter
      if (type && customer.type !== type) {
        return false;
      }

      // Status filter
      if (status && customer.status !== status) {
        return false;
      }

      // Country filter
      if (country && customer.country !== country) {
        return false;
      }

      return true;
    });
  });

  getTypeLabel(type: CustomerType): string {
    const labels: Record<CustomerType, string> = {
      'RESTAURANT': 'Restaurant',
      'WINE_SHOP': 'Wine Shop',
      'HOTEL': 'Hotel',
      'DISTRIBUTOR': 'Distributor',
      'BAR': 'Bar'
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: CustomerType): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    const severities: Record<CustomerType, 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast'> = {
      'RESTAURANT': 'info',
      'WINE_SHOP': 'success',
      'HOTEL': 'warning',
      'DISTRIBUTOR': 'contrast',
      'BAR': 'secondary'
    };
    return severities[type] || 'secondary';
  }

  getStatusSeverity(status: CustomerStatus): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    const severities: Record<CustomerStatus, 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast'> = {
      'ACTIVE': 'success',
      'INACTIVE': 'secondary',
      'BLOCKED': 'danger'
    };
    return severities[status] || 'secondary';
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set(null);
    this.selectedStatus.set(null);
    this.selectedCountry.set(null);
  }

  addCustomer(): void {
    console.log('Add customer');
    // In real app, would navigate to create customer form
  }

  viewCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.showDetailDialog = true;
  }

  editCustomer(customer: Customer): void {
    console.log('Edit customer:', customer);
    // In real app, would navigate to edit customer form
  }

  createOrderForCustomer(customer: Customer): void {
    console.log('Create order for customer:', customer);
    // In real app, would navigate to sales order create with customer pre-selected
  }
}
