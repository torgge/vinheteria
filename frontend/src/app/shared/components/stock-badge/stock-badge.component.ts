import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-stock-badge',
  standalone: true,
  imports: [CommonModule, TranslocoModule, TagModule],
  template: `
    <ng-container *transloco="let t">
      <p-tag [value]="resolveLabel(t)" [severity]="severity()" [icon]="icon()" />
    </ng-container>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class StockBadgeComponent {
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

  resolveLabel(t: (key: string, params?: object) => string): string {
    const qty = this.quantity();
    if (qty <= 0) return t('catalog.wine.outOfStock');
    if (!this.showQuantity()) {
      if (qty <= this.criticalThreshold()) return t('catalog.wine.lowStock');
      if (qty <= this.lowThreshold()) return t('catalog.wine.lowStock');
      return t('catalog.wine.inStock');
    }
    return `${qty} units`;
  }
}
