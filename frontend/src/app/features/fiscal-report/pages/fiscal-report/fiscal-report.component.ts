import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CurrencyService } from '../../../../core/currency/currency.service';
import { ExchangeRateService } from '../../../../core/currency/exchange-rate.service';
import { SupportedCurrency } from '../../../../core/currency/currency.model';
import { formatDate } from '../../../../shared/utils/date.utils';
import { SALES_ORDERS, SalesOrderStatus } from '../../../../mock/data';

interface FiscalRow {
  orderNumber: string;
  date: string;
  customerName: string;
  transactionCurrency: SupportedCurrency;
  transactionAmount: number;
  rate: number | null;         // null quando a transação já é BRL
  rateDate: string;
  carriedForward: boolean;
  accountingAmount: number;    // sempre BRL
  missingRate: boolean;        // par nunca cadastrado (bootstrap)
}

// Só transações efetivadas entram na contabilidade.
const RECORDED_STATUSES: SalesOrderStatus[] = ['APPROVED', 'FULFILLED', 'SHIPPED', 'DELIVERED'];

@Component({
  selector: 'app-fiscal-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <div class="fiscal-report-page" *transloco="let t">
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('fiscalReport.title') }}</h1>
          <p class="text-secondary">{{ t('fiscalReport.subtitle') }}</p>
        </div>
        <mat-form-field appearance="outline" class="period-filter">
          <mat-label>{{ t('fiscalReport.period') }}</mat-label>
          <mat-select [(ngModel)]="selectedPeriod">
            <mat-option value="all">{{ t('fiscalReport.allPeriods') }}</mat-option>
            @for (p of periods(); track p) {
              <mat-option [value]="p">{{ p }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- KPIs -->
      <div class="kpi-row">
        <mat-card appearance="outlined" class="kpi-card">
          <span class="kpi-label">{{ t('fiscalReport.totalAccounting') }}</span>
          <span class="kpi-value">{{ currency.formatPrice(totalAccounting(), 'BRL') }}</span>
        </mat-card>
        <mat-card appearance="outlined" class="kpi-card">
          <span class="kpi-label">{{ t('fiscalReport.transactionCount') }}</span>
          <span class="kpi-value">{{ rows().length }}</span>
        </mat-card>
      </div>

      <mat-card appearance="outlined">
        <mat-card-content>
          <table mat-table [dataSource]="rows()" style="min-width: 60rem">
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef>{{ t('fiscalReport.orderNumber') }}</th>
              <td mat-cell *matCellDef="let r">{{ r.orderNumber }}</td>
              <td mat-footer-cell *matFooterCellDef>{{ t('fiscalReport.total') }}</td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>{{ t('fiscalReport.date') }}</th>
              <td mat-cell *matCellDef="let r">{{ formatDate(r.date) }}</td>
              <td mat-footer-cell *matFooterCellDef></td>
            </ng-container>

            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>{{ t('fiscalReport.customer') }}</th>
              <td mat-cell *matCellDef="let r">{{ r.customerName }}</td>
              <td mat-footer-cell *matFooterCellDef></td>
            </ng-container>

            <!-- COLUNA 1: moeda da transação -->
            <ng-container matColumnDef="transaction">
              <th mat-header-cell *matHeaderCellDef class="amount-col">
                {{ t('fiscalReport.transactionAmount') }}
              </th>
              <td mat-cell *matCellDef="let r" class="amount-col">
                <span class="currency-tag">{{ r.transactionCurrency }}</span>
                {{ currency.formatPrice(r.transactionAmount, r.transactionCurrency) }}
              </td>
              <td mat-footer-cell *matFooterCellDef class="amount-col">—</td>
            </ng-container>

            <!-- Taxa aplicada -->
            <ng-container matColumnDef="rate">
              <th mat-header-cell *matHeaderCellDef class="amount-col">{{ t('fiscalReport.rate') }}</th>
              <td mat-cell *matCellDef="let r" class="amount-col">
                @if (r.rate === null) {
                  <span class="text-secondary">—</span>
                } @else {
                  {{ r.rate }}
                  @if (r.carriedForward) {
                    <mat-icon
                      class="carry-icon"
                      fontIcon="history"
                      [matTooltip]="t('fiscalReport.carriedForward', { date: formatDate(r.rateDate) })"
                    />
                  }
                }
              </td>
              <td mat-footer-cell *matFooterCellDef class="amount-col"></td>
            </ng-container>

            <!-- COLUNA 2: moeda contábil (BRL) -->
            <ng-container matColumnDef="accounting">
              <th mat-header-cell *matHeaderCellDef class="amount-col accounting-col">
                {{ t('fiscalReport.accountingAmount') }}
              </th>
              <td mat-cell *matCellDef="let r" class="amount-col accounting-col">
                @if (r.missingRate) {
                  <span class="missing-rate" [matTooltip]="t('fiscalReport.missingRate')">
                    <mat-icon fontIcon="warning" />
                  </span>
                } @else {
                  {{ currency.formatPrice(r.accountingAmount, 'BRL') }}
                }
              </td>
              <td mat-footer-cell *matFooterCellDef class="amount-col accounting-col total-value">
                {{ currency.formatPrice(totalAccounting(), 'BRL') }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            <tr mat-footer-row *matFooterRowDef="displayedColumns"></tr>
          </table>

          @if (rows().length === 0) {
            <div class="empty-state">
              <mat-icon fontIcon="receipt_long" />
              <p>{{ t('fiscalReport.noData') }}</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }
    .period-filter { min-width: 12rem; }
    .kpi-row {
      display: flex;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
      flex-wrap: wrap;
    }
    .kpi-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-xxs);
      padding: var(--space-md);
      min-width: 14rem;
    }
    .kpi-label { color: var(--color-ink-secondary); font-size: var(--font-size-sm); }
    .kpi-value { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-ink); }
    .amount-col { text-align: right; }
    .accounting-col { background: var(--color-canvas-soft); font-weight: 500; }
    .currency-tag {
      display: inline-block;
      font-size: var(--font-size-xs);
      color: var(--color-ink-secondary);
      margin-right: var(--space-xxs);
    }
    .carry-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      vertical-align: middle;
      color: var(--color-accent-orange);
      cursor: help;
    }
    .missing-rate { color: var(--color-error); }
    .total-value { font-weight: 700; color: var(--color-ink); }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-xxl);
      color: var(--color-ink-secondary);
    }
  `]
})
export class FiscalReportComponent {
  readonly currency = inject(CurrencyService);
  private readonly exchangeRates = inject(ExchangeRateService);

  readonly formatDate = formatDate;
  readonly displayedColumns = ['orderNumber', 'date', 'customer', 'transaction', 'rate', 'accounting'];

  readonly selectedPeriod = signal<string>('all');

  private readonly recordedOrders = SALES_ORDERS.filter(o => RECORDED_STATUSES.includes(o.status));

  readonly periods = computed(() => {
    const set = new Set(this.recordedOrders.map(o => o.createdAt.substring(0, 7)));
    return [...set].sort((a, b) => b.localeCompare(a));
  });

  readonly rows = computed<FiscalRow[]>(() => {
    const period = this.selectedPeriod();
    return this.recordedOrders
      .filter(o => period === 'all' || o.createdAt.substring(0, 7) === period)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(o => {
        const isoDate = o.createdAt.split('T')[0];
        const txCurrency = o.transactionCurrency;
        const txAmount = o.totalAmount[txCurrency];
        const converted = this.exchangeRates.toAccounting(txAmount, txCurrency, isoDate);
        return {
          orderNumber: o.orderNumber,
          date: o.createdAt,
          customerName: o.customerName,
          transactionCurrency: txCurrency,
          transactionAmount: txAmount,
          rate: txCurrency === 'BRL' ? null : (converted?.resolved.rate ?? null),
          rateDate: converted?.resolved.date ?? isoDate,
          carriedForward: converted?.resolved.carriedForward ?? false,
          accountingAmount: converted?.accountingAmount ?? 0,
          missingRate: converted === null
        };
      });
  });

  readonly totalAccounting = computed(() =>
    this.rows().reduce((sum, r) => sum + (r.missingRate ? 0 : r.accountingAmount), 0)
  );
}
