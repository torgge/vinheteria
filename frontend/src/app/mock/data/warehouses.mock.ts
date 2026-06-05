/**
 * Mock warehouse data for the Vinheria Digital investor demo.
 * Includes 3 warehouses across South America.
 */

import { Wine, WINES } from './wines.mock';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  currency: 'BRL' | 'PYG' | 'USD';
  timezone: string;
  isActive: boolean;
}

export interface StockPosition {
  id: string;
  warehouseId: string;
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  averageCost: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  lastUpdated: string;
}

export const WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-001',
    code: 'SP-01',
    name: 'Centro de Distribuição São Paulo',
    address: 'Av. Industrial, 1500',
    city: 'Barueri',
    state: 'SP',
    country: 'Brazil',
    postalCode: '06454-000',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    isActive: true
  },
  {
    id: 'wh-002',
    code: 'RJ-01',
    name: 'Centro de Distribuição Rio de Janeiro',
    address: 'Rod. Presidente Dutra, km 163',
    city: 'Nova Iguaçu',
    state: 'RJ',
    country: 'Brazil',
    postalCode: '26041-000',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    isActive: true
  },
  {
    id: 'wh-003',
    code: 'PY-01',
    name: 'Centro de Distribución Asunción',
    address: 'Av. Madame Lynch 3000',
    city: 'Asunción',
    state: 'Central',
    country: 'Paraguay',
    postalCode: '1749',
    currency: 'PYG',
    timezone: 'America/Asuncion',
    isActive: true
  }
];

// Generate stock positions for all warehouses
function generateStockPositions(): StockPosition[] {
  const positions: StockPosition[] = [];
  const now = new Date();

  WAREHOUSES.forEach((warehouse, whIndex) => {
    // Each warehouse has different stock levels
    WINES.forEach((wine, wineIndex) => {
      // Not all wines are in all warehouses
      const hasStock = Math.random() > 0.2; // 80% chance to have stock

      if (hasStock) {
        const baseQuantity = Math.floor(Math.random() * 200) + 10;
        const reserved = Math.floor(Math.random() * Math.min(baseQuantity, 20));

        // Add some variance to the cost
        const costVariance = 0.95 + (Math.random() * 0.1); // -5% to +5%

        positions.push({
          id: `sp-${warehouse.id}-${wine.sku}`,
          warehouseId: warehouse.id,
          sku: wine.sku,
          availableQuantity: baseQuantity - reserved,
          reservedQuantity: reserved,
          averageCost: {
            BRL: Math.round(wine.cost.BRL * costVariance * 100) / 100,
            PYG: Math.round(wine.cost.PYG * costVariance),
            USD: Math.round(wine.cost.USD * costVariance * 100) / 100
          },
          lastUpdated: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    });
  });

  return positions;
}

export const STOCK_POSITIONS: StockPosition[] = generateStockPositions();

// Helper functions
export function getWarehouseById(id: string): Warehouse | undefined {
  return WAREHOUSES.find(wh => wh.id === id);
}

export function getWarehouseByCode(code: string): Warehouse | undefined {
  return WAREHOUSES.find(wh => wh.code === code);
}

export function getStockByWarehouse(warehouseId: string): StockPosition[] {
  return STOCK_POSITIONS.filter(sp => sp.warehouseId === warehouseId);
}

export function getStockBySku(sku: string): StockPosition[] {
  return STOCK_POSITIONS.filter(sp => sp.sku === sku);
}

export function getStockPosition(warehouseId: string, sku: string): StockPosition | undefined {
  return STOCK_POSITIONS.find(sp => sp.warehouseId === warehouseId && sp.sku === sku);
}

export function getTotalStockBySku(sku: string): number {
  return STOCK_POSITIONS
    .filter(sp => sp.sku === sku)
    .reduce((sum, sp) => sum + sp.availableQuantity, 0);
}

export function getActiveWarehouses(): Warehouse[] {
  return WAREHOUSES.filter(wh => wh.isActive);
}

export function getWarehousesWithStock(sku: string): Warehouse[] {
  const warehouseIds = STOCK_POSITIONS
    .filter(sp => sp.sku === sku && sp.availableQuantity > 0)
    .map(sp => sp.warehouseId);

  return WAREHOUSES.filter(wh => warehouseIds.includes(wh.id));
}
