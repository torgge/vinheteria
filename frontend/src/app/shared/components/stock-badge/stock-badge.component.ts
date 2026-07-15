import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-stock-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="badge" [class]="'badge-' + severity()">
      @if (iconName()) {
        <mat-icon [fontIcon]="iconName()!" />
      }
      <span>{{ displayLabel() }}</span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xxs);
      padding: var(--space-xxs) var(--space-xs);
      border-radius: var(--radius-full);
      font: var(--font-eyebrow);
      white-space: nowrap;
      color: var(--color-on-primary);

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .badge-success {
      background: var(--color-accent-green);
    }

    .badge-secondary {
      background: var(--color-ink-muted);
    }

    .badge-warning {
      background: var(--color-accent-orange);
    }

    .badge-danger {
      background: var(--color-error);
    }
  `]
})
export class StockBadgeComponent {
  private transloco = inject(TranslocoService);

  private static readonly PI_TO_MATERIAL: Record<string, string> = {
    'pi pi-check-circle': 'check_circle',
    'pi pi-exclamation-circle': 'error',
    'pi pi-exclamation-triangle': 'warning',
    'pi pi-times-circle': 'cancel',
  };

  /** Available quantity */
  quantity = input.required<number>();

  /** Low stock threshold (default 10) */
  lowThreshold = input<number>(10);

  /** Critical stock threshold (default 5) */
  criticalThreshold = input<number>(5);

  /** Whether to show the quantity number */
  showQuantity = input<boolean>(true);

  severity = computed<'success' | 'warning' | 'danger' | 'secondary'>(() => {
    const qty = this.quantity();
    if (qty <= 0) return 'danger';
    if (qty <= this.criticalThreshold()) return 'danger';
    if (qty <= this.lowThreshold()) return 'warning';
    return 'success';
  });

  icon = computed(() => {
    const qty = this.quantity();
    if (qty <= 0) return 'pi pi-times-circle';
    if (qty <= this.criticalThreshold()) return 'pi pi-exclamation-circle';
    if (qty <= this.lowThreshold()) return 'pi pi-exclamation-triangle';
    return 'pi pi-check-circle';
  });

  iconName = computed(() => {
    return StockBadgeComponent.PI_TO_MATERIAL[this.icon()] ?? null;
  });

  displayLabel = computed(() => {
    const qty = this.quantity();
    if (qty <= 0) return this.transloco.translate('catalog.wine.outOfStock');
    if (!this.showQuantity()) {
      if (qty <= this.criticalThreshold()) return this.transloco.translate('catalog.wine.lowStock');
      if (qty <= this.lowThreshold()) return this.transloco.translate('catalog.wine.lowStock');
      return this.transloco.translate('catalog.wine.inStock');
    }
    return `${qty} units`;
  });
}
