import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `<div *transloco="let t"><h1>{{ t('purchases.title') }}</h1><p>Coming soon...</p></div>`
})
export class PurchaseOrderListComponent {}
