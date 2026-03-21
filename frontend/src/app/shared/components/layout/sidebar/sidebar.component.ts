import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../../core/auth/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    TooltipModule
  ],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()" *transloco="let t">
      <div class="sidebar-header">
        <div class="logo">
          <i class="pi pi-box"></i>
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
            [pTooltip]="collapsed() ? t('nav.' + item.label) : null"
            tooltipPosition="right"
          >
            <i [class]="item.icon"></i>
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
              [pTooltip]="collapsed() ? t('nav.' + item.label) : null"
              tooltipPosition="right"
            >
              <i [class]="item.icon"></i>
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
          [pTooltip]="collapsed() ? 'Expand' : 'Collapse'"
          tooltipPosition="right"
        >
          <i [class]="collapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'"></i>
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
      background: var(--p-surface-card);
      border-right: 1px solid var(--p-surface-border);
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
      border-bottom: 1px solid var(--p-surface-border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--vinheria-spacing-sm);

      i {
        font-size: 1.75rem;
        color: var(--p-primary-color);
      }

      .logo-text {
        font-family: var(--vinheria-font-display);
        font-size: var(--vinheria-font-size-xl);
        font-weight: 600;
        color: var(--p-primary-color);
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
      color: var(--p-text-color-secondary);
      text-decoration: none;
      transition: all var(--vinheria-transition-fast);
      margin-bottom: var(--vinheria-spacing-xs);

      i {
        font-size: 1.25rem;
        width: 24px;
        text-align: center;
      }

      span {
        font-weight: 500;
        white-space: nowrap;
      }

      &:hover {
        background: var(--p-surface-hover);
        color: var(--p-text-color);
      }

      &.active {
        background: var(--p-primary-50);
        color: var(--p-primary-color);

        i {
          color: var(--p-primary-color);
        }
      }
    }

    .nav-divider {
      height: 1px;
      background: var(--p-surface-border);
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
      color: var(--p-text-color-muted);
    }

    .sidebar-footer {
      padding: var(--vinheria-spacing-md);
      border-top: 1px solid var(--p-surface-border);
    }

    .collapse-btn {
      width: 100%;
      padding: var(--vinheria-spacing-sm);
      border: none;
      background: var(--p-surface-hover);
      border-radius: var(--vinheria-radius-md);
      cursor: pointer;
      color: var(--p-text-color-secondary);
      transition: all var(--vinheria-transition-fast);

      &:hover {
        background: var(--p-primary-50);
        color: var(--p-primary-color);
      }

      i {
        font-size: 1rem;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);

        &.collapsed {
          transform: translateX(-100%);
        }
      }
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);

  collapsed = input(false);
  collapsedChange = output<boolean>();

  private menuItems: MenuItem[] = [
    { label: 'dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'catalog', icon: 'pi pi-book', route: '/catalog' },
    { label: 'sales', icon: 'pi pi-shopping-cart', route: '/sales', roles: ['SELLER', 'ADMIN'] },
    { label: 'purchases', icon: 'pi pi-truck', route: '/purchases', roles: ['PURCHASER', 'ADMIN'] },
    { label: 'approvals', icon: 'pi pi-check-circle', route: '/approvals', roles: ['MANAGER', 'ADMIN'] },
    { label: 'fulfillments', icon: 'pi pi-box', route: '/fulfillments' }
  ];

  private adminItems: MenuItem[] = [
    { label: 'customers', icon: 'pi pi-users', route: '/admin/customers' },
    { label: 'suppliers', icon: 'pi pi-building', route: '/admin/suppliers' },
    { label: 'warehouses', icon: 'pi pi-warehouse', route: '/admin/warehouses' },
    { label: 'pricing', icon: 'pi pi-dollar', route: '/admin/pricing' },
    { label: 'users', icon: 'pi pi-user-edit', route: '/admin/users' }
  ];

  visibleMenuItems = computed(() => {
    return this.menuItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.some(role => this.authService.hasRole(role as any));
    });
  });

  adminMenuItems = computed(() => {
    if (!this.authService.isAdmin()) return [];
    return this.adminItems;
  });
}
