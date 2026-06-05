import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { formatDateTime } from '../../../../shared/utils/date.utils';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
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

interface TimelineEvent {
  status: string;
  date: string | null;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-fulfillment-list',
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
    DialogModule,
    InputTextModule,
    ToastModule,
    TimelineModule,
    TooltipModule,
    StatusBadgeComponent
  ],
  providers: [MessageService],
  template: `
    <div class="fulfillment-page" *transloco="let t">
      <p-toast />

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
      <p-card styleClass="filters-card">
        <div class="filters-row">
          <p-dropdown
            [options]="warehouseOptions"
            [(ngModel)]="selectedWarehouse"
            [placeholder]="t('fulfillments.warehouse')"
            [showClear]="true"
            styleClass="warehouse-dropdown"
          />

          <p-dropdown
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            [placeholder]="t('common.status')"
            [showClear]="true"
            styleClass="status-dropdown"
          />
        </div>
      </p-card>

      <!-- Fulfillments Table -->
      <p-card styleClass="table-card">
        <p-table
          [value]="filteredFulfillments()"
          [paginator]="true"
          [rows]="10"
          [tableStyle]="{ 'min-width': '60rem' }"
          styleClass="p-datatable-striped"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Fulfillment ID</th>
              <th>Order #</th>
              <th>{{ t('fulfillments.warehouse') }}</th>
              <th>Customer</th>
              <th>{{ t('fulfillments.items') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('fulfillments.trackingCode') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-fulfillment>
            <tr>
              <td><span class="fulfillment-id">{{ fulfillment.id }}</span></td>
              <td><strong class="order-number">{{ fulfillment.salesOrderNumber }}</strong></td>
              <td>
                <span class="warehouse-code">{{ fulfillment.warehouseCode }}</span>
              </td>
              <td>{{ fulfillment.customerName }}</td>
              <td>{{ fulfillment.items.length }} item(s)</td>
              <td>
                <app-status-badge [status]="fulfillment.status" context="fulfillment" />
              </td>
              <td>
                @if (fulfillment.trackingCode) {
                  <span class="tracking-code">{{ fulfillment.trackingCode }}</span>
                } @else {
                  <span class="na">-</span>
                }
              </td>
              <td>
                <div class="actions">
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    [pTooltip]="t('common.view')"
                    (onClick)="viewFulfillment(fulfillment)"
                  />
                  @if (canProgress(fulfillment)) {
                    <p-button
                      icon="pi pi-arrow-right"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      [pTooltip]="getNextStatusLabel(fulfillment.status)"
                      (onClick)="progressStatus(fulfillment)"
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
                  <i class="pi pi-box"></i>
                  <p>No fulfillments found</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Detail Dialog -->
      <p-dialog
        [(visible)]="showDetailDialog"
        [header]="'Fulfillment Details'"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
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
              <p-timeline [value]="getTimeline(selectedFulfillment()!)" align="left">
                <ng-template pTemplate="marker" let-event>
                  <span class="timeline-marker" [style.background]="event.color">
                    <i [class]="event.icon"></i>
                  </span>
                </ng-template>
                <ng-template pTemplate="content" let-event>
                  <div class="timeline-content">
                    <span class="timeline-status">{{ event.status }}</span>
                    <span class="timeline-date">{{ event.date || 'Pending' }}</span>
                  </div>
                </ng-template>
              </p-timeline>
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
        <ng-template pTemplate="footer">
          <p-button [label]="t('common.close')" [text]="true" (onClick)="closeDialog()" />
          @if (selectedFulfillment() && canProgress(selectedFulfillment()!)) {
            <p-button
              [label]="'Progress to ' + getNextStatusLabel(selectedFulfillment()!.status)"
              icon="pi pi-arrow-right"
              (onClick)="progressStatus(selectedFulfillment()!); closeDialog()"
            />
          }
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .fulfillment-page {
      animation: fadeIn var(--vinheria-transition-normal, 0.3s);
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

    .stats-row {
      display: flex;
      gap: var(--vinheria-spacing-sm, 8px);
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--vinheria-spacing-sm, 8px) var(--vinheria-spacing-md, 16px);
      background: var(--m3-surface);
      border-radius: var(--vinheria-radius-md, 8px);
      box-shadow: var(--p-card-shadow);
      min-width: 80px;

      .stat-value {
        font-size: var(--vinheria-font-size-xl, 1.25rem);
        font-weight: 700;
      }

      .stat-label {
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
      }

      &.status-pending .stat-value { color: var(--vinheria-warning, #ed6c02); }
      &.status-picking .stat-value { color: var(--vinheria-info, #0288d1); }
      &.status-packed .stat-value { color: var(--vinheria-info, #0288d1); }
      &.status-shipped .stat-value { color: var(--m3-primary); }
      &.status-delivered .stat-value { color: var(--vinheria-success, #2e7d32); }
    }

    :host ::ng-deep .filters-card {
      margin-bottom: var(--vinheria-spacing-lg, 24px);
      .p-card-body { padding: var(--vinheria-spacing-md, 16px); }
    }

    .filters-row {
      display: flex;
      gap: var(--vinheria-spacing-md, 16px);
      flex-wrap: wrap;
    }

    :host ::ng-deep .warehouse-dropdown,
    :host ::ng-deep .status-dropdown {
      min-width: 200px;
    }

    :host ::ng-deep .table-card {
      .p-card-body { padding: var(--vinheria-spacing-lg, 24px); }
    }

    .fulfillment-id {
      font-family: var(--vinheria-font-mono, monospace);
      font-size: var(--vinheria-font-size-xs, 0.75rem);
      color: var(--m3-on-surface-variant);
    }

    .order-number {
      font-family: var(--vinheria-font-mono, monospace);
      color: var(--m3-primary);
    }

    .warehouse-code {
      font-weight: 600;
      padding: 2px 8px;
      background: var(--p-surface-100);
      border-radius: var(--vinheria-radius-sm, 4px);
    }

    .tracking-code {
      font-family: var(--vinheria-font-mono, monospace);
      font-size: var(--vinheria-font-size-sm, 0.875rem);
    }

    .na {
      color: var(--m3-on-surface-variant);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm, 8px);
    }

    .detail-content {
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--vinheria-spacing-lg, 24px);

        h3 { margin: 0 0 var(--vinheria-spacing-xs, 4px) 0; }
        p { margin: 0; color: var(--m3-on-surface-variant); }
      }

      .detail-section {
        margin-bottom: var(--vinheria-spacing-lg, 24px);

        h4 {
          margin: 0 0 var(--vinheria-spacing-sm, 8px) 0;
          font-size: var(--vinheria-font-size-sm, 0.875rem);
          color: var(--m3-on-surface-variant);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
    }

    .timeline-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: white;

      i { font-size: 0.875rem; }
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      padding-left: var(--vinheria-spacing-sm, 8px);

      .timeline-status { font-weight: 600; }
      .timeline-date {
        font-size: var(--vinheria-font-size-sm, 0.875rem);
        color: var(--m3-on-surface-variant);
      }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--vinheria-spacing-xs, 4px);
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md, 16px);
      padding: var(--vinheria-spacing-sm, 8px);
      background: var(--p-surface-50);
      border-radius: var(--vinheria-radius-sm, 4px);

      .item-sku {
        font-family: var(--vinheria-font-mono, monospace);
        font-size: var(--vinheria-font-size-xs, 0.75rem);
        color: var(--m3-on-surface-variant);
        width: 120px;
      }

      .item-name { flex: 1; }

      .item-qty {
        font-weight: 600;
        color: var(--m3-primary);
      }
    }

    .tracking-info {
      display: flex;
      gap: var(--vinheria-spacing-sm, 8px);

      .tracking-label { color: var(--m3-on-surface-variant); }
      .tracking-value {
        font-family: var(--vinheria-font-mono, monospace);
        font-weight: 600;
      }
    }


  `]
})
export class FulfillmentListComponent {
  private currencyService = inject(CurrencyService);
  private messageService = inject(MessageService);

