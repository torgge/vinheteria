import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { TranslocoService } from '@jsverse/transloco';

export type OrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'ORDERED' | 'RECEIVED';
export type FulfillmentStatus = 'PENDING' | 'PICKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';
export type StatusType = OrderStatus | FulfillmentStatus;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag [value]="displayText()" [severity]="severity()" [icon]="icon()" />
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class StatusBadgeComponent {
  private transloco = inject(TranslocoService);

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
