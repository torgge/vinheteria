/**
 * Mock customer data for the Vinheria Digital investor demo.
 * Includes 12 B2B customers across Brazil and Paraguay.
 */

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CustomerType = 'RESTAURANT' | 'WINE_SHOP' | 'HOTEL' | 'DISTRIBUTOR' | 'BAR';

export interface SalesCondition {
  priceTableId: string;
  priceTableName: string;
  paymentTermDays: number;
  discountPercentage: number;
  creditLimit: {
    BRL: number;
    PYG: number;
    USD: number;
  };
}

export interface Customer {
  id: string;
  companyName: string;
  tradeName: string;
  taxId: string; // CNPJ for Brazil, RUC for Paraguay
  type: CustomerType;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  salesCondition: SalesCondition;
  status: CustomerStatus;
  createdAt: string;
  lastOrderDate?: string;
}

export const CUSTOMERS: Customer[] = [
  // Brazilian Customers
  {
    id: 'cust-001',
    companyName: 'Restaurante La Parrilla Ltda',
    tradeName: 'La Parrilla Steakhouse',
    taxId: '12.345.678/0001-90',
    type: 'RESTAURANT',
    email: 'compras@laparrilla.com.br',
    phone: '+55 11 3456-7890',
    address: 'Rua Oscar Freire, 789',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brazil',
    postalCode: '01426-001',
    salesCondition: {
      priceTableId: 'pt-premium',
      priceTableName: 'Premium',
      paymentTermDays: 30,
      discountPercentage: 5,
      creditLimit: { BRL: 50000, PYG: 72500000, USD: 10000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-01-15T10:00:00Z',
    lastOrderDate: '2024-03-20T14:30:00Z'
  },
  {
    id: 'cust-002',
    companyName: 'Wine Shop Central Comercio de Vinhos Ltda',
    tradeName: 'Wine Shop Central',
    taxId: '23.456.789/0001-01',
    type: 'WINE_SHOP',
    email: 'pedidos@wineshopcentral.com.br',
    phone: '+55 11 2345-6789',
    address: 'Alameda Lorena, 456',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brazil',
    postalCode: '01424-001',
    salesCondition: {
      priceTableId: 'pt-wholesale',
      priceTableName: 'Wholesale',
      paymentTermDays: 45,
      discountPercentage: 10,
      creditLimit: { BRL: 100000, PYG: 145000000, USD: 20000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-02-20T09:00:00Z',
    lastOrderDate: '2024-03-19T11:15:00Z'
  },
  {
    id: 'cust-003',
    companyName: 'Hotel Grand Plaza S.A.',
    tradeName: 'Hotel Grand Plaza',
    taxId: '34.567.890/0001-12',
    type: 'HOTEL',
    email: 'suprimentos@grandplaza.com.br',
    phone: '+55 21 3456-7890',
    address: 'Av. Atlântica, 1500',
    city: 'Rio de Janeiro',
    state: 'RJ',
    country: 'Brazil',
    postalCode: '22021-001',
    salesCondition: {
      priceTableId: 'pt-premium',
      priceTableName: 'Premium',
      paymentTermDays: 60,
      discountPercentage: 8,
      creditLimit: { BRL: 150000, PYG: 217500000, USD: 30000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-03-10T14:00:00Z',
    lastOrderDate: '2024-03-19T16:45:00Z'
  },
  {
    id: 'cust-004',
    companyName: 'Distribuidora Norte Vinhos e Bebidas Ltda',
    tradeName: 'Distribuidora Norte',
    taxId: '45.678.901/0001-23',
    type: 'DISTRIBUTOR',
    email: 'compras@distribuidoranorte.com.br',
    phone: '+55 11 4567-8901',
    address: 'Av. Industrial, 2000',
    city: 'Guarulhos',
    state: 'SP',
    country: 'Brazil',
    postalCode: '07190-001',
    salesCondition: {
      priceTableId: 'pt-distributor',
      priceTableName: 'Distributor',
      paymentTermDays: 90,
      discountPercentage: 15,
      creditLimit: { BRL: 300000, PYG: 435000000, USD: 60000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-04-05T11:00:00Z',
    lastOrderDate: '2024-03-18T09:30:00Z'
  },
  {
    id: 'cust-005',
    companyName: 'Bar & Bistro Luna Ltda',
    tradeName: 'Bar Luna',
    taxId: '56.789.012/0001-34',
    type: 'BAR',
    email: 'contato@barluna.com.br',
    phone: '+55 11 5678-9012',
    address: 'Rua Augusta, 234',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brazil',
    postalCode: '01305-000',
    salesCondition: {
      priceTableId: 'pt-standard',
      priceTableName: 'Standard',
      paymentTermDays: 30,
      discountPercentage: 3,
      creditLimit: { BRL: 25000, PYG: 36250000, USD: 5000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-05-15T16:00:00Z',
    lastOrderDate: '2024-03-17T13:20:00Z'
  },
  {
    id: 'cust-006',
    companyName: 'Emporio Vinhedo Comercio Ltda',
    tradeName: 'Empório Vinhedo',
    taxId: '67.890.123/0001-45',
    type: 'WINE_SHOP',
    email: 'vendas@emporiovinhedo.com.br',
    phone: '+55 21 6789-0123',
    address: 'Rua Visconde de Pirajá, 567',
    city: 'Rio de Janeiro',
    state: 'RJ',
    country: 'Brazil',
    postalCode: '22410-002',
    salesCondition: {
      priceTableId: 'pt-wholesale',
      priceTableName: 'Wholesale',
      paymentTermDays: 45,
      discountPercentage: 8,
      creditLimit: { BRL: 75000, PYG: 108750000, USD: 15000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-06-01T10:00:00Z',
    lastOrderDate: '2024-03-15T10:00:00Z'
  },
  {
    id: 'cust-007',
    companyName: 'Churrascaria Fogo de Chão Ltda',
    tradeName: 'Fogo de Chão',
    taxId: '78.901.234/0001-56',
    type: 'RESTAURANT',
    email: 'suprimentos@fogodechao.com.br',
    phone: '+55 11 7890-1234',
    address: 'Av. Santo Amaro, 789',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brazil',
    postalCode: '04506-001',
    salesCondition: {
      priceTableId: 'pt-premium',
      priceTableName: 'Premium',
      paymentTermDays: 30,
      discountPercentage: 5,
      creditLimit: { BRL: 80000, PYG: 116000000, USD: 16000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-07-10T09:00:00Z',
    lastOrderDate: '2024-03-14T15:30:00Z'
  },
  {
    id: 'cust-008',
    companyName: 'Resort Tropical Paradise S.A.',
    tradeName: 'Tropical Paradise Resort',
    taxId: '89.012.345/0001-67',
    type: 'HOTEL',
    email: 'compras@tropicalparadise.com.br',
    phone: '+55 71 8901-2345',
    address: 'Av. Beira Mar, 1000',
    city: 'Salvador',
    state: 'BA',
    country: 'Brazil',
    postalCode: '40140-130',
    salesCondition: {
      priceTableId: 'pt-premium',
      priceTableName: 'Premium',
      paymentTermDays: 60,
      discountPercentage: 7,
      creditLimit: { BRL: 120000, PYG: 174000000, USD: 24000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-08-20T14:00:00Z',
    lastOrderDate: '2024-03-10T11:45:00Z'
  },

  // Paraguayan Customers
  {
    id: 'cust-009',
    companyName: 'Restaurante El Paraguayo S.R.L.',
    tradeName: 'El Paraguayo',
    taxId: '80012345-6',
    type: 'RESTAURANT',
    email: 'compras@elparaguayo.com.py',
    phone: '+595 21 456 789',
    address: 'Av. Mariscal López, 3456',
    city: 'Asunción',
    state: 'Central',
    country: 'Paraguay',
    postalCode: '1209',
    salesCondition: {
      priceTableId: 'pt-py-premium',
      priceTableName: 'Paraguay Premium',
      paymentTermDays: 30,
      discountPercentage: 5,
      creditLimit: { BRL: 35000, PYG: 50000000, USD: 7000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-09-01T10:00:00Z',
    lastOrderDate: '2024-03-12T14:00:00Z'
  },
  {
    id: 'cust-010',
    companyName: 'Vinoteca Asunción S.A.',
    tradeName: 'Vinoteca Asunción',
    taxId: '80023456-7',
    type: 'WINE_SHOP',
    email: 'pedidos@vinotecaasuncion.com.py',
    phone: '+595 21 567 890',
    address: 'Calle Palma, 789',
    city: 'Asunción',
    state: 'Central',
    country: 'Paraguay',
    postalCode: '1001',
    salesCondition: {
      priceTableId: 'pt-py-wholesale',
      priceTableName: 'Paraguay Wholesale',
      paymentTermDays: 45,
      discountPercentage: 10,
      creditLimit: { BRL: 70000, PYG: 100000000, USD: 14000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-10-15T09:00:00Z',
    lastOrderDate: '2024-03-08T16:30:00Z'
  },
  {
    id: 'cust-011',
    companyName: 'Hotel Guaraní S.A.',
    tradeName: 'Hotel Guaraní',
    taxId: '80034567-8',
    type: 'HOTEL',
    email: 'suprimentos@hotelguarani.com.py',
    phone: '+595 21 678 901',
    address: 'Av. Independencia, 1234',
    city: 'Asunción',
    state: 'Central',
    country: 'Paraguay',
    postalCode: '1100',
    salesCondition: {
      priceTableId: 'pt-py-premium',
      priceTableName: 'Paraguay Premium',
      paymentTermDays: 60,
      discountPercentage: 8,
      creditLimit: { BRL: 100000, PYG: 145000000, USD: 20000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-11-01T11:00:00Z',
    lastOrderDate: '2024-03-05T10:15:00Z'
  },
  {
    id: 'cust-012',
    companyName: 'Distribuidora del Este S.R.L.',
    tradeName: 'Distribuidora del Este',
    taxId: '80045678-9',
    type: 'DISTRIBUTOR',
    email: 'compras@disteste.com.py',
    phone: '+595 61 789 012',
    address: 'Av. San Blas, 567',
    city: 'Ciudad del Este',
    state: 'Alto Paraná',
    country: 'Paraguay',
    postalCode: '7000',
    salesCondition: {
      priceTableId: 'pt-py-distributor',
      priceTableName: 'Paraguay Distributor',
      paymentTermDays: 90,
      discountPercentage: 15,
      creditLimit: { BRL: 200000, PYG: 290000000, USD: 40000 }
    },
    status: 'ACTIVE',
    createdAt: '2023-12-01T14:00:00Z',
    lastOrderDate: '2024-03-01T09:00:00Z'
  }
];

// Helper functions
export function getCustomerById(id: string): Customer | undefined {
  return CUSTOMERS.find(customer => customer.id === id);
}

export function getCustomersByType(type: CustomerType): Customer[] {
  return CUSTOMERS.filter(customer => customer.type === type);
}

export function getCustomersByStatus(status: CustomerStatus): Customer[] {
  return CUSTOMERS.filter(customer => customer.status === status);
}

export function getCustomersByCountry(country: string): Customer[] {
  return CUSTOMERS.filter(customer => customer.country.toLowerCase() === country.toLowerCase());
}

export function getActiveCustomers(): Customer[] {
  return CUSTOMERS.filter(customer => customer.status === 'ACTIVE');
}

export function searchCustomers(query: string): Customer[] {
  const lowerQuery = query.toLowerCase();
  return CUSTOMERS.filter(customer =>
    customer.companyName.toLowerCase().includes(lowerQuery) ||
    customer.tradeName.toLowerCase().includes(lowerQuery) ||
    customer.taxId.includes(query)
  );
}

export function getCustomerTypes(): CustomerType[] {
  return ['RESTAURANT', 'WINE_SHOP', 'HOTEL', 'DISTRIBUTOR', 'BAR'];
}
