import { Component, computed, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
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
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { formatDate } from '../../../../shared/utils/date.utils';
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
    MarginIndicatorComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="sales-orders-page" *transloco="let t">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('sales.title') }}</h1>
          <p class="text-secondary">{{ t('sales.orderList') }}</p>
        </div>
        <div class="header-actions">
          <button mat-flat-button (click)="createOrder()">
            <mat-icon fontIcon="add" />
            {{ t('sales.createOrder') }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <mat-card appearance="outlined" class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-filter">
              <mat-icon matPrefix fontIcon="search" />
              <input
                matInput
                [placeholder]="t('common.search')"
                [(ngModel)]="searchQuery"
              />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ t('common.status') }}</mat-label>
              <mat-select [(ngModel)]="selectedStatus">
                <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                @for (opt of statusOptions; track opt.value) {
                  <mat-option [value]="opt">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

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
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="orderNumber">
                Order #
              </th>
              <td mat-cell *matCellDef="let order">
                <strong class="order-number">{{ order.orderNumber }}</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="customerName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="customerName">
                Customer
              </th>
              <td mat-cell *matCellDef="let order">{{ order.customerName }}</td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="total">
                {{ t('common.total') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <app-price-display [price]="order.totalAmount" />
              </td>
            </ng-container>

            <ng-container matColumnDef="margin">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('common.margin') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <app-margin-indicator [marginPercentage]="order.marginPercentage" />
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="status">
                {{ t('common.status') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <app-status-badge [status]="order.status" context="sales" />
              </td>
            </ng-container>

            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>
                Items
              </th>
              <td mat-cell *matCellDef="let order">
                <span class="items-count">{{ order.items.length }} item(s)</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header="createdAt">
                {{ t('common.date') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <span class="date">{{ formatDate(order.createdAt) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>
                {{ t('common.actions') }}
              </th>
              <td mat-cell *matCellDef="let order">
                <div class="actions">
                  <button
                    mat-icon-button
                    matTooltip="{{ t('common.viewDetails') }}"
                    (click)="$event.stopPropagation(); viewOrder(order)"
                  >
                    <mat-icon fontIcon="visibility" />
                  </button>
                  @if (order.status === 'DRAFT') {
                    <button
                      mat-icon-button
                      matTooltip="{{ t('common.edit') }}"
                      (click)="$event.stopPropagation(); editOrder(order)"
                    >
                      <mat-icon fontIcon="edit" />
                    </button>
                  }
                  @if (canApprove() && order.status === 'PENDING_APPROVAL') {
                    <button
                      mat-icon-button
                      matTooltip="{{ t('approvals.approve') }}"
                      (click)="$event.stopPropagation(); openApproveDialog(order)"
                    >
                      <mat-icon fontIcon="check" />
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="{{ t('approvals.reject') }}"
                      (click)="$event.stopPropagation(); openRejectDialog(order)"
                    >
                      <mat-icon fontIcon="close" />
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
                    <p>{{ t('common.noResults') }}</p>
                  </div>
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Approve Dialog -->
      <ng-template #approveDialog>
        <h2 mat-dialog-title>{{ t('approvals.approve') }}</h2>
        <mat-dialog-content>
          @if (selectedOrder()) {
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
      <ng-template #rejectDialog>
        <h2 mat-dialog-title>{{ t('approvals.reject') }}</h2>
        <mat-dialog-content>
          @if (selectedOrder()) {
            <p>{{ t('approvals.rejectConfirmation', { orderNumber: selectedOrder()!.orderNumber }) }}</p>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>{{ t('approvals.rejectReason') }}</mat-label>
              <textarea
                matInput
                [(ngModel)]="rejectReason"
                rows="3"
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
    .sales-orders-page {
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
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
      color: var(--color-primary);
    }

    .items-count {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-ink-secondary);
    }

    .date {
      font-size: var(--font-size-sm, 0.875rem);
    }

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

        .label {
          color: var(--color-ink-secondary);
        }
      }
    }
  `]
})
export class SalesOrderListComponent {
  private router = inject(Router);
  private currencyService = inject(CurrencyService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private translocoService = inject(TranslocoService);
  readonly dialog = inject(MatDialog);
  @ViewChild('approveDialog', { read: TemplateRef }) approveDialog!: TemplateRef<unknown>;
  @ViewChild('rejectDialog', { read: TemplateRef }) rejectDialog!: TemplateRef<unknown>;

  orders = SALES_ORDERS;

  searchQuery = signal('');
  selectedStatus = signal<StatusOption | null>(null);
  selectedOrder = signal<SalesOrder | null>(null);
  rejectReason = '';
  private processedIds = signal<Set<string>>(new Set());
  sort = signal<Sort>({ active: '', direction: '' });

  readonly displayedColumns = ['orderNumber', 'customerName', 'total', 'margin', 'status', 'items', 'createdAt', 'actions'];

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
    const sort = this.sort();

    let results = this.orders.filter(order => {
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

    if (sort.active && sort.direction) {
      results = [...results].sort((a, b) => {
        const dir = sort.direction === 'asc' ? 1 : -1;
        let aVal: unknown, bVal: unknown;

        switch (sort.active) {
          case 'orderNumber': aVal = a.orderNumber; bVal = b.orderNumber; break;
          case 'customerName': aVal = a.customerName; bVal = b.customerName; break;
          case 'total': aVal = a.totalAmount.BRL; bVal = b.totalAmount.BRL; break;
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

  canApprove = computed(() => {
    const role = this.authService.userRole();
    return role === 'MANAGER' || role === 'ADMIN';
  });

  formatDate = formatDate;

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set(null);
  }

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
    this.dialog.open(this.approveDialog, { width: '400px' });
  }

  openRejectDialog(order: SalesOrder): void {
    this.selectedOrder.set(order);
    this.rejectReason = '';
    this.dialog.open(this.rejectDialog, { width: '450px' });
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
      summary: this.translocoService.translate('approvals.approvedSummary'),
      detail: this.translocoService.translate('approvals.approvedDetail', {
        orderNumber: order.orderNumber
      })
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
      summary: this.translocoService.translate('approvals.rejectedSummary'),
      detail: this.translocoService.translate('approvals.rejectedDetail', {
        orderNumber: order.orderNumber
      })
    });

    this.dialog.closeAll();
  }

  onSortChange(sort: Sort): void {
    this.sort.set(sort);
  }
}
