import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type KpiTrend = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="kpi-card vinheria-card-elevated" [class]="variant() ? 'kpi-card--' + variant() : ''">
      <div class="kpi-content">
        <div class="kpi-icon" [class]="iconBgClass()">
          <mat-icon [fontIcon]="iconName()" />
        </div>
        <div class="kpi-data">
          <div class="kpi-value">{{ value() }}</div>
          <div class="kpi-label">{{ label() }}</div>
          @if (trend(); as t) {
            <div class="kpi-trend" [class]="'trend-' + trendDirection()">
              <mat-icon [fontIcon]="trendIconName()" />
              <span>{{ t }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      padding: var(--vinheria-spacing-lg, 24px);
      border-radius: var(--vinheria-radius-lg);
      background: var(--m3-surface-container-low);
      border: none;
    }

    .kpi-card--warning {
      border-left: 4px solid var(--vinheria-warning);
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md, 16px);
    }

    .kpi-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--vinheria-radius-md);
      flex-shrink: 0;

      mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
    }

    .kpi-icon--success {
      background: var(--vinheria-success-bg);
      color: var(--vinheria-success);
    }

    .kpi-icon--warning {
      background: var(--vinheria-warning-bg);
      color: var(--vinheria-warning);
    }

    .kpi-icon--info {
      background: var(--vinheria-info-bg);
      color: var(--vinheria-info);
    }

    .kpi-icon--primary {
      background: var(--m3-primary-container);
      color: var(--m3-on-primary-container);
    }

    .kpi-data {
      flex: 1;
    }

    .kpi-value {
      font-size: var(--vinheria-font-size-2xl);
      font-weight: 700;
      color: var(--m3-on-surface);
      line-height: 1.2;
    }

    .kpi-label {
      font-size: var(--vinheria-font-size-sm);
      color: var(--m3-on-surface-variant);
      margin-top: 2px;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--vinheria-font-size-sm);
      font-weight: 600;
      margin-top: 4px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .trend-up {
      color: var(--vinheria-success);
    }

    .trend-down {
      color: var(--vinheria-error);
    }

    .trend-neutral {
      color: var(--m3-on-surface-variant);
    }
  `]
})
export class KpiCardComponent {
  /** Material Symbol name (e.g. 'attach_money') */
  icon = input<string>('bar_chart');
  iconBgClass = input<string>('kpi-icon--primary');
  value = input<string>('');
  label = input<string>('');
  trend = input<string | null>(null);
  trendDirection = input<KpiTrend>('neutral');
  variant = input<string>('');

  iconName = computed(() => {
    const name = this.icon();
    return name.startsWith('pi ') ? 'bar_chart' : name;
  });

  trendIconName = computed(() => {
    const direction = this.trendDirection();
    if (direction === 'up') return 'arrow_upward';
    if (direction === 'down') return 'arrow_downward';
    return 'remove';
  });
}
