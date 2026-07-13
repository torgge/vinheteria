import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-fab
      class="vinheria-fab"
      [class.vinheria-fab-small]="size() === 'small'"
      [class.vinheria-fab-large]="size() === 'large'"
      [class.vinheria-fab-extended]="extended()"
      (click)="fabClick.emit()"
      [attr.aria-label]="ariaLabel()"
    >
      @if (icon()) {
        <mat-icon [fontIcon]="icon()" />
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
