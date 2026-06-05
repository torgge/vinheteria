import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { DemoUser, LanguageOption, ROLE_INFO, UserRole, AVAILABLE_LANGUAGES } from '../../../core/auth/auth.model';
import { CurrencyService } from '../../../core/currency/currency.service';

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
          <i class="pi pi-box" style="font-size: 3rem; color: var(--m3-primary)"></i>
        </div>
        <h1 class="vinheria-display">{{ t('common.appName') }}</h1>
        <p class="text-secondary">B2B Wine Distribution Platform</p>
      </div>

      <div class="login-settings">
        <p-dropdown
          [options]="languages"
          [(ngModel)]="selectedLanguage"
          optionLabel="label"
          (onChange)="onLanguageChange($event.value.id)"
          styleClass="language-dropdown"
        >
          <ng-template pTemplate="selectedItem" let-selected>
            <span>{{ selected.flag }} {{ selected.label }}</span>
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
          <div class="user-card vinheria-card-elevated" (click)="login(user)">
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
                [outlined]="true"
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
      font-family: var(--p-font-family);
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

          i {
            font-size: 1rem;
          }
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

  languages = AVAILABLE_LANGUAGES;

  private getCurrentLanguageOption(): LanguageOption {
    const activeLang = this.translocoService.getActiveLang();
    return this.languages.find(l => l.id === activeLang) ?? this.languages[0];
  }
  selectedLanguage: LanguageOption = this.getCurrentLanguageOption();

  login(user: DemoUser): void {
    // Set language and currency based on user preferences
    this.translocoService.setActiveLang(user.preferredLanguage);
    this.currencyService.setCurrency(user.preferredCurrency);

    // Perform login
    this.authService.loginWithDemoUser(user);
  }

  onLanguageChange(langId: string): void {
    this.translocoService.setActiveLang(langId);
  }

  getRoleColor(role: UserRole): string {
    return ROLE_INFO[role]?.color ?? 'var(--m3-on-surface-variant)';
  }

  getRoleIcon(role: UserRole): string {
    return ROLE_INFO[role]?.icon ?? 'pi pi-user';
  }

}
