/**
 * Mock sales orders, purchase orders, and fulfillments for the Vinheria Digital investor demo.
 */

import { WINES } from './wines.mock';
import { CUSTOMERS } from './customers.mock';
import { WAREHOUSES, STOCK_POSITIONS } from './warehouses.mock';
import { SUPPLIERS } from './suppliers.mock';

// Types
export type SalesOrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PurchaseOrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type FulfillmentStatus = 'PENDING' | 'PICKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';

export interface SalesOrderItem {
  id: string;
  sku: string;
  wineName: string;
  warehouseId: string;
  warehouseCode: string;
  quantity: number;
  unitPrice: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  unitCost: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  totalPrice: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  marginPercentage: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: SalesOrderItem[];
  totalAmount: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  totalCost: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  totalMargin: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  marginPercentage: number;
  status: SalesOrderStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  sku: string;
  wineName: string;
  quantity: number;
  unitCost: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  totalCost: {
    BRL: number;
    PYG: number;
    USD: number;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseCode: string;
  items: PurchaseOrderItem[];
  totalAmount: {
    BRL: number;
    PYG: number;
    USD: number;
  };
  status: PurchaseOrderStatus;
  expectedDeliveryDate: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  receivedAt?: string;
  notes?: string;
}

export interface Fulfillment {
  id: string;
  salesOrderId: string;
  salesOrderNumber: string;
  warehouseId: string;
  warehouseCode: string;
  customerName: string;
  items: {
    sku: string;
    wineName: string;
    quantity: number;
  }[];
  status: FulfillmentStatus;
  trackingCode?: string;
  createdAt: string;
  pickedAt?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

// Generate Sales Orders
function generateSalesOrders(): SalesOrder[] {
  const orders: SalesOrder[] = [];
  const statuses: SalesOrderStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'FULFILLED', 'SHIPPED', 'DELIVERED', 'REJECTED'];
  const sellers = ['Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa'];

  for (let i = 1; i <= 25; i++) {
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const numItems = Math.floor(Math.random() * 5) + 1;
    const items: SalesOrderItem[] = [];

    let totalBRL = 0, totalPYG = 0, totalUSD = 0;
    let costBRL = 0, costPYG = 0, costUSD = 0;

    const usedSkus = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      let wine = WINES[Math.floor(Math.random() * WINES.length)];
      while (usedSkus.has(wine.sku)) {
        wine = WINES[Math.floor(Math.random() * WINES.length)];
      }
      usedSkus.add(wine.sku);

      const warehouse = WAREHOUSES[Math.floor(Math.random() * WAREHOUSES.length)];
      const quantity = Math.floor(Math.random() * 20) + 1;

      const itemTotalBRL = wine.prices.BRL * quantity;
      const itemTotalPYG = wine.prices.PYG * quantity;
      const itemTotalUSD = wine.prices.USD * quantity;

      const itemCostBRL = wine.cost.BRL * quantity;
      const itemCostPYG = wine.cost.PYG * quantity;
      const itemCostUSD = wine.cost.USD * quantity;

      const margin = ((wine.prices.BRL - wine.cost.BRL) / wine.prices.BRL) * 100;

      items.push({
        id: `soi-${i}-${j}`,
        sku: wine.sku,
        wineName: wine.name,
        warehouseId: warehouse.id,
        warehouseCode: warehouse.code,
        quantity,
        unitPrice: { BRL: wine.prices.BRL, PYG: wine.prices.PYG, USD: wine.prices.USD },
        unitCost: { BRL: wine.cost.BRL, PYG: wine.cost.PYG, USD: wine.cost.USD },
        totalPrice: { BRL: itemTotalBRL, PYG: itemTotalPYG, USD: itemTotalUSD },
        marginPercentage: Math.round(margin * 10) / 10
      });

      totalBRL += itemTotalBRL;
      totalPYG += itemTotalPYG;
      totalUSD += itemTotalUSD;
      costBRL += itemCostBRL;
      costPYG += itemCostPYG;
      costUSD += itemCostUSD;
    }

    const marginBRL = totalBRL - costBRL;
    const marginPYG = totalPYG - costPYG;
    const marginUSD = totalUSD - costUSD;
    const marginPct = (marginBRL / totalBRL) * 100;

    const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const seller = sellers[Math.floor(Math.random() * sellers.length)];

