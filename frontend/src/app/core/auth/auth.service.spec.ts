import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { DemoUser, DEMO_USERS } from './auth.model';

const AUTH_STORAGE_KEY = 'vinheria-auth-user';

describe('AuthService', () => {
  let service: AuthService;
  let router: { navigate: jest.Mock };

  function createService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('initialization', () => {
    it('loads user from localStorage on creation', () => {
      const storedUser = DEMO_USERS[0];
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedUser));
      service = createService();

      expect(service.currentUser()?.id).toBe(storedUser.id);
      expect(service.currentUser()?.role).toBe(storedUser.role);
    });

    it('defaults to null when localStorage is empty', () => {
      service = createService();
      expect(service.currentUser()).toBeNull();
    });

    it('returns null when localStorage has invalid JSON', () => {
      localStorage.setItem(AUTH_STORAGE_KEY, 'not-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      service = createService();
      expect(service.currentUser()).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('derived signals', () => {
    const user = DEMO_USERS[0];

    beforeEach(() => {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      service = createService();
    });

    it('isAuthenticated is true when a user is loaded', () => {
      expect(service.isAuthenticated()).toBe(true);
    });

    it('userRole returns the role of the current user', () => {
      expect(service.userRole()).toBe('SELLER');
    });

    it('userName returns the name of the current user', () => {
      expect(service.userName()).toBe(user.name);
    });

    it('userAvatar returns the avatar URL', () => {
      expect(service.userAvatar()).toBe(user.avatar);
    });

    it('isSeller returns true only for SELLER role', () => {
      expect(service.isSeller()).toBe(true);
    });

    it('isAdmin returns false for SELLER role', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('loginWithDemoUser', () => {
    beforeEach(() => {
      service = createService();
    });

    it('sets the current user from a DemoUser', () => {
      service.loginWithDemoUser(DEMO_USERS[2]); // MANAGER
      expect(service.currentUser()?.role).toBe('MANAGER');
      expect(service.currentUser()?.name).toBe(DEMO_USERS[2].name);
    });

    it('persists the user to localStorage', () => {
      service.loginWithDemoUser(DEMO_USERS[1]);
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).role).toBe('PURCHASER');
    });

    it('navigates to /dashboard after login', () => {
      service.loginWithDemoUser(DEMO_USERS[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USERS[0]));
      service = createService();
    });

    it('clears the current user', () => {
      service.logout();
      expect(service.currentUser()).toBeNull();
    });

    it('removes the user from localStorage', () => {
      service.logout();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });

    it('navigates to /login', () => {
      service.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('switchUser', () => {
    beforeEach(() => {
      service = createService();
    });

    it('replaces the current user with a different DemoUser', () => {
      service.switchUser(DEMO_USERS[0]);
      expect(service.currentUser()?.role).toBe('SELLER');

      service.switchUser(DEMO_USERS[3]); // ADMIN
      expect(service.currentUser()?.role).toBe('ADMIN');
      expect(router.navigate).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasRole', () => {
    beforeEach(() => {
      service = createService();
    });

    it('returns false when no user is logged in', () => {
      expect(service.hasRole('SELLER')).toBe(false);
    });

    it('returns true when the user has the exact role', () => {
      service.loginWithDemoUser(DEMO_USERS[0]); // SELLER
      expect(service.hasRole('SELLER')).toBe(true);
      expect(service.hasRole('PURCHASER')).toBe(false);
    });

    it('returns true for any role when the user is ADMIN', () => {
      service.loginWithDemoUser(DEMO_USERS[3]); // ADMIN
      expect(service.hasRole('SELLER')).toBe(true);
      expect(service.hasRole('PURCHASER')).toBe(true);
      expect(service.hasRole('MANAGER')).toBe(true);
    });
  });

  describe('hasAnyRole', () => {
    beforeEach(() => {
      service = createService();
    });

    it('returns true when the user has at least one of the given roles', () => {
      service.loginWithDemoUser(DEMO_USERS[2]); // MANAGER
      expect(service.hasAnyRole(['PURCHASER', 'MANAGER'])).toBe(true);
    });

    it('returns false when the user has none of the given roles', () => {
      service.loginWithDemoUser(DEMO_USERS[0]); // SELLER
      expect(service.hasAnyRole(['PURCHASER', 'MANAGER'])).toBe(false);
    });
  });

  describe('hasPermission', () => {
    beforeEach(() => {
      service = createService();
    });

    it('returns false when no user is logged in', () => {
      expect(service.hasPermission('sales:create')).toBe(false);
    });

    it('returns true for an exact permission match', () => {
      service.loginWithDemoUser(DEMO_USERS[0]); // SELLER
      expect(service.hasPermission('sales:create')).toBe(true);
    });

    it('returns false for a permission the user does not have', () => {
      service.loginWithDemoUser(DEMO_USERS[0]); // SELLER
      expect(service.hasPermission('approvals:manage')).toBe(false);
    });

    it('returns true for any permission when ADMIN (wildcard)', () => {
      service.loginWithDemoUser(DEMO_USERS[3]); // ADMIN
      expect(service.hasPermission('sales:create')).toBe(true);
      expect(service.hasPermission('any:thing')).toBe(true);
    });

    it('matches wildcard sub-permissions like sales:read:*', () => {
      service.loginWithDemoUser(DEMO_USERS[0]); // SELLER has sales:read:own
      expect(service.hasPermission('sales:read:own')).toBe(true);
    });
  });

  describe('computed role checks', () => {
    beforeEach(() => {
      service = createService();
    });

    it('canApprove is true for MANAGER', () => {
      service.loginWithDemoUser(DEMO_USERS[2]);
      expect(service.canApprove()).toBe(true);
    });

    it('canApprove is false for SELLER', () => {
      service.loginWithDemoUser(DEMO_USERS[0]);
      expect(service.canApprove()).toBe(false);
    });

    it('canManageUsers is true only for ADMIN', () => {
      service.loginWithDemoUser(DEMO_USERS[3]);
      expect(service.canManageUsers()).toBe(true);

      service.loginWithDemoUser(DEMO_USERS[2]);
      expect(service.canManageUsers()).toBe(false);
    });

    it('canViewReports is true for MANAGER', () => {
      service.loginWithDemoUser(DEMO_USERS[2]);
      expect(service.canViewReports()).toBe(true);
    });
  });
});
