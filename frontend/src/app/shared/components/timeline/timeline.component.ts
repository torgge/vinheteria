import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface TimelineEvent {
  icon?: string;      // Material Symbol name
  color?: string;     // CSS color; default var(--color-primary)
  title: string;
  subtitle?: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <ol class="timeline">
      @for (event of events(); track $index) {
        <li class="timeline-item">
          <span class="marker" [style.background]="event.color ?? 'var(--color-primary)'">
            @if (event.icon) { <mat-icon [fontIcon]="event.icon" /> }
          </span>
          <div class="content">
            <div class="title">{{ event.title }}</div>
            @if (event.subtitle) { <div class="subtitle">{{ event.subtitle }}</div> }
          </div>
        </li>
      }
    </ol>
  `,
  styles: [`
    .timeline { list-style: none; margin: 0; padding: 0; }
    .timeline-item { display: flex; gap: var(--space-sm); position: relative; padding-bottom: var(--space-lg); }
    .timeline-item:not(:last-child)::before {
      content: ''; position: absolute; left: 15px; top: 32px; bottom: 0;
      width: 1px; background: var(--color-hairline);
    }
    .marker {
      width: 32px; height: 32px; border-radius: var(--radius-full); flex-shrink: 0;
      display: grid; place-items: center; color: var(--color-on-primary);
    }
    .marker mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .title { font: var(--font-body-sm); color: var(--color-ink); font-weight: 600; }
    .subtitle { font: var(--font-caption); color: var(--color-ink-muted); }
  `],
})
export class TimelineComponent {
  events = input.required<TimelineEvent[]>();
}