    const order: SalesOrder = {
      id: `so-${String(i).padStart(3, '0')}`,
      orderNumber: `SO-2024-${String(i).padStart(4, '0')}`,
      customerId: customer.id,
      customerName: customer.tradeName,
      items,
      totalAmount: { BRL: Math.round(totalBRL * 100) / 100, PYG: Math.round(totalPYG), USD: Math.round(totalUSD * 100) / 100 },
      totalCost: { BRL: Math.round(costBRL * 100) / 100, PYG: Math.round(costPYG), USD: Math.round(costUSD * 100) / 100 },
      totalMargin: { BRL: Math.round(marginBRL * 100) / 100, PYG: Math.round(marginPYG), USD: Math.round(marginUSD * 100) / 100 },
      marginPercentage: Math.round(marginPct * 10) / 10,
      status,
      createdBy: seller,
      createdAt: createdDate.toISOString()
    };

    if (['APPROVED', 'FULFILLED', 'SHIPPED', 'DELIVERED'].includes(status)) {
      order.approvedBy = 'Roberto Manager';
      order.approvedAt = new Date(createdDate.getTime() + 2 * 60 * 60 * 1000).toISOString();
    }

    if (status === 'REJECTED') {
      order.rejectionReason = 'Customer credit limit exceeded';
    }

    orders.push(order);
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Generate Purchase Orders
function generatePurchaseOrders(): PurchaseOrder[] {
  const orders: PurchaseOrder[] = [];
  const statuses: PurchaseOrderStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'RECEIVED'];
  const purchasers = ['Carlos Buyer', 'Fernanda Compras'];

