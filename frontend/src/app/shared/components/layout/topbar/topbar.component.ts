import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuItem } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { CurrencyService } from '../../../../core/currency/currency.service';
import { LanguageOption, ROLE_INFO, AVAILABLE_LANGUAGES } from '../../../../core/auth/auth.model';
import { SupportedCurrency, CurrencyOption } from '../../../../core/currency/currency.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    DropdownModule,
    MenuModule,
    AvatarModule,
    BadgeModule
  ],
  template: `
    <header class="topbar" *transloco="let t">
      <div class="topbar-start">
        <button
          class="menu-toggle"
          (click)="toggleSidebar.emit()"
          pButton
          icon="pi pi-bars"
          text
        ></button>
      </div>

      <div class="topbar-end">
        <!-- Currency Switcher -->
        <p-dropdown
          [options]="currencies"
          [(ngModel)]="selectedCurrency"
          optionLabel="label"
          (onChange)="onCurrencyChange($event.value.code)"
          styleClass="currency-dropdown"
        >
          <ng-template pTemplate="selectedItem" let-selected>
            <span class="currency-selected">{{ selected.flag }} {{ selected.label }}</span>
          </ng-template>
          <ng-template pTemplate="item" let-item>
            <span>{{ item.flag }} {{ item.label }}</span>
          </ng-template>
        </p-dropdown>

        <!-- Language Switcher -->
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

        <!-- User Menu -->
        <div class="user-menu" (click)="userMenu.toggle($event)">
          <p-avatar
            [image]="authService.userAvatar()"
            [label]="authService.userAvatar() ? undefined : getInitials()"
            shape="circle"
            size="normal"
            styleClass="user-avatar"
          />
          <div class="user-info">
            <span class="user-name">{{ authService.userName() }}</span>
            <span class="user-role" [style.color]="getRoleColor()">
              {{ t('auth.roles.' + authService.userRole()) }}
            </span>
          </div>
          <i class="pi pi-chevron-down"></i>
        </div>

        <p-menu #userMenu [model]="userMenuItems" [popup]="true" />
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      position: fixed;
      top: 0;
      right: 0;
      left: var(--vinheria-sidebar-width);
      height: var(--vinheria-topbar-height);
      background: var(--m3-surface);
      box-shadow: var(--m3-elevation-2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--vinheria-spacing-lg);
      z-index: 999;
      transition: left var(--vinheria-transition-normal);
    }

    :host-context(.sidebar-collapsed) .topbar {
      left: var(--vinheria-sidebar-collapsed-width);
    }

    .topbar-start {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md);
    }

    .menu-toggle {
      display: none;

      @media (max-width: 599px) {
        display: block;
      }
    }

    .topbar-end {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm);
      padding: var(--vinheria-spacing-xs) var(--vinheria-spacing-sm);
      border-radius: var(--vinheria-radius-md);
      cursor: pointer;
      transition: background var(--vinheria-transition-fast);

      &:hover {
        background: var(--m3-surface-container-high);
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      text-align: left;

      @media (max-width: 599px) {
        display: none;
      }
    }

    .user-name {
      font-weight: 600;
      font-size: var(--vinheria-font-size-sm);
      color: var(--m3-on-surface);
    }

    .user-role {
      font-size: var(--vinheria-font-size-xs);
      font-weight: 500;
    }

    .currency-selected {
      font-weight: 600;
    }

    :host ::ng-deep {
      .currency-dropdown,
      .language-dropdown {
        min-width: auto;

        .p-dropdown-label {
          padding: 0.5rem 0.75rem;
        }
      }

      .user-avatar {
        background: var(--m3-primary);
        color: var(--m3-on-primary);
      }
    }

    /* Compact: full-width topbar */
    @media (max-width: 599px) {
      .topbar {
        left: 0;
      }
    }

    /* Medium: collapsed sidebar offset */
    @media (min-width: 600px) and (max-width: 839px) {
      .topbar {
        left: var(--vinheria-sidebar-collapsed-width, 80px);
      }
    }
  `]
})
export class TopbarComponent {
  authService = inject(AuthService);
  private currencyService = inject(CurrencyService);
  private translocoService = inject(TranslocoService);

  sidebarCollapsed = input(false);
  toggleSidebar = output<void>();

  languages = AVAILABLE_LANGUAGES;

  currencies: CurrencyOption[] = [
    { code: 'BRL', label: 'Real (BRL)', flag: '🇧🇷' },
    { code: 'PYG', label: 'Guaraní (PYG)', flag: '🇵🇾' },
    { code: 'USD', label: 'Dollar (USD)', flag: '🇺🇸' }
  ];

  private getCurrentLanguageOption(): LanguageOption {
    const activeLang = this.translocoService.getActiveLang();
    return this.languages.find(l => l.id === activeLang) ?? this.languages[0];
  }
  selectedLanguage: LanguageOption = this.getCurrentLanguageOption();

  private getCurrentCurrencyOption(): CurrencyOption {
    const code = this.currencyService.selectedCurrency();
    return this.currencies.find(c => c.code === code) ?? this.currencies[0];
  }
  selectedCurrency: CurrencyOption = this.getCurrentCurrencyOption();

  userMenuItems: MenuItem[] = [
    {
      label: 'Switch User',
      icon: 'pi pi-users',
      command: () => this.authService.logout()
    },
    { separator: true },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => this.authService.logout()
    }
  ];

  onLanguageChange(langId: string): void {
    this.translocoService.setActiveLang(langId);
  }

  onCurrencyChange(currency: SupportedCurrency): void {
    this.selectedCurrency = this.currencies.find(c => c.code === currency) ?? this.currencies[0];
    this.currencyService.setCurrency(currency);
  }

  getRoleColor(): string {
    const role = this.authService.userRole();
    return role ? ROLE_INFO[role]?.color : 'var(--m3-on-surface-variant)';
  }

  getInitials(): string {
    const name = this.authService.userName();
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
