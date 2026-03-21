import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyService } from '../../../core/currency/currency.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    CardModule,
    ChartModule,
    TableModule,
    TagModule,
    ButtonModule
  ],
  template: `
    <div class="dashboard" *transloco="let t">
      <div class="dashboard-header">
        <h1>{{ t('dashboard.welcome', { name: authService.userName() }) }}</h1>
        <p class="text-secondary">{{ getCurrentDate() }}</p>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-icon" style="background: var(--vinheria-success-bg); color: var(--vinheria-success)">
              <i class="pi pi-dollar"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-value">{{ formatCurrency(248500) }}</span>
              <span class="kpi-label">{{ t('dashboard.totalSales') }}</span>
            </div>
          </div>
          <div class="kpi-trend positive">
            <i class="pi pi-arrow-up"></i>
            <span>+12.5%</span>
          </div>
        </p-card>

        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-icon" style="background: var(--vinheria-info-bg); color: var(--vinheria-info)">
              <i class="pi pi-shopping-cart"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-value">47</span>
              <span class="kpi-label">{{ t('dashboard.totalOrders') }}</span>
            </div>
          </div>
          <div class="kpi-trend positive">
            <i class="pi pi-arrow-up"></i>
            <span>+8.3%</span>
          </div>
        </p-card>

        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-icon" style="background: #FFF3E0; color: #ED6C02">
              <i class="pi pi-percentage"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-value">32.4%</span>
              <span class="kpi-label">{{ t('dashboard.totalMargin') }}</span>
            </div>
          </div>
          <div class="kpi-trend positive">
            <i class="pi pi-arrow-up"></i>
            <span>+2.1%</span>
          </div>
        </p-card>

        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-icon" style="background: var(--vinheria-warning-bg); color: var(--vinheria-warning)">
              <i class="pi pi-clock"></i>
            </div>
            <div class="kpi-data">
              <span class="kpi-value">5</span>
              <span class="kpi-label">{{ t('dashboard.pendingApprovals') }}</span>
            </div>
          </div>
          <a routerLink="/approvals" class="kpi-action">
            {{ t('common.view') }} <i class="pi pi-arrow-right"></i>
          </a>
        </p-card>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <p-card [header]="t('dashboard.salesChart')" styleClass="chart-card">
          <p-chart type="line" [data]="salesChartData" [options]="chartOptions" />
        </p-card>

        <p-card [header]="t('dashboard.topWines')" styleClass="top-wines-card">
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
        </p-card>
      </div>

      <!-- Recent Orders -->
      <p-card [header]="t('dashboard.recentOrders')" styleClass="orders-card">
        <p-table [value]="recentOrders" [tableStyle]="{ 'min-width': '60rem' }">
          <ng-template pTemplate="header">
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>{{ t('common.total') }}</th>
              <th>{{ t('common.margin') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('common.date') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-order>
            <tr>
              <td><strong>#{{ order.id }}</strong></td>
              <td>{{ order.customer }}</td>
              <td>{{ formatCurrency(order.total) }}</td>
              <td [class]="getMarginClass(order.marginPercentage)">
                {{ order.marginPercentage }}%
              </td>
              <td>
                <p-tag [value]="t('sales.status.' + order.status)" [severity]="getStatusSeverity(order.status)" />
              </td>
              <td>{{ order.date }}</td>
              <td>
                <p-button icon="pi pi-eye" text rounded size="small" />
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn var(--vinheria-transition-normal);
    }

    .dashboard-header {
      margin-bottom: var(--vinheria-spacing-xl);

      h1 {
        margin-bottom: var(--vinheria-spacing-xs);
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--vinheria-spacing-lg);
      margin-bottom: var(--vinheria-spacing-xl);
    }

    :host ::ng-deep .kpi-card {
      .p-card-body {
        padding: var(--vinheria-spacing-lg);
      }
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--vinheria-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
      }
    }

    .kpi-data {
      display: flex;
      flex-direction: column;
    }

    .kpi-value {
      font-size: var(--vinheria-font-size-2xl);
      font-weight: 700;
      color: var(--p-text-color);
    }

    .kpi-label {
      font-size: var(--vinheria-font-size-sm);
      color: var(--p-text-color-secondary);
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-xs);
      margin-top: var(--vinheria-spacing-sm);
      font-size: var(--vinheria-font-size-sm);
      font-weight: 600;

      &.positive {
        color: var(--vinheria-success);
      }

      &.negative {
        color: var(--vinheria-error);
      }
    }

    .kpi-action {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-xs);
      margin-top: var(--vinheria-spacing-sm);
      font-size: var(--vinheria-font-size-sm);
      color: var(--p-primary-color);
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--vinheria-spacing-lg);
      margin-bottom: var(--vinheria-spacing-xl);

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .chart-card,
    :host ::ng-deep .top-wines-card {
      .p-card-body {
        padding: var(--vinheria-spacing-lg);
      }
    }

    .top-wines-list {
      display: flex;
      flex-direction: column;
      gap: var(--vinheria-spacing-sm);
    }

    .top-wine-item {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md);
      padding: var(--vinheria-spacing-sm);
      border-radius: var(--vinheria-radius-md);
      transition: background var(--vinheria-transition-fast);

      &:hover {
        background: var(--p-surface-hover);
      }
    }

    .wine-rank {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--p-primary-50);
      color: var(--p-primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--vinheria-font-size-sm);
    }

    .wine-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .wine-name {
        font-weight: 600;
        font-size: var(--vinheria-font-size-sm);
      }

      .wine-region {
        font-size: var(--vinheria-font-size-xs);
        color: var(--p-text-color-secondary);
      }
    }

    .wine-sales {
      font-weight: 600;
      color: var(--p-primary-color);
    }

    :host ::ng-deep .orders-card {
      .p-card-body {
        padding: var(--vinheria-spacing-lg);
      }
    }

    .margin-high { color: var(--vinheria-margin-high); font-weight: 600; }
    .margin-medium { color: var(--vinheria-margin-medium); font-weight: 600; }
    .margin-low { color: var(--vinheria-margin-low); font-weight: 600; }
  `]
})
export class AdminDashboardComponent {
  authService = inject(AuthService);
  currencyService = inject(CurrencyService);

  // Mock data for charts
  salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Sales',
        data: [65000, 72000, 68000, 85000, 92000, 88000, 95000, 102000, 98000, 115000, 125000, 135000],
        fill: true,
        borderColor: '#722F37',
        backgroundColor: 'rgba(114, 47, 55, 0.1)',
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
          callback: (value: number) => this.formatCurrency(value)
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
    return new Intl.DateTimeFormat(this.currencyService.currencyLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  }

  getMarginClass(margin: number): string {
    if (margin >= 30) return 'margin-high';
    if (margin >= 15) return 'margin-medium';
    return 'margin-low';
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast'> = {
      'DRAFT': 'secondary',
      'PENDING_APPROVAL': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'FULFILLED': 'info',
      'SHIPPED': 'info',
      'DELIVERED': 'success',
      'CANCELLED': 'danger'
    };
    return severities[status] ?? 'secondary';
  }
}
