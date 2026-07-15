import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

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
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <header class="topbar" *transloco="let t">
      <div class="topbar-start">
        <button
          class="menu-toggle"
          mat-icon-button
          (click)="toggleSidebar.emit()"
        >
          <mat-icon fontIcon="menu" />
        </button>
      </div>

      <div class="topbar-end">
        <!-- Currency Switcher -->
        <mat-select
          class="topbar-select currency-select"
          [(ngModel)]="selectedCurrency"
          (selectionChange)="onCurrencyChange($event.value.code)"
        >
          <mat-select-trigger>
            <span class="currency-selected">{{ selectedCurrency.flag }} {{ selectedCurrency.label }}</span>
          </mat-select-trigger>
          @for (item of currencies; track item.code) {
            <mat-option [value]="item">{{ item.flag }} {{ item.label }}</mat-option>
          }
        </mat-select>

        <!-- Language Switcher -->
        <mat-select
          class="topbar-select language-select"
          [(ngModel)]="selectedLanguage"
          (selectionChange)="onLanguageChange($event.value.id)"
        >
          <mat-select-trigger>
            <span>{{ selectedLanguage.flag }} {{ selectedLanguage.label }}</span>
          </mat-select-trigger>
          @for (item of languages; track item.id) {
            <mat-option [value]="item">{{ item.flag }} {{ item.label }}</mat-option>
          }
        </mat-select>

        <!-- User Menu -->
        <div class="user-menu" [matMenuTriggerFor]="userMenu">
          <span class="avatar">
            @if (authService.userAvatar()) {
              <img [src]="authService.userAvatar()" alt="" />
            } @else {
              {{ getInitials() }}
            }
          </span>
          <div class="user-info">
            <span class="user-name">{{ authService.userName() }}</span>
            <span class="user-role" [style.color]="getRoleColor()">
              {{ t('auth.roles.' + authService.userRole()) }}
            </span>
          </div>
          <mat-icon fontIcon="expand_more" />
        </div>

        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="authService.logout()">
            <mat-icon fontIcon="group" />
            <span>Switch User</span>
          </button>
          <mat-divider />
          <button mat-menu-item (click)="authService.logout()">
            <mat-icon fontIcon="logout" />
            <span>Sign Out</span>
          </button>
        </mat-menu>
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

    .topbar-select {
      width: auto;
      min-width: 140px;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-hairline);
      border-radius: var(--radius-xs);
      background: var(--color-surface);
      font: var(--font-body-sm);
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

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--color-secondary);
      color: var(--color-on-primary);
      font: var(--font-eyebrow);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
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
