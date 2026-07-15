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
      padding: var(--space-lg, 24px);
      border-radius: var(--radius-lg);
      background: var(--color-canvas-soft);
      border: none;
    }

    .kpi-card--warning {
      border-left: 4px solid var(--color-accent-orange);
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: var(--space-md, 16px);
    }

    .kpi-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      flex-shrink: 0;

      mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
    }

    .kpi-icon--success {
      background: var(--color-success-bg);
      color: var(--color-accent-green);
    }

    .kpi-icon--warning {
      background: var(--color-warning-bg);
      color: var(--color-accent-orange);
    }

    .kpi-icon--info {
      background: var(--color-info-bg);
      color: var(--color-accent-sky);
    }

    .kpi-icon--primary {
      background: var(--color-canvas-soft);
      color: var(--color-ink);
    }

    .kpi-data {
      flex: 1;
    }

    .kpi-value {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--color-ink);
      line-height: 1.2;
    }

    .kpi-label {
      font-size: var(--font-size-sm);
      color: var(--color-ink-secondary);
      margin-top: 2px;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-sm);
      font-weight: 600;
      margin-top: 4px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .trend-up {
      color: var(--color-accent-green);
    }

    .trend-down {
      color: var(--color-error);
    }

    .trend-neutral {
      color: var(--color-ink-secondary);
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
