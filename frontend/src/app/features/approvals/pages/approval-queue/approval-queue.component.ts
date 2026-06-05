import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { formatDate } from '../../../../shared/utils/date.utils';
import { PriceDisplayComponent } from '../../../../shared/components/price-display/price-display.component';
import { MarginIndicatorComponent } from '../../../../shared/components/margin-indicator/margin-indicator.component';
import {
  SALES_ORDERS,
  PURCHASE_ORDERS,
  SalesOrder,
  PurchaseOrder
} from '../../../../mock/data';

type OrderType = 'sales' | 'purchase';

interface PendingOrder {
  id: string;
  orderNumber: string;
  type: OrderType;
  entityName: string;
  totalAmount: { BRL: number; PYG: number; USD: number };
  marginPercentage?: number;
  itemCount: number;
  createdBy: string;
  createdAt: string;
  originalOrder: SalesOrder | PurchaseOrder;
}

@Component({
  selector: 'app-approval-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    TabViewModule,
    DialogModule,
    InputTextareaModule,
    ToastModule,
    TooltipModule,
    PriceDisplayComponent,
    MarginIndicatorComponent
  ],
  providers: [MessageService],
  template: `
    <div class="approval-page" *transloco="let t">
      <p-toast />

      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('approvals.title') }}</h1>
          <p class="text-secondary">{{ t('approvals.queue') }}</p>
        </div>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-value">{{ pendingOrders().length }}</span>
            <span class="stat-label">{{ t('approvals.pending') }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <p-tabView>
        <p-tabPanel [header]="t('common.all') + ' (' + pendingOrders().length + ')'">
          <ng-container *ngTemplateOutlet="ordersTable; context: { orders: pendingOrders() }" />
        </p-tabPanel>
        <p-tabPanel [header]="t('nav.sales') + ' (' + pendingSalesOrders().length + ')'">
          <ng-container *ngTemplateOutlet="ordersTable; context: { orders: pendingSalesOrders() }" />
        </p-tabPanel>
        <p-tabPanel [header]="t('nav.purchases') + ' (' + pendingPurchaseOrders().length + ')'">
          <ng-container *ngTemplateOutlet="ordersTable; context: { orders: pendingPurchaseOrders() }" />
        </p-tabPanel>
      </p-tabView>

      <!-- Orders Table Template -->
      <ng-template #ordersTable let-orders="orders">
        <p-table [value]="orders" [tableStyle]="{ 'min-width': '60rem' }" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ t('approvals.orderType') }}</th>
              <th>Order #</th>
              <th>Customer/Supplier</th>
              <th>{{ t('common.total') }}</th>
              <th>{{ t('common.margin') }}</th>
              <th>Items</th>
              <th>{{ t('approvals.requester') }}</th>
              <th>{{ t('common.date') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-order>
            <tr>
              <td>
                <p-tag
                  [value]="order.type === 'sales' ? t('nav.sales') : t('nav.purchases')"
                  [severity]="order.type === 'sales' ? 'info' : 'warning'"
                />
              </td>
              <td><strong class="order-number">{{ order.orderNumber }}</strong></td>
              <td>{{ order.entityName }}</td>
              <td><app-price-display [price]="order.totalAmount" /></td>
              <td>
                @if (order.marginPercentage !== undefined) {
                  <app-margin-indicator [marginPercentage]="order.marginPercentage" />
                } @else {
                  <span class="na">N/A</span>
                }
              </td>
              <td>{{ order.itemCount }} item(s)</td>
              <td>{{ order.createdBy }}</td>
              <td>{{ formatDate(order.createdAt) }}</td>
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
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9">
                <div class="vinheria-empty-state">
                  <i class="pi pi-check-circle"></i>
                  <h3>{{ t('approvals.noApprovals') }}</h3>
                  <p>All orders have been processed.</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </ng-template>

      <!-- Approve Dialog -->
      <p-dialog
        [(visible)]="showApproveDialog"
        [header]="t('approvals.approve')"
        [modal]="true"
        [style]="{ width: '400px' }"
      >
        @if (selectedOrder()) {
          <div class="dialog-content">
            <p>Are you sure you want to approve order <strong>{{ selectedOrder()!.orderNumber }}</strong>?</p>

            <div class="order-summary">
              <div class="summary-row">
                <span class="label">Total:</span>
                <app-price-display [price]="selectedOrder()!.totalAmount" />
              </div>
              @if (selectedOrder()!.marginPercentage !== undefined) {
                <div class="summary-row">
                  <span class="label">Margin:</span>
                  <app-margin-indicator [marginPercentage]="selectedOrder()!.marginPercentage!" />
                </div>
              }
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
            <p>Reject order <strong>{{ selectedOrder()!.orderNumber }}</strong>?</p>

            <div class="form-field">
              <label>{{ t('approvals.rejectReason') }}</label>
              <textarea
                pInputTextarea
                [(ngModel)]="rejectReason"
                rows="3"
                class="w-full"
                placeholder="Enter reason for rejection..."
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
    .approval-page {
      animation: fadeIn var(--vinheria-transition-normal, 0.3s);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--vinheria-spacing-lg, 24px);

      h1 { margin-bottom: var(--vinheria-spacing-xs, 4px); }
    }

    .stats {
      display: flex;
      gap: var(--vinheria-spacing-md, 16px);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--vinheria-spacing-md, 16px) var(--vinheria-spacing-lg, 24px);
      background: var(--m3-surface);
      border-radius: var(--vinheria-radius-md, 8px);
      box-shadow: var(--p-card-shadow);

      .stat-value {
        font-size: var(--vinheria-font-size-2xl, 1.5rem);
        font-weight: 700;
        color: var(--vinheria-warning, #ed6c02);
      }

      .stat-label {
        font-size: var(--vinheria-font-size-sm, 0.875rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .order-number {
      font-family: var(--vinheria-font-mono, monospace);
      color: var(--m3-primary);
    }

    .na {
      color: var(--m3-on-surface-variant);
      font-style: italic;
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
export class ApprovalQueueComponent {
  private currencyService = inject(CurrencyService);
  private messageService = inject(MessageService);

  // Dialogs
  showApproveDialog = false;
  showRejectDialog = false;
  selectedOrder = signal<PendingOrder | null>(null);
  rejectReason = '';

  // Pending orders
  private allPendingSales = SALES_ORDERS.filter(o => o.status === 'PENDING_APPROVAL');
  private allPendingPurchases = PURCHASE_ORDERS.filter(o => o.status === 'PENDING_APPROVAL');

  // Track processed orders
  private processedIds = signal<Set<string>>(new Set());

  pendingSalesOrders = computed<PendingOrder[]>(() => {
    const processed = this.processedIds();
    return this.allPendingSales
      .filter(o => !processed.has(o.id))
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: 'sales' as OrderType,
        entityName: o.customerName,
        totalAmount: o.totalAmount,
        marginPercentage: o.marginPercentage,
        itemCount: o.items.length,
        createdBy: o.createdBy,
        createdAt: o.createdAt,
        originalOrder: o
      }));
  });

  pendingPurchaseOrders = computed<PendingOrder[]>(() => {
    const processed = this.processedIds();
    return this.allPendingPurchases
      .filter(o => !processed.has(o.id))
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: 'purchase' as OrderType,
        entityName: o.supplierName,
        totalAmount: o.totalAmount,
        marginPercentage: undefined,
        itemCount: o.items.length,
        createdBy: o.createdBy,
        createdAt: o.createdAt,
        originalOrder: o
      }));
  });

  pendingOrders = computed<PendingOrder[]>(() => {
    return [...this.pendingSalesOrders(), ...this.pendingPurchaseOrders()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  formatDate = formatDate;

  viewOrder(order: PendingOrder): void {
    console.log('View order:', order);
    // In real app, would navigate to order detail
  }

  openApproveDialog(order: PendingOrder): void {
    this.selectedOrder.set(order);
    this.showApproveDialog = true;
  }

  openRejectDialog(order: PendingOrder): void {
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
      summary: 'Order Approved',
      detail: `${order.orderNumber} has been approved`
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
      summary: 'Order Rejected',
      detail: `${order.orderNumber} has been rejected`
    });

    this.closeDialogs();
  }
}
