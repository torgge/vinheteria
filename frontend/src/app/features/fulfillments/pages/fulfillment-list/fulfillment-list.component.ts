import { Component, computed, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { formatDateTime } from '../../../../shared/utils/date.utils';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TimelineComponent, TimelineEvent } from '../../../../shared/components/timeline/timeline.component';
import {
  FULFILLMENTS,
  Fulfillment,
  FulfillmentStatus,
  WAREHOUSES
} from '../../../../mock/data';

interface StatusOption {
  label: string;
  value: FulfillmentStatus | null;
}

@Component({
  selector: 'app-fulfillment-list',
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
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    StatusBadgeComponent,
    TimelineComponent
  ],
  template: `
    <div class="fulfillment-page" *transloco="let t">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('fulfillments.title') }}</h1>
          <p class="text-secondary">{{ t('fulfillments.tracking') }}</p>
        </div>
        <div class="stats-row">
          @for (stat of statusStats(); track stat.status) {
            <div class="stat-item" [class]="'status-' + stat.status.toLowerCase()">
              <span class="stat-value">{{ stat.count }}</span>
              <span class="stat-label">{{ stat.status }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Filters -->
      <mat-card appearance="outlined" class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="warehouse-filter">
              <mat-label>{{ t('fulfillments.warehouse') }}</mat-label>
              <mat-select [(ngModel)]="selectedWarehouse">
                <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                @for (opt of warehouseOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="status-filter">
              <mat-label>{{ t('common.status') }}</mat-label>
              <mat-select [(ngModel)]="selectedStatus">
                <mat-option [value]="null">{{ t('common.all') }}</mat-option>
                @for (opt of statusOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Fulfillments Table -->
      <mat-card appearance="outlined" class="table-card">
        <mat-card-content>
          <table
            mat-table
            [dataSource]="filteredFulfillments()"
            style="min-width: 60rem"
          >
            <!-- fulfillmentId Column -->
            <ng-container matColumnDef="fulfillmentId">
              <th mat-header-cell *matHeaderCellDef>Fulfillment ID</th>
              <td mat-cell *matCellDef="let fulfillment">
                <span class="fulfillment-id">{{ fulfillment.id }}</span>
              </td>
            </ng-container>

            <!-- orderNumber Column -->
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef>Order #</th>
              <td mat-cell *matCellDef="let fulfillment">
                <strong class="order-number">{{ fulfillment.salesOrderNumber }}</strong>
              </td>
            </ng-container>

            <!-- warehouse Column -->
            <ng-container matColumnDef="warehouse">
              <th mat-header-cell *matHeaderCellDef>{{ t('fulfillments.warehouse') }}</th>
              <td mat-cell *matCellDef="let fulfillment">
                <span class="warehouse-code">{{ fulfillment.warehouseCode }}</span>
              </td>
            </ng-container>

            <!-- customer Column -->
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let fulfillment">{{ fulfillment.customerName }}</td>
            </ng-container>

            <!-- items Column -->
            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>{{ t('fulfillments.items') }}</th>
              <td mat-cell *matCellDef="let fulfillment">{{ fulfillment.items.length }} item(s)</td>
            </ng-container>

            <!-- status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.status') }}</th>
              <td mat-cell *matCellDef="let fulfillment">
                <app-status-badge [status]="fulfillment.status" context="fulfillment" />
              </td>
            </ng-container>

            <!-- trackingCode Column -->
            <ng-container matColumnDef="trackingCode">
              <th mat-header-cell *matHeaderCellDef>{{ t('fulfillments.trackingCode') }}</th>
              <td mat-cell *matCellDef="let fulfillment">
                @if (fulfillment.trackingCode) {
                  <span class="tracking-code">{{ fulfillment.trackingCode }}</span>
                } @else {
                  <span class="na">-</span>
                }
              </td>
            </ng-container>

            <!-- actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.actions') }}</th>
              <td mat-cell *matCellDef="let fulfillment">
                <div class="actions">
                  <button
                    mat-icon-button
                    matTooltip="{{ t('common.view') }}"
                    (click)="viewFulfillment(fulfillment)"
                  >
                    <mat-icon fontIcon="visibility" />
                  </button>
                  @if (canProgress(fulfillment)) {
                    <button
                      mat-icon-button
                      matTooltip="{{ getNextStatusLabel(fulfillment.status) }}"
                      (click)="progressStatus(fulfillment)"
                    >
                      <mat-icon fontIcon="arrow_forward" />
                    </button>
                  }
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            @if (filteredFulfillments().length === 0) {
              <tr class="mat-row">
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="vinheria-empty-state">
                    <mat-icon fontIcon="inventory_2" />
                    <p>No fulfillments found</p>
                  </div>
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Detail Dialog -->
      <ng-template #detailDialog>
        <h2 mat-dialog-title>Fulfillment Details</h2>
        <mat-dialog-content>
          @if (selectedFulfillment()) {
            <div class="detail-content">
              <div class="detail-header">
                <div class="detail-info">
                  <h3>{{ selectedFulfillment()!.salesOrderNumber }}</h3>
                  <p>{{ selectedFulfillment()!.customerName }}</p>
                </div>
                <app-status-badge [status]="selectedFulfillment()!.status" context="fulfillment" />
              </div>

              <div class="detail-section">
                <h4>Timeline</h4>
                <app-timeline [events]="getTimeline(selectedFulfillment()!)" />
              </div>

              <div class="detail-section">
                <h4>Items</h4>
                <div class="items-list">
                  @for (item of selectedFulfillment()!.items; track item.sku) {
                    <div class="item-row">
                      <span class="item-sku">{{ item.sku }}</span>
                      <span class="item-name">{{ item.wineName }}</span>
                      <span class="item-qty">x{{ item.quantity }}</span>
                    </div>
                  }
                </div>
              </div>

              @if (selectedFulfillment()!.trackingCode) {
                <div class="detail-section">
                  <h4>Tracking</h4>
                  <div class="tracking-info">
                    <span class="tracking-label">Code:</span>
                    <span class="tracking-value">{{ selectedFulfillment()!.trackingCode }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="dialog.closeAll()">{{ t('common.close') }}</button>
          @if (selectedFulfillment() && canProgress(selectedFulfillment()!)) {
            <button
              mat-flat-button
              (click)="progressStatus(selectedFulfillment()!); dialog.closeAll()"
            >
              <mat-icon fontIcon="arrow_forward" />
              {{ 'Progress to ' + getNextStatusLabel(selectedFulfillment()!.status) }}
            </button>
          }
        </mat-dialog-actions>
      </ng-template>
    </div>
  `,
  styles: [`
    .fulfillment-page {
      animation: fadeIn var(--motion-normal, 0.3s);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-lg, 24px);
      flex-wrap: wrap;
      gap: var(--space-md, 16px);

      h1 { margin-bottom: var(--space-xxs, 4px); }
    }

    .stats-row {
      display: flex;
      gap: var(--space-xs, 8px);
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-xs, 8px) var(--space-md, 16px);
      background: var(--color-surface);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      min-width: 80px;

      .stat-value {
        font-size: var(--font-size-xl, 1.25rem);
        font-weight: 700;
      }

      .stat-label {
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
      }

      &.status-pending .stat-value { color: var(--color-accent-orange, #ed6c02); }
      &.status-picking .stat-value { color: var(--color-accent-sky, #0288d1); }
      &.status-packed .stat-value { color: var(--color-accent-sky, #0288d1); }
      &.status-shipped .stat-value { color: var(--color-primary); }
      &.status-delivered .stat-value { color: var(--color-accent-green, #2e7d32); }
    }

    .filters-card {
      margin-bottom: var(--space-lg, 24px);
    }

    .filters-row {
      display: flex;
      gap: var(--space-md, 16px);
      flex-wrap: wrap;
    }

    .warehouse-filter,
    .status-filter {
      min-width: 200px;
    }

    .table-card {
      mat-card-content {
        padding: var(--space-lg, 24px);
      }
    }

    .fulfillment-id {
      font-family: var(--font-mono, monospace);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-ink-secondary);
    }

    .order-number {
      font-family: var(--font-mono, monospace);
      color: var(--color-primary);
    }

    .warehouse-code {
      font-weight: 600;
      padding: 2px 8px;
      background: var(--color-canvas-soft);
      border-radius: var(--radius-sm, 4px);
    }

    .tracking-code {
      font-family: var(--font-mono, monospace);
      font-size: var(--font-size-sm, 0.875rem);
    }

    .na {
      color: var(--color-ink-secondary);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-xs, 8px);
    }

    .detail-content {
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-lg, 24px);

        h3 { margin: 0 0 var(--space-xxs, 4px) 0; }
        p { margin: 0; color: var(--color-ink-secondary); }
      }

      .detail-section {
        margin-bottom: var(--space-lg, 24px);

        h4 {
          margin: 0 0 var(--space-xs, 8px) 0;
          font-size: var(--font-size-sm, 0.875rem);
          color: var(--color-ink-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs, 4px);
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: var(--space-md, 16px);
      padding: var(--space-xs, 8px);
      background: var(--color-canvas-soft);
      border-radius: var(--radius-sm, 4px);

      .item-sku {
        font-family: var(--font-mono, monospace);
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-ink-secondary);
        width: 120px;
      }

      .item-name { flex: 1; }

      .item-qty {
        font-weight: 600;
        color: var(--color-primary);
      }
    }

    .tracking-info {
      display: flex;
      gap: var(--space-xs, 8px);

      .tracking-label { color: var(--color-ink-secondary); }
      .tracking-value {
        font-family: var(--font-mono, monospace);
        font-weight: 600;
      }
    }
  `]
})
export class FulfillmentListComponent {
  private currencyService = inject(CurrencyService);
  private notificationService = inject(NotificationService);
  readonly dialog = inject(MatDialog);
  @ViewChild('detailDialog', { read: TemplateRef }) detailDialog!: TemplateRef<unknown>;

