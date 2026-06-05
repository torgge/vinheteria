import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

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
          <div class="content-inner">
            <router-outlet />
          </div>
        </main>
      </div>

      <p-toast position="top-right" />
    </div>
  `,
  styles: [`
    .shell-container {
      display: flex;
      min-height: 100vh;
      background: var(--m3-surface-container-lowest);
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

    /* Compact: full-width */
    @media (max-width: 599px) {
      .shell-main {
        margin-left: 0;
      }

      .shell-content {
        padding: var(--vinheria-spacing-md, 16px);
      }
    }

    /* Medium: collapsed sidebar */
    @media (min-width: 600px) and (max-width: 839px) {
      .shell-main {
        margin-left: var(--vinheria-sidebar-collapsed-width, 80px);
      }
    }

    /* Expanded+: full sidebar */
    @media (min-width: 840px) {
      .shell-main {
        margin-left: var(--vinheria-sidebar-width, 280px);
      }
    }

    /* Large: constrain max-width */
    @media (min-width: 1200px) {
      .content-inner {
        max-width: 1040px;
        margin: 0 auto;
      }
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
}
