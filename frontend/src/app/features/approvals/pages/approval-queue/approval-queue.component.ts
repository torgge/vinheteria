import { Component, computed, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { NotificationService } from '../../../../core/services/notification.service';
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
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    MatTabsModule,
    PriceDisplayComponent,
    MarginIndicatorComponent
  ],
  template: `
    <div class="approval-page" *transloco="let t">
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
      <mat-tab-group>
        <mat-tab>
          <ng-template mat-tab-label>{{ t('common.all') }} ({{ pendingOrders().length }})</ng-template>
          <ng-container *ngTemplateOutlet="ordersTable; context: { orders: pendingOrders() }" />
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label>{{ t('nav.sales') }} ({{ pendingSalesOrders().length }})</ng-template>
          <ng-container *ngTemplateOutlet="ordersTable; context: { orders: pendingSalesOrders() }" />
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label>{{ t('nav.purchases') }} ({{ pendingPurchaseOrders().length }})</ng-template>
          <ng-container *ngTemplateOutlet="ordersTable; context: { orders: pendingPurchaseOrders() }" />
        </mat-tab>
      </mat-tab-group>

      <!-- Orders Table Template -->
      <ng-template #ordersTable let-orders="orders">
        <mat-card appearance="outlined" class="table-card">
          <mat-card-content>
            <table mat-table [dataSource]="orders" style="min-width: 60rem">
              <!-- orderType Column -->
              <ng-container matColumnDef="orderType">
                <th mat-header-cell *matHeaderCellDef>{{ t('approvals.orderType') }}</th>
                <td mat-cell *matCellDef="let order">
                  <span class="badge badge-{{ order.type === 'sales' ? 'info' : 'warning' }}">
                    {{ order.type === 'sales' ? t('nav.sales') : t('nav.purchases') }}
                  </span>
                </td>
              </ng-container>

              <!-- orderNumber Column -->
              <ng-container matColumnDef="orderNumber">
                <th mat-header-cell *matHeaderCellDef>Order #</th>
                <td mat-cell *matCellDef="let order">
                  <strong class="order-number">{{ order.orderNumber }}</strong>
                </td>
              </ng-container>

              <!-- entityName Column -->
              <ng-container matColumnDef="entityName">
                <th mat-header-cell *matHeaderCellDef>Customer/Supplier</th>
                <td mat-cell *matCellDef="let order">{{ order.entityName }}</td>
              </ng-container>

              <!-- total Column -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.total') }}</th>
                <td mat-cell *matCellDef="let order">
                  <app-price-display [price]="order.totalAmount" />
                </td>
              </ng-container>

              <!-- margin Column -->
              <ng-container matColumnDef="margin">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.margin') }}</th>
                <td mat-cell *matCellDef="let order">
                  @if (order.marginPercentage !== undefined) {
                    <app-margin-indicator [marginPercentage]="order.marginPercentage" />
                  } @else {
                    <span class="na">N/A</span>
                  }
                </td>
              </ng-container>

              <!-- items Column -->
              <ng-container matColumnDef="items">
                <th mat-header-cell *matHeaderCellDef>Items</th>
                <td mat-cell *matCellDef="let order">{{ order.itemCount }} item(s)</td>
              </ng-container>

              <!-- createdBy Column -->
              <ng-container matColumnDef="createdBy">
                <th mat-header-cell *matHeaderCellDef>{{ t('approvals.requester') }}</th>
                <td mat-cell *matCellDef="let order">{{ order.createdBy }}</td>
              </ng-container>

              <!-- createdAt Column -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.date') }}</th>
                <td mat-cell *matCellDef="let order">{{ formatDate(order.createdAt) }}</td>
              </ng-container>

              <!-- actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.actions') }}</th>
                <td mat-cell *matCellDef="let order">
                  <div class="actions">
                    <button
                      mat-icon-button
                      matTooltip="{{ t('common.view') }}"
                      (click)="viewOrder(order)"
                    >
                      <mat-icon fontIcon="visibility" />
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="{{ t('approvals.approve') }}"
                      (click)="openApproveDialog(order)"
                    >
                      <mat-icon fontIcon="check" />
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="{{ t('approvals.reject') }}"
                      (click)="openRejectDialog(order)"
                    >
                      <mat-icon fontIcon="close" />
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              @if (orders.length === 0) {
                <tr class="mat-row">
                  <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                    <div class="vinheria-empty-state">
                      <mat-icon fontIcon="check_circle" />
                      <h3>{{ t('approvals.noApprovals') }}</h3>
                      <p>All orders have been processed.</p>
                    </div>
                  </td>
                </tr>
              }
            </table>
          </mat-card-content>
        </mat-card>
      </ng-template>

      <!-- Approve Dialog -->
      <ng-template #approveDialogTemplate>
        <h2 mat-dialog-title>{{ t('approvals.approve') }}</h2>
        <mat-dialog-content>
          @if (selectedOrder()) {
            <p>Are you sure you want to approve order <strong>{{ selectedOrder()!.orderNumber }}</strong>?</p>
            <div class="order-summary">
              <div class="summary-row">
                <span class="label">{{ t('common.total') }}:</span>
                <app-price-display [price]="selectedOrder()!.totalAmount" />
              </div>
              @if (selectedOrder()!.marginPercentage !== undefined) {
                <div class="summary-row">
                  <span class="label">{{ t('common.margin') }}:</span>
                  <app-margin-indicator [marginPercentage]="selectedOrder()!.marginPercentage!" />
                </div>
              }
            </div>
          }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="dialog.closeAll()">{{ t('common.cancel') }}</button>
          <button mat-flat-button (click)="approveOrder()">
            <mat-icon fontIcon="check" />
            {{ t('approvals.approve') }}
          </button>
        </mat-dialog-actions>
      </ng-template>

      <!-- Reject Dialog -->
      <ng-template #rejectDialogTemplate>
        <h2 mat-dialog-title>{{ t('approvals.reject') }}</h2>
        <mat-dialog-content>
          @if (selectedOrder()) {
            <p>Reject order <strong>{{ selectedOrder()!.orderNumber }}</strong>?</p>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>{{ t('approvals.rejectReason') }}</mat-label>
              <textarea
                matInput
                [(ngModel)]="rejectReason"
                rows="4"
                placeholder="Enter reason for rejection..."
              ></textarea>
            </mat-form-field>
          }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="dialog.closeAll()">{{ t('common.cancel') }}</button>
          <button
            mat-flat-button
            color="warn"
            (click)="rejectOrder()"
            [disabled]="!rejectReason"
          >
            <mat-icon fontIcon="close" />
            {{ t('approvals.reject') }}
          </button>
        </mat-dialog-actions>
      </ng-template>
    </div>
  `,
  styles: [`
    .approval-page {
      animation: fadeIn var(--motion-normal);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-lg);

      h1 { margin-bottom: var(--space-xxs); }
    }

    .stats {
      display: flex;
      gap: var(--space-md);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-md) var(--space-lg);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-level-1);

      .stat-value {
        font-size: var(--font-size-2xl, 1.5rem);
        font-weight: 700;
        color: var(--color-accent-orange, #ed6c02);
      }

      .stat-label {
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-ink-secondary);
      }
    }

    .table-card {
      margin-top: var(--space-md);
    }

    .order-number {
      font-family: var(--font-mono, monospace);
      color: var(--color-primary);
    }

    .na {
      color: var(--color-ink-secondary);
      font-style: italic;
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
    .badge-info { background: var(--color-primary); }
    .badge-warning { background: var(--color-accent-orange); }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .order-summary {
      margin-top: var(--space-md);
      padding: var(--space-md);
      background: var(--color-canvas-soft);
      border-radius: var(--radius-md);

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-xxs) 0;

        .label { color: var(--color-ink-secondary); }
      }
    }
  `]
})
export class ApprovalQueueComponent {
  private currencyService = inject(CurrencyService);
  private notificationService = inject(NotificationService);
  readonly dialog = inject(MatDialog);
  @ViewChild('approveDialogTemplate', { read: TemplateRef }) approveDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('rejectDialogTemplate', { read: TemplateRef }) rejectDialogTemplate!: TemplateRef<unknown>;

