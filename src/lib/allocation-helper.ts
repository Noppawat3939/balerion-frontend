import type { Order, Stock } from "@/types/mock.type";

const WILDCARD_WAREHOUSE = "WH-000";
const WILDCARD_SUPPLIER = "SP-000";

export type ResolvedWildcard = {
  resolvedWarehouseId: string;
  resolvedSupplierId: string;
};

/**
 * Resolves wildcard warehouse (WH-000) and/or supplier (SP-000)
 * by selecting the stock entry with the highest `availableStock`.
 *
 * - WH-000 only  → pick warehouse with max stock for `itemId` + `supplierId`
 * - SP-000 only  → pick supplier with max stock for `itemId` + `warehouseId`
 * - Both         → pick (warehouse, supplier) combination with max stock for `itemId`
 * - Neither      → return original IDs unchanged
 *
 * Falls back to original (wildcard) IDs when no candidate stock entry is found.
 *
 * @param order  - The sub-order being resolved
 * @param stocks - Current stock snapshot
 * @returns Resolved warehouse and supplier IDs
 */
export function resolveWildcard(
  order: Order,
  stocks: Stock[],
): ResolvedWildcard {
  const { itemId, warehouseId, supplierId } = order;
  const isWHWildcard = warehouseId === WILDCARD_WAREHOUSE;
  const isSPWildcard = supplierId === WILDCARD_SUPPLIER;

  if (!isWHWildcard && !isSPWildcard) {
    return { resolvedWarehouseId: warehouseId, resolvedSupplierId: supplierId };
  }

  let candidates: Stock[];

  if (isWHWildcard && isSPWildcard) {
    candidates = stocks.filter((s) => s.itemId === itemId);
  } else if (isWHWildcard) {
    candidates = stocks.filter(
      (s) => s.itemId === itemId && s.supplierId === supplierId,
    );
  } else {
    candidates = stocks.filter(
      (s) => s.itemId === itemId && s.warehouseId === warehouseId,
    );
  }

  if (candidates.length === 0) {
    return { resolvedWarehouseId: warehouseId, resolvedSupplierId: supplierId };
  }

  const best = candidates.reduce((prev, curr) =>
    curr.availableStock > prev.availableStock ? curr : prev,
  );

  return {
    resolvedWarehouseId: best.warehouseId,
    resolvedSupplierId: best.supplierId,
  };
}
