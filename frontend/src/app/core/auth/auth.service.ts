import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, DemoUser, DEMO_USERS, ROLE_PERMISSIONS, UserRole } from './auth.model';

const AUTH_STORAGE_KEY = 'vinheria-auth-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Current user signal
  private readonly _currentUser = signal<AuthUser | null>(this.loadUserFromStorage());

  // Public signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly userName = computed(() => this._currentUser()?.name ?? '');
  readonly userAvatar = computed(() => this._currentUser()?.avatar ?? '');

  // Role checks
  readonly isSeller = computed(() => this.hasRole('SELLER'));
  readonly isPurchaser = computed(() => this.hasRole('PURCHASER'));
  readonly isManager = computed(() => this.hasRole('MANAGER'));
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));
  readonly canApprove = computed(() => this.hasAnyRole(['MANAGER', 'ADMIN']));
  readonly canManageUsers = computed(() => this.hasRole('ADMIN'));
  readonly canViewReports = computed(() => this.hasAnyRole(['MANAGER', 'ADMIN']));

  // Demo users for login selector
  readonly demoUsers: DemoUser[] = DEMO_USERS;

  constructor(private router: Router) {}

  /**
   * Login with a demo user (for investor demo)
   */
  loginWithDemoUser(user: DemoUser): void {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      preferredLanguage: user.preferredLanguage,
      preferredCurrency: user.preferredCurrency
    };

    this._currentUser.set(authUser);
    this.saveUserToStorage(authUser);

    // Navigate to dashboard after login
    this.router.navigate(['/dashboard']);
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Switch to a different demo user (for demo purposes)
   */
  switchUser(user: DemoUser): void {
    this.loginWithDemoUser(user);
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    const currentRole = this._currentUser()?.role;
    if (!currentRole) return false;
    if (currentRole === 'ADMIN') return true; // Admin has all roles
    return currentRole === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const role = this._currentUser()?.role;
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role];
    if (permissions.includes('*')) return true; // Admin has all permissions

    // Check for exact match or wildcard match
    return permissions.some(p => {
      if (p === permission) return true;
      // Handle wildcard permissions like 'sales:read:*'
      const parts = p.split(':');
      const permParts = permission.split(':');
      return parts.every((part, i) => part === '*' || part === permParts[i]);
    });
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): AuthUser | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch (e) {
      console.error('Failed to load user from storage:', e);
    }
    return null;
  }

  /**
   * Save user to localStorage
   */
  private saveUserToStorage(user: AuthUser): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user to storage:', e);
    }
  }
}
