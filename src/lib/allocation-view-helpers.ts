import { customers as initialCustomers } from "@/mock/customers"
import { stocks as initialStocks } from "@/mock/stocks"
import type { AllocationResult, Customer, Stock } from "@/types/mock.type"

/**
 * Derives remaining stock after allocation by diffing allocatedQty against initial stock.
 * Uses a composite key `warehouseId|supplierId|itemId` because stock identity requires
 * all three fields — same item in different warehouses or from different suppliers are
 * distinct slots. Spread `{ ...s }` to avoid mutating the imported mock array.
 */
export function computeRemainingStocks(results: AllocationResult[]): Stock[] {
  const stockMap = new Map(
    initialStocks.map((s) => [`${s.warehouseId}|${s.supplierId}|${s.itemId}`, { ...s }]),
  )
  for (const r of results) {
    const key = `${r.resolvedWarehouseId}|${r.resolvedSupplierId}|${r.itemId}`
    const s = stockMap.get(key)
    if (s) s.availableStock -= r.allocatedQty
  }
  return [...stockMap.values()]
}

/**
 * Derives each customer's usedCredit after allocation by accumulating totalPrice per result.
 * Spread `{ ...c }` to avoid mutating the imported mock array.
 */
export function computeCustomersAfterAllocation(results: AllocationResult[]): Customer[] {
  const customerMap = new Map(initialCustomers.map((c) => [c.customerId, { ...c }]))
  for (const r of results) {
    const c = customerMap.get(r.customerId)
    if (c) c.usedCredit += r.totalPrice
  }
  return [...customerMap.values()]
}
