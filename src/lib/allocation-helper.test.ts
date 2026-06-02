import { describe, expect,it } from "vitest";

import type { Order, Stock } from "@/types/mock.type";

import { resolveWildcard } from "./allocation-helper";

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  orderId: "ORDER-0001",
  subOrderId: "ORDER-0001-001",
  itemId: "Item-1",
  warehouseId: "WH-001",
  supplierId: "SP-001",
  requestQty: 10,
  type: "DAILY",
  createDate: "2025-01-01",
  customerId: "CT-0001",
  remark: "",
  ...overrides,
});

const makeStock = (overrides: Partial<Stock> = {}): Stock => ({
  warehouseId: "WH-001",
  supplierId: "SP-001",
  itemId: "Item-1",
  availableStock: 100,
  ...overrides,
});

// Mock stocks from grooming spec
const GROOMING_STOCKS: Stock[] = [
  { warehouseId: "WH-001", supplierId: "SP-001", itemId: "Item-1", availableStock: 500 },
  { warehouseId: "WH-001", supplierId: "SP-002", itemId: "Item-1", availableStock: 300 },
  { warehouseId: "WH-002", supplierId: "SP-001", itemId: "Item-1", availableStock: 150 },
  { warehouseId: "WH-002", supplierId: "SP-001", itemId: "Item-2", availableStock: 200 },
  { warehouseId: "WH-002", supplierId: "SP-002", itemId: "Item-2", availableStock: 80  },
  { warehouseId: "WH-003", supplierId: "SP-001", itemId: "Item-1", availableStock: 600 },
  { warehouseId: "WH-003", supplierId: "SP-002", itemId: "Item-2", availableStock: 120 },
];

// ─── resolveWildcard ──────────────────────────────────────────────────────────

describe("resolveWildcard", () => {
  describe("no wildcard", () => {
    it("returns original IDs unchanged when neither is a wildcard", () => {
      const order = makeOrder({ warehouseId: "WH-001", supplierId: "SP-001" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result).toEqual({
        resolvedWarehouseId: "WH-001",
        resolvedSupplierId: "SP-001",
      });
    });
  });

  describe("WH-000 wildcard only", () => {
    it("picks the warehouse with max stock for the given itemId + supplierId", () => {
      // Item-1 + SP-001: WH-001(500), WH-002(150), WH-003(600) → WH-003 wins
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-000", supplierId: "SP-001" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-003");
      expect(result.resolvedSupplierId).toBe("SP-001");
    });

    it("picks correct warehouse when supplier has stock in limited warehouses", () => {
      // Item-1 + SP-002: WH-001(300), WH-002(no entry for Item-1/SP-002) → WH-001 wins
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-000", supplierId: "SP-002" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-001");
      expect(result.resolvedSupplierId).toBe("SP-002");
    });

    it("returns fallback (WH-000) when no candidates found", () => {
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-000", supplierId: "SP-999" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-000");
      expect(result.resolvedSupplierId).toBe("SP-999");
    });
  });

  describe("SP-000 wildcard only", () => {
    it("picks the supplier with max stock for the given itemId + warehouseId", () => {
      // Item-2 + WH-002: SP-001(200), SP-002(80) → SP-001 wins
      const order = makeOrder({ itemId: "Item-2", warehouseId: "WH-002", supplierId: "SP-000" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-002");
      expect(result.resolvedSupplierId).toBe("SP-001");
    });

    it("picks correct supplier when only one exists for that warehouse + item", () => {
      // Item-1 + WH-002: only SP-001(150)
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-002", supplierId: "SP-000" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-002");
      expect(result.resolvedSupplierId).toBe("SP-001");
    });

    it("returns fallback (SP-000) when no candidates found", () => {
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-999", supplierId: "SP-000" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-999");
      expect(result.resolvedSupplierId).toBe("SP-000");
    });
  });

  describe("both WH-000 and SP-000 wildcards", () => {
    it("picks the (warehouse, supplier) combination with max stock for itemId", () => {
      // Item-2: WH-002/SP-001(200), WH-002/SP-002(80), WH-003/SP-002(120) → WH-002/SP-001 wins
      const order = makeOrder({ itemId: "Item-2", warehouseId: "WH-000", supplierId: "SP-000" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-002");
      expect(result.resolvedSupplierId).toBe("SP-001");
    });

    it("picks the combination with max stock across all warehouses and suppliers for Item-1", () => {
      // Item-1: WH-001/SP-001(500), WH-001/SP-002(300), WH-002/SP-001(150), WH-003/SP-001(600) → WH-003/SP-001 wins
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-000", supplierId: "SP-000" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-003");
      expect(result.resolvedSupplierId).toBe("SP-001");
    });

    it("returns fallback (WH-000, SP-000) when no candidates found", () => {
      const order = makeOrder({ itemId: "Item-999", warehouseId: "WH-000", supplierId: "SP-000" });
      const result = resolveWildcard(order, GROOMING_STOCKS);
      expect(result.resolvedWarehouseId).toBe("WH-000");
      expect(result.resolvedSupplierId).toBe("SP-000");
    });
  });

  describe("edge cases", () => {
    it("returns empty stocks fallback when stock list is empty", () => {
      const order = makeOrder({ warehouseId: "WH-000", supplierId: "SP-000" });
      const result = resolveWildcard(order, []);
      expect(result).toEqual({ resolvedWarehouseId: "WH-000", resolvedSupplierId: "SP-000" });
    });

    it("resolves correctly when a single candidate exists", () => {
      const stocks: Stock[] = [makeStock({ warehouseId: "WH-002", availableStock: 50 })];
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-000", supplierId: "SP-001" });
      const result = resolveWildcard(order, stocks);
      expect(result.resolvedWarehouseId).toBe("WH-002");
    });

    it("picks the max even when all candidates have availableStock = 0", () => {
      const stocks: Stock[] = [
        makeStock({ warehouseId: "WH-001", availableStock: 0 }),
        makeStock({ warehouseId: "WH-002", availableStock: 0 }),
      ];
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-000", supplierId: "SP-001" });
      const result = resolveWildcard(order, stocks);
      // reduce picks first when all equal — WH-001 (no item lost)
      expect(result.resolvedWarehouseId).toBe("WH-001");
    });

    it("does not mutate the stocks array", () => {
      const stocks = [...GROOMING_STOCKS];
      const order = makeOrder({ warehouseId: "WH-000", supplierId: "SP-000" });
      resolveWildcard(order, stocks);
      expect(stocks).toHaveLength(GROOMING_STOCKS.length);
    });

    it("ignores stocks for different itemId when resolving wildcard", () => {
      const stocks: Stock[] = [
        makeStock({ warehouseId: "WH-001", itemId: "Item-2", availableStock: 999 }),
        makeStock({ warehouseId: "WH-002", itemId: "Item-1", availableStock: 50 }),
      ];
      // Item-1 + WH-000 + SP-001: should only match WH-002 (itemId=Item-1), not WH-001
      const order = makeOrder({ itemId: "Item-1", warehouseId: "WH-000", supplierId: "SP-001" });
      const result = resolveWildcard(order, stocks);
      expect(result.resolvedWarehouseId).toBe("WH-002");
    });
  });
});
