import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-wine-detail',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `<div *transloco="let t"><h1>Wine Detail</h1><p>Coming soon...</p></div>`
})
export class WineDetailComponent {}
