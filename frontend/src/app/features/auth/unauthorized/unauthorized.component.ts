import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, ButtonModule],
  template: `
    <div class="unauthorized-container" *transloco="let t">
      <div class="unauthorized-content">
        <i class="pi pi-lock"></i>
        <h1>{{ t('errors.unauthorized') }}</h1>
        <p>You don't have permission to access this page.</p>
        <p-button label="Go to Dashboard" routerLink="/dashboard" icon="pi pi-home" />
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--m3-surface-container-lowest);
    }
    .unauthorized-content {
      text-align: center;
      i { font-size: 4rem; color: var(--vinheria-error); margin-bottom: 1rem; }
      h1 { color: var(--m3-on-surface); margin-bottom: 0.5rem; }
      p { color: var(--m3-on-surface-variant); margin-bottom: 1.5rem; }
    }
  `]
})
export class UnauthorizedComponent {}
