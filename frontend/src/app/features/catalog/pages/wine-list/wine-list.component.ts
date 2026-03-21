import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-wine-list',
  standalone: true,
  imports: [CommonModule, TranslocoModule, CardModule],
  template: `
    <div *transloco="let t">
      <h1>{{ t('catalog.title') }}</h1>
      <p class="text-secondary">Wine catalog coming soon...</p>
    </div>
  `
})
export class WineListComponent {}
