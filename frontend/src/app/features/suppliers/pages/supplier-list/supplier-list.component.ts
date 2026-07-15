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
import { MatChipsModule } from '@angular/material/chips';

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
    MatChipsModule,
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
          <button mat-flat-button (click)="addSupplier()">
            <mat-icon fontIcon="add" />
            {{ t('suppliers.addSupplier') }}
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

      <!-- Suppliers Table -->
      <mat-card appearance="outlined">
        <mat-card-content>
          <table
            mat-table
            [dataSource]="filteredSuppliers()"
            matSort
            (matSortChange)="onSortChange($event)"
            style="min-width: 80rem"
          >
            <!-- tradeName Column -->
            <ng-container matColumnDef="tradeName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="tradeName">
                {{ t('suppliers.name') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <div class="supplier-name">
                  <strong>{{ supplier.tradeName }}</strong>
                  <span class="company-name">{{ supplier.companyName }}</span>
                  <span class="location">{{ supplier.city }}, {{ supplier.country }}</span>
                </div>
              </td>
            </ng-container>

            <!-- contact Column -->
            <ng-container matColumnDef="contact">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('suppliers.contact') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <div class="contact-info">
                  <span class="contact-person">{{ supplier.contactPerson }}</span>
                  <span class="email">{{ supplier.email }}</span>
                </div>
              </td>
            </ng-container>

            <!-- wineRegions Column -->
            <ng-container matColumnDef="wineRegions">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('suppliers.wineRegions') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <div class="regions">
                  <mat-chip-set>
                    @for (region of supplier.wineRegions.slice(0, 3); track region) {
                      <mat-chip>{{ region }}</mat-chip>
                    }
                  </mat-chip-set>
                  @if (supplier.wineRegions.length > 3) {
                    <span class="more-regions">+{{ supplier.wineRegions.length - 3 }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- minimumOrder Column -->
            <ng-container matColumnDef="minimumOrder">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="minimumOrder">
                {{ t('suppliers.minimumOrder') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <app-price-display [price]="supplier.purchaseCondition.minimumOrderValue" />
              </td>
            </ng-container>

            <!-- leadTime Column -->
            <ng-container matColumnDef="leadTime">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="leadTime">
                {{ t('suppliers.leadTime') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <span class="lead-time">
                  {{ supplier.purchaseCondition.leadTimeDays }} {{ t('suppliers.days') }}
                </span>
              </td>
            </ng-container>

            <!-- paymentTerms Column -->
            <ng-container matColumnDef="paymentTerms">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('suppliers.paymentTerms') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <span class="payment-terms">
                  {{ supplier.purchaseCondition.paymentTermDays }} {{ t('suppliers.days') }}
                  @if (supplier.purchaseCondition.discountPercentage > 0) {
                    <span class="discount">({{ supplier.purchaseCondition.discountPercentage }}% disc.)</span>
                  }
                </span>
              </td>
            </ng-container>

            <!-- status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="status">
                {{ t('common.status') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <span class="badge badge-{{ getStatusSeverity(supplier.status) }}">{{ t('customers.status.' + supplier.status) }}</span>
              </td>
            </ng-container>

            <!-- actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('common.actions') }}
              </th>
              <td mat-cell *matCellDef="let supplier">
                <div class="actions">
                  <button
                    mat-icon-button
                    matTooltip="{{ t('common.view') }}"
                    (click)="viewSupplier(supplier)"
                  >
                    <mat-icon fontIcon="visibility" />
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="{{ t('common.edit') }}"
                    (click)="editSupplier(supplier)"
                  >
                    <mat-icon fontIcon="edit" />
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="{{ t('suppliers.createOrder') }}"
                    (click)="createOrderForSupplier(supplier)"
                  >
                    <mat-icon fontIcon="shopping_cart" />
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="viewSupplier(row)"></tr>

            @if (filteredSuppliers().length === 0) {
              <tr class="mat-row">
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="vinheria-empty-state">
                    <mat-icon fontIcon="local_shipping" />
                    <h3>{{ t('suppliers.noSuppliers') }}</h3>
                    <p>{{ t('suppliers.noSuppliersDescription') }}</p>
                  </div>
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Supplier Detail Dialog -->
      <ng-template #detailDialog>
        <h2 mat-dialog-title>{{ selectedSupplier()?.tradeName || '' }}</h2>
        <mat-dialog-content>
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
                <mat-chip-set>
                  @for (region of selectedSupplier()!.wineRegions; track region) {
                    <mat-chip>{{ region }}</mat-chip>
                  }
                </mat-chip-set>
              </div>
            </div>
          }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="dialog.closeAll()">{{ t('common.close') }}</button>
          <button mat-flat-button (click)="onDialogCreateOrder()">
            <mat-icon fontIcon="shopping_cart" />
            {{ t('suppliers.createOrder') }}
          </button>
        </mat-dialog-actions>
      </ng-template>
    </div>
  `,
  styles: [`
    .suppliers-page {
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

    .supplier-name {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: var(--color-ink);
      }

      .company-name, .location {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
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
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
    }

    .regions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs);
      align-items: center;

      .more-regions {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
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
    .badge-secondary { background: var(--color-ink-muted); }

    .lead-time, .payment-terms {
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

    .supplier-detail {
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
export class SupplierListComponent {
  private currencyService = inject(CurrencyService);
  readonly dialog = inject(MatDialog);
  @ViewChild('detailDialog', { read: TemplateRef }) detailDialog!: TemplateRef<unknown>;

  // State
  searchQuery = signal('');
  selectedCountry = signal<FilterOption<string> | null>(null);
  selectedStatus = signal<FilterOption<SupplierStatus> | null>(null);
  selectedSupplier = signal<Supplier | null>(null);
  sort = signal<Sort>({ active: '', direction: '' });

  readonly displayedColumns = ['tradeName', 'contact', 'wineRegions', 'minimumOrder', 'leadTime', 'paymentTerms', 'status', 'actions'];

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
    const sort = this.sort();

    let results = SUPPLIERS.filter(supplier => {
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

    // Client-side sorting
    if (sort.active && sort.direction) {
      results = [...results].sort((a, b) => {
        const dir = sort.direction === 'asc' ? 1 : -1;
        let aVal: unknown, bVal: unknown;

        switch (sort.active) {
          case 'tradeName': aVal = a.tradeName; bVal = b.tradeName; break;
          case 'minimumOrder': aVal = a.purchaseCondition.minimumOrderValue.BRL; bVal = b.purchaseCondition.minimumOrderValue.BRL; break;
          case 'leadTime': aVal = a.purchaseCondition.leadTimeDays; bVal = b.purchaseCondition.leadTimeDays; break;
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

  getStatusSeverity(status: SupplierStatus): string {
    const severities: Record<SupplierStatus, string> = {
      'ACTIVE': 'success',
      'INACTIVE': 'secondary'
    };
    return severities[status] || 'secondary';
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCountry.set(null);
    this.selectedStatus.set(null);
  }

  addSupplier(): void {
    console.log('Add supplier');
  }

  viewSupplier(supplier: Supplier): void {
    this.selectedSupplier.set(supplier);
    this.dialog.open(this.detailDialog, { width: '600px' });
  }

  editSupplier(supplier: Supplier): void {
    console.log('Edit supplier:', supplier);
  }

  createOrderForSupplier(supplier: Supplier): void {
    console.log('Create order for supplier:', supplier);
  }

  onDialogCreateOrder(): void {
    this.createOrderForSupplier(this.selectedSupplier()!);
    this.dialog.closeAll();
  }

  onSortChange(sort: Sort): void {
    this.sort.set(sort);
  }
}
