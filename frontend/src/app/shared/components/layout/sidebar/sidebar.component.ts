import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../../core/auth/auth.service';
import { UserRole } from '../../../../core/auth/auth.model';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatTooltipModule,
    MatIconModule
  ],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()" *transloco="let t">
      <div class="sidebar-header">
        <div class="logo">
          <mat-icon fontIcon="inventory_2" />
          @if (!collapsed()) {
            <span class="logo-text">Vinheria</span>
          }
        </div>
      </div>

      <nav class="sidebar-nav">
        @for (item of visibleMenuItems(); track item.route) {
          <a
            class="nav-item"
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            [matTooltip]="t('nav.' + item.label)"
            [matTooltipDisabled]="!collapsed()"
            matTooltipPosition="right"
          >
            <mat-icon [fontIcon]="item.icon" />
            @if (!collapsed()) {
              <span>{{ t('nav.' + item.label) }}</span>
            }
          </a>
        }

        @if (authService.isAdmin()) {
          <div class="nav-divider"></div>
          <div class="nav-section" *ngIf="!collapsed()">
            <span class="nav-section-title">{{ t('nav.admin') }}</span>
          </div>
          @for (item of adminMenuItems(); track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              [matTooltip]="t('nav.' + item.label)"
              [matTooltipDisabled]="!collapsed()"
              matTooltipPosition="right"
            >
              <mat-icon [fontIcon]="item.icon" />
              @if (!collapsed()) {
                <span>{{ t('nav.' + item.label) }}</span>
              }
            </a>
          }
        }
      </nav>

      <div class="sidebar-footer">
        <button
          class="collapse-btn"
          (click)="collapsedChange.emit(!collapsed())"
          [matTooltip]="collapsed() ? 'Expand' : 'Collapse'"
          matTooltipPosition="right"
        >
          <mat-icon [fontIcon]="collapsed() ? 'chevron_right' : 'chevron_left'" />
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: var(--layout-sidebar-width);
      background: var(--color-surface);
      box-shadow: var(--shadow-level-1);
      display: flex;
      flex-direction: column;
      transition: width var(--motion-normal);
      z-index: 1000;

      &.collapsed {
        width: var(--layout-sidebar-collapsed-width);

        .logo-text {
          display: none;
        }

        .nav-section-title {
          display: none;
        }
      }
    }

    .sidebar-header {
      padding: var(--space-lg);
      border-bottom: 1px solid var(--color-hairline);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--space-xs);

      mat-icon {
        font-size: 1.75rem;
        width: 1.75rem;
        height: 1.75rem;
        color: var(--color-primary);
      }

      .logo-text {
        font-family: var(--font-family);
        font-size: var(--font-size-xl);
        font-weight: 600;
        color: var(--color-primary);
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--space-md);
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-xs) var(--space-md);
      border-radius: var(--radius-md);
      color: var(--color-ink-secondary);
      text-decoration: none;
      transition: all var(--motion-fast);
      margin-bottom: var(--space-xxs);
      position: relative;

      mat-icon {
        font-size: 1.25rem;
        width: 24px;
        height: 1.25rem;
        text-align: center;
      }

      span {
        font-weight: 500;
        white-space: nowrap;
      }

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: var(--radius-sm);
        transition: background 150ms ease;
        pointer-events: none;
      }

      &:hover {
        color: var(--color-ink);

        &::after {
          background: linear-gradient(rgba(var(--color-primary-rgb), var(--state-hover-opacity)), rgba(var(--color-primary-rgb), var(--state-hover-opacity)));
        }
      }

      &.active {
        color: var(--color-primary);

        mat-icon {
          color: var(--color-primary);
        }

        &::after {
          background: linear-gradient(rgba(var(--color-primary-rgb), var(--state-focus-opacity)), rgba(var(--color-primary-rgb), var(--state-focus-opacity)));
        }
      }
    }

    .nav-divider {
      height: 1px;
      background: var(--color-hairline);
      margin: var(--space-md) 0;
    }

    .nav-section {
      padding: var(--space-xxs) var(--space-md);
      margin-bottom: var(--space-xxs);
    }

    .nav-section-title {
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-ink-muted);
    }

    .sidebar-footer {
      padding: var(--space-md);
      border-top: 1px solid var(--color-hairline);
    }

    .collapse-btn {
      width: 100%;
      padding: var(--space-xs);
      border: none;
      background: var(--color-canvas-soft);
      border-radius: var(--radius-md);
      cursor: pointer;
      color: var(--color-ink-secondary);
      transition: all var(--motion-fast);

      &:hover {
        background: var(--color-canvas-soft);
        color: var(--color-primary);
      }

      mat-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }
    }

    /* Compact: off-screen */
    @media (max-width: 599px) {
      :host {
        transform: translateX(-100%);
      }
      :host(.sidebar-open) {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);

  collapsed = input(false);
  collapsedChange = output<boolean>();

  private menuItems: MenuItem[] = [
    { label: 'dashboard', icon: 'home', route: '/dashboard' },
    { label: 'catalog', icon: 'menu_book', route: '/catalog' },
    { label: 'sales', icon: 'shopping_cart', route: '/sales', roles: ['SELLER', 'ADMIN'] },
    { label: 'purchases', icon: 'local_shipping', route: '/purchases', roles: ['PURCHASER', 'ADMIN'] },
    { label: 'approvals', icon: 'check_circle', route: '/approvals', roles: ['MANAGER', 'ADMIN'] },
    { label: 'fulfillments', icon: 'inventory_2', route: '/fulfillments' },
    { label: 'fiscalReport', icon: 'receipt_long', route: '/fiscal-report', roles: ['MANAGER', 'ADMIN'] }
  ];

  private adminItems: MenuItem[] = [
    { label: 'customers', icon: 'group', route: '/admin/customers' },
    { label: 'suppliers', icon: 'domain', route: '/admin/suppliers' },
    { label: 'warehouses', icon: 'warehouse', route: '/admin/warehouses' },
    { label: 'pricing', icon: 'attach_money', route: '/admin/pricing' },
    { label: 'exchangeRates', icon: 'currency_exchange', route: '/admin/exchange-rates' },
    { label: 'users', icon: 'manage_accounts', route: '/admin/users' }
  ];

  visibleMenuItems = computed(() => {
    return this.menuItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.some(role => this.authService.hasRole(role));
    });
  });

  adminMenuItems = computed(() => {
    if (!this.authService.isAdmin()) return [];
    return this.adminItems;
  });
}
