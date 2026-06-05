import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';

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
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    ChartModule,
    TooltipModule,
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
        <p-card [header]="t('approvals.queue') + ' (' + pendingApprovals + ')'" styleClass="table-card">
          @if (pendingOrders.length > 0) {
            <p-table [value]="pendingOrders" [rows]="5" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>{{ t('common.orderNumber') }}</th>
                  <th>{{ t('approvals.orderType') }}</th>
                  <th>{{ t('common.total') }}</th>
                  <th>{{ t('approvals.requester') }}</th>
                  <th>{{ t('common.actions') }}</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-order>
                <tr>
                  <td><strong>{{ order.orderNumber }}</strong></td>
                  <td>
                    <p-tag
                      [value]="order.type === 'sales' ? t('nav.sales') : t('nav.purchases')"
                      [severity]="order.type === 'sales' ? 'info' : 'warning'"
                    />
                  </td>
                  <td><app-price-display [price]="order.totalAmount" /></td>
                  <td>{{ order.createdBy }}</td>
                  <td>
                    <p-button
                      icon="pi pi-eye"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      [pTooltip]="t('common.view')"
                      routerLink="/approvals"
                    />
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="empty-state">
              <i class="pi pi-check-circle"></i>
              <p>{{ t('approvals.noApprovals') }}</p>
            </div>
          }
          <div class="card-footer">
            <p-button
              [label]="t('dashboard.viewAllApprovals')"
              [link]="true"
              routerLink="/approvals"
            />
          </div>
        </p-card>

        <!-- Team Performance -->
        <p-card [header]="t('dashboard.teamPerformance')" styleClass="table-card">
          <p-table [value]="teamMetrics" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ t('dashboard.seller') }}</th>
                <th>{{ t('dashboard.orders') }}</th>
                <th>{{ t('dashboard.revenue') }}</th>
                <th>{{ t('common.margin') }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-member>
              <tr>
                <td><strong>{{ member.name }}</strong></td>
                <td>{{ member.orderCount }}</td>
                <td><app-price-display [price]="member.revenue" /></td>
                <td>
                  <span [class]="getMarginClass(member.margin)">
                    {{ member.margin.toFixed(1) }}%
                  </span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>

      <!-- Fulfillment Status -->
      <p-card [header]="t('dashboard.fulfillmentStatus')" styleClass="full-width-card">
        <div class="fulfillment-summary">
          @for (status of fulfillmentStats; track status.status) {
            <div class="fulfillment-stat">
              <div class="stat-icon" [ngClass]="status.class">
                <i [class]="status.icon"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ status.count }}</span>
                <span class="stat-label">{{ t('fulfillments.status.' + status.status) }}</span>
              </div>
            </div>
          }
        </div>
      </p-card>
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

    :host ::ng-deep .table-card {
      .p-card-body {
        padding: 0;
      }

      .p-card-header {
        padding: var(--vinheria-spacing-md, 16px);
        border-bottom: 1px solid var(--m3-outline-variant);
      }
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

      i {
        font-size: 2.5rem;
        opacity: 0.3;
        color: var(--vinheria-success);
        margin-bottom: var(--vinheria-spacing-sm, 8px);
      }
    }

    .margin-high { color: var(--vinheria-success, #2e7d32); font-weight: 600; }
    .margin-medium { color: var(--vinheria-warning, #ed6c02); font-weight: 600; }
    .margin-low { color: var(--vinheria-error, #d32f2f); font-weight: 600; }

    :host ::ng-deep .full-width-card {
      .p-card-body {
        padding: var(--vinheria-spacing-lg, 24px);
      }
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

      i { font-size: 1.5rem; }

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
    { status: 'PENDING', count: FULFILLMENTS.filter(f => f.status === 'PENDING').length, icon: 'pi pi-clock', class: 'pending' },
    { status: 'PICKING', count: FULFILLMENTS.filter(f => f.status === 'PICKING').length, icon: 'pi pi-list', class: 'picking' },
    { status: 'PACKED', count: FULFILLMENTS.filter(f => f.status === 'PACKED').length, icon: 'pi pi-box', class: 'packed' },
    { status: 'SHIPPED', count: FULFILLMENTS.filter(f => f.status === 'SHIPPED').length, icon: 'pi pi-truck', class: 'shipped' },
    { status: 'DELIVERED', count: FULFILLMENTS.filter(f => f.status === 'DELIVERED').length, icon: 'pi pi-check-circle', class: 'delivered' }
  ];

  getMarginClass(margin: number): string {
    if (margin >= 30) return 'margin-high';
    if (margin >= 15) return 'margin-medium';
    return 'margin-low';
  }
}
