import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-margin-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="margin-indicator" [class]="marginClass()">
      <mat-icon [fontIcon]="iconName()" />
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
      border-radius: var(--radius-sm, 4px);

      mat-icon {
        font-size: 0.75rem;
        width: 0.75rem;
        height: 0.75rem;
      }
    }

    .margin-high {
      color: var(--color-accent-green);
      background: rgba(var(--color-margin-high-rgb), 0.1);
    }

    .margin-medium {
      color: var(--color-accent-orange);
      background: rgba(var(--color-margin-medium-rgb), 0.1);
    }

    .margin-low {
      color: var(--color-accent-pink);
      background: rgba(var(--color-margin-low-rgb), 0.1);
    }

    .margin-negative {
      color: var(--color-accent-purple-deep);
      background: rgba(var(--color-margin-negative-rgb), 0.1);
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

  iconName = computed(() => {
    const margin = this.marginPercentage();
    if (margin < 0) return 'arrow_downward';
    if (margin >= this.highThreshold()) return 'arrow_upward';
    if (margin >= this.mediumThreshold()) return 'remove';
    return 'arrow_downward';
  });
}
