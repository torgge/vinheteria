import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../../core/auth/auth.service';
import { CurrencyService } from '../../../../core/currency/currency.service';
import { formatDate, formatDateTime } from '../../../../shared/utils/date.utils';
import { PriceDisplayComponent } from '../../../../shared/components/price-display/price-display.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  PURCHASE_ORDERS,
  PurchaseOrder,
  PurchaseOrderStatus
} from '../../../../mock/data';

interface StatusOption {
  label: string;
  value: PurchaseOrderStatus | 'ALL';
}

@Component({
  selector: 'app-purchase-order-list',
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
    InputTextareaModule,
    ToastModule,
    TooltipModule,
    PriceDisplayComponent,
    StatusBadgeComponent
  ],
  providers: [MessageService],
  template: `
    <div class="purchase-orders-page" *transloco="let t">
      <p-toast />

      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('purchases.title') }}</h1>
          <p class="text-secondary">{{ t('purchases.subtitle') }}</p>
        </div>
        <div class="header-actions">
          @if (canCreateOrders()) {
            <p-button
              [label]="t('purchases.createOrder')"
              icon="pi pi-plus"
              (onClick)="createNewOrder()"
            />
          }
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

          <!-- Status Filter -->
          <div class="filter-item">
            <p-dropdown
              [options]="statusOptions"
              [(ngModel)]="selectedStatus"
              optionLabel="label"
              [placeholder]="t('common.status')"
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

      <!-- Orders Table -->
      <p-card>
        <p-table
          [value]="filteredOrders()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [tableStyle]="{ 'min-width': '70rem' }"
          styleClass="p-datatable-striped"
          [globalFilterFields]="['orderNumber', 'supplierName', 'warehouseCode']"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="orderNumber">
                {{ t('common.orderNumber') }}
                <p-sortIcon field="orderNumber" />
              </th>
              <th pSortableColumn="supplierName">
                {{ t('purchases.supplier') }}
                <p-sortIcon field="supplierName" />
              </th>
              <th>{{ t('common.warehouse') }}</th>
              <th>{{ t('common.items') }}</th>
              <th pSortableColumn="totalAmount.BRL">
                {{ t('common.total') }}
                <p-sortIcon field="totalAmount.BRL" />
              </th>
              <th pSortableColumn="expectedDeliveryDate">
                {{ t('purchases.expectedDelivery') }}
                <p-sortIcon field="expectedDeliveryDate" />
              </th>
              <th pSortableColumn="status">
                {{ t('common.status') }}
                <p-sortIcon field="status" />
              </th>
              <th pSortableColumn="createdAt">
                {{ t('common.date') }}
                <p-sortIcon field="createdAt" />
              </th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-order>
            <tr>
              <td>
                <strong class="order-number">{{ order.orderNumber }}</strong>
              </td>
              <td>{{ order.supplierName }}</td>
              <td>
                <p-tag [value]="order.warehouseCode" severity="info" />
              </td>
              <td>{{ order.items.length }} item(s)</td>
              <td>
                <app-price-display [price]="order.totalAmount" />
              </td>
              <td>{{ formatDate(order.expectedDeliveryDate) }}</td>
              <td>
                <app-status-badge [status]="order.status" context="purchase" />
              </td>
              <td>{{ formatDateTime(order.createdAt) }}</td>
              <td>
                <div class="actions">
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    [pTooltip]="t('common.view')"
                    (onClick)="viewOrder(order)"
                  />
                  @if (canApprove() && order.status === 'PENDING_APPROVAL') {
                    <p-button
                      icon="pi pi-check"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      [pTooltip]="t('approvals.approve')"
                      (onClick)="openApproveDialog(order)"
                    />
                    <p-button
                      icon="pi pi-times"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      [pTooltip]="t('approvals.reject')"
                      (onClick)="openRejectDialog(order)"
                    />
                  }
                  @if (order.status === 'ORDERED') {
                    <p-button
                      icon="pi pi-box"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      [pTooltip]="t('purchases.markReceived')"
                      (onClick)="markAsReceived(order)"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9">
                <div class="vinheria-empty-state">
                  <i class="pi pi-inbox"></i>
                  <h3>{{ t('purchases.noOrders') }}</h3>
                  <p>{{ t('purchases.noOrdersDescription') }}</p>
                  @if (canCreateOrders()) {
                    <p-button
                      [label]="t('purchases.createOrder')"
                      icon="pi pi-plus"
                      (onClick)="createNewOrder()"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Approve Dialog -->
      <p-dialog
        [(visible)]="showApproveDialog"
        [header]="t('approvals.approve')"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        @if (selectedOrder()) {
          <div class="dialog-content">
            <p>{{ t('purchases.confirmApprove', { orderNumber: selectedOrder()!.orderNumber }) }}</p>

            <div class="order-summary">
              <div class="summary-row">
                <span class="label">{{ t('purchases.supplier') }}:</span>
                <span>{{ selectedOrder()!.supplierName }}</span>
              </div>
              <div class="summary-row">
                <span class="label">{{ t('common.warehouse') }}:</span>
                <p-tag [value]="selectedOrder()!.warehouseCode" severity="info" />
              </div>
              <div class="summary-row">
                <span class="label">{{ t('common.total') }}:</span>
                <app-price-display [price]="selectedOrder()!.totalAmount" />
              </div>
              <div class="summary-row">
                <span class="label">{{ t('purchases.expectedDelivery') }}:</span>
                <span>{{ formatDate(selectedOrder()!.expectedDeliveryDate) }}</span>
              </div>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <p-button
            [label]="t('common.cancel')"
            [text]="true"
            (onClick)="closeDialogs()"
          />
          <p-button
            [label]="t('approvals.approve')"
            icon="pi pi-check"
            severity="success"
            (onClick)="approveOrder()"
          />
        </ng-template>
      </p-dialog>

      <!-- Reject Dialog -->
      <p-dialog
        [(visible)]="showRejectDialog"
        [header]="t('approvals.reject')"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        @if (selectedOrder()) {
          <div class="dialog-content">
            <p>{{ t('purchases.confirmReject', { orderNumber: selectedOrder()!.orderNumber }) }}</p>

            <div class="form-field">
              <label>{{ t('approvals.rejectReason') }}</label>
              <textarea
                pInputTextarea
                [(ngModel)]="rejectReason"
                rows="3"
                class="w-full"
                [placeholder]="t('approvals.rejectReasonPlaceholder')"
              ></textarea>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <p-button
            [label]="t('common.cancel')"
            [text]="true"
            (onClick)="closeDialogs()"
          />
          <p-button
            [label]="t('approvals.reject')"
            icon="pi pi-times"
            severity="danger"
            (onClick)="rejectOrder()"
            [disabled]="!rejectReason"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .purchase-orders-page {
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

    :host ::ng-deep .status-dropdown {
      min-width: 180px;
    }

    .order-number {
      font-family: var(--vinheria-font-mono, monospace);
      color: var(--m3-primary);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm, 8px);
    }

    .dialog-content {
      .order-summary {
        margin-top: var(--vinheria-spacing-md, 16px);
        padding: var(--vinheria-spacing-md, 16px);
        background: var(--p-surface-50);
        border-radius: var(--vinheria-radius-md, 8px);

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--vinheria-spacing-xs, 4px) 0;

          .label {
            color: var(--m3-on-surface-variant);
          }
        }
      }

      .form-field {
        margin-top: var(--vinheria-spacing-md, 16px);

        label {
          display: block;
          margin-bottom: var(--vinheria-spacing-xs, 4px);
          font-weight: 600;
        }
      }
    }


  `]
})
export class PurchaseOrderListComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private currencyService = inject(CurrencyService);
  private messageService = inject(MessageService);

  // State
  searchQuery = signal('');
  selectedOrder = signal<PurchaseOrder | null>(null);
  showApproveDialog = false;
  showRejectDialog = false;
  rejectReason = '';

  // Track order state changes (for demo)
  private orderUpdates = signal<Map<string, Partial<PurchaseOrder>>>(new Map());

  // Status options
  statusOptions: StatusOption[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Ordered', value: 'ORDERED' },
    { label: 'Received', value: 'RECEIVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  selectedStatus = signal<StatusOption>(this.statusOptions[0]);

  // Filtered orders
  filteredOrders = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const updates = this.orderUpdates();

    return PURCHASE_ORDERS
      .map(order => {
        const update = updates.get(order.id);
        return update ? { ...order, ...update } : order;
      })
      .filter(order => {
        // Status filter
        const statusValue = this.selectedStatus().value;
        if (statusValue !== 'ALL' && order.status !== statusValue) {
          return false;
        }

        // Search filter
        if (search) {
          const searchFields = [
            order.orderNumber,
            order.supplierName,
            order.warehouseCode,
            order.createdBy
          ].join(' ').toLowerCase();
          if (!searchFields.includes(search)) {
            return false;
          }
        }

        return true;
      });
  });

  // Permissions
  canCreateOrders = computed(() => {
    const role = this.authService.userRole();
    return role ? ['PURCHASER', 'MANAGER', 'ADMIN'].includes(role) : false;
  });

  canApprove = computed(() => {
    const role = this.authService.userRole();
    return role ? ['MANAGER', 'ADMIN'].includes(role) : false;
  });

  formatDate = formatDate;
  formatDateTime = formatDateTime;

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set(this.statusOptions[0]);
  }

  createNewOrder(): void {
    this.router.navigate(['/purchases/create']);
  }

  viewOrder(order: PurchaseOrder): void {
    console.log('View order:', order);
    // In real app, navigate to order detail
  }

  openApproveDialog(order: PurchaseOrder): void {
    this.selectedOrder.set(order);
    this.showApproveDialog = true;
  }

  openRejectDialog(order: PurchaseOrder): void {
    this.selectedOrder.set(order);
    this.rejectReason = '';
    this.showRejectDialog = true;
  }

  closeDialogs(): void {
    this.showApproveDialog = false;
    this.showRejectDialog = false;
    this.selectedOrder.set(null);
    this.rejectReason = '';
  }

  approveOrder(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.orderUpdates.update(updates => {
      const newUpdates = new Map(updates);
      newUpdates.set(order.id, {
        status: 'APPROVED',
        approvedBy: this.authService.currentUser()?.name || 'Manager',
        approvedAt: new Date().toISOString()
      });
      return newUpdates;
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Order Approved',
      detail: `${order.orderNumber} has been approved`
    });

    this.closeDialogs();
  }

  rejectOrder(): void {
    const order = this.selectedOrder();
    if (!order || !this.rejectReason) return;

    this.orderUpdates.update(updates => {
      const newUpdates = new Map(updates);
      newUpdates.set(order.id, { status: 'REJECTED' });
      return newUpdates;
    });

    this.messageService.add({
      severity: 'warn',
      summary: 'Order Rejected',
      detail: `${order.orderNumber} has been rejected`
    });

    this.closeDialogs();
  }

  markAsReceived(order: PurchaseOrder): void {
    this.orderUpdates.update(updates => {
      const newUpdates = new Map(updates);
      newUpdates.set(order.id, {
        status: 'RECEIVED',
        receivedAt: new Date().toISOString()
      });
      return newUpdates;
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Stock Received',
      detail: `${order.orderNumber} has been marked as received`
    });
  }
}
