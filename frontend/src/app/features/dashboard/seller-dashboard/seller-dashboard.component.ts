import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';

import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyService } from '../../../core/currency/currency.service';
import { PriceDisplayComponent } from '../../../shared/components/price-display/price-display.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { MarginIndicatorComponent } from '../../../shared/components/margin-indicator/margin-indicator.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SALES_ORDERS, CUSTOMERS } from '../../../mock/data';

@Component({
  selector: 'app-seller-dashboard',
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
    PriceDisplayComponent,
    StatusBadgeComponent,
    MarginIndicatorComponent,
    KpiCardComponent
  ],
  template: `
    <div class="dashboard" *transloco="let t">
      <div class="dashboard-header">
        <h1>{{ t('dashboard.welcome', { name: authService.userName() }) }}</h1>
        <p class="text-secondary">{{ t('dashboard.sellerView') }}</p>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <app-kpi-card
          icon="pi pi-dollar"
          iconBgClass="kpi-icon--success"
          [value]="formatCurrency(myTotalSales.BRL)"
          [label]="t('dashboard.mySales')"
          [trend]="'+15.2% ' + t('dashboard.vsLastMonth')"
          trendDirection="up"
        />

        <app-kpi-card
          icon="pi pi-shopping-cart"
          iconBgClass="kpi-icon--info"
          [value]="myOrderCount.toString()"
          [label]="t('dashboard.myOrders')"
        />

        <app-kpi-card
          icon="pi pi-percentage"
          iconBgClass="kpi-icon--primary"
          [value]="myAvgMargin.toFixed(1) + '%'"
          [label]="t('dashboard.myAvgMargin')"
        />

        <app-kpi-card
          icon="pi pi-clock"
          iconBgClass="kpi-icon--warning"
          [value]="myPendingOrders.toString()"
          [label]="t('dashboard.pendingOrders')"
        />
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <p-button
          [label]="t('sales.createOrder')"
          icon="pi pi-plus"
          routerLink="/sales/create"
        />
        <p-button
          [label]="t('dashboard.viewCatalog')"
          icon="pi pi-list"
          [outlined]="true"
          routerLink="/catalog"
        />
        <p-button
          [label]="t('dashboard.viewCustomers')"
          icon="pi pi-users"
          [outlined]="true"
          routerLink="/customers"
        />
      </div>

      <!-- Tables Row -->
      <div class="tables-row">
        <!-- Recent Orders -->
        <p-card [header]="t('dashboard.myRecentOrders')" styleClass="table-card">
          <p-table [value]="myRecentOrders" [rows]="5" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ t('common.orderNumber') }}</th>
                <th>{{ t('dashboard.customer') }}</th>
                <th>{{ t('common.total') }}</th>
                <th>{{ t('common.margin') }}</th>
                <th>{{ t('common.status') }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-order>
              <tr>
                <td><strong>{{ order.orderNumber }}</strong></td>
                <td>{{ order.customerName }}</td>
                <td><app-price-display [price]="order.totalAmount" /></td>
                <td><app-margin-indicator [marginPercentage]="order.marginPercentage" /></td>
                <td><app-status-badge [status]="order.status" context="sales" /></td>
              </tr>
            </ng-template>
          </p-table>
          <div class="card-footer">
            <p-button
              [label]="t('dashboard.viewAllOrders')"
              [link]="true"
              routerLink="/sales"
            />
          </div>
        </p-card>

        <!-- Top Customers -->
        <p-card [header]="t('dashboard.topCustomers')" styleClass="table-card">
          <p-table [value]="topCustomers" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>{{ t('dashboard.customer') }}</th>
                <th>{{ t('dashboard.orders') }}</th>
                <th>{{ t('dashboard.totalPurchases') }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-customer>
              <tr>
                <td>
                  <div class="customer-cell">
                    <strong>{{ customer.name }}</strong>
                    <span class="customer-type">{{ customer.type }}</span>
                  </div>
                </td>
                <td>{{ customer.orderCount }}</td>
                <td><app-price-display [price]="customer.totalPurchases" /></td>
              </tr>
            </ng-template>
          </p-table>
          <div class="card-footer">
            <p-button
              [label]="t('dashboard.viewAllCustomers')"
              [link]="true"
              routerLink="/customers"
            />
          </div>
        </p-card>
      </div>

      <!-- Sales Target Progress -->
      <p-card [header]="t('dashboard.monthlyTarget')" styleClass="target-card">
        <div class="target-content">
          <div class="target-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="targetProgress"></div>
            </div>
            <div class="progress-labels">
              <span>{{ t('dashboard.current') }}: <app-price-display [price]="myTotalSales" /></span>
              <span>{{ t('dashboard.target') }}: <app-price-display [price]="monthlyTarget" /></span>
            </div>
          </div>
          <div class="target-percentage">
            <span class="percentage-value">{{ targetProgress.toFixed(0) }}%</span>
            <span class="percentage-label">{{ t('dashboard.achieved') }}</span>
          </div>
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

    .quick-actions {
      display: flex;
      gap: var(--vinheria-spacing-md, 16px);
      margin-bottom: var(--vinheria-spacing-lg, 24px);
      flex-wrap: wrap;
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

    .customer-cell {
      display: flex;
      flex-direction: column;

      .customer-type {
        font-size: 0.75rem;
        color: var(--m3-on-surface-variant);
      }
    }

    :host ::ng-deep .target-card .p-card-body {
      padding: var(--vinheria-spacing-lg, 24px);
    }

    .target-content {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-xl, 32px);
    }

    .target-progress {
      flex: 1;
    }

    .progress-bar {
      height: 16px;
      background: var(--p-surface-200);
      border-radius: var(--vinheria-radius-md);
      overflow: hidden;
      margin-bottom: var(--vinheria-spacing-sm, 8px);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--m3-primary) 0%, var(--vinheria-success) 100%);
      border-radius: var(--vinheria-radius-md);
      transition: width 0.5s ease-out;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--m3-on-surface-variant);
    }

    .target-percentage {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--vinheria-spacing-md, 16px);
      background: var(--p-surface-50);
      border-radius: var(--vinheria-radius-lg, 12px);
    }

    .percentage-value {
      font-size: var(--vinheria-font-size-3xl);
      font-weight: 700;
      color: var(--m3-primary);
    }

    .percentage-label {
      font-size: 0.875rem;
      color: var(--m3-on-surface-variant);
    }


  `]
})
export class SellerDashboardComponent {
  authService = inject(AuthService);
  currencyService = inject(CurrencyService);

