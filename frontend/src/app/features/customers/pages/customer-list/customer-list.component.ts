import { Component, computed, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

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
    MatTableModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
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
          <button mat-flat-button (click)="addCustomer()">
            <mat-icon fontIcon="add" />
            {{ t('customers.addCustomer') }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <mat-card appearance="outlined" class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <!-- Search -->
            <mat-form-field appearance="outline" class="search-filter">
              <mat-icon matPrefix fontIcon="search" />
              <input
                matInput
                [placeholder]="t('common.search')"
                [(ngModel)]="searchQuery"
              />
            </mat-form-field>

            <!-- Type Filter -->
            <mat-form-field appearance="outline">
              <mat-label>{{ t('customers.type') }}</mat-label>
              <mat-select [(ngModel)]="selectedType">
                <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                @for (opt of typeOptions; track opt.value) {
                  <mat-option [value]="opt">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Status Filter -->
            <mat-form-field appearance="outline">
              <mat-label>{{ t('common.status') }}</mat-label>
              <mat-select [(ngModel)]="selectedStatus">
                <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                @for (opt of statusOptions; track opt.value) {
                  <mat-option [value]="opt">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Country Filter -->
            <mat-form-field appearance="outline">
              <mat-label>{{ t('catalog.country') }}</mat-label>
              <mat-select [(ngModel)]="selectedCountry">
                <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                @for (opt of countryOptions; track opt.value) {
                  <mat-option [value]="opt">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Clear Filters -->
            <button
              mat-stroked-button
              matTooltip="{{ t('common.clearFilters') }}"
              (click)="clearFilters()"
            >
              <mat-icon fontIcon="filter_list" />
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Customers Table -->
      <mat-card appearance="outlined">
        <mat-card-content>
          <table
            mat-table
            [dataSource]="filteredCustomers()"
            matSort
            (matSortChange)="onSortChange($event)"
            style="min-width: 80rem"
          >
            <!-- tradeName Column -->
            <ng-container matColumnDef="tradeName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="tradeName">
                {{ t('customers.companyName') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <div class="customer-name">
                  <strong>{{ customer.tradeName }}</strong>
                  <span class="company-name">{{ customer.companyName }}</span>
                </div>
              </td>
            </ng-container>

            <!-- taxId Column -->
            <ng-container matColumnDef="taxId">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('customers.taxId') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <code class="tax-id">{{ customer.taxId }}</code>
              </td>
            </ng-container>

            <!-- type Column -->
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="type">
                {{ t('customers.type') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <span class="badge badge-{{ getTypeSeverity(customer.type) }}">{{ getTypeLabel(customer.type) }}</span>
              </td>
            </ng-container>

            <!-- location Column -->
            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('customers.location') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <div class="location">
                  <span>{{ customer.city }}, {{ customer.state }}</span>
                  <span class="country">{{ customer.country }}</span>
                </div>
              </td>
            </ng-container>

            <!-- priceTable Column -->
            <ng-container matColumnDef="priceTable">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('customers.priceTable') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <span class="badge badge-secondary">{{ customer.salesCondition.priceTableName }}</span>
              </td>
            </ng-container>

            <!-- creditLimit Column -->
            <ng-container matColumnDef="creditLimit">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="creditLimit">
                {{ t('customers.creditLimit') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <app-price-display [price]="customer.salesCondition.creditLimit" />
              </td>
            </ng-container>

            <!-- paymentTerms Column -->
            <ng-container matColumnDef="paymentTerms">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('customers.paymentTerms') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <span class="payment-terms">
                  {{ customer.salesCondition.paymentTermDays }} {{ t('customers.days') }}
                  @if (customer.salesCondition.discountPercentage > 0) {
                    <span class="discount">({{ customer.salesCondition.discountPercentage }}% {{ t('customers.discount') }})</span>
                  }
                </span>
              </td>
            </ng-container>

            <!-- status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="status">
                {{ t('common.status') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <span class="badge badge-{{ getStatusSeverity(customer.status) }}">{{ t('customers.status.' + customer.status) }}</span>
              </td>
            </ng-container>

            <!-- actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('common.actions') }}
              </th>
              <td mat-cell *matCellDef="let customer">
                <div class="actions">
                  <button
                    mat-icon-button
                    matTooltip="{{ t('common.view') }}"
                    (click)="viewCustomer(customer)"
                  >
                    <mat-icon fontIcon="visibility" />
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="{{ t('common.edit') }}"
                    (click)="editCustomer(customer)"
                  >
                    <mat-icon fontIcon="edit" />
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="{{ t('customers.createOrder') }}"
                    (click)="createOrderForCustomer(customer)"
                  >
                    <mat-icon fontIcon="shopping_cart" />
                  </button>
                </div>
              </td>
            </ng-container>

            <!-- Empty State -->
            <ng-container matColumnDef="empty">
              <td mat-cell *matCellDef="let customer" [attr.colspan]="displayedColumns.length">
                <div class="vinheria-empty-state">
                  <mat-icon fontIcon="group" />
                  <h3>{{ t('customers.noCustomers') }}</h3>
                  <p>{{ t('customers.noCustomersDescription') }}</p>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="viewCustomer(row)"></tr>

            @if (filteredCustomers().length === 0) {
              <tr class="mat-row">
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="vinheria-empty-state">
                    <mat-icon fontIcon="group" />
                    <h3>{{ t('customers.noCustomers') }}</h3>
                    <p>{{ t('customers.noCustomersDescription') }}</p>
                  </div>
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Customer Detail Dialog -->
      <ng-template #detailDialog>
        <h2 mat-dialog-title>{{ selectedCustomer()?.tradeName || '' }}</h2>
        <mat-dialog-content>
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
                    <span class="badge badge-info">{{ getTypeLabel(selectedCustomer()!.type) }}</span>
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
                    <span class="badge badge-secondary">{{ selectedCustomer()!.salesCondition.priceTableName }}</span>
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
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="dialog.closeAll()">{{ t('common.close') }}</button>
          <button mat-flat-button (click)="onDialogCreateOrder()">
            <mat-icon fontIcon="shopping_cart" />
            {{ t('customers.createOrder') }}
          </button>
        </mat-dialog-actions>
      </ng-template>
    </div>
  `,
  styles: [`
    .customers-page {
      animation: fadeIn var(--motion-normal);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-lg);
      flex-wrap: wrap;
      gap: var(--space-md);

      h1 {
        margin-bottom: var(--space-xxs);
      }
    }

    .filters-card {
      margin-bottom: var(--space-lg);
    }

    .filters-row {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      flex-wrap: wrap;

      mat-form-field {
        min-width: 150px;
      }
    }

    .search-filter {
      flex: 1;
      min-width: 250px;
    }

    .customer-name {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: var(--color-ink);
      }

      .company-name {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
    }

    .tax-id {
      font-family: var(--font-mono, monospace);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-ink-secondary);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: var(--space-xxs) var(--space-xs);
      border-radius: var(--radius-full);
      font: var(--font-eyebrow);
      white-space: nowrap;
      color: var(--color-on-primary);
    }
    .badge-success { background: var(--color-accent-green); }
    .badge-secondary, .badge-contrast { background: var(--color-ink-muted); }
    .badge-info { background: var(--color-primary); }
    .badge-warning { background: var(--color-accent-orange); }
    .badge-danger { background: var(--color-error); }

    .location {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .country {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
    }

    .payment-terms {
      .discount {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-accent-green, #2e7d32);
        font-weight: 600;
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .customer-detail {
      .detail-section {
        margin-bottom: var(--space-lg);

        &:last-child {
          margin-bottom: 0;
        }

        h4 {
          margin: 0 0 var(--space-sm) 0;
          color: var(--color-primary);
          font-size: var(--font-size-sm, 0.875rem);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .detail-grid {
        display: flex;
        flex-direction: column;
        gap: var(--space-xxs);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-xxs) var(--space-sm);
        background: var(--color-canvas-soft);
        border-radius: var(--radius-sm);

        .label {
          color: var(--color-ink-secondary);
          font-size: var(--font-size-sm, 0.875rem);
        }
      }
    }
  `]
})
export class CustomerListComponent {
  private currencyService = inject(CurrencyService);
  readonly dialog = inject(MatDialog);
  @ViewChild('detailDialog', { read: TemplateRef }) detailDialog!: TemplateRef<unknown>;

  // State
  searchQuery = signal('');
  selectedType = signal<FilterOption<CustomerType> | null>(null);
  selectedStatus = signal<FilterOption<CustomerStatus> | null>(null);
  selectedCountry = signal<FilterOption<string> | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  sort = signal<Sort>({ active: '', direction: '' });

  readonly displayedColumns = ['tradeName', 'taxId', 'type', 'location', 'priceTable', 'creditLimit', 'paymentTerms', 'status', 'actions'];

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
    const sort = this.sort();

    let results = CUSTOMERS.filter(customer => {
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
      if (type && customer.type !== type.value) {
        return false;
      }

      // Status filter
      if (status && customer.status !== status.value) {
        return false;
      }

      // Country filter
      if (country && customer.country !== country.value) {
        return false;
      }

      return true;
    });

    // Client-side sorting
    if (sort.active && sort.direction) {
      results = [...results].sort((a, b) => {
        const dir = sort.direction === 'asc' ? 1 : -1;
        let aVal: unknown, bVal: unknown;

        switch (sort.active) {
          case 'tradeName': aVal = a.tradeName; bVal = b.tradeName; break;
          case 'type': aVal = a.type; bVal = b.type; break;
          case 'creditLimit': aVal = a.salesCondition.creditLimit.BRL; bVal = b.salesCondition.creditLimit.BRL; break;
          case 'status': aVal = a.status; bVal = b.status; break;
          default: return 0;
        }

        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
      });
    }

    return results;
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

  getTypeSeverity(type: CustomerType): string {
    const severities: Record<CustomerType, string> = {
      'RESTAURANT': 'info',
      'WINE_SHOP': 'success',
      'HOTEL': 'warning',
      'DISTRIBUTOR': 'contrast',
      'BAR': 'secondary'
    };
    return severities[type] || 'secondary';
  }

  getStatusSeverity(status: CustomerStatus): string {
    const severities: Record<CustomerStatus, string> = {
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
  }

  viewCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.dialog.open(this.detailDialog, { width: '600px' });
  }

  editCustomer(customer: Customer): void {
    console.log('Edit customer:', customer);
  }

  createOrderForCustomer(customer: Customer): void {
    console.log('Create order for customer:', customer);
  }

  onDialogCreateOrder(): void {
    this.createOrderForCustomer(this.selectedCustomer()!);
    this.dialog.closeAll();
  }

  onSortChange(sort: Sort): void {
    this.sort.set(sort);
  }
}
