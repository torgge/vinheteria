// Vinheria Digital — Auth Models

import { SupportedCurrency } from '../currency/currency.model';

export interface LanguageOption {
  id: string;
  label: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { id: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { id: 'es-PY', label: 'Español (Paraguay)', flag: '🇵🇾' },
  { id: 'en-US', label: 'English (USA)', flag: '🇺🇸' }
];

export type UserRole = 'SELLER' | 'PURCHASER' | 'MANAGER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  preferredLanguage: string;
  preferredCurrency: SupportedCurrency;
}

export interface DemoUser extends AuthUser {
  description: string;
}

// Demo users for investor presentation
export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-seller-1',
    email: 'seller@vinheria.demo',
    name: 'Carlos Silva',
    role: 'SELLER',
    description: 'Sales Representative - Creates sales orders, manages customer relationships',
    preferredLanguage: 'pt-BR',
    preferredCurrency: 'BRL',
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Silva&background=722F37&color=fff'
  },
  {
    id: 'demo-purchaser-1',
    email: 'purchaser@vinheria.demo',
    name: 'Ana Martínez',
    role: 'PURCHASER',
    description: 'Buyer - Creates purchase orders, manages supplier relationships',
    preferredLanguage: 'es-PY',
    preferredCurrency: 'PYG',
    avatar: 'https://ui-avatars.com/api/?name=Ana+Martinez&background=722F37&color=fff'
  },
  {
    id: 'demo-manager-1',
    email: 'manager@vinheria.demo',
    name: 'Roberto Ferreira',
    role: 'MANAGER',
    description: 'Manager - Approves orders, views reports, oversees team performance',
    preferredLanguage: 'pt-BR',
    preferredCurrency: 'BRL',
    avatar: 'https://ui-avatars.com/api/?name=Roberto+Ferreira&background=722F37&color=fff'
  },
  {
    id: 'demo-admin-1',
    email: 'admin@vinheria.demo',
    name: 'Maria Santos',
    role: 'ADMIN',
    description: 'Administrator - Full access to all features, settings, and configurations',
    preferredLanguage: 'en-US',
    preferredCurrency: 'USD',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=722F37&color=fff'
  }
];

// Role permissions matrix
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SELLER: [
    'catalog:read',
    'customers:read',
    'sales:create',
    'sales:read:own',
    'fulfillments:read:own',
    'stock:read'
  ],
  PURCHASER: [
    'catalog:read',
    'suppliers:read',
    'purchases:create',
    'purchases:read:own',
    'stock:read',
    'stock:receive'
  ],
  MANAGER: [
    'catalog:read',
    'customers:read',
    'suppliers:read',
    'sales:read:all',
    'purchases:read:all',
    'approvals:manage',
    'fulfillments:read:all',
    'fulfillments:update',
    'stock:read',
    'reports:read'
  ],
  ADMIN: [
    '*' // Full access
  ]
};

// Role display info
export const ROLE_INFO: Record<UserRole, { label: string; icon: string; color: string }> = {
  SELLER: {
    label: 'Seller',
    icon: 'pi pi-shopping-cart',
    color: 'var(--vinheria-success)'
  },
  PURCHASER: {
    label: 'Purchaser',
    icon: 'pi pi-truck',
    color: 'var(--vinheria-info)'
  },
  MANAGER: {
    label: 'Manager',
    icon: 'pi pi-users',
    color: 'var(--vinheria-warning)'
  },
  ADMIN: {
    label: 'Administrator',
    icon: 'pi pi-shield',
    color: 'var(--m3-primary)'
  }
};
