import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/auth/auth.service';
import { PriceDisplayComponent } from '../../../shared/components/price-display/price-display.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import {
  SALES_ORDERS,
  PURCHASE_ORDERS,
  FULFILLMENTS
} from '../../../mock/data';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslocoModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PriceDisplayComponent,
    StatusBadgeComponent,
    KpiCardComponent
  ],
  template: `
    <div class="dashboard" *transloco="let t">
      <div class="dashboard-header">
        <h1>{{ t('dashboard.welcome', { name: authService.userName() }) }}</h1>
        <p class="text-secondary">{{ t('dashboard.managerView') }}</p>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <app-kpi-card
          variant="warning"
          icon="pi pi-clock"
          iconBgClass="kpi-icon--warning"
          [value]="pendingApprovals.toString()"
          [label]="t('dashboard.pendingApprovals')"
        />

        <app-kpi-card
          icon="pi pi-check-circle"
          iconBgClass="kpi-icon--success"
          [value]="approvedToday.toString()"
          [label]="t('dashboard.approvedToday')"
        />

        <app-kpi-card
          icon="pi pi-truck"
          iconBgClass="kpi-icon--info"
          [value]="activeFulfillments.toString()"
          [label]="t('dashboard.activeFulfillments')"
        />

        <app-kpi-card
          icon="pi pi-percentage"
          iconBgClass="kpi-icon--primary"
          [value]="averageMargin.toFixed(1) + '%'"
          [label]="t('dashboard.avgMargin')"
        />
      </div>

      <!-- Tables Row -->
      <div class="tables-row">
        <!-- Pending Approvals -->
        <mat-card appearance="outlined" class="table-card">
          <mat-card-header>
            <mat-card-title>{{ t('approvals.queue') + ' (' + pendingApprovals + ')' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (pendingOrders.length > 0) {
              <table mat-table [dataSource]="pendingOrders">
                <ng-container matColumnDef="orderNumber">
                  <th mat-header-cell *matHeaderCellDef>{{ t('common.orderNumber') }}</th>
                  <td mat-cell *matCellDef="let order"><strong>{{ order.orderNumber }}</strong></td>
                </ng-container>

                <ng-container matColumnDef="orderType">
                  <th mat-header-cell *matHeaderCellDef>{{ t('approvals.orderType') }}</th>
                  <td mat-cell *matCellDef="let order">
                    <span class="badge" [class]="order.type === 'sales' ? 'badge-info' : 'badge-warning'">
                      {{ order.type === 'sales' ? t('nav.sales') : t('nav.purchases') }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef>{{ t('common.total') }}</th>
                  <td mat-cell *matCellDef="let order"><app-price-display [price]="order.totalAmount" /></td>
                </ng-container>

                <ng-container matColumnDef="requester">
                  <th mat-header-cell *matHeaderCellDef>{{ t('approvals.requester') }}</th>
                  <td mat-cell *matCellDef="let order">{{ order.createdBy }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>{{ t('common.actions') }}</th>
                  <td mat-cell *matCellDef="let order">
                    <button mat-icon-button [matTooltip]="t('common.view')" routerLink="/approvals">
                      <mat-icon fontIcon="visibility" />
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumnsApprovals"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumnsApprovals;"></tr>
              </table>
            } @else {
              <div class="empty-state">
                <mat-icon fontIcon="check_circle" />
                <p>{{ t('approvals.noApprovals') }}</p>
              </div>
            }
          </mat-card-content>
          <div class="card-footer">
            <button mat-button routerLink="/approvals">{{ t('dashboard.viewAllApprovals') }}</button>
          </div>
        </mat-card>

        <!-- Team Performance -->
        <mat-card appearance="outlined" class="table-card">
          <mat-card-header>
            <mat-card-title>{{ t('dashboard.teamPerformance') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="teamMetrics">
              <ng-container matColumnDef="seller">
                <th mat-header-cell *matHeaderCellDef>{{ t('dashboard.seller') }}</th>
                <td mat-cell *matCellDef="let member"><strong>{{ member.name }}</strong></td>
              </ng-container>

              <ng-container matColumnDef="orders">
                <th mat-header-cell *matHeaderCellDef>{{ t('dashboard.orders') }}</th>
                <td mat-cell *matCellDef="let member">{{ member.orderCount }}</td>
              </ng-container>

              <ng-container matColumnDef="revenue">
                <th mat-header-cell *matHeaderCellDef>{{ t('dashboard.revenue') }}</th>
                <td mat-cell *matCellDef="let member"><app-price-display [price]="member.revenue" /></td>
              </ng-container>

              <ng-container matColumnDef="margin">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.margin') }}</th>
                <td mat-cell *matCellDef="let member">
                  <span [class]="getMarginClass(member.margin)">
                    {{ member.margin.toFixed(1) }}%
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumnsTeam"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumnsTeam;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Fulfillment Status -->
      <mat-card appearance="outlined" class="full-width-card">
        <mat-card-header>
          <mat-card-title>{{ t('dashboard.fulfillmentStatus') }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="fulfillment-summary">
            @for (status of fulfillmentStats; track status.status) {
              <div class="fulfillment-stat">
                <div class="stat-icon" [ngClass]="status.class">
                  <mat-icon [fontIcon]="status.icon" />
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ status.count }}</span>
                  <span class="stat-label">{{ t('fulfillments.status.' + status.status) }}</span>
                </div>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn var(--vinheria-transition-normal) ease-out;
    }

    .dashboard-header {
      margin-bottom: var(--vinheria-spacing-lg, 24px);

      h1 {
        margin-bottom: var(--vinheria-spacing-xs, 4px);
      }
    }

    .kpi-grid {
      display: grid;
      gap: var(--vinheria-spacing-md, 16px);
      margin-bottom: var(--vinheria-spacing-lg, 24px);
      grid-template-columns: 1fr;

      @media (min-width: 600px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 840px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .tables-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--vinheria-spacing-lg, 24px);
      margin-bottom: var(--vinheria-spacing-lg, 24px);
    }

    .table-card mat-card-content {
      padding: 0;
    }

    .table-card mat-card-header {
      padding: var(--vinheria-spacing-md, 16px);
      border-bottom: 1px solid var(--m3-outline-variant);
    }

    .card-footer {
      padding: var(--vinheria-spacing-sm, 8px) var(--vinheria-spacing-md, 16px);
      border-top: 1px solid var(--m3-outline-variant);
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--vinheria-spacing-xl, 32px);
      color: var(--m3-on-surface-variant);

      mat-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        opacity: 0.3;
        color: var(--vinheria-success);
        margin-bottom: var(--vinheria-spacing-sm, 8px);
      }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: var(--radius-full);
      font: var(--font-eyebrow);
      white-space: nowrap;
      color: var(--color-on-primary);
    }

    .badge-info {
      background: var(--color-primary);
    }

    .badge-warning {
      background: var(--color-accent-orange);
    }

    .margin-high { color: var(--vinheria-success, #2e7d32); font-weight: 600; }
    .margin-medium { color: var(--vinheria-warning, #ed6c02); font-weight: 600; }
    .margin-low { color: var(--vinheria-error, #d32f2f); font-weight: 600; }

    .full-width-card mat-card-content {
      padding: var(--vinheria-spacing-lg, 24px);
    }

    .fulfillment-summary {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: var(--vinheria-spacing-lg, 24px);
    }

    .fulfillment-stat {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md, 16px);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }

      &.pending   { background: var(--vinheria-warning-bg); color: var(--vinheria-warning); }
      &.picking   { background: var(--vinheria-info-bg); color: var(--vinheria-info); }
      &.packed    { background: var(--m3-tertiary-container); color: var(--m3-on-tertiary-container); }
      &.shipped   { background: var(--m3-secondary-container); color: var(--m3-on-secondary-container); }
      &.delivered { background: var(--vinheria-success-bg); color: var(--vinheria-success); }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: var(--vinheria-font-size-xl);
      font-weight: 700;
      color: var(--m3-on-surface);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--m3-on-surface-variant);
    }
  `]
})
export class ManagerDashboardComponent {
  authService = inject(AuthService);

