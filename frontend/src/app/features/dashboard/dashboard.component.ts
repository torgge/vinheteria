import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { SellerDashboardComponent } from './seller-dashboard/seller-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AdminDashboardComponent,
    ManagerDashboardComponent,
    SellerDashboardComponent
  ],
  template: `
    @switch (userRole()) {
      @case ('ADMIN') {
        <app-admin-dashboard />
      }
      @case ('MANAGER') {
        <app-manager-dashboard />
      }
      @case ('SELLER') {
        <app-seller-dashboard />
      }
      @case ('PURCHASER') {
        <!-- Purchaser uses a similar view to seller but focused on purchases -->
        <app-manager-dashboard />
      }
      @default {
        <app-admin-dashboard />
      }
    }
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  userRole = this.authService.userRole;
}
