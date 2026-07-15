import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AuthService } from '../../../core/auth/auth.service';
import { DemoUser, LanguageOption, ROLE_INFO, UserRole, AVAILABLE_LANGUAGES } from '../../../core/auth/auth.model';
import { CurrencyService } from '../../../core/currency/currency.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="login-container" *transloco="let t">
      <div class="login-header">
        <div class="logo">
          <mat-icon fontIcon="inventory_2" style="font-size: 3rem; width: 3rem; height: 3rem; color: var(--m3-primary)" />
        </div>
        <h1 class="vinheria-display">{{ t('common.appName') }}</h1>
        <p class="text-secondary">B2B Wine Distribution Platform</p>
      </div>

      <div class="login-settings">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-select [(ngModel)]="selectedLanguage" (selectionChange)="onLanguageChange($event.value.id)">
            <mat-select-trigger>
              <span>{{ selectedLanguage.flag }} {{ selectedLanguage.label }}</span>
            </mat-select-trigger>
            @for (lang of languages; track lang.id) {
              <mat-option [value]="lang">
                <span>{{ lang.flag }} {{ lang.label }}</span>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div class="demo-badge">
        <mat-icon fontIcon="info" />
        {{ t('auth.demoMode') }}
      </div>

      <h2 class="select-user-title">{{ t('auth.selectUser') }}</h2>

      <div class="user-cards">
        @for (user of demoUsers; track user.id) {
          <div class="user-card vinheria-card-elevated" (click)="login(user)">
            <div class="user-avatar">
              <img [src]="user.avatar" [alt]="user.name" />
            </div>
            <div class="user-info">
              <h3>{{ user.name }}</h3>
              <div class="user-role" [style.color]="getRoleColor(user.role)">
                <mat-icon [fontIcon]="getRoleIcon(user.role)" />
                {{ t('auth.roles.' + user.role) }}
              </div>
              <p class="user-description">{{ t('auth.roleDescriptions.' + user.role) }}</p>
            </div>
            <div class="user-action">
              <button mat-stroked-button>
                {{ t('auth.login') }}
                <mat-icon fontIcon="arrow_forward" />
              </button>
            </div>
          </div>
        }
      </div>

      <div class="login-footer">
        <p>&copy; 2024 Vinheria Digital. All rights reserved.</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--vinheria-spacing-xl);
      background: linear-gradient(135deg, var(--m3-surface-container-lowest) 0%, var(--m3-primary-container) 100%);
    }

    .login-header {
      text-align: center;
      margin-bottom: var(--vinheria-spacing-lg);

      .logo {
        margin-bottom: var(--vinheria-spacing-md);
      }

      h1 {
        color: var(--m3-primary);
        margin-bottom: var(--vinheria-spacing-xs);
      }
    }

    .login-settings {
      margin-bottom: var(--vinheria-spacing-lg);
    }

    .demo-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm);
      padding: var(--vinheria-spacing-sm) var(--vinheria-spacing-md);
      background: var(--vinheria-info-bg);
      color: var(--vinheria-info);
      border-radius: var(--vinheria-radius-full);
      font-size: var(--vinheria-font-size-sm);
      font-weight: 600;
      margin-bottom: var(--vinheria-spacing-lg);
    }

    .select-user-title {
      font-family: var(--font-family);
      font-size: var(--vinheria-font-size-xl);
      color: var(--m3-on-surface-variant);
      margin-bottom: var(--vinheria-spacing-lg);
    }

    .user-cards {
      display: grid;
      gap: var(--vinheria-spacing-lg, 24px);
      max-width: 1400px;
      width: 100%;
      grid-template-columns: 1fr;

      @media (min-width: 600px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 840px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1200px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .user-card {
      background: var(--m3-surface-container-low);
      border: none;
      border-radius: var(--m3-radius-md);
      box-shadow: var(--m3-elevation-1);
      padding: var(--vinheria-spacing-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--vinheria-spacing-md);
      cursor: pointer;
      transition: all var(--vinheria-transition-normal);

      &:hover {
        box-shadow: var(--m3-elevation-3);
        transform: translateY(-4px);
      }

      .user-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid var(--m3-primary-container);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .user-info {
        text-align: center;

        h3 {
          font-family: var(--vinheria-font-display);
          font-size: var(--vinheria-font-size-xl);
          margin-bottom: var(--vinheria-spacing-xs);
        }

        .user-role {
          display: inline-flex;
          align-items: center;
          gap: var(--vinheria-spacing-xs);
          font-weight: 600;
          font-size: var(--vinheria-font-size-sm);
          margin-bottom: var(--vinheria-spacing-sm);
        }

        .user-description {
          color: var(--m3-on-surface-variant);
          font-size: var(--vinheria-font-size-sm);
          line-height: 1.5;
          max-width: 280px;
        }
      }

      .user-action {
        margin-top: auto;
      }
    }

    .login-footer {
      margin-top: auto;
      padding-top: var(--vinheria-spacing-xl);
      color: var(--m3-outline);
      font-size: var(--vinheria-font-size-sm);
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private translocoService = inject(TranslocoService);
  private currencyService = inject(CurrencyService);

  demoUsers = this.authService.demoUsers;

  languages = AVAILABLE_LANGUAGES;

  private getCurrentLanguageOption(): LanguageOption {
    const activeLang = this.translocoService.getActiveLang();
    return this.languages.find(l => l.id === activeLang) ?? this.languages[0];
  }
  selectedLanguage: LanguageOption = this.getCurrentLanguageOption();

  login(user: DemoUser): void {
    this.translocoService.setActiveLang(user.preferredLanguage);
    this.currencyService.setCurrency(user.preferredCurrency);
    this.authService.loginWithDemoUser(user);
  }

  onLanguageChange(langId: string): void {
    this.translocoService.setActiveLang(langId);
  }

  getRoleColor(role: UserRole): string {
    return ROLE_INFO[role]?.color ?? 'var(--m3-on-surface-variant)';
  }

  getRoleIcon(role: UserRole): string {
    return ROLE_INFO[role]?.icon ?? 'person';
  }
}