  displayedColumnsApprovals = ['orderNumber', 'orderType', 'total', 'requester', 'actions'];
  displayedColumnsTeam = ['seller', 'orders', 'revenue', 'margin'];

  // Calculated metrics
  pendingApprovals = SALES_ORDERS.filter(o => o.status === 'PENDING_APPROVAL').length +
                     PURCHASE_ORDERS.filter(o => o.status === 'PENDING_APPROVAL').length;

  approvedToday = SALES_ORDERS.filter(o =>
    o.status === 'APPROVED' &&
    o.approvedAt &&
    new Date(o.approvedAt).toDateString() === new Date().toDateString()
  ).length;

  activeFulfillments = FULFILLMENTS.filter(f =>
    ['PENDING', 'PICKING', 'PACKED', 'SHIPPED'].includes(f.status)
  ).length;

  averageMargin = SALES_ORDERS
    .filter(o => o.status !== 'DRAFT' && o.status !== 'REJECTED')
    .reduce((sum, o) => sum + o.marginPercentage, 0) /
    SALES_ORDERS.filter(o => o.status !== 'DRAFT' && o.status !== 'REJECTED').length || 0;

  // Pending orders for approval queue
  pendingOrders = [
    ...SALES_ORDERS.filter(o => o.status === 'PENDING_APPROVAL').map(o => ({
      ...o,
      type: 'sales' as const
    })),
    ...PURCHASE_ORDERS.filter(o => o.status === 'PENDING_APPROVAL').map(o => ({
      ...o,
      type: 'purchase' as const
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 5);

  // Team performance
  teamMetrics = [
    { name: 'Maria Silva', orderCount: 12, revenue: { BRL: 85000, PYG: 123250000, USD: 17000 }, margin: 34.2 },
    { name: 'João Santos', orderCount: 9, revenue: { BRL: 62000, PYG: 89900000, USD: 12400 }, margin: 31.8 },
    { name: 'Ana Oliveira', orderCount: 8, revenue: { BRL: 54000, PYG: 78300000, USD: 10800 }, margin: 29.5 },
    { name: 'Pedro Costa', orderCount: 6, revenue: { BRL: 47500, PYG: 68875000, USD: 9500 }, margin: 33.1 }
  ];

  // Fulfillment stats
  fulfillmentStats = [
    { status: 'PENDING', count: FULFILLMENTS.filter(f => f.status === 'PENDING').length, icon: 'schedule', class: 'pending' },
    { status: 'PICKING', count: FULFILLMENTS.filter(f => f.status === 'PICKING').length, icon: 'list', class: 'picking' },
    { status: 'PACKED', count: FULFILLMENTS.filter(f => f.status === 'PACKED').length, icon: 'inventory_2', class: 'packed' },
    { status: 'SHIPPED', count: FULFILLMENTS.filter(f => f.status === 'SHIPPED').length, icon: 'local_shipping', class: 'shipped' },
    { status: 'DELIVERED', count: FULFILLMENTS.filter(f => f.status === 'DELIVERED').length, icon: 'check_circle', class: 'delivered' }
  ];

  getMarginClass(margin: number): string {
    if (margin >= 30) return 'margin-high';
    if (margin >= 15) return 'margin-medium';
    return 'margin-low';
  }
}
