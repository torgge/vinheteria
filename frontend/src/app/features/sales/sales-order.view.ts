import { SalesOrder, SalesOrderItem, SalesOrderStatus } from '../../mock/data';
import { Money, SupportedCurrency } from '../../core/currency/currency.model';
import { ExchangeRateService, ResolvedRate } from '../../core/currency/exchange-rate.service';

export interface SalesOrderItemView {
  id: string;
  sku: string;
  wineName: string;
  warehouseId: string;
  warehouseCode: string;
  quantity: number;
  unitPrice: Money;
  unitCost: Money;
  totalPrice: Money;
  marginPercentage: number;
}

export interface SalesOrderView {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: SalesOrderStatus;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  transactionCurrency: SupportedCurrency;
  items: SalesOrderItemView[];
  totalAmount: Money;
  totalCost: Money;
  totalMargin: Money;
  marginPercentage: number;
  accounting: { totalAmount: Money; rate: ResolvedRate } | null;
}

/** Extract the transaction-currency column of a seed triple as a single Money. */
function pick(triple: { BRL: number; PYG: number; USD: number }, cur: SupportedCurrency): Money {
  return { amount: triple[cur], currency: cur };
}

function toItemView(item: SalesOrderItem, cur: SupportedCurrency): SalesOrderItemView {
  return {
    id: item.id,
    sku: item.sku,
    wineName: item.wineName,
    warehouseId: item.warehouseId,
    warehouseCode: item.warehouseCode,
    quantity: item.quantity,
    unitPrice: pick(item.unitPrice, cur),
    unitCost: pick(item.unitCost, cur),
    totalPrice: pick(item.totalPrice, cur),
    marginPercentage: item.marginPercentage,
  };
}

/**
 * Maps a seed SalesOrder (display-switch triple) into a SalesOrderView with a single
 * Money on transactionCurrency + BRL accounting derived from the frozen daily rate.
 * The seed's own .BRL columns are legacy and are never read for accounting.
 */
export function toSalesOrderView(order: SalesOrder, fx: ExchangeRateService): SalesOrderView {
  const cur = order.transactionCurrency;
  const acc = fx.toAccounting(order.totalAmount[cur], cur, order.createdAt);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerName: order.customerName,
    status: order.status,
    createdAt: order.createdAt,
    createdBy: order.createdBy,
    approvedBy: order.approvedBy,
    approvedAt: order.approvedAt,
    transactionCurrency: cur,
    items: order.items.map((it) => toItemView(it, cur)),
    totalAmount: pick(order.totalAmount, cur),
    totalCost: pick(order.totalCost, cur),
    totalMargin: pick(order.totalMargin, cur),
    marginPercentage: order.marginPercentage,
    accounting: acc
      ? { totalAmount: { amount: acc.accountingAmount, currency: 'BRL' }, rate: acc.resolved }
      : null,
  };
}
