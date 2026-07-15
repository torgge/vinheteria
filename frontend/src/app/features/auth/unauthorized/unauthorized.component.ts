import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container" *transloco="let t">
      <div class="unauthorized-content">
        <mat-icon fontIcon="lock" />
        <h1>{{ t('errors.unauthorized') }}</h1>
        <p>You don't have permission to access this page.</p>
        <button mat-flat-button color="primary" routerLink="/dashboard">
          <mat-icon fontIcon="home" />
          Go to Dashboard
        </button>
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
      mat-icon { font-size: 4rem; width: 4rem; height: 4rem; color: var(--vinheria-error); margin-bottom: 1rem; }
      h1 { color: var(--m3-on-surface); margin-bottom: 0.5rem; }
      p { color: var(--m3-on-surface-variant); margin-bottom: 1.5rem; }
    }
  `]
})
export class UnauthorizedComponent {}