  // Filters
  selectedWarehouse = signal<string | null>(null);
  selectedStatus = signal<FulfillmentStatus | null>(null);

  // Dialog
  showDetailDialog = false;
  selectedFulfillment = signal<Fulfillment | null>(null);

  // Local state for status updates
  private fulfillmentStatuses = signal<Map<string, FulfillmentStatus>>(new Map());

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
        status: 'Created',
        date: fulfillment.createdAt ? formatDateTime(fulfillment.createdAt) : null,
        icon: 'pi pi-plus',
        color: 'var(--m3-on-surface-variant)'
      },
      {
        status: 'Picking',
        date: fulfillment.pickedAt ? formatDateTime(fulfillment.pickedAt) : null,
        icon: 'pi pi-list',
        color: fulfillment.pickedAt ? 'var(--vinheria-info)' : 'var(--m3-outline-variant)'
      },
      {
        status: 'Packed',
        date: fulfillment.packedAt ? formatDateTime(fulfillment.packedAt) : null,
        icon: 'pi pi-box',
        color: fulfillment.packedAt ? 'var(--vinheria-info)' : 'var(--m3-outline-variant)'
      },
      {
        status: 'Shipped',
        date: fulfillment.shippedAt ? formatDateTime(fulfillment.shippedAt) : null,
        icon: 'pi pi-truck',
        color: fulfillment.shippedAt ? 'var(--m3-primary)' : 'var(--m3-outline-variant)'
      },
      {
        status: 'Delivered',
        date: fulfillment.deliveredAt ? formatDateTime(fulfillment.deliveredAt) : null,
        icon: 'pi pi-check-circle',
        color: fulfillment.deliveredAt ? 'var(--vinheria-success)' : 'var(--m3-outline-variant)'
      }
    ];
  }

  viewFulfillment(fulfillment: Fulfillment): void {
    this.selectedFulfillment.set(this.getFulfillmentWithStatus(fulfillment));
    this.showDetailDialog = true;
  }

  progressStatus(fulfillment: Fulfillment): void {
    const currentFulfillment = this.getFulfillmentWithStatus(fulfillment);
    const nextStatus = this.getNextStatus(currentFulfillment.status);

    this.fulfillmentStatuses.update(statuses => {
      const newStatuses = new Map(statuses);
      newStatuses.set(fulfillment.id, nextStatus);
      return newStatuses;
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Fulfillment updated to ${this.getNextStatusLabel(currentFulfillment.status)}`
    });
  }

  closeDialog(): void {
    this.showDetailDialog = false;
    this.selectedFulfillment.set(null);
  }
}
