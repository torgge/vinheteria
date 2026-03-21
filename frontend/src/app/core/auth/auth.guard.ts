import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './auth.model';

/**
 * Guard that checks if user is authenticated
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Guard that checks if user is NOT authenticated (for login page)
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

/**
 * Factory function to create role-based guards
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
}

/**
 * Guard for seller routes
 */
export const sellerGuard: CanActivateFn = roleGuard(['SELLER', 'ADMIN']);

/**
 * Guard for purchaser routes
 */
export const purchaserGuard: CanActivateFn = roleGuard(['PURCHASER', 'ADMIN']);

/**
 * Guard for manager routes
 */
export const managerGuard: CanActivateFn = roleGuard(['MANAGER', 'ADMIN']);

/**
 * Guard for admin-only routes
 */
export const adminGuard: CanActivateFn = roleGuard(['ADMIN']);

/**
 * Guard for approval routes (manager or admin)
 */
export const approvalGuard: CanActivateFn = roleGuard(['MANAGER', 'ADMIN']);