  formatCurrency(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  // My metrics (simulating current seller's data)
  myTotalSales = { BRL: 85000, PYG: 123250000, USD: 17000 };
  myOrderCount = 12;
  myAvgMargin = 34.2;
  myPendingOrders = SALES_ORDERS.filter(o =>
    o.status === 'PENDING_APPROVAL' && o.createdBy === 'Maria Silva'
  ).length || 2;

  // Monthly target
  monthlyTarget = { BRL: 100000, PYG: 145000000, USD: 20000 };
  targetProgress = (this.myTotalSales.BRL / this.monthlyTarget.BRL) * 100;

  // Recent orders
  myRecentOrders = SALES_ORDERS
    .filter(o => o.createdBy === 'Maria Silva')
    .slice(0, 5);

  // Top customers
  topCustomers = [
    { name: 'La Parrilla Steakhouse', type: 'Restaurant', orderCount: 5, totalPurchases: { BRL: 28000, PYG: 40600000, USD: 5600 } },
    { name: 'Wine Shop Central', type: 'Wine Shop', orderCount: 4, totalPurchases: { BRL: 22000, PYG: 31900000, USD: 4400 } },
    { name: 'Hotel Grand Plaza', type: 'Hotel', orderCount: 3, totalPurchases: { BRL: 18500, PYG: 26825000, USD: 3700 } },
    { name: 'Bar Luna', type: 'Bar', orderCount: 2, totalPurchases: { BRL: 9500, PYG: 13775000, USD: 1900 } }
  ];
}
