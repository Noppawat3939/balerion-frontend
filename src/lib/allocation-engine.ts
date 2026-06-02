import { resolveWildcard } from "@/lib/allocation-helper";
import {
  calculateMaxQtyByCredit,
  calculateRemainingCredit,
} from "@/lib/credit-helper";
import { sortingOrderByPriority } from "@/lib/order-helper";
import { calculatePricePerUnit } from "@/lib/utils";
import type {
  AllocationResult,
  Customer,
  Order,
  Price,
  Stock,
} from "@/types/mock.type";

function resolveStatus(
  allocatedQty: number,
  requestQty: number,
): AllocationResult["status"] {
  if (allocatedQty === 0) return "UNALLOCATED";
  if (allocatedQty < requestQty) return "PARTIALLY_ALLOCATED";
  return "FULLY_ALLOCATED";
}

/**
 * Runs the auto-allocation algorithm against the provided orders, stocks,
 * prices, and customers.
 *
 * Processing order:
 * 1. Sort sub-orders by type priority (EMERGENCY → OVERDUE → DAILY), then
 *    by `createDate` ascending (FIFO) within the same type.
 * 2. For each sub-order: resolve wildcards, look up stock and price,
 *    calculate `allocatedQty = min(requestQty, availableStock, maxQtyByCredit)`,
 *    deduct stock, and charge credit.
 *
 * Does NOT mutate the original arrays — all state changes are applied to
 * internal copies.
 *
 * @param orders    - Sub-orders to allocate
 * @param stocks    - Current stock snapshot
 * @param prices    - Price table with tier multipliers
 * @param customers - Customers with credit limits
 * @returns Allocation results in processing order
 */
export function allocate(
  orders: Order[],
  stocks: Stock[],
  prices: Price[],
  customers: Customer[],
): AllocationResult[] {
  // Clone mutable state so originals are never changed
  const stockMap = new Map<string, Stock>(
    stocks.map((s) => [
      `${s.warehouseId}|${s.supplierId}|${s.itemId}`,
      { ...s },
    ]),
  );
  const customerMap = new Map<string, Customer>(
    customers.map((c) => [c.customerId, { ...c }]),
  );

  const sorted = sortingOrderByPriority(orders);
  const results: AllocationResult[] = [];

  for (const order of sorted) {
    // Wildcard resolution uses the live (post-deduction) stock values
    const { resolvedWarehouseId, resolvedSupplierId } = resolveWildcard(
      order,
      [...stockMap.values()],
    );

    const stockKey = `${resolvedWarehouseId}|${resolvedSupplierId}|${order.itemId}`;
    const stock = stockMap.get(stockKey);
    const availableStock = stock?.availableStock ?? 0;

    const price = prices.find(
      (p) =>
        p.itemId === order.itemId &&
        p.supplierId === resolvedSupplierId &&
        p.priceTier === order.type,
    );

    const unitPrice = price
      ? calculatePricePerUnit(price.basePrice, price.multiplier)
      : 0;

    const customer = customerMap.get(order.customerId);
    const remainingCredit = customer ? calculateRemainingCredit(customer) : 0;
    const maxQtyByCredit = calculateMaxQtyByCredit(remainingCredit, unitPrice);

    // unitPrice = 0 means no price entry exists → cannot allocate
    const allocatedQty =
      unitPrice > 0
        ? Math.min(order.requestQty, availableStock, maxQtyByCredit)
        : 0;

    const totalPrice = allocatedQty * unitPrice;

    if (stock && allocatedQty > 0) {
      stock.availableStock -= allocatedQty;
    }
    if (customer && allocatedQty > 0) {
      customer.usedCredit += totalPrice;
    }

    results.push({
      subOrderId: order.subOrderId,
      orderId: order.orderId,
      itemId: order.itemId,
      resolvedWarehouseId,
      resolvedSupplierId,
      customerId: order.customerId,
      type: order.type,
      requestQty: order.requestQty,
      allocatedQty,
      unitPrice,
      totalPrice,
      status: resolveStatus(allocatedQty, order.requestQty),
    });
  }

  return results;
}
