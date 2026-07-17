import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PriceDisplayComponent, SimplePrices } from '../../../../shared/components/price-display/price-display.component';
import { MarginIndicatorComponent } from '../../../../shared/components/margin-indicator/margin-indicator.component';
import { StockBadgeComponent } from '../../../../shared/components/stock-badge/stock-badge.component';
import {
  CUSTOMERS,
  Customer,
  WINES,
  Wine,
  WAREHOUSES,
  Warehouse,
  getStockPosition,
  getWarehousesWithStock
} from '../../../../mock/data';

interface OrderItem {
  id: string;
  wine: Wine;
  warehouse: Warehouse;
  quantity: number;
  unitPrice: SimplePrices;
  unitCost: SimplePrices;
  totalPrice: SimplePrices;
  marginPercentage: number;
  availableStock: number;
}

@Component({
  selector: 'app-sales-order-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    MatAutocompleteModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    PriceDisplayComponent,
    MarginIndicatorComponent,
    StockBadgeComponent
  ],
  template: `
    <div class="create-order-page" *transloco="let t">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('sales.createOrder') }}</h1>
          <p class="text-secondary">{{ t('sales.orderDetail') }}</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="cancel()">
            <mat-icon fontIcon="close" />
            {{ t('common.cancel') }}
          </button>
          <button
            mat-stroked-button
            (click)="saveDraft()"
            [disabled]="!canSave()"
          >
            <mat-icon fontIcon="save" />
            {{ t('sales.saveDraft') }}
          </button>
          <button
            mat-flat-button
            (click)="submitOrder()"
            [disabled]="!canSubmit()"
          >
            <mat-icon fontIcon="send" />
            {{ t('sales.submitOrder') }}
          </button>
        </div>
      </div>

      <div class="order-grid">
        <!-- Customer Selection -->
        <mat-card appearance="outlined" class="customer-card">
          <mat-card-header>
            <mat-card-title>{{ t('sales.selectCustomer') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>{{ t('sales.selectCustomer') }}</mat-label>
              <mat-select
                [(ngModel)]="selectedCustomer"
                [compareWith]="compareCustomers"
              >
                @if (selectedCustomer(); as customer) {
                  <mat-select-trigger class="customer-selected">
                    <span class="customer-name">{{ customer.tradeName }}</span>
                    <span class="customer-type">{{ customer.type }}</span>
                  </mat-select-trigger>
                }
                <mat-option [value]="null">{{ t('sales.selectCustomer') }}</mat-option>
                @for (customer of customerOptions; track customer.id) {
                  <mat-option [value]="customer">
                    <div class="customer-option">
                      <div class="customer-info">
                        <span class="customer-name">{{ customer.tradeName }}</span>
                        <span class="customer-company">{{ customer.companyName }}</span>
                      </div>
                      <span class="customer-type-badge">{{ customer.type }}</span>
                    </div>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (selectedCustomer()) {
              <div class="customer-details">
                <mat-divider />
                <div class="details-grid">
                  <div class="detail">
                    <span class="label">{{ t('customers.taxId') }}</span>
                    <span class="value">{{ selectedCustomer()!.taxId }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">{{ t('customers.paymentTerms') }}</span>
                    <span class="value">{{ selectedCustomer()!.salesCondition.paymentTermDays }} {{ t('common.days') }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">{{ t('customers.discount') }}</span>
                    <span class="value">{{ selectedCustomer()!.salesCondition.discountPercentage }}%</span>
                  </div>
                  <div class="detail">
                    <span class="label">{{ t('customers.creditLimit') }}</span>
                    <span class="value">{{ formatPrice(selectedCustomer()!.salesCondition.creditLimit.BRL) }}</span>
                  </div>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Order Summary -->
        <mat-card appearance="outlined" class="summary-card">
          <mat-card-header>
            <mat-card-title>{{ t('sales.orderSummary') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-content">
              <div class="summary-row">
                <span class="summary-label">{{ t('sales.subtotal') }}</span>
                <app-price-display [price]="orderTotals().totalPrice" size="medium" />
              </div>
              <div class="summary-row">
                <span class="summary-label">{{ t('common.margin') }}</span>
                <app-price-display [price]="orderTotals().totalMargin" size="medium" />
              </div>
              <mat-divider />
              <div class="summary-row total">
                <span class="summary-label">{{ t('common.total') }}</span>
                <app-price-display [price]="orderTotals().totalPrice" size="large" />
              </div>
              <div class="summary-row margin-total">
                <span class="summary-label">{{ t('sales.marginPercentage') }}</span>
                <app-margin-indicator [marginPercentage]="orderTotals().marginPercentage" />
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Add Item Section -->
      <mat-card appearance="outlined" class="add-item-card">
        <mat-card-header>
          <mat-card-title>{{ t('sales.addItem') }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="add-item-form">
            <div class="form-row">
              <div class="form-field wine-field">
                <label>{{ t('sales.selectWine') }}</label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <input
                    matInput
                    [matAutocomplete]="auto"
                    [ngModel]="searchText()"
                    (ngModelChange)="searchText.set($event)"
                    (input)="searchWines($event)"
                    [placeholder]="t('sales.selectWine')"
                  />
                  <mat-autocomplete
                    #auto="matAutocomplete"
                    [displayWith]="displayFn"
                    (optionSelected)="onWineSelected($event)"
                  >
                    @for (wine of filteredWines(); track wine.id) {
                      <mat-option [value]="wine">
                        <div class="wine-option">
                          <div class="wine-info">
                            <span class="wine-name">{{ wine.name }}</span>
                            <span class="wine-sku">{{ wine.sku }}</span>
                          </div>
                          <span class="wine-price">{{ formatPrice(wine.prices.BRL) }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-autocomplete>
                </mat-form-field>
              </div>

              <div class="form-field warehouse-field">
                <label>{{ t('sales.selectWarehouse') }}</label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <mat-select
                    [(ngModel)]="selectedWarehouse"
                    [disabled]="!selectedWine()"
                    [compareWith]="compareWarehouses"
                  >
                    @if (selectedWarehouse(); as warehouse) {
                      <mat-select-trigger>{{ warehouse.code }} - {{ warehouse.name }}</mat-select-trigger>
                    }
                    <mat-option [value]="null">{{ t('sales.selectWarehouse') }}</mat-option>
                    @for (wh of availableWarehouses(); track wh.id) {
                      <mat-option [value]="wh">
                        <div class="warehouse-option">
                          <span class="wh-code">{{ wh.code }}</span>
                          <span class="wh-name">{{ wh.name }}</span>
                          <app-stock-badge [quantity]="getStockForWarehouse(wh.id)" />
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-field quantity-field">
                <label>{{ t('common.quantity') }}</label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <input
                    matInput
                    type="number"
                    [ngModel]="itemQuantity()"
                    (ngModelChange)="itemQuantity.set($event)"
                    min="1"
                    [max]="maxQuantity()"
                    [disabled]="!selectedWarehouse()"
                  />
                </mat-form-field>
              </div>

              <div class="form-field action-field">
                <button
                  mat-flat-button
                  (click)="addItem()"
                  [disabled]="!canAddItem()"
                  style="width: 100%;"
                >
                  <mat-icon fontIcon="add" />
                  {{ t('sales.addItem') }}
                </button>
              </div>
            </div>

            @if (selectedWine() && selectedWarehouse()) {
              <div class="item-preview">
                <div class="preview-row">
                  <span class="preview-label">{{ t('common.price') }}:</span>
                  <app-price-display [price]="selectedWine()!.prices" />
                </div>
                <div class="preview-row">
                  <span class="preview-label">{{ t('common.margin') }}:</span>
                  <app-margin-indicator [marginPercentage]="calculateItemMargin(selectedWine()!)" />
                </div>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Order Items -->
      <mat-card appearance="outlined" class="items-card">
        <mat-card-header>
          <mat-card-title>{{ t('sales.orderItems') }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="orderItems()" style="min-width: 60rem">
            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef>{{ t('catalog.wine.sku') }}</th>
              <td mat-cell *matCellDef="let item"><span class="sku">{{ item.wine.sku }}</span></td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>{{ t('catalog.wine.name') }}</th>
              <td mat-cell *matCellDef="let item">
                <div class="item-wine">
                  <span class="wine-name">{{ item.wine.name }}</span>
                  <span class="wine-producer">{{ item.wine.producer }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="warehouse">
              <th mat-header-cell *matHeaderCellDef>{{ t('warehouse.code') }}</th>
              <td mat-cell *matCellDef="let item"><strong>{{ item.warehouse.code }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.quantity') }}</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <mat-form-field appearance="outline" class="quantity-input-form">
                  <input
                    matInput
                    type="number"
                    [ngModel]="item.quantity"
                    (ngModelChange)="updateItemQuantity(i, $event)"
                    min="1"
                    [max]="item.availableStock"
                  />
                </mat-form-field>
              </td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.price') }}</th>
              <td mat-cell *matCellDef="let item"><app-price-display [price]="item.unitPrice" /></td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.total') }}</th>
              <td mat-cell *matCellDef="let item"><app-price-display [price]="item.totalPrice" /></td>
            </ng-container>

            <ng-container matColumnDef="margin">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.margin') }}</th>
              <td mat-cell *matCellDef="let item"><app-margin-indicator [marginPercentage]="item.marginPercentage" /></td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.actions') }}</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <button
                  mat-icon-button
                  matTooltip="{{ t('common.delete') }}"
                  (click)="removeItem(i)"
                >
                  <mat-icon fontIcon="delete" />
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            @if (orderItems().length === 0) {
              <tr class="mat-row">
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="vinheria-empty-state">
                    <mat-icon fontIcon="shopping_cart" />
                    <p>{{ t('sales.noItemsAdded') }}</p>
                  </div>
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-order-page {
      animation: fadeIn var(--motion-normal);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-lg);
      flex-wrap: wrap;
      gap: var(--space-md);

      h1 { margin-bottom: var(--space-xxs); }
    }

    .header-actions {
      display: flex;
      gap: var(--space-sm);
    }

    .order-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-lg);
      margin-bottom: var(--space-lg);

      @media (max-width: 839px) {
        grid-template-columns: 1fr;
      }
    }

    .customer-card,
    .summary-card {
      margin-bottom: 0;
    }

    .customer-card mat-card-header,
    .summary-card mat-card-header,
    .add-item-card mat-card-header,
    .items-card mat-card-header {
      padding-bottom: 0;
    }

    .customer-selected {
      display: flex;
      align-items: center;
      gap: var(--space-sm);

      .customer-name { font-weight: 600; }
      .customer-type {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
    }

    .customer-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-xxs) 0;
    }

    .customer-info {
      display: flex;
      flex-direction: column;

      .customer-name { font-weight: 600; }
      .customer-company {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
    }

    .customer-type-badge {
      font-size: var(--font-size-xs, 0.75rem);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      background: var(--color-canvas-soft);
    }

    .customer-details {
      margin-top: var(--space-md);
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
      margin-top: var(--space-md);
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .label {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
      .value { font-weight: 600; }
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.total {
        font-size: var(--font-size-lg, 1.125rem);
        font-weight: 700;
      }
    }

    .add-item-form {
      .form-row {
        display: grid;
        grid-template-columns: 2fr 1fr 150px auto;
        gap: var(--space-md);
        align-items: end;

        @media (max-width: 839px) {
          grid-template-columns: 1fr;
        }
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-xxs);

        label {
          font-size: var(--font-size-sm, 0.875rem);
          font-weight: 600;
          color: var(--color-ink-secondary);
        }
      }

      .action-field {
        justify-content: flex-end;
      }
    }

    .wine-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-xxs) 0;

      .wine-info {
        display: flex;
        flex-direction: column;

        .wine-name { font-weight: 600; }
        .wine-sku {
          font-size: var(--font-size-xs, 0.75rem);
          font-family: var(--font-mono, monospace);
          color: var(--color-ink-secondary);
        }
      }

      .wine-price {
        font-weight: 600;
        color: var(--color-primary);
      }
    }

    .warehouse-option {
      display: flex;
      align-items: center;
      gap: var(--space-sm);

      .wh-code { font-weight: 600; }
      .wh-name {
        flex: 1;
        color: var(--color-ink-secondary);
      }
    }

    .item-preview {
      display: flex;
      gap: var(--space-lg);
      margin-top: var(--space-md);
      padding: var(--space-md);
      background: var(--color-canvas-soft);
      border-radius: var(--radius-md);

      .preview-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .preview-label {
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-ink-secondary);
      }
    }

    .add-item-card,
    .items-card {
      margin-bottom: var(--space-lg);
    }

    .sku {
      font-family: var(--font-mono, monospace);
      font-size: var(--font-size-sm, 0.875rem);
    }

    .item-wine {
      display: flex;
      flex-direction: column;

      .wine-name { font-weight: 600; }
      .wine-producer {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }
    }

    .quantity-input-form {
      width: 100px;
    }
  `]
})
export class SalesOrderCreateComponent {
  private router = inject(Router);
  private currencyService = inject(CurrencyService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // Customer selection
  customerOptions = CUSTOMERS.filter(c => c.status === 'ACTIVE');
  selectedCustomer = signal<Customer | null>(null);

  // Wine selection
  allWines = WINES;
  wineSearchResults = signal<Wine[]>([]);
  selectedWine = signal<Wine | null>(null);
  searchText = signal('');

  // Warehouse selection
  selectedWarehouse = signal<Warehouse | null>(null);

  // Quantity
  itemQuantity = signal(1);

  // Order items
  orderItems = signal<OrderItem[]>([]);

  readonly displayedColumns = ['sku', 'name', 'warehouse', 'quantity', 'price', 'total', 'margin', 'actions'];

  // Computed: filtered wines based on search
  filteredWines = computed(() => this.wineSearchResults());

  // Computed: available warehouses for selected wine
  availableWarehouses = computed(() => {
    const wine = this.selectedWine();
    if (!wine) return [];
    return getWarehousesWithStock(wine.sku);
  });

  // Computed: max quantity based on stock
  maxQuantity = computed(() => {
    const wine = this.selectedWine();
    const warehouse = this.selectedWarehouse();
    if (!wine || !warehouse) return 1;

    const stock = getStockPosition(warehouse.id, wine.sku);
    return stock?.availableQuantity ?? 0;
  });

  // Computed: order totals
  orderTotals = computed(() => {
    const items = this.orderItems();

    const totalPrice: SimplePrices = { BRL: 0, PYG: 0, USD: 0 };
    const totalCost: SimplePrices = { BRL: 0, PYG: 0, USD: 0 };

    items.forEach(item => {
      totalPrice.BRL += item.totalPrice.BRL;
      totalPrice.PYG += item.totalPrice.PYG;
      totalPrice.USD += item.totalPrice.USD;

      totalCost.BRL += item.unitCost.BRL * item.quantity;
      totalCost.PYG += item.unitCost.PYG * item.quantity;
      totalCost.USD += item.unitCost.USD * item.quantity;
    });

    const totalMargin: SimplePrices = {
      BRL: totalPrice.BRL - totalCost.BRL,
      PYG: totalPrice.PYG - totalCost.PYG,
      USD: totalPrice.USD - totalCost.USD
    };

    const marginPercentage = totalPrice.BRL > 0
      ? (totalMargin.BRL / totalPrice.BRL) * 100
      : 0;

    return {
      totalPrice,
      totalCost,
      totalMargin,
      marginPercentage: Math.round(marginPercentage * 10) / 10
    };
  });

  // Computed: can add item
  canAddItem = computed(() => {
    return this.selectedWine() !== null &&
           this.selectedWarehouse() !== null &&
           this.itemQuantity() > 0 &&
           this.itemQuantity() <= this.maxQuantity();
  });

  // Computed: can save
  canSave = computed(() => {
    return this.selectedCustomer() !== null && this.orderItems().length > 0;
  });

  // Computed: can submit
  canSubmit = computed(() => {
    return this.canSave();
  });

  displayFn = (value: Wine | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name;
  };

  compareCustomers(a: Customer | null, b: Customer | null): boolean {
    return a?.id === b?.id;
  }

  compareWarehouses(a: Warehouse | null, b: Warehouse | null): boolean {
    return a?.id === b?.id;
  }

  searchWines(event: Event): void {
    this.selectedWine.set(null);
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    if (!query) {
      this.wineSearchResults.set([]);
      return;
    }

    this.wineSearchResults.set(
      this.allWines.filter(wine =>
        wine.name.toLowerCase().includes(query) ||
        wine.sku.toLowerCase().includes(query) ||
        wine.producer.toLowerCase().includes(query)
      ).slice(0, 20)
    );
  }

  onWineSelected(event: MatAutocompleteSelectedEvent): void {
    const wine = event.option.value as Wine;
    this.selectedWine.set(wine);
    this.searchText.set(wine.name);
  }

  getStockForWarehouse(warehouseId: string): number {
    const wine = this.selectedWine();
    if (!wine) return 0;
    const stock = getStockPosition(warehouseId, wine.sku);
    return stock?.availableQuantity ?? 0;
  }

  calculateItemMargin(wine: Wine): number {
    return ((wine.prices.BRL - wine.cost.BRL) / wine.prices.BRL) * 100;
  }

  formatPrice(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  addItem(): void {
    const wine = this.selectedWine();
    const warehouse = this.selectedWarehouse();
    const quantity = this.itemQuantity();

    if (!wine || !warehouse) return;

    const stock = getStockPosition(warehouse.id, wine.sku);
    const marginPercentage = this.calculateItemMargin(wine);

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      wine,
      warehouse,
      quantity,
      unitPrice: wine.prices,
      unitCost: wine.cost,
      totalPrice: {
        BRL: wine.prices.BRL * quantity,
        PYG: wine.prices.PYG * quantity,
        USD: wine.prices.USD * quantity
      },
      marginPercentage: Math.round(marginPercentage * 10) / 10,
      availableStock: stock?.availableQuantity ?? 0
    };

    this.orderItems.update(items => [...items, newItem]);

    // Reset selection
    this.selectedWine.set(null);
    this.selectedWarehouse.set(null);
    this.itemQuantity.set(1);
    this.searchText.set('');

    this.notificationService.add({
      severity: 'success',
      summary: 'Item Added',
      detail: `${wine.name} added to order`
    });
  }

  updateItemQuantity(index: number, quantity: number): void {
    this.orderItems.update(items => {
      const item = items[index];
      item.quantity = quantity;
      item.totalPrice = {
        BRL: item.unitPrice.BRL * quantity,
        PYG: item.unitPrice.PYG * quantity,
        USD: item.unitPrice.USD * quantity
      };
      return [...items];
    });
  }

  removeItem(index: number): void {
    this.orderItems.update(items => items.filter((_, i) => i !== index));
  }

  saveDraft(): void {
    this.notificationService.add({
      severity: 'info',
      summary: 'Draft Saved',
      detail: 'Order saved as draft'
    });
    // In a real app, would save to backend
  }

  submitOrder(): void {
    const isAdmin = this.authService.userRole() === 'ADMIN';

    this.notificationService.add({
      severity: 'success',
      summary: 'Order Submitted',
      detail: isAdmin ? 'Order has been auto-approved' : 'Order sent for approval'
    });

    // Navigate back to list after short delay
    setTimeout(() => {
      this.router.navigate(['/sales']);
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/sales']);
  }
}
