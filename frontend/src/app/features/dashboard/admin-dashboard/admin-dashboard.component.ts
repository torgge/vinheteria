import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyService } from '../../../core/currency/currency.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { formatLongDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    KpiCardComponent,
    StatusBadgeComponent,
    ChartComponent,
  ],
  template: `
    <div class="dashboard" *transloco="let t">
      <div class="dashboard-header">
        <h1>{{ t('dashboard.welcome', { name: authService.userName() }) }}</h1>
        <p class="text-secondary">{{ getCurrentDate() }}</p>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <app-kpi-card
          icon="attach_money"
          iconBgClass="kpi-icon--success"
          [value]="formatCurrency(248500)"
          [label]="t('dashboard.totalSales')"
          trend="+12.5%"
          trendDirection="up"
        />

        <app-kpi-card
          icon="shopping_cart"
          iconBgClass="kpi-icon--info"
          value="47"
          [label]="t('dashboard.totalOrders')"
          trend="+8.3%"
          trendDirection="up"
        />

        <app-kpi-card
          icon="percent"
          iconBgClass="kpi-icon--warning"
          value="32.4%"
          [label]="t('dashboard.totalMargin')"
          trend="+2.1%"
          trendDirection="up"
        />

        <app-kpi-card
          icon="schedule"
          iconBgClass="kpi-icon--warning"
          value="5"
          [label]="t('dashboard.pendingApprovals')"
        />
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <mat-card appearance="outlined" class="chart-card">
          <mat-card-header>
            <mat-card-title>{{ t('dashboard.salesChart') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-chart type="line" [data]="salesChartData" [options]="chartOptions" />
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined" class="top-wines-card">
          <mat-card-header>
            <mat-card-title>{{ t('dashboard.topWines') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="top-wines-list">
              @for (wine of topWines; track wine.sku) {
                <div class="top-wine-item">
                  <div class="wine-rank">{{ $index + 1 }}</div>
                  <div class="wine-info">
                    <span class="wine-name">{{ wine.name }}</span>
                    <span class="wine-region">{{ wine.region }}</span>
                  </div>
                  <div class="wine-sales">{{ formatCurrency(wine.sales) }}</div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent Orders -->
      <mat-card appearance="outlined" class="orders-card">
        <mat-card-header>
          <mat-card-title>{{ t('dashboard.recentOrders') }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="recentOrders">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let order"><strong>#{{ order.id }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let order">{{ order.customer }}</td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.total') }}</th>
              <td mat-cell *matCellDef="let order">{{ formatCurrency(order.total) }}</td>
            </ng-container>

            <ng-container matColumnDef="margin">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.margin') }}</th>
              <td mat-cell *matCellDef="let order" [class]="getMarginClass(order.marginPercentage)">
                {{ order.marginPercentage }}%
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.status') }}</th>
              <td mat-cell *matCellDef="let order">
                <app-status-badge [status]="order.status" context="sales" />
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.date') }}</th>
              <td mat-cell *matCellDef="let order">{{ order.date }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>{{ t('common.actions') }}</th>
              <td mat-cell *matCellDef="let order">
                <button mat-icon-button [matTooltip]="t('common.view')">
                  <mat-icon fontIcon="visibility" />
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn var(--motion-normal);
    }

    .dashboard-header {
      margin-bottom: var(--space-xl);

      h1 {
        margin-bottom: var(--space-xxs);
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

    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);

      @media (max-width: 839px) {
        grid-template-columns: 1fr;
      }
    }

    .chart-card mat-card-content,
    .top-wines-card mat-card-content {
      padding: var(--space-lg);
    }

    .top-wines-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .top-wine-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-xs);
      border-radius: var(--radius-md);
      transition: background var(--motion-fast);

      &:hover {
        background: var(--color-canvas-soft);
      }
    }

    .wine-rank {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-canvas-soft);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--font-size-sm);
    }

    .wine-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .wine-name {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .wine-region {
        font-size: var(--font-size-xs);
        color: var(--color-ink-secondary);
      }
    }

    .wine-sales {
      font-weight: 600;
      color: var(--color-primary);
    }

    .orders-card mat-card-content {
      padding: var(--space-lg);
    }

    .margin-high { color: var(--color-accent-green); font-weight: 600; }
    .margin-medium { color: var(--color-accent-orange); font-weight: 600; }
    .margin-low { color: var(--color-accent-pink); font-weight: 600; }
  `]
})
export class AdminDashboardComponent {
  authService = inject(AuthService);
  private currencyService = inject(CurrencyService);

  displayedColumns = ['id', 'customer', 'total', 'margin', 'status', 'date', 'actions'];

  // Mock data for charts
  salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Sales',
        data: [65000, 72000, 68000, 85000, 92000, 88000, 95000, 102000, 98000, 115000, 125000, 135000],
        fill: true,
        borderColor: 'var(--color-primary)',
        backgroundColor: 'var(--color-canvas-soft)',
        tension: 0.4
      }
    ]
  };

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => this.formatCurrency(Number(value))
        }
      }
    }
  };

  topWines = [
    { sku: 'MLB-2020-001', name: 'Catena Zapata Malbec 2020', region: 'Mendoza, Argentina', sales: 42500 },
    { sku: 'CAB-2019-005', name: 'Don Melchor Cabernet 2019', region: 'Maipo, Chile', sales: 38200 },
    { sku: 'TAN-2021-003', name: 'Tannat Reserva 2021', region: 'Asuncion, Paraguay', sales: 31800 },
    { sku: 'MLB-2018-008', name: 'Achaval Ferrer Malbec 2018', region: 'Mendoza, Argentina', sales: 28500 },
    { sku: 'CMR-2020-002', name: 'Carmenere Gran Reserva 2020', region: 'Colchagua, Chile', sales: 24200 }
  ];

  recentOrders = [
    { id: '001', customer: 'Restaurant La Parrilla', total: 12500, marginPercentage: 35.2, status: 'DELIVERED', date: '2024-03-20' },
    { id: '002', customer: 'Wine Shop Central', total: 8200, marginPercentage: 28.5, status: 'SHIPPED', date: '2024-03-19' },
    { id: '003', customer: 'Hotel Grand Plaza', total: 15800, marginPercentage: 42.1, status: 'PENDING_APPROVAL', date: '2024-03-19' },
    { id: '004', customer: 'Distribuidora Norte', total: 22400, marginPercentage: 18.3, status: 'APPROVED', date: '2024-03-18' },
    { id: '005', customer: 'Bar & Bistro Luna', total: 5600, marginPercentage: 31.8, status: 'FULFILLED', date: '2024-03-17' }
  ];

  formatCurrency(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  getCurrentDate(): string {
    return formatLongDate(new Date());
  }

  getMarginClass(margin: number): string {
    if (margin >= 30) return 'margin-high';
    if (margin >= 15) return 'margin-medium';
    return 'margin-low';
  }
}