  for (let i = 1; i <= 15; i++) {
    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
    const warehouse = WAREHOUSES[Math.floor(Math.random() * WAREHOUSES.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const numItems = Math.floor(Math.random() * 8) + 2;
    const items: PurchaseOrderItem[] = [];

    let totalBRL = 0, totalPYG = 0, totalUSD = 0;
    const usedSkus = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      let wine = WINES[Math.floor(Math.random() * WINES.length)];
      while (usedSkus.has(wine.sku)) {
        wine = WINES[Math.floor(Math.random() * WINES.length)];
      }
      usedSkus.add(wine.sku);

      const quantity = Math.floor(Math.random() * 50) + 10;
      const itemTotalBRL = wine.cost.BRL * quantity;
      const itemTotalPYG = wine.cost.PYG * quantity;
      const itemTotalUSD = wine.cost.USD * quantity;

      items.push({
        id: `poi-${i}-${j}`,
        sku: wine.sku,
        wineName: wine.name,
        quantity,
        unitCost: { BRL: wine.cost.BRL, PYG: wine.cost.PYG, USD: wine.cost.USD },
        totalCost: { BRL: itemTotalBRL, PYG: itemTotalPYG, USD: itemTotalUSD }
      });

      totalBRL += itemTotalBRL;
      totalPYG += itemTotalPYG;
      totalUSD += itemTotalUSD;
    }

    const createdDate = new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000);
    const expectedDelivery = new Date(createdDate.getTime() + supplier.purchaseCondition.leadTimeDays * 24 * 60 * 60 * 1000);
    const purchaser = purchasers[Math.floor(Math.random() * purchasers.length)];

    const order: PurchaseOrder = {
      id: `po-${String(i).padStart(3, '0')}`,
      orderNumber: `PO-2024-${String(i).padStart(4, '0')}`,
      supplierId: supplier.id,
      supplierName: supplier.tradeName,
      warehouseId: warehouse.id,
      warehouseCode: warehouse.code,
      items,
      totalAmount: { BRL: Math.round(totalBRL * 100) / 100, PYG: Math.round(totalPYG), USD: Math.round(totalUSD * 100) / 100 },
      status,
      expectedDeliveryDate: expectedDelivery.toISOString().split('T')[0],
      createdBy: purchaser,
      createdAt: createdDate.toISOString()
    };

    if (['APPROVED', 'ORDERED', 'RECEIVED'].includes(status)) {
      order.approvedBy = 'Roberto Manager';
      order.approvedAt = new Date(createdDate.getTime() + 4 * 60 * 60 * 1000).toISOString();
    }

    if (status === 'RECEIVED') {
      order.receivedAt = new Date(expectedDelivery.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString();
    }

    orders.push(order);
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Generate Fulfillments from approved/fulfilled/shipped/delivered sales orders
function generateFulfillments(salesOrders: SalesOrder[]): Fulfillment[] {
  const fulfillments: Fulfillment[] = [];
  const approvedOrders = salesOrders.filter(so => ['APPROVED', 'FULFILLED', 'SHIPPED', 'DELIVERED'].includes(so.status));

  approvedOrders.forEach((order, orderIndex) => {
    // Group items by warehouse
    const itemsByWarehouse = new Map<string, typeof order.items>();

    order.items.forEach(item => {
      const existing = itemsByWarehouse.get(item.warehouseId) || [];
      existing.push(item);
      itemsByWarehouse.set(item.warehouseId, existing);
    });

    let fulfillmentIndex = 0;
    itemsByWarehouse.forEach((items, warehouseId) => {
      const warehouse = WAREHOUSES.find(w => w.id === warehouseId);
      if (!warehouse) return;

      let status: FulfillmentStatus;
      switch (order.status) {
        case 'APPROVED': status = 'PENDING'; break;
        case 'FULFILLED': status = Math.random() > 0.5 ? 'PACKED' : 'PICKING'; break;
        case 'SHIPPED': status = 'SHIPPED'; break;
        case 'DELIVERED': status = 'DELIVERED'; break;
        default: status = 'PENDING';
      }

      const createdAt = order.approvedAt || order.createdAt;
      const fulfillment: Fulfillment = {
        id: `ful-${order.id}-${fulfillmentIndex}`,
        salesOrderId: order.id,
        salesOrderNumber: order.orderNumber,
        warehouseId,
        warehouseCode: warehouse.code,
        customerName: order.customerName,
        items: items.map(item => ({
          sku: item.sku,
          wineName: item.wineName,
          quantity: item.quantity
        })),
        status,
        createdAt
      };

      if (['PICKING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(status)) {
        fulfillment.pickedAt = new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
      }
      if (['PACKED', 'SHIPPED', 'DELIVERED'].includes(status)) {
        fulfillment.packedAt = new Date(new Date(createdAt).getTime() + 4 * 60 * 60 * 1000).toISOString();
      }
      if (['SHIPPED', 'DELIVERED'].includes(status)) {
        fulfillment.shippedAt = new Date(new Date(createdAt).getTime() + 8 * 60 * 60 * 1000).toISOString();
        fulfillment.trackingCode = `BR${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      }
      if (status === 'DELIVERED') {
        fulfillment.deliveredAt = new Date(new Date(createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      }

      fulfillments.push(fulfillment);
      fulfillmentIndex++;
    });
  });

  return fulfillments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Export generated data
export const SALES_ORDERS = generateSalesOrders();
export const PURCHASE_ORDERS = generatePurchaseOrders();
export const FULFILLMENTS = generateFulfillments(SALES_ORDERS);

// Helper functions
export function getSalesOrderById(id: string): SalesOrder | undefined {
  return SALES_ORDERS.find(order => order.id === id);
}

export function getSalesOrdersByStatus(status: SalesOrderStatus): SalesOrder[] {
  return SALES_ORDERS.filter(order => order.status === status);
}

export function getSalesOrdersByCustomer(customerId: string): SalesOrder[] {
  return SALES_ORDERS.filter(order => order.customerId === customerId);
}

export function getPendingApprovalOrders(): SalesOrder[] {
  return SALES_ORDERS.filter(order => order.status === 'PENDING_APPROVAL');
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return PURCHASE_ORDERS.find(order => order.id === id);
}

export function getPurchaseOrdersByStatus(status: PurchaseOrderStatus): PurchaseOrder[] {
  return PURCHASE_ORDERS.filter(order => order.status === status);
}

export function getPurchaseOrdersBySupplier(supplierId: string): PurchaseOrder[] {
  return PURCHASE_ORDERS.filter(order => order.supplierId === supplierId);
}

export function getFulfillmentById(id: string): Fulfillment | undefined {
  return FULFILLMENTS.find(f => f.id === id);
}

export function getFulfillmentsByStatus(status: FulfillmentStatus): Fulfillment[] {
  return FULFILLMENTS.filter(f => f.status === status);
}

export function getFulfillmentsByWarehouse(warehouseId: string): Fulfillment[] {
  return FULFILLMENTS.filter(f => f.warehouseId === warehouseId);
}

export function getFulfillmentsBySalesOrder(salesOrderId: string): Fulfillment[] {
  return FULFILLMENTS.filter(f => f.salesOrderId === salesOrderId);
}
