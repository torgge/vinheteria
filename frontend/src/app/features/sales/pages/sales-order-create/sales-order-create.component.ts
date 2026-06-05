import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { AuthService } from '../../../../core/auth/auth.service';
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

interface WineOption {
  id: string;
  sku: string;
  name: string;
  wine: Wine;
}

@Component({
  selector: 'app-sales-order-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    TableModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    AutoCompleteModule,
    TooltipModule,
    PriceDisplayComponent,
    MarginIndicatorComponent,
    StockBadgeComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="create-order-page" *transloco="let t">
      <p-toast />
      <p-confirmDialog />

      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('sales.createOrder') }}</h1>
          <p class="text-secondary">{{ t('sales.orderDetail') }}</p>
        </div>
        <div class="header-actions">
          <p-button
            [label]="t('common.cancel')"
            icon="pi pi-times"
            [text]="true"
            severity="danger"
            (onClick)="cancel()"
          />
          <p-button
            [label]="t('sales.saveDraft')"
            icon="pi pi-save"
            [outlined]="true"
            (onClick)="saveDraft()"
            [disabled]="!canSave()"
          />
          <p-button
            [label]="t('sales.submitOrder')"
            icon="pi pi-send"
            (onClick)="submitOrder()"
            [disabled]="!canSubmit()"
          />
        </div>
      </div>

      <div class="order-grid">
        <!-- Customer Selection -->
        <p-card [header]="t('sales.selectCustomer')" styleClass="customer-card vinheria-card-elevated">
          <p-dropdown
            [options]="customerOptions"
            [(ngModel)]="selectedCustomer"
            optionLabel="tradeName"
            [placeholder]="t('sales.selectCustomer')"
            [filter]="true"
            filterBy="tradeName,companyName"
            [showClear]="true"
            styleClass="w-full"
          >
            <ng-template pTemplate="selectedItem" let-customer>
              <div class="customer-selected">
                <span class="customer-name">{{ customer.tradeName }}</span>
                <span class="customer-type">{{ customer.type }}</span>
              </div>
            </ng-template>
            <ng-template pTemplate="item" let-customer>
              <div class="customer-option">
                <div class="customer-info">
                  <span class="customer-name">{{ customer.tradeName }}</span>
                  <span class="customer-company">{{ customer.companyName }}</span>
                </div>
                <span class="customer-type-badge">{{ customer.type }}</span>
              </div>
            </ng-template>
          </p-dropdown>

          @if (selectedCustomer()) {
            <div class="customer-details">
              <p-divider />
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
        </p-card>

        <!-- Order Summary -->
        <p-card [header]="t('sales.orderSummary')" styleClass="summary-card vinheria-card-elevated">
          <div class="summary-content">
            <div class="summary-row">
              <span class="summary-label">{{ t('sales.subtotal') }}</span>
              <app-price-display [price]="orderTotals().totalPrice" size="medium" />
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ t('common.margin') }}</span>
              <app-price-display [price]="orderTotals().totalMargin" size="medium" />
            </div>
            <p-divider />
            <div class="summary-row total">
              <span class="summary-label">{{ t('common.total') }}</span>
              <app-price-display [price]="orderTotals().totalPrice" size="large" />
            </div>
            <div class="summary-row margin-total">
              <span class="summary-label">{{ t('sales.marginPercentage') }}</span>
              <app-margin-indicator [marginPercentage]="orderTotals().marginPercentage" />
            </div>
          </div>
        </p-card>
      </div>

      <!-- Add Item Section -->
      <p-card [header]="t('sales.addItem')" styleClass="add-item-card vinheria-card-elevated">
        <div class="add-item-form">
          <div class="form-row">
            <div class="form-field wine-field">
              <label>{{ t('sales.selectWine') }}</label>
              <p-autoComplete
                [(ngModel)]="selectedWine"
                [suggestions]="filteredWines()"
                (completeMethod)="searchWines($event)"
                field="name"
                [dropdown]="true"
                [placeholder]="t('sales.selectWine')"
                styleClass="w-full"
              >
                <ng-template let-wine pTemplate="item">
                  <div class="wine-option">
                    <div class="wine-info">
                      <span class="wine-name">{{ wine.name }}</span>
                      <span class="wine-sku">{{ wine.sku }}</span>
                    </div>
                    <span class="wine-price">{{ formatPrice(wine.prices.BRL) }}</span>
                  </div>
                </ng-template>
              </p-autoComplete>
            </div>

            <div class="form-field warehouse-field">
              <label>{{ t('sales.selectWarehouse') }}</label>
              <p-dropdown
                [options]="availableWarehouses()"
                [(ngModel)]="selectedWarehouse"
                optionLabel="code"
                [placeholder]="t('sales.selectWarehouse')"
                [disabled]="!selectedWine()"
                styleClass="w-full"
              >
                <ng-template pTemplate="selectedItem" let-wh>
                  <span>{{ wh.code }} - {{ wh.name }}</span>
                </ng-template>
                <ng-template pTemplate="item" let-wh>
                  <div class="warehouse-option">
                    <span class="wh-code">{{ wh.code }}</span>
                    <span class="wh-name">{{ wh.name }}</span>
                    <app-stock-badge [quantity]="getStockForWarehouse(wh.id)" />
                  </div>
                </ng-template>
              </p-dropdown>
            </div>

            <div class="form-field quantity-field">
              <label>{{ t('common.quantity') }}</label>
              <p-inputNumber
                [(ngModel)]="itemQuantity"
                [min]="1"
                [max]="maxQuantity()"
                [showButtons]="true"
                [disabled]="!selectedWarehouse()"
                styleClass="w-full"
              />
            </div>

            <div class="form-field action-field">
              <p-button
                [label]="t('sales.addItem')"
                icon="pi pi-plus"
                (onClick)="addItem()"
                [disabled]="!canAddItem()"
                styleClass="w-full"
              />
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
      </p-card>

      <!-- Order Items -->
      <p-card [header]="t('sales.orderItems')" styleClass="items-card vinheria-card-elevated">
        <p-table [value]="orderItems()" [tableStyle]="{ 'min-width': '60rem' }">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ t('catalog.wine.sku') }}</th>
              <th>{{ t('catalog.wine.name') }}</th>
              <th>{{ t('warehouse.code') }}</th>
              <th>{{ t('common.quantity') }}</th>
              <th>{{ t('common.price') }}</th>
              <th>{{ t('common.total') }}</th>
              <th>{{ t('common.margin') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item let-rowIndex="rowIndex">
            <tr>
              <td><span class="sku">{{ item.wine.sku }}</span></td>
              <td>
                <div class="item-wine">
                  <span class="wine-name">{{ item.wine.name }}</span>
                  <span class="wine-producer">{{ item.wine.producer }}</span>
                </div>
              </td>
              <td><strong>{{ item.warehouse.code }}</strong></td>
              <td>
                <p-inputNumber
                  [(ngModel)]="item.quantity"
                  [min]="1"
                  [max]="item.availableStock"
                  [showButtons]="true"
                  (onInput)="updateItemQuantity(rowIndex)"
                  styleClass="quantity-input"
                />
              </td>
              <td><app-price-display [price]="item.unitPrice" /></td>
              <td><app-price-display [price]="item.totalPrice" /></td>
              <td><app-margin-indicator [marginPercentage]="item.marginPercentage" /></td>
              <td>
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  severity="danger"
                  [pTooltip]="t('common.delete')"
                  (onClick)="removeItem(rowIndex)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8">
                <div class="vinheria-empty-state">
                  <i class="pi pi-shopping-cart"></i>
                  <p>{{ t('sales.noItemsAdded') }}</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `,
  styles: [`
    .create-order-page {
      animation: fadeIn var(--vinheria-transition-normal);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--vinheria-spacing-lg, 24px);
      flex-wrap: wrap;
      gap: var(--vinheria-spacing-md, 16px);

      h1 { margin-bottom: var(--vinheria-spacing-xs, 4px); }
    }

    .header-actions {
      display: flex;
      gap: var(--vinheria-spacing-sm, 8px);
    }

    .order-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--vinheria-spacing-lg, 24px);
      margin-bottom: var(--vinheria-spacing-lg, 24px);

      @media (max-width: 839px) {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .customer-card,
    :host ::ng-deep .summary-card,
    :host ::ng-deep .add-item-card,
    :host ::ng-deep .items-card {
      .p-card-body { padding: var(--vinheria-spacing-lg, 24px); }
    }

    .customer-selected {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm, 8px);

      .customer-name { font-weight: 600; }
      .customer-type {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .customer-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--vinheria-spacing-xs, 4px) 0;
    }

    .customer-info {
      display: flex;
      flex-direction: column;

      .customer-name { font-weight: 600; }
      .customer-company {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .customer-type-badge {
      font-size: var(--vinheria-font-size-xs, 0.75rem);
      padding: 2px 8px;
      border-radius: var(--vinheria-radius-sm, 4px);
        background: var(--m3-surface-container-low);
    }

    .customer-details {
      margin-top: var(--vinheria-spacing-md, 16px);
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--vinheria-spacing-md, 16px);
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .label {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
      .value { font-weight: 600; }
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: var(--vinheria-spacing-sm, 8px);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.total {
        font-size: var(--vinheria-font-size-lg, 1.125rem);
        font-weight: 700;
      }
    }

    .add-item-form {
      .form-row {
        display: grid;
        grid-template-columns: 2fr 1fr 150px auto;
        gap: var(--vinheria-spacing-md, 16px);
        align-items: end;

        @media (max-width: 839px) {
          grid-template-columns: 1fr;
        }
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--vinheria-spacing-xs, 4px);

        label {
          font-size: var(--vinheria-font-size-sm, 0.875rem);
          font-weight: 600;
          color: var(--m3-on-surface-variant);
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
      padding: var(--vinheria-spacing-xs, 4px) 0;

      .wine-info {
        display: flex;
        flex-direction: column;

        .wine-name { font-weight: 600; }
        .wine-sku {
          font-size: var(--vinheria-font-size-xs, 0.75rem);
          font-family: var(--vinheria-font-mono, monospace);
          color: var(--m3-on-surface-variant);
        }
      }

      .wine-price {
        font-weight: 600;
        color: var(--m3-primary);
      }
    }

    .warehouse-option {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm, 8px);

      .wh-code { font-weight: 600; }
      .wh-name {
        flex: 1;
        color: var(--m3-on-surface-variant);
      }
    }

    .item-preview {
      display: flex;
      gap: var(--vinheria-spacing-lg, 24px);
      margin-top: var(--vinheria-spacing-md, 16px);
      padding: var(--vinheria-spacing-md, 16px);
        background: var(--m3-surface-container-lowest);
      border-radius: var(--vinheria-radius-md, 8px);

      .preview-row {
        display: flex;
        align-items: center;
        gap: var(--vinheria-spacing-sm, 8px);
      }

      .preview-label {
        font-size: var(--vinheria-font-size-sm, 0.875rem);
        color: var(--m3-on-surface-variant);
      }
    }

    :host ::ng-deep .add-item-card,
    :host ::ng-deep .items-card {
      margin-bottom: var(--vinheria-spacing-lg, 24px);
    }

    .sku {
      font-family: var(--vinheria-font-mono, monospace);
      font-size: var(--vinheria-font-size-sm, 0.875rem);
    }

    .item-wine {
      display: flex;
      flex-direction: column;

      .wine-name { font-weight: 600; }
      .wine-producer {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }
    }

    :host ::ng-deep .quantity-input {
      width: 100px;
    }


  `]
})
export class SalesOrderCreateComponent {
  private router = inject(Router);
  private currencyService = inject(CurrencyService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  // Customer selection
  customerOptions = CUSTOMERS.filter(c => c.status === 'ACTIVE');
  selectedCustomer = signal<Customer | null>(null);

  // Wine selection
  allWines = WINES;
  wineSearchResults = signal<Wine[]>([]);
  selectedWine = signal<Wine | null>(null);

  // Warehouse selection
  selectedWarehouse = signal<Warehouse | null>(null);

  // Quantity
  itemQuantity = signal(1);

  // Order items
  orderItems = signal<OrderItem[]>([]);

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

  searchWines(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.wineSearchResults.set(
      this.allWines.filter(wine =>
        wine.name.toLowerCase().includes(query) ||
        wine.sku.toLowerCase().includes(query) ||
        wine.producer.toLowerCase().includes(query)
      ).slice(0, 20)
    );
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

    this.messageService.add({
      severity: 'success',
      summary: 'Item Added',
      detail: `${wine.name} added to order`
    });
  }

  updateItemQuantity(index: number): void {
    this.orderItems.update(items => {
      const item = items[index];
      item.totalPrice = {
        BRL: item.unitPrice.BRL * item.quantity,
        PYG: item.unitPrice.PYG * item.quantity,
        USD: item.unitPrice.USD * item.quantity
      };
      return [...items];
    });
  }

  removeItem(index: number): void {
    this.orderItems.update(items => items.filter((_, i) => i !== index));
  }

  saveDraft(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Draft Saved',
      detail: 'Order saved as draft'
    });
    // In a real app, would save to backend
  }

  submitOrder(): void {
    const isAdmin = this.authService.userRole() === 'ADMIN';

    this.messageService.add({
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
