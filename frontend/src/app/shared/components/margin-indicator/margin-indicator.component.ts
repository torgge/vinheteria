import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-margin-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="margin-indicator" [class]="marginClass()">
      <i [class]="iconClass()"></i>
      {{ marginPercentage() | number:'1.1-1' }}%
    </span>
  `,
  styles: [`
    .margin-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--vinheria-radius-sm, 4px);

      i {
        font-size: 0.75rem;
      }
    }

    .margin-high {
      color: var(--vinheria-margin-high);
      background: rgba(var(--vinheria-margin-high-rgb), 0.1);
    }

    .margin-medium {
      color: var(--vinheria-margin-medium);
      background: rgba(var(--vinheria-margin-medium-rgb), 0.1);
    }

    .margin-low {
      color: var(--vinheria-margin-low);
      background: rgba(var(--vinheria-margin-low-rgb), 0.1);
    }

    .margin-negative {
      color: var(--vinheria-margin-negative);
      background: rgba(var(--vinheria-margin-negative-rgb), 0.1);
    }
  `]
})
export class MarginIndicatorComponent {
  /** The margin percentage value */
  marginPercentage = input.required<number>();

  /** High margin threshold (default 30%) */
  highThreshold = input<number>(30);

  /** Medium margin threshold (default 15%) */
  mediumThreshold = input<number>(15);

  marginClass = computed(() => {
    const margin = this.marginPercentage();
    if (margin < 0) return 'margin-negative';
    if (margin >= this.highThreshold()) return 'margin-high';
    if (margin >= this.mediumThreshold()) return 'margin-medium';
    return 'margin-low';
  });

  iconClass = computed(() => {
    const margin = this.marginPercentage();
    if (margin < 0) return 'pi pi-arrow-down';
    if (margin >= this.highThreshold()) return 'pi pi-arrow-up';
    if (margin >= this.mediumThreshold()) return 'pi pi-minus';
    return 'pi pi-arrow-down';
  });
}
