import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { formatDate } from '../../../../shared/utils/date.utils';
import { AuthService } from '../../../../core/auth/auth.service';
import { PriceDisplayComponent } from '../../../../shared/components/price-display/price-display.component';
import { MarginIndicatorComponent } from '../../../../shared/components/margin-indicator/margin-indicator.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  SALES_ORDERS,
  SalesOrder,
  SalesOrderStatus
} from '../../../../mock/data';

interface StatusOption {
  label: string;
  value: SalesOrderStatus | null;
}

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    TooltipModule,
    PriceDisplayComponent,
    MarginIndicatorComponent,
    StatusBadgeComponent,
    DialogModule,
    InputTextareaModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="sales-orders-page" *transloco="let t">
      <p-toast position="top-right" />
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('sales.title') }}</h1>
          <p class="text-secondary">{{ t('sales.orderList') }}</p>
        </div>
        <div class="header-actions">
          <p-button
            [label]="t('sales.createOrder')"
            icon="pi pi-plus"
            (onClick)="createOrder()"
          />
        </div>
      </div>

      <!-- Filters -->
      <p-card styleClass="filters-card">
        <div class="filters-row">
          <p-iconField iconPosition="left" class="search-field">
            <p-inputIcon styleClass="pi pi-search" />
            <input
              type="text"
              pInputText
              [placeholder]="t('common.search')"
              [(ngModel)]="searchQuery"
            />
          </p-iconField>

          <p-dropdown
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            optionLabel="label"
            [placeholder]="t('common.status')"
            [showClear]="true"
            styleClass="status-dropdown"
          />
        </div>
      </p-card>

      <!-- Orders Table -->
      <p-card styleClass="table-card">
        <p-table
          [value]="filteredOrders()"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          [rowsPerPageOptions]="[10, 25, 50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders"
          [tableStyle]="{ 'min-width': '70rem' }"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="orderNumber">Order # <p-sortIcon field="orderNumber" /></th>
              <th pSortableColumn="customerName">Customer <p-sortIcon field="customerName" /></th>
              <th pSortableColumn="totalAmount.BRL">{{ t('common.total') }} <p-sortIcon field="totalAmount.BRL" /></th>
              <th>{{ t('common.margin') }}</th>
              <th pSortableColumn="status">{{ t('common.status') }} <p-sortIcon field="status" /></th>
              <th>Items</th>
              <th pSortableColumn="createdAt">{{ t('common.date') }} <p-sortIcon field="createdAt" /></th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-order>
            <tr>
              <td>
                <strong class="order-number">{{ order.orderNumber }}</strong>
              </td>
              <td>{{ order.customerName }}</td>
              <td>
                <app-price-display [price]="order.totalAmount" />
              </td>
              <td>
                <app-margin-indicator [marginPercentage]="order.marginPercentage" />
              </td>
              <td>
                <app-status-badge [status]="order.status" context="sales" />
              </td>
              <td>
                <span class="items-count">{{ order.items.length }} item(s)</span>
              </td>
              <td>
                <span class="date">{{ formatDate(order.createdAt) }}</span>
              </td>
              <td>
                <div class="actions">
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    [pTooltip]="t('common.viewDetails')"
                    (onClick)="viewOrder(order)"
                  />
                  @if (order.status === 'DRAFT') {
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      severity="warning"
                      [pTooltip]="t('common.edit')"
                      (onClick)="editOrder(order)"
                    />
                  }
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
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8">
                <div class="vinheria-empty-state">
                  <i class="pi pi-inbox"></i>
                  <p>{{ t('common.noResults') }}</p>
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
        [style]="{ width: '400px' }"
      >
        @if (selectedOrder()) {
          <div class="dialog-content">
            <p>{{ t('approvals.approveConfirmation', { orderNumber: selectedOrder()!.orderNumber }) }}</p>
            <div class="order-summary">
              <div class="summary-row">
                <span class="label">{{ t('common.total') }}:</span>
                <app-price-display [price]="selectedOrder()!.totalAmount" />
              </div>
              @if (selectedOrder()!.marginPercentage !== undefined) {
                <div class="summary-row">
                  <span class="label">{{ t('common.margin') }}:</span>
                  <app-margin-indicator [marginPercentage]="selectedOrder()!.marginPercentage" />
                </div>
              }
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <p-button [label]="t('common.cancel')" [text]="true" (onClick)="closeDialogs()" />
          <p-button [label]="t('approvals.approve')" icon="pi pi-check" severity="success" (onClick)="approveOrder()" />
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
            <p>{{ t('approvals.rejectConfirmation', { orderNumber: selectedOrder()!.orderNumber }) }}</p>
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
          <p-button [label]="t('common.cancel')" [text]="true" (onClick)="closeDialogs()" />
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
    .sales-orders-page {
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
      gap: var(--vinheria-spacing-md, 16px);
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    :host ::ng-deep .status-dropdown {
      min-width: 200px;
    }

    :host ::ng-deep .table-card {
      .p-card-body {
        padding: var(--vinheria-spacing-lg, 24px);
      }
    }

    .order-number {
      font-family: var(--vinheria-font-mono, 'JetBrains Mono', monospace);
      color: var(--m3-primary);
    }

    .items-count {
      font-size: var(--vinheria-font-size-sm, 0.875rem);
      color: var(--m3-on-surface-variant);
    }

    .date {
      font-size: var(--vinheria-font-size-sm, 0.875rem);
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

          .label { color: var(--m3-on-surface-variant); }
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
export class SalesOrderListComponent {
  private router = inject(Router);
  private currencyService = inject(CurrencyService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  orders = SALES_ORDERS;

  searchQuery = signal('');
  selectedStatus = signal<StatusOption | null>(null);

  showApproveDialog = false;
  showRejectDialog = false;
  selectedOrder = signal<SalesOrder | null>(null);
  rejectReason = '';
  private processedIds = signal<Set<string>>(new Set());

  statusOptions: StatusOption[] = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Fulfilled', value: 'FULFILLED' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  filteredOrders = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const status = this.selectedStatus();
    const processed = this.processedIds();

    return this.orders.filter(order => {
      if (processed.has(order.id)) return false;

      if (search) {
        const searchFields = [
          order.orderNumber,
          order.customerName,
          order.createdBy
        ].join(' ').toLowerCase();
        if (!searchFields.includes(search)) return false;
      }

      if (status && order.status !== status.value) return false;

      return true;
    });
  });

  canApprove = computed(() => {
    const role = this.authService.userRole();
    return role === 'MANAGER' || role === 'ADMIN';
  });

  formatDate = formatDate;

  createOrder(): void {
    this.router.navigate(['/sales/create']);
  }

  viewOrder(order: SalesOrder): void {
    this.router.navigate(['/sales', order.id]);
  }

  editOrder(order: SalesOrder): void {
    this.router.navigate(['/sales', order.id, 'edit']);
  }

  openApproveDialog(order: SalesOrder): void {
    this.selectedOrder.set(order);
    this.showApproveDialog = true;
  }

  openRejectDialog(order: SalesOrder): void {
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

    this.processedIds.update(ids => {
      const newIds = new Set(ids);
      newIds.add(order.id);
      return newIds;
    });

    this.messageService.add({
      severity: 'success',
      summary: this.translocoService.translate('approvals.approvedSummary'),
      detail: this.translocoService.translate('approvals.approvedDetail', {
        orderNumber: order.orderNumber
      })
    });

    this.closeDialogs();
  }

  rejectOrder(): void {
    const order = this.selectedOrder();
    if (!order || !this.rejectReason) return;

    this.processedIds.update(ids => {
      const newIds = new Set(ids);
      newIds.add(order.id);
      return newIds;
    });

    this.messageService.add({
      severity: 'warn',
      summary: this.translocoService.translate('approvals.rejectedSummary'),
      detail: this.translocoService.translate('approvals.rejectedDetail', {
        orderNumber: order.orderNumber
      })
    });

    this.closeDialogs();
  }
}