  // Filters
  selectedWarehouse = signal<string | null>(null);
  selectedStatus = signal<FulfillmentStatus | null>(null);

  // Dialog
  selectedFulfillment = signal<Fulfillment | null>(null);

  // Local state for status updates
  private fulfillmentStatuses = signal<Map<string, FulfillmentStatus>>(new Map());

  readonly displayedColumns = ['fulfillmentId', 'orderNumber', 'warehouse', 'customer', 'items', 'status', 'trackingCode', 'actions'];

  warehouseOptions = WAREHOUSES.map(w => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  statusOptions: StatusOption[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Picking', value: 'PICKING' },
    { label: 'Packed', value: 'PACKED' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' }
  ];

  // Get fulfillment with potentially updated status
  private getFulfillmentWithStatus(f: Fulfillment): Fulfillment {
    const statuses = this.fulfillmentStatuses();
    const updatedStatus = statuses.get(f.id);
    if (updatedStatus) {
      return { ...f, status: updatedStatus };
    }
    return f;
  }

  filteredFulfillments = computed(() => {
    const warehouse = this.selectedWarehouse();
    const status = this.selectedStatus();

    return FULFILLMENTS
      .map(f => this.getFulfillmentWithStatus(f))
      .filter(f => {
        if (warehouse && f.warehouseId !== warehouse) return false;
        if (status && f.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  statusStats = computed(() => {
    const allFulfillments = FULFILLMENTS.map(f => this.getFulfillmentWithStatus(f));
    const counts: Record<FulfillmentStatus, number> = {
      'PENDING': 0,
      'PICKING': 0,
      'PACKED': 0,
      'SHIPPED': 0,
      'DELIVERED': 0
    };

    allFulfillments.forEach(f => counts[f.status]++);

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count
    }));
  });

  canProgress(fulfillment: Fulfillment): boolean {
    return fulfillment.status !== 'DELIVERED';
  }

  getNextStatusLabel(status: FulfillmentStatus): string {
    const nextStatus: Record<FulfillmentStatus, string> = {
      'PENDING': 'Picking',
      'PICKING': 'Packed',
      'PACKED': 'Shipped',
      'SHIPPED': 'Delivered',
      'DELIVERED': 'Delivered'
    };
    return nextStatus[status];
  }

  getNextStatus(status: FulfillmentStatus): FulfillmentStatus {
    const nextStatus: Record<FulfillmentStatus, FulfillmentStatus> = {
      'PENDING': 'PICKING',
      'PICKING': 'PACKED',
      'PACKED': 'SHIPPED',
      'SHIPPED': 'DELIVERED',
      'DELIVERED': 'DELIVERED'
    };
    return nextStatus[status];
  }

  getTimeline(fulfillment: Fulfillment): TimelineEvent[] {
    return [
      {
        icon: 'add',
        color: 'var(--color-ink-secondary)',
        title: 'Created',
        subtitle: fulfillment.createdAt ? formatDateTime(fulfillment.createdAt) : 'Pending'
      },
      {
        icon: 'list',
        color: fulfillment.pickedAt ? 'var(--color-accent-sky)' : 'var(--color-hairline)',
        title: 'Picking',
        subtitle: fulfillment.pickedAt ? formatDateTime(fulfillment.pickedAt) : undefined
      },
      {
        icon: 'inventory_2',
        color: fulfillment.packedAt ? 'var(--color-accent-sky)' : 'var(--color-hairline)',
        title: 'Packed',
        subtitle: fulfillment.packedAt ? formatDateTime(fulfillment.packedAt) : undefined
      },
      {
        icon: 'local_shipping',
        color: fulfillment.shippedAt ? 'var(--color-primary)' : 'var(--color-hairline)',
        title: 'Shipped',
        subtitle: fulfillment.shippedAt ? formatDateTime(fulfillment.shippedAt) : undefined
      },
      {
        icon: 'check_circle',
        color: fulfillment.deliveredAt ? 'var(--color-accent-green)' : 'var(--color-hairline)',
        title: 'Delivered',
        subtitle: fulfillment.deliveredAt ? formatDateTime(fulfillment.deliveredAt) : undefined
      }
    ];
  }

  viewFulfillment(fulfillment: Fulfillment): void {
    this.selectedFulfillment.set(this.getFulfillmentWithStatus(fulfillment));
    this.dialog.open(this.detailDialog, { width: '600px' });
  }

  progressStatus(fulfillment: Fulfillment): void {
    const currentFulfillment = this.getFulfillmentWithStatus(fulfillment);
    const nextStatus = this.getNextStatus(currentFulfillment.status);

    this.fulfillmentStatuses.update(statuses => {
      const newStatuses = new Map(statuses);
      newStatuses.set(fulfillment.id, nextStatus);
      return newStatuses;
    });

    this.notificationService.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Fulfillment updated to ${this.getNextStatusLabel(currentFulfillment.status)}`
    });
  }
}
