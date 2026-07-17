import { Component, computed, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

import { AuthService } from '../../../../core/auth/auth.service';
import { CurrencyService } from '../../../../core/currency/currency.service';
import { NotificationService } from '../../../../core/services/notification.service';
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
  value: PurchaseOrderStatus;
}

@Component({
  selector: 'app-purchase-order-list',
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
    PriceDisplayComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="purchase-orders-page" *transloco="let t">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('purchases.title') }}</h1>
          <p class="text-secondary">{{ t('purchases.subtitle') }}</p>
        </div>
        <div class="header-actions">
          @if (canCreateOrders()) {
            <button mat-flat-button (click)="createNewOrder()">
              <mat-icon fontIcon="add" />
              {{ t('purchases.createOrder') }}
            </button>
          }
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

      <!-- Orders Table -->
      <mat-card appearance="outlined">
        <mat-card-content>
          <table
            mat-table
            [dataSource]="filteredOrders()"
            matSort
            (matSortChange)="onSortChange($event)"
            style="min-width: 70rem"
          >
            <!-- orderNumber Column -->
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="orderNumber">
                {{ t('common.orderNumber') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <strong class="order-number">{{ order.orderNumber }}</strong>
              </td>
            </ng-container>

            <!-- supplierName Column -->
            <ng-container matColumnDef="supplierName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="supplierName">
                {{ t('purchases.supplier') }}
              </th>
              <td mat-cell *matCellDef="let order">{{ order.supplierName }}</td>
            </ng-container>

            <!-- warehouse Column -->
            <ng-container matColumnDef="warehouse">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('common.warehouse') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <span class="badge badge-info">{{ order.warehouseCode }}</span>
              </td>
            </ng-container>

            <!-- items Column -->
            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('common.items') }}
              </th>
              <td mat-cell *matCellDef="let order">{{ order.items.length }} item(s)</td>
            </ng-container>

            <!-- total Column -->
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="total">
                {{ t('common.total') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <app-price-display [price]="order.totalAmount" />
              </td>
            </ng-container>

            <!-- expectedDeliveryDate Column -->
            <ng-container matColumnDef="expectedDeliveryDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="expectedDeliveryDate">
                {{ t('purchases.expectedDelivery') }}
              </th>
              <td mat-cell *matCellDef="let order">{{ formatDate(order.expectedDeliveryDate) }}</td>
            </ng-container>

            <!-- status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="status">
                {{ t('common.status') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <app-status-badge [status]="order.status" context="purchase" />
              </td>
            </ng-container>

            <!-- createdAt Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="createdAt">
                {{ t('common.date') }}
              </th>
              <td mat-cell *matCellDef="let order">{{ formatDateTime(order.createdAt) }}</td>
            </ng-container>

            <!-- actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('common.actions') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <div class="actions">
                  <button
                    mat-icon-button
                    matTooltip="{{ t('common.view') }}"
                    (click)="viewOrder(order)"
                  >
                    <mat-icon fontIcon="visibility" />
                  </button>
                  @if (canApprove() && order.status === 'PENDING_APPROVAL') {
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
                  }
                  @if (order.status === 'ORDERED') {
                    <button
                      mat-icon-button
                      matTooltip="{{ t('purchases.markReceived') }}"
                      (click)="markAsReceived(order)"
                    >
                      <mat-icon fontIcon="inventory_2" />
                    </button>
                  }
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="viewOrder(row)"></tr>

            @if (filteredOrders().length === 0) {
              <tr class="mat-row">
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="vinheria-empty-state">
                    <mat-icon fontIcon="receipt_long" />
                    <h3>{{ t('purchases.noOrders') }}</h3>
                    <p>{{ t('purchases.noOrdersDescription') }}</p>
                    @if (canCreateOrders()) {
                      <button mat-flat-button (click)="createNewOrder()">
                        <mat-icon fontIcon="add" />
                        {{ t('purchases.createOrder') }}
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Approve Dialog -->
      <ng-template #approveDialogTemplate>
        <h2 mat-dialog-title>{{ t('approvals.approve') }}</h2>
        <mat-dialog-content>
          @if (selectedOrder()) {
            <p>{{ t('purchases.confirmApprove', { orderNumber: selectedOrder()!.orderNumber }) }}</p>
            <div class="order-summary">
              <div class="summary-row">
                <span class="label">{{ t('purchases.supplier') }}:</span>
                <span>{{ selectedOrder()!.supplierName }}</span>
              </div>
              <div class="summary-row">
                <span class="label">{{ t('common.warehouse') }}:</span>
                <span class="badge badge-info">{{ selectedOrder()!.warehouseCode }}</span>
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
            <p>{{ t('purchases.confirmReject', { orderNumber: selectedOrder()!.orderNumber }) }}</p>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>{{ t('approvals.rejectReason') }}</mat-label>
              <textarea
                matInput
                [(ngModel)]="rejectReason"
                rows="4"
                [placeholder]="t('approvals.rejectReasonPlaceholder')"
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
    .purchase-orders-page {
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

    .order-number {
      font-family: var(--font-mono, monospace);
      color: var(--color-primary);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
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
    .badge-info {
      background: var(--color-primary);
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

        .label {
          color: var(--color-ink-secondary);
        }
      }
    }
  `]
})
export class PurchaseOrderListComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private currencyService = inject(CurrencyService);
  private notificationService = inject(NotificationService);
  readonly dialog = inject(MatDialog);
  @ViewChild('approveDialogTemplate', { read: TemplateRef }) approveDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('rejectDialogTemplate', { read: TemplateRef }) rejectDialogTemplate!: TemplateRef<unknown>;

  // State
  searchQuery = signal('');
  selectedOrder = signal<PurchaseOrder | null>(null);
  rejectReason = '';
  sort = signal<Sort>({ active: '', direction: '' });

  readonly displayedColumns = ['orderNumber', 'supplierName', 'warehouse', 'items', 'total', 'expectedDeliveryDate', 'status', 'createdAt', 'actions'];

  // Track order state changes (for demo)
  private orderUpdates = signal<Map<string, Partial<PurchaseOrder>>>(new Map());

  // Status options
  statusOptions: StatusOption[] = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Ordered', value: 'ORDERED' },
    { label: 'Received', value: 'RECEIVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  selectedStatus = signal<StatusOption | null>(null);

  // Filtered orders
  filteredOrders = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const updates = this.orderUpdates();
    const statusValue = this.selectedStatus()?.value;
    const sort = this.sort();

    let results = PURCHASE_ORDERS
      .map(order => {
        const update = updates.get(order.id);
        return update ? { ...order, ...update } : order;
      })
      .filter(order => {
        // Status filter
        if (statusValue && order.status !== statusValue) {
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

    // Client-side sorting
    if (sort.active && sort.direction) {
      results = [...results].sort((a, b) => {
        const dir = sort.direction === 'asc' ? 1 : -1;
        let aVal: unknown, bVal: unknown;

        switch (sort.active) {
          case 'orderNumber': aVal = a.orderNumber; bVal = b.orderNumber; break;
          case 'supplierName': aVal = a.supplierName; bVal = b.supplierName; break;
          case 'total': aVal = a.totalAmount.BRL; bVal = b.totalAmount.BRL; break;
          case 'expectedDeliveryDate': aVal = a.expectedDeliveryDate; bVal = b.expectedDeliveryDate; break;
          case 'status': aVal = a.status; bVal = b.status; break;
          case 'createdAt': aVal = a.createdAt; bVal = b.createdAt; break;
          default: return 0;
        }

        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
      });
    }

    return results;
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
    this.selectedStatus.set(null);
  }

  createNewOrder(): void {
    this.router.navigate(['/purchases/create']);
  }

  viewOrder(order: PurchaseOrder): void {
    console.log('View order:', order);
  }

  openApproveDialog(order: PurchaseOrder): void {
    this.selectedOrder.set(order);
    this.dialog.open(this.approveDialogTemplate, { width: '450px' });
  }

  openRejectDialog(order: PurchaseOrder): void {
    this.selectedOrder.set(order);
    this.rejectReason = '';
    this.dialog.open(this.rejectDialogTemplate, { width: '450px' });
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

    this.orderUpdates.update(updates => {
      const newUpdates = new Map(updates);
      newUpdates.set(order.id, { status: 'REJECTED' });
      return newUpdates;
    });

    this.notificationService.add({
      severity: 'warn',
      summary: 'Order Rejected',
      detail: `${order.orderNumber} has been rejected`
    });

    this.dialog.closeAll();
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

    this.notificationService.add({
      severity: 'success',
      summary: 'Stock Received',
      detail: `${order.orderNumber} has been marked as received`
    });
  }

  onSortChange(sort: Sort): void {
    this.sort.set(sort);
  }
}
