/**
 * Mock supplier data for the Vinheria Digital investor demo.
 * Includes 6 wine suppliers from South America.
 */

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface PurchaseCondition {
  minimumOrderValue: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  paymentTermDays: number;
  leadTimeDays: number;
  discountPercentage: number;
}

export interface Supplier {
  id: string;
  companyName: string;
  tradeName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactPerson: string;
  purchaseCondition: PurchaseCondition;
  wineRegions: string[];
  status: SupplierStatus;
  createdAt: string;
}

export const SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    companyName: 'Importadora Vinhos Argentina S.A.',
    tradeName: 'Vinhos Argentina',
    taxId: '11.222.333/0001-44',
    email: 'vendas@vinhosargentina.com.br',
    phone: '+55 11 3333-4444',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brazil',
    postalCode: '01310-100',
    contactPerson: 'Carlos Rodriguez',
    purchaseCondition: {
      minimumOrderValue: { BRL: 10000, PYG: 14500000, USD: 2000 },
      paymentTermDays: 60,
      leadTimeDays: 14,
      discountPercentage: 5
    },
    wineRegions: ['Mendoza', 'Valle de Uco', 'Luján de Cuyo', 'Salta'],
    status: 'ACTIVE',
    createdAt: '2022-01-15T10:00:00Z'
  },
  {
    id: 'sup-002',
    companyName: 'Chile Wine Imports Ltda',
    tradeName: 'Chile Wine',
    taxId: '22.333.444/0001-55',
    email: 'pedidos@chilewine.com.br',
    phone: '+55 11 4444-5555',
    address: 'Rua da Consolação, 500',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brazil',
    postalCode: '01302-000',
    contactPerson: 'Alejandro Silva',
    purchaseCondition: {
      minimumOrderValue: { BRL: 8000, PYG: 11600000, USD: 1600 },
      paymentTermDays: 45,
      leadTimeDays: 10,
      discountPercentage: 4
    },
    wineRegions: ['Maipo', 'Colchagua', 'Casablanca', 'Aconcagua'],
    status: 'ACTIVE',
    createdAt: '2022-03-20T09:00:00Z'
  },
  {
    id: 'sup-003',
    companyName: 'Bodega Uruguay Exportaciones S.A.',
    tradeName: 'Bodega Uruguay',
    taxId: '33.444.555/0001-66',
    email: 'export@bodegauruguay.com',
    phone: '+598 2 345 6789',
    address: 'Rambla Sur, 1234',
    city: 'Montevideo',
    state: 'Montevideo',
    country: 'Uruguay',
    postalCode: '11000',
    contactPerson: 'María González',
    purchaseCondition: {
      minimumOrderValue: { BRL: 5000, PYG: 7250000, USD: 1000 },
      paymentTermDays: 30,
      leadTimeDays: 7,
      discountPercentage: 3
    },
    wineRegions: ['Maldonado', 'Canelones', 'Progreso'],
    status: 'ACTIVE',
    createdAt: '2022-05-10T14:00:00Z'
  },
  {
    id: 'sup-004',
    companyName: 'Vinhos do Brasil Distribuidora Ltda',
    tradeName: 'Vinhos do Brasil',
    taxId: '44.555.666/0001-77',
    email: 'comercial@vinhosdobrasil.com.br',
    phone: '+55 54 3455-6677',
    address: 'RS-444, km 21',
    city: 'Bento Gonçalves',
    state: 'RS',
    country: 'Brazil',
    postalCode: '95700-000',
    contactPerson: 'João Valduga',
    purchaseCondition: {
      minimumOrderValue: { BRL: 3000, PYG: 4350000, USD: 600 },
      paymentTermDays: 30,
      leadTimeDays: 5,
      discountPercentage: 2
    },
    wineRegions: ['Vale dos Vinhedos', 'Serra Gaúcha'],
    status: 'ACTIVE',
    createdAt: '2022-07-01T11:00:00Z'
  },
  {
    id: 'sup-005',
    companyName: 'Paraguay Wines Import S.R.L.',
    tradeName: 'Paraguay Wines',
    taxId: '80098765-4',
    email: 'ventas@paraguaywines.com.py',
    phone: '+595 21 234 567',
    address: 'Av. España, 2000',
    city: 'Asunción',
    state: 'Central',
    country: 'Paraguay',
    postalCode: '1001',
    contactPerson: 'Roberto Fernández',
    purchaseCondition: {
      minimumOrderValue: { BRL: 7000, PYG: 10000000, USD: 1400 },
      paymentTermDays: 45,
      leadTimeDays: 12,
      discountPercentage: 6
    },
    wineRegions: ['Asunción', 'Ciudad del Este'],
    status: 'ACTIVE',
    createdAt: '2022-09-15T10:00:00Z'
  },
  {
    id: 'sup-006',
    companyName: 'Premium South American Wines LLC',
    tradeName: 'PSAW',
    taxId: '55.666.777/0001-88',
    email: 'orders@psaw.com',
    phone: '+1 305 555 6789',
    address: '1200 Brickell Ave',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    postalCode: '33131',
    contactPerson: 'Michael Torres',
    purchaseCondition: {
      minimumOrderValue: { BRL: 25000, PYG: 36250000, USD: 5000 },
      paymentTermDays: 90,
      leadTimeDays: 21,
      discountPercentage: 8
    },
    wineRegions: ['Mendoza', 'Maipo', 'Patagonia', 'Colchagua'],
    status: 'ACTIVE',
    createdAt: '2022-11-01T09:00:00Z'
  }
];

// Helper functions
export function getSupplierById(id: string): Supplier | undefined {
  return SUPPLIERS.find(supplier => supplier.id === id);
}

export function getSuppliersByCountry(country: string): Supplier[] {
  return SUPPLIERS.filter(supplier => supplier.country.toLowerCase() === country.toLowerCase());
}

export function getSuppliersByRegion(region: string): Supplier[] {
  return SUPPLIERS.filter(supplier =>
    supplier.wineRegions.some(r => r.toLowerCase().includes(region.toLowerCase()))
  );
}

export function getActiveSuppliers(): Supplier[] {
  return SUPPLIERS.filter(supplier => supplier.status === 'ACTIVE');
}

export function searchSuppliers(query: string): Supplier[] {
  const lowerQuery = query.toLowerCase();
  return SUPPLIERS.filter(supplier =>
    supplier.companyName.toLowerCase().includes(lowerQuery) ||
    supplier.tradeName.toLowerCase().includes(lowerQuery) ||
    supplier.wineRegions.some(r => r.toLowerCase().includes(lowerQuery))
  );
}
