import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ExchangeRateService } from '../../../../core/currency/exchange-rate.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { formatDate } from '../../../../shared/utils/date.utils';

type PairCurrency = 'USD' | 'PYG';

@Component({
  selector: 'app-exchange-rate-list',
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
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="exchange-rates-page" *transloco="let t">
      <div class="page-header">
        <div class="header-content">
          <h1>{{ t('exchangeRates.title') }}</h1>
          <p class="text-secondary">{{ t('exchangeRates.subtitle') }}</p>
        </div>
      </div>

      <!-- Taxa atual por par -->
      <div class="latest-row">
        @for (r of exchangeRates.latestByPair(); track r.id) {
          <mat-card appearance="outlined" class="latest-card">
            <span class="pair">{{ r.fromCurrency }} → {{ r.toCurrency }}</span>
            <span class="rate">{{ r.rate }}</span>
            <span class="meta text-secondary">{{ formatDate(r.date) }} · {{ t('exchangeRates.source.' + r.source) }}</span>
          </mat-card>
        }
      </div>

      <!-- Cadastro / override manual (ADMIN) -->
      <mat-card appearance="outlined" class="form-card">
        <mat-card-content>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>{{ t('exchangeRates.currency') }}</mat-label>
              <mat-select [(ngModel)]="formCurrency">
                <mat-option value="USD">USD → BRL</mat-option>
                <mat-option value="PYG">PYG → BRL</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ t('exchangeRates.date') }}</mat-label>
              <input matInput type="date" [(ngModel)]="formDate" [max]="today" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ t('exchangeRates.rate') }}</mat-label>
              <input matInput type="number" step="0.0001" min="0" [(ngModel)]="formRate" />
            </mat-form-field>

            <button mat-flat-button [disabled]="!canSave()" (click)="save()">
              <mat-icon fontIcon="save" />
              {{ t('exchangeRates.saveRate') }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Histórico -->
      <mat-card appearance="outlined">
        <mat-card-content>
          <table mat-table [dataSource]="exchangeRates.rates()" style="min-width: 40rem">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>{{ t('exchangeRates.date') }}</th>
              <td mat-cell *matCellDef="let r">{{ formatDate(r.date) }}</td>
            </ng-container>
            <ng-container matColumnDef="pair">
              <th mat-header-cell *matHeaderCellDef>{{ t('exchangeRates.pair') }}</th>
              <td mat-cell *matCellDef="let r">{{ r.fromCurrency }} → {{ r.toCurrency }}</td>
            </ng-container>
            <ng-container matColumnDef="rate">
              <th mat-header-cell *matHeaderCellDef class="amount-col">{{ t('exchangeRates.rate') }}</th>
              <td mat-cell *matCellDef="let r" class="amount-col">{{ r.rate }}</td>
            </ng-container>
            <ng-container matColumnDef="source">
              <th mat-header-cell *matHeaderCellDef>{{ t('exchangeRates.source.label') }}</th>
              <td mat-cell *matCellDef="let r">
                <span class="source-tag" [class.manual]="r.source === 'MANUAL'">
                  {{ t('exchangeRates.source.' + r.source) }}
                </span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: var(--space-lg); }
    .latest-row { display: flex; gap: var(--space-md); margin-bottom: var(--space-lg); flex-wrap: wrap; }
    .latest-card {
      display: flex; flex-direction: column; gap: var(--space-xxs);
      padding: var(--space-md); min-width: 12rem;
    }
    .latest-card .pair { font-size: var(--font-size-sm); color: var(--color-ink-secondary); }
    .latest-card .rate { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-ink); }
    .latest-card .meta { font-size: var(--font-size-xs); }
    .form-card { margin-bottom: var(--space-lg); }
    .form-row { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
    .amount-col { text-align: right; }
    .source-tag {
      font-size: var(--font-size-xs);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--color-canvas-soft);
      color: var(--color-ink-secondary);
    }
    .source-tag.manual { background: var(--color-info-bg); color: var(--color-accent-sky); }
  `]
})
export class ExchangeRateListComponent {
  readonly exchangeRates = inject(ExchangeRateService);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  readonly formatDate = formatDate;
  readonly displayedColumns = ['date', 'pair', 'rate', 'source'];
  readonly today = new Date().toISOString().split('T')[0];

  readonly formCurrency = signal<PairCurrency>('USD');
  readonly formDate = signal<string>(this.today);
  readonly formRate = signal<number | null>(null);

  readonly canSave = computed(() => {
    const rate = this.formRate();
    return rate !== null && rate > 0 && !!this.formDate();
  });

  save(): void {
    const rate = this.formRate();
    if (rate === null || rate <= 0) return;
    this.exchangeRates.upsertRate(this.formCurrency(), this.formDate(), rate);
    this.notification.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate('exchangeRates.rateSaved', {
        pair: `${this.formCurrency()} → BRL`
      })
    });
    this.formRate.set(null);
  }
}
