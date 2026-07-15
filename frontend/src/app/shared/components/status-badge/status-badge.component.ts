import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoService } from '@jsverse/transloco';

export type OrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'ORDERED' | 'RECEIVED';
export type FulfillmentStatus = 'PENDING' | 'PICKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';
export type StatusType = OrderStatus | FulfillmentStatus;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="badge" [class]="'badge-' + severity()">
      @if (iconName()) {
        <mat-icon [fontIcon]="iconName()!" />
      }
      <span>{{ displayText() }}</span>
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

    .badge-secondary, .badge-contrast {
      background: var(--color-ink-muted);
    }

    .badge-info {
      background: var(--color-primary);
    }

    .badge-warning {
      background: var(--color-accent-orange);
    }

    .badge-danger {
      background: var(--color-error);
    }
  `]
})
export class StatusBadgeComponent {
  private transloco = inject(TranslocoService);

  private static readonly PI_TO_MATERIAL: Record<string, string> = {
    'pi pi-pencil': 'edit',
    'pi pi-clock': 'schedule',
    'pi pi-check': 'check',
    'pi pi-times': 'close',
    'pi pi-box': 'inventory_2',
    'pi pi-list': 'list',
    'pi pi-truck': 'local_shipping',
    'pi pi-send': 'send',
    'pi pi-check-circle': 'check_circle',
    'pi pi-ban': 'block',
    'pi pi-circle': 'circle',
  };

  /** The status value */
  status = input.required<StatusType>();

  /** The context for translations (sales, purchase, fulfillment) */
  context = input<'sales' | 'purchase' | 'fulfillment'>('sales');

  severity = computed<'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast'>(() => {
    const status = this.status();
    const severities: Record<StatusType, 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast'> = {
      'DRAFT': 'secondary',
      'PENDING_APPROVAL': 'warning',
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'FULFILLED': 'info',
      'PICKING': 'info',
      'PACKED': 'info',
      'SHIPPED': 'info',
      'ORDERED': 'info',
      'DELIVERED': 'success',
      'RECEIVED': 'success',
      'CANCELLED': 'danger'
    };
    return severities[status] ?? 'secondary';
  });

  icon = computed(() => {
    const status = this.status();
    const icons: Record<StatusType, string> = {
      'DRAFT': 'pi pi-pencil',
      'PENDING_APPROVAL': 'pi pi-clock',
      'PENDING': 'pi pi-clock',
      'APPROVED': 'pi pi-check',
      'REJECTED': 'pi pi-times',
      'FULFILLED': 'pi pi-box',
      'PICKING': 'pi pi-list',
      'PACKED': 'pi pi-box',
      'SHIPPED': 'pi pi-truck',
      'ORDERED': 'pi pi-send',
      'DELIVERED': 'pi pi-check-circle',
      'RECEIVED': 'pi pi-check-circle',
      'CANCELLED': 'pi pi-ban'
    };
    return icons[status] ?? 'pi pi-circle';
  });

  iconName = computed(() => {
    return StatusBadgeComponent.PI_TO_MATERIAL[this.icon()] ?? null;
  });

  displayText = computed(() => {
    const status = this.status();
    const ctx = this.context();
    // Map context to translation namespace (singular to plural where needed)
    const translationNamespace = ctx === 'purchase' ? 'purchases' :
                                  ctx === 'fulfillment' ? 'fulfillments' : ctx;
    const key = `${translationNamespace}.status.${status}`;

    // Try to translate, fallback to formatted status
    const translation = this.transloco.translate(key);
    if (translation !== key) {
      return translation;
    }

    // Fallback: convert SNAKE_CASE to Title Case
    return status
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  });
}
