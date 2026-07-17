import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
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
          icon="attach_money"
          iconBgClass="kpi-icon--success"
          [value]="formatCurrency(myTotalSales.BRL)"
          [label]="t('dashboard.mySales')"
          [trend]="'+15.2% ' + t('dashboard.vsLastMonth')"
          trendDirection="up"
        />

        <app-kpi-card
          icon="shopping_cart"
          iconBgClass="kpi-icon--info"
          [value]="myOrderCount.toString()"
          [label]="t('dashboard.myOrders')"
        />

        <app-kpi-card
          icon="percent"
          iconBgClass="kpi-icon--primary"
          [value]="myAvgMargin.toFixed(1) + '%'"
          [label]="t('dashboard.myAvgMargin')"
        />

        <app-kpi-card
          icon="schedule"
          iconBgClass="kpi-icon--warning"
          [value]="myPendingOrders.toString()"
          [label]="t('dashboard.pendingOrders')"
        />
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button mat-flat-button routerLink="/sales/create">
          <mat-icon fontIcon="add" />
          {{ t('sales.createOrder') }}
        </button>
        <button mat-stroked-button routerLink="/catalog">
          <mat-icon fontIcon="list" />
          {{ t('dashboard.viewCatalog') }}
        </button>
        <button mat-stroked-button routerLink="/customers">
          <mat-icon fontIcon="group" />
          {{ t('dashboard.viewCustomers') }}
        </button>
      </div>

      <!-- Tables Row -->
      <div class="tables-row">
        <!-- Recent Orders -->
        <mat-card appearance="outlined" class="table-card">
          <mat-card-header>
            <mat-card-title>{{ t('dashboard.myRecentOrders') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="myRecentOrders">
              <ng-container matColumnDef="orderNumber">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.orderNumber') }}</th>
                <td mat-cell *matCellDef="let order"><strong>{{ order.orderNumber }}</strong></td>
              </ng-container>

              <ng-container matColumnDef="customerName">
                <th mat-header-cell *matHeaderCellDef>{{ t('dashboard.customer') }}</th>
                <td mat-cell *matCellDef="let order">{{ order.customerName }}</td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.total') }}</th>
                <td mat-cell *matCellDef="let order"><app-price-display [price]="order.totalAmount" /></td>
              </ng-container>

              <ng-container matColumnDef="margin">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.margin') }}</th>
                <td mat-cell *matCellDef="let order"><app-margin-indicator [marginPercentage]="order.marginPercentage" /></td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>{{ t('common.status') }}</th>
                <td mat-cell *matCellDef="let order"><app-status-badge [status]="order.status" context="sales" /></td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumnsOrders"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumnsOrders;"></tr>
            </table>
          </mat-card-content>
          <div class="card-footer">
            <button mat-button routerLink="/sales">{{ t('dashboard.viewAllOrders') }}</button>
          </div>
        </mat-card>

        <!-- Top Customers -->
        <mat-card appearance="outlined" class="table-card">
          <mat-card-header>
            <mat-card-title>{{ t('dashboard.topCustomers') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="topCustomers">
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>{{ t('dashboard.customer') }}</th>
                <td mat-cell *matCellDef="let customer">
                  <div class="customer-cell">
                    <strong>{{ customer.name }}</strong>
                    <span class="customer-type">{{ customer.type }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="orders">
                <th mat-header-cell *matHeaderCellDef>{{ t('dashboard.orders') }}</th>
                <td mat-cell *matCellDef="let customer">{{ customer.orderCount }}</td>
              </ng-container>

              <ng-container matColumnDef="totalPurchases">
                <th mat-header-cell *matHeaderCellDef>{{ t('dashboard.totalPurchases') }}</th>
                <td mat-cell *matCellDef="let customer"><app-price-display [price]="customer.totalPurchases" /></td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumnsCustomers"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumnsCustomers;"></tr>
            </table>
          </mat-card-content>
          <div class="card-footer">
            <button mat-button routerLink="/customers">{{ t('dashboard.viewAllCustomers') }}</button>
          </div>
        </mat-card>
      </div>

      <!-- Sales Target Progress -->
      <mat-card appearance="outlined" class="target-card">
        <mat-card-header>
          <mat-card-title>{{ t('dashboard.monthlyTarget') }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
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
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn var(--motion-normal) ease-out;
    }

    .dashboard-header {
      margin-bottom: var(--space-lg, 24px);

      h1 {
        margin-bottom: var(--space-xxs, 4px);
      }
    }

    .kpi-grid {
      display: grid;
      gap: var(--space-md, 16px);
      margin-bottom: var(--space-lg, 24px);
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
      gap: var(--space-md, 16px);
      margin-bottom: var(--space-lg, 24px);
      flex-wrap: wrap;
    }

    .tables-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-lg, 24px);
      margin-bottom: var(--space-lg, 24px);
    }

    .table-card mat-card-content {
      padding: 0;
    }

    .table-card mat-card-header {
      padding: var(--space-md, 16px);
      border-bottom: 1px solid var(--color-hairline);
    }

    .card-footer {
      padding: var(--space-xs, 8px) var(--space-md, 16px);
      border-top: 1px solid var(--color-hairline);
      text-align: center;
    }

    .customer-cell {
      display: flex;
      flex-direction: column;

      .customer-type {
        font-size: 0.75rem;
        color: var(--color-ink-secondary);
      }
    }

    .target-card mat-card-content {
      padding: var(--space-lg, 24px);
    }

    .target-content {
      display: flex;
      align-items: center;
      gap: var(--space-xl, 32px);
    }

    .target-progress {
      flex: 1;
    }

    .progress-bar {
      height: 16px;
      background: var(--color-canvas-soft);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: var(--space-xs, 8px);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent-green) 100%);
      border-radius: var(--radius-md);
      transition: width 0.5s ease-out;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--color-ink-secondary);
    }

    .target-percentage {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-md, 16px);
      background: var(--color-canvas-soft);
      border-radius: var(--radius-lg, 12px);
    }

    .percentage-value {
      font-size: var(--font-size-3xl);
      font-weight: 700;
      color: var(--color-primary);
    }

    .percentage-label {
      font-size: 0.875rem;
      color: var(--color-ink-secondary);
    }
  `]
})
export class SellerDashboardComponent {
  authService = inject(AuthService);
  currencyService = inject(CurrencyService);

  displayedColumnsOrders = ['orderNumber', 'customerName', 'total', 'margin', 'status'];
  displayedColumnsCustomers = ['customer', 'orders', 'totalPurchases'];

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
