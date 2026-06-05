import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <button
      class="vinheria-fab"
      [class.vinheria-fab-small]="size() === 'small'"
      [class.vinheria-fab-large]="size() === 'large'"
      [class.vinheria-fab-extended]="extended()"
      (click)="fabClick.emit()"
      [attr.aria-label]="ariaLabel()"
    >
      @if (icon()) {
        <span class="material-symbols-outlined">{{ icon() }}</span>
      }
      @if (extended() && label()) {
        <span class="vinheria-fab-label">{{ label() }}</span>
      }
    </button>
  `,
  styles: []
})
export class FabComponent {
  icon = input<string>('add');
  label = input<string>('');
  size = input<'small' | 'default' | 'large'>('default');
  extended = input<boolean>(false);
  ariaLabel = input<string>('Floating action button');
  fabClick = output<void>();
}
