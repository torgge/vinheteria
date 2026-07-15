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
      width: var(--vinheria-sidebar-width);
      background: var(--m3-surface);
      box-shadow: var(--m3-elevation-1);
      display: flex;
      flex-direction: column;
      transition: width var(--vinheria-transition-normal);
      z-index: 1000;

      &.collapsed {
        width: var(--vinheria-sidebar-collapsed-width);

        .logo-text {
          display: none;
        }

        .nav-section-title {
          display: none;
        }
      }
    }

    .sidebar-header {
      padding: var(--vinheria-spacing-lg);
      border-bottom: 1px solid var(--m3-outline-variant);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm);

      mat-icon {
        font-size: 1.75rem;
        width: 1.75rem;
        height: 1.75rem;
        color: var(--m3-primary);
      }

      .logo-text {
        font-family: var(--vinheria-font-display);
        font-size: var(--vinheria-font-size-xl);
        font-weight: 600;
        color: var(--m3-primary);
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--vinheria-spacing-md);
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-md);
      padding: var(--vinheria-spacing-sm) var(--vinheria-spacing-md);
      border-radius: var(--vinheria-radius-md);
      color: var(--m3-on-surface-variant);
      text-decoration: none;
      transition: all var(--vinheria-transition-fast);
      margin-bottom: var(--vinheria-spacing-xs);
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
        border-radius: var(--m3-radius-sm);
        transition: background 150ms ease;
        pointer-events: none;
      }

      &:hover {
        color: var(--m3-on-surface);

        &::after {
          background: linear-gradient(rgba(var(--m3-primary-rgb), var(--m3-state-hover-opacity)), rgba(var(--m3-primary-rgb), var(--m3-state-hover-opacity)));
        }
      }

      &.active {
        color: var(--m3-primary);

        mat-icon {
          color: var(--m3-primary);
        }

        &::after {
          background: linear-gradient(rgba(var(--m3-primary-rgb), var(--m3-state-focus-opacity)), rgba(var(--m3-primary-rgb), var(--m3-state-focus-opacity)));
        }
      }
    }

    .nav-divider {
      height: 1px;
      background: var(--m3-outline-variant);
      margin: var(--vinheria-spacing-md) 0;
    }

    .nav-section {
      padding: var(--vinheria-spacing-xs) var(--vinheria-spacing-md);
      margin-bottom: var(--vinheria-spacing-xs);
    }

    .nav-section-title {
      font-size: var(--vinheria-font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--m3-outline);
    }

    .sidebar-footer {
      padding: var(--vinheria-spacing-md);
      border-top: 1px solid var(--m3-outline-variant);
    }

    .collapse-btn {
      width: 100%;
      padding: var(--vinheria-spacing-sm);
      border: none;
      background: var(--m3-surface-container-high);
      border-radius: var(--vinheria-radius-md);
      cursor: pointer;
      color: var(--m3-on-surface-variant);
      transition: all var(--vinheria-transition-fast);

      &:hover {
        background: var(--m3-primary-container);
        color: var(--m3-primary);
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
    { label: 'fulfillments', icon: 'inventory_2', route: '/fulfillments' }
  ];

  private adminItems: MenuItem[] = [
    { label: 'customers', icon: 'group', route: '/admin/customers' },
    { label: 'suppliers', icon: 'domain', route: '/admin/suppliers' },
    { label: 'warehouses', icon: 'warehouse', route: '/admin/warehouses' },
    { label: 'pricing', icon: 'attach_money', route: '/admin/pricing' },
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
