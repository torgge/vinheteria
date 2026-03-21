import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { DemoUser, ROLE_INFO } from '../../../core/auth/auth.model';
import { CurrencyService } from '../../../core/currency/currency.service';

interface LanguageOption {
  id: string;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    FormsModule
  ],
  template: `
    <div class="login-container" *transloco="let t">
      <div class="login-header">
        <div class="logo">
          <i class="pi pi-box" style="font-size: 3rem; color: var(--p-primary-color)"></i>
        </div>
        <h1 class="vinheria-display">{{ t('common.appName') }}</h1>
        <p class="text-secondary">B2B Wine Distribution Platform</p>
      </div>

      <div class="login-settings">
        <p-dropdown
          [options]="languages"
          [(ngModel)]="selectedLanguage"
          optionLabel="label"
          optionValue="id"
          (onChange)="onLanguageChange($event.value)"
          styleClass="language-dropdown"
        >
          <ng-template pTemplate="selectedItem" let-selected>
            <span>{{ getLanguageFlag(selected) }} {{ getLanguageLabel(selected) }}</span>
          </ng-template>
          <ng-template pTemplate="item" let-item>
            <span>{{ item.flag }} {{ item.label }}</span>
          </ng-template>
        </p-dropdown>
      </div>

      <div class="demo-badge">
        <i class="pi pi-info-circle"></i>
        {{ t('auth.demoMode') }}
      </div>

      <h2 class="select-user-title">{{ t('auth.selectUser') }}</h2>

      <div class="user-cards">
        @for (user of demoUsers; track user.id) {
          <div class="user-card" (click)="login(user)">
            <div class="user-avatar">
              <img [src]="user.avatar" [alt]="user.name" />
            </div>
            <div class="user-info">
              <h3>{{ user.name }}</h3>
              <div class="user-role" [style.color]="getRoleColor(user.role)">
                <i [class]="getRoleIcon(user.role)"></i>
                {{ t('auth.roles.' + user.role) }}
              </div>
              <p class="user-description">{{ t('auth.roleDescriptions.' + user.role) }}</p>
            </div>
            <div class="user-action">
              <p-button
                [label]="t('auth.login')"
                icon="pi pi-arrow-right"
                iconPos="right"
                styleClass="p-button-outlined"
              />
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
      background: linear-gradient(135deg, var(--p-surface-ground) 0%, #FDF2F3 100%);
    }

    .login-header {
      text-align: center;
      margin-bottom: var(--vinheria-spacing-lg);

      .logo {
        margin-bottom: var(--vinheria-spacing-md);
      }

      h1 {
        color: var(--p-primary-color);
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
      font-family: var(--p-font-family);
      font-size: var(--vinheria-font-size-xl);
      color: var(--p-text-color-secondary);
      margin-bottom: var(--vinheria-spacing-lg);
    }

    .user-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--vinheria-spacing-lg);
      max-width: 1400px;
      width: 100%;
    }

    .user-card {
      background: var(--p-surface-card);
      border: 2px solid var(--p-surface-border);
      border-radius: var(--vinheria-radius-lg);
      padding: var(--vinheria-spacing-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--vinheria-spacing-md);
      cursor: pointer;
      transition: all var(--vinheria-transition-normal);

      &:hover {
        border-color: var(--p-primary-color);
        box-shadow: var(--vinheria-shadow-lg);
        transform: translateY(-4px);
      }

      .user-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid var(--p-primary-100);

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

          i {
            font-size: 1rem;
          }
        }

        .user-description {
          color: var(--p-text-color-secondary);
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
      color: var(--p-text-color-muted);
      font-size: var(--vinheria-font-size-sm);
    }

    :host ::ng-deep .language-dropdown {
      min-width: 200px;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private translocoService = inject(TranslocoService);
  private currencyService = inject(CurrencyService);

  demoUsers = this.authService.demoUsers;

  languages: LanguageOption[] = [
    { id: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
    { id: 'es-PY', label: 'Español (Paraguay)', flag: '🇵🇾' },
    { id: 'en-US', label: 'English (USA)', flag: '🇺🇸' }
  ];

  selectedLanguage = this.translocoService.getActiveLang();

  login(user: DemoUser): void {
    // Set language and currency based on user preferences
    this.translocoService.setActiveLang(user.preferredLanguage);
    this.currencyService.setCurrency(user.preferredCurrency as any);

    // Perform login
    this.authService.loginWithDemoUser(user);
  }

  onLanguageChange(langId: string): void {
    this.translocoService.setActiveLang(langId);
  }

  getRoleColor(role: string): string {
    return ROLE_INFO[role as keyof typeof ROLE_INFO]?.color ?? '#666';
  }

  getRoleIcon(role: string): string {
    return ROLE_INFO[role as keyof typeof ROLE_INFO]?.icon ?? 'pi pi-user';
  }

  getLanguageFlag(langId: string): string {
    return this.languages.find(l => l.id === langId)?.flag ?? '';
  }

  getLanguageLabel(langId: string): string {
    return this.languages.find(l => l.id === langId)?.label ?? langId;
  }
}