  // Dialogs
  selectedOrder = signal<PendingOrder | null>(null);
  rejectReason = '';

  readonly displayedColumns = ['orderType', 'orderNumber', 'entityName', 'total', 'margin', 'items', 'createdBy', 'createdAt', 'actions'];

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
  }

  openApproveDialog(order: PendingOrder): void {
    this.selectedOrder.set(order);
    this.dialog.open(this.approveDialogTemplate, { width: '400px' });
  }

  openRejectDialog(order: PendingOrder): void {
    this.selectedOrder.set(order);
    this.rejectReason = '';
    this.dialog.open(this.rejectDialogTemplate, { width: '450px' });
  }

  approveOrder(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.processedIds.update(ids => {
      const newIds = new Set(ids);
      newIds.add(order.id);
      return newIds;
    });

    this.notificationService.add({
      severity: 'success',
      summary: 'Order Approved',
      detail: `${order.orderNumber} has been approved`
    });

    this.dialog.closeAll();
  }

  rejectOrder(): void {
    const order = this.selectedOrder();
    if (!order || !this.rejectReason) return;

    this.processedIds.update(ids => {
      const newIds = new Set(ids);
      newIds.add(order.id);
      return newIds;
    });

    this.notificationService.add({
      severity: 'warn',
      summary: 'Order Rejected',
      detail: `${order.orderNumber} has been rejected`
    });

    this.dialog.closeAll();
  }
}
