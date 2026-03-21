import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslocoModule,
    ToastModule,
    SidebarComponent,
    TopbarComponent
  ],
  providers: [MessageService],
  template: `
    <div class="shell-container" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar
        [collapsed]="sidebarCollapsed()"
        (collapsedChange)="sidebarCollapsed.set($event)"
      />

      <div class="shell-main">
        <app-topbar
          [sidebarCollapsed]="sidebarCollapsed()"
          (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())"
        />

        <main class="shell-content">
          <router-outlet />
        </main>
      </div>

      <p-toast position="top-right" />
    </div>
  `,
  styles: [`
    .shell-container {
      display: flex;
      min-height: 100vh;
      background: var(--p-surface-ground);
    }

    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: var(--vinheria-sidebar-width);
      transition: margin-left var(--vinheria-transition-normal);
    }

    .sidebar-collapsed .shell-main {
      margin-left: var(--vinheria-sidebar-collapsed-width);
    }

    .shell-content {
      flex: 1;
      padding: var(--vinheria-spacing-xl);
      margin-top: var(--vinheria-topbar-height);
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .shell-main {
        margin-left: 0;
      }

      .shell-content {
        padding: var(--vinheria-spacing-md);
      }
    }
  `]
})
export class ShellComponent {
  private authService = inject(AuthService);

  sidebarCollapsed = signal(false);
}
