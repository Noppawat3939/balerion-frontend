import { describe, expect,it } from "vitest";

import type { Customer, Order, Price, Stock } from "@/types/mock.type";

import { allocate } from "./allocation-engine";

// ─── Grooming spec fixtures ───────────────────────────────────────────────────

const ORDERS: Order[] = [
  {
    orderId: "ORDER-0001",
    subOrderId: "ORDER-0001-001",
    itemId: "Item-1",
    warehouseId: "WH-001",
    supplierId: "SP-001",
    requestQty: 11,
    type: "DAILY",
    createDate: "2025-01-01",
    customerId: "CT-0001",
    remark: "",
  },
  {
    orderId: "ORDER-0001",
    subOrderId: "ORDER-0001-002",
    itemId: "Item-2",
    warehouseId: "WH-002",
    supplierId: "SP-000",
    requestQty: 20,
    type: "DAILY",
    createDate: "2025-01-01",
    customerId: "CT-0001",
    remark: "",
  },
  {
    orderId: "ORDER-0002",
    subOrderId: "ORDER-0002-001",
    itemId: "Item-1",
    warehouseId: "WH-001",
    supplierId: "SP-002",
    requestQty: 300,
    type: "EMERGENCY",
    createDate: "2025-01-03",
    customerId: "CT-0002",
    remark: "Special for VIP",
  },
  {
    orderId: "ORDER-0002",
    subOrderId: "ORDER-0002-002",
    itemId: "Item-2",
    warehouseId: "WH-000",
    supplierId: "SP-000",
    requestQty: 100,
    type: "EMERGENCY",
    createDate: "2025-01-03",
    customerId: "CT-0002",
    remark: "Special for VIP",
  },
  {
    orderId: "ORDER-0003",
    subOrderId: "ORDER-0003-001",
    itemId: "Item-1",
    warehouseId: "WH-002",
    supplierId: "SP-001",
    requestQty: 50,
    type: "OVERDUE",
    createDate: "2024-12-28",
    customerId: "CT-0003",
    remark: "",
  },
];

const STOCKS: Stock[] = [
  { warehouseId: "WH-001", supplierId: "SP-001", itemId: "Item-1", availableStock: 500 },
  { warehouseId: "WH-001", supplierId: "SP-002", itemId: "Item-1", availableStock: 300 },
  { warehouseId: "WH-002", supplierId: "SP-001", itemId: "Item-1", availableStock: 150 },
  { warehouseId: "WH-002", supplierId: "SP-001", itemId: "Item-2", availableStock: 200 },
  { warehouseId: "WH-002", supplierId: "SP-002", itemId: "Item-2", availableStock: 80  },
  { warehouseId: "WH-003", supplierId: "SP-001", itemId: "Item-1", availableStock: 600 },
  { warehouseId: "WH-003", supplierId: "SP-002", itemId: "Item-2", availableStock: 120 },
];

const PRICES: Price[] = [
  { itemId: "Item-1", supplierId: "SP-001", basePrice: 123.49, priceTier: "EMERGENCY", multiplier: 1.20 },
  { itemId: "Item-1", supplierId: "SP-001", basePrice: 123.49, priceTier: "OVERDUE",   multiplier: 1.00 },
  { itemId: "Item-1", supplierId: "SP-001", basePrice: 123.49, priceTier: "DAILY",     multiplier: 0.90 },
  { itemId: "Item-1", supplierId: "SP-002", basePrice: 98.75,  priceTier: "EMERGENCY", multiplier: 1.20 },
  { itemId: "Item-1", supplierId: "SP-002", basePrice: 98.75,  priceTier: "OVERDUE",   multiplier: 1.00 },
  { itemId: "Item-1", supplierId: "SP-002", basePrice: 98.75,  priceTier: "DAILY",     multiplier: 0.90 },
  { itemId: "Item-2", supplierId: "SP-001", basePrice: 76.00,  priceTier: "EMERGENCY", multiplier: 1.20 },
  { itemId: "Item-2", supplierId: "SP-001", basePrice: 76.00,  priceTier: "OVERDUE",   multiplier: 1.00 },
  { itemId: "Item-2", supplierId: "SP-001", basePrice: 76.00,  priceTier: "DAILY",     multiplier: 0.90 },
  { itemId: "Item-2", supplierId: "SP-002", basePrice: 65.50,  priceTier: "EMERGENCY", multiplier: 1.20 },
  { itemId: "Item-2", supplierId: "SP-002", basePrice: 65.50,  priceTier: "OVERDUE",   multiplier: 1.00 },
  { itemId: "Item-2", supplierId: "SP-002", basePrice: 65.50,  priceTier: "DAILY",     multiplier: 0.90 },
];

const CUSTOMERS: Customer[] = [
  { customerId: "CT-0001", name: "บริษัท ปลาทอง จำกัด",       creditLimit: 50000, usedCredit: 0 },
  { customerId: "CT-0002", name: "บริษัท สยามซีฟู้ด จำกัด",   creditLimit: 80000, usedCredit: 0 },
  { customerId: "CT-0003", name: "บริษัท โอเชี่ยนเฟรช จำกัด", creditLimit: 30000, usedCredit: 0 },
];

// Helper: run allocate and index results by subOrderId
function runAllocate() {
  const results = allocate(ORDERS, STOCKS, PRICES, CUSTOMERS);
  return Object.fromEntries(results.map((r) => [r.subOrderId, r]));
}

// ─── T-10 Check 1: Allocation order ──────────────────────────────────────────

describe("T-10 — allocation order", () => {
  it("processes EMERGENCY orders before OVERDUE before DAILY", () => {
    const results = allocate(ORDERS, STOCKS, PRICES, CUSTOMERS);
    const types = results.map((r) => r.type);
    const emergencyEnd = types.lastIndexOf("EMERGENCY");
    const overdueStart = types.indexOf("OVERDUE");
    const dailyStart = types.indexOf("DAILY");
    expect(emergencyEnd).toBeLessThan(overdueStart);
    expect(overdueStart).toBeLessThan(dailyStart);
  });

  it("returns one result per sub-order", () => {
    const results = allocate(ORDERS, STOCKS, PRICES, CUSTOMERS);
    expect(results).toHaveLength(ORDERS.length);
  });

  it("all sub-order IDs are present in results", () => {
    const results = allocate(ORDERS, STOCKS, PRICES, CUSTOMERS);
    const ids = results.map((r) => r.subOrderId).sort();
    expect(ids).toEqual(ORDERS.map((o) => o.subOrderId).sort());
  });
});

// ─── T-10 Check 2: Wildcard resolution ───────────────────────────────────────

describe("T-10 — wildcard resolution", () => {
  it("ORDER-0002-002 (WH-000 + SP-000, Item-2) resolves to the warehouse+supplier with max stock", () => {
    const r = runAllocate();
    // At time of allocation, Item-2 stocks: WH-002/SP-001(200), WH-002/SP-002(80), WH-003/SP-002(120)
    expect(r["ORDER-0002-002"].resolvedWarehouseId).toBe("WH-002");
    expect(r["ORDER-0002-002"].resolvedSupplierId).toBe("SP-001");
  });

  it("ORDER-0001-002 (SP-000 only, WH-002, Item-2) resolves to supplier with max stock at WH-002", () => {
    const r = runAllocate();
    // By the time DAILY is processed, WH-002/SP-001/Item-2 has been partially used
    // but SP-001 still has more than SP-002 — so SP-001 wins
    expect(r["ORDER-0001-002"].resolvedWarehouseId).toBe("WH-002");
    expect(r["ORDER-0001-002"].resolvedSupplierId).toBe("SP-001");
  });

  it("non-wildcard order keeps original warehouse and supplier", () => {
    const r = runAllocate();
    expect(r["ORDER-0002-001"].resolvedWarehouseId).toBe("WH-001");
    expect(r["ORDER-0002-001"].resolvedSupplierId).toBe("SP-002");
    expect(r["ORDER-0003-001"].resolvedWarehouseId).toBe("WH-002");
    expect(r["ORDER-0003-001"].resolvedSupplierId).toBe("SP-001");
  });
});

// ─── T-10 Check 3: Credit limit not exceeded ─────────────────────────────────

describe("T-10 — credit limit not exceeded", () => {
  it("total totalPrice per customer never exceeds their creditLimit", () => {
    const results = allocate(ORDERS, STOCKS, PRICES, CUSTOMERS);
    const usedPerCustomer: Record<string, number> = {};
    for (const r of results) {
      usedPerCustomer[r.customerId] =
        (usedPerCustomer[r.customerId] ?? 0) + r.totalPrice;
    }
    for (const customer of CUSTOMERS) {
      expect(usedPerCustomer[customer.customerId] ?? 0).toBeLessThanOrEqual(
        customer.creditLimit,
      );
    }
  });

  it("stops allocating when customer has no remaining credit", () => {
    const tightCustomer: Customer = {
      customerId: "CT-0001",
      name: "Tight",
      creditLimit: 100,
      usedCredit: 99.99,
    };
    const order: Order = {
      orderId: "ORDER-X",
      subOrderId: "ORDER-X-001",
      itemId: "Item-1",
      warehouseId: "WH-001",
      supplierId: "SP-001",
      requestQty: 10,
      type: "DAILY",
      createDate: "2025-01-01",
      customerId: "CT-0001",
      remark: "",
    };
    const results = allocate([order], STOCKS, PRICES, [tightCustomer]);
    // unitPrice = bankerRound(123.49 * 0.9) = 111.14, remaining = 0.01 → maxQtyByCredit = 0
    expect(results[0].allocatedQty).toBe(0);
    expect(results[0].status).toBe("UNALLOCATED");
  });
});

// ─── T-10 Check 4: Stock never goes negative ─────────────────────────────────

describe("T-10 — stock never goes negative", () => {
  it("sum of allocatedQty per stock entry never exceeds original availableStock", () => {
    const results = allocate(ORDERS, STOCKS, PRICES, CUSTOMERS);
    for (const stock of STOCKS) {
      const allocated = results
        .filter(
          (r) =>
            r.resolvedWarehouseId === stock.warehouseId &&
            r.resolvedSupplierId === stock.supplierId &&
            r.itemId === stock.itemId,
        )
        .reduce((sum, r) => sum + r.allocatedQty, 0);
      expect(allocated).toBeLessThanOrEqual(stock.availableStock);
    }
  });

  it("does not allocate more than availableStock even when requestQty is large", () => {
    const limitedStock: Stock = {
      warehouseId: "WH-001",
      supplierId: "SP-001",
      itemId: "Item-1",
      availableStock: 5,
    };
    const order: Order = {
      orderId: "ORDER-X",
      subOrderId: "ORDER-X-001",
      itemId: "Item-1",
      warehouseId: "WH-001",
      supplierId: "SP-001",
      requestQty: 9999,
      type: "DAILY",
      createDate: "2025-01-01",
      customerId: "CT-0001",
      remark: "",
    };
    const results = allocate([order], [limitedStock], PRICES, CUSTOMERS);
    expect(results[0].allocatedQty).toBe(5);
    expect(results[0].status).toBe("PARTIALLY_ALLOCATED");
  });
});

// ─── T-10 Check 5: Banker's Rounding ─────────────────────────────────────────

describe("T-10 — Banker's Rounding on unitPrice", () => {
  it("ORDER-0002-001 unitPrice = bankerRound(98.75 × 1.20) = 118.5", () => {
    const r = runAllocate();
    expect(r["ORDER-0002-001"].unitPrice).toBe(118.5);
  });

  it("ORDER-0002-002 unitPrice = bankerRound(76.00 × 1.20) = 91.2", () => {
    const r = runAllocate();
    expect(r["ORDER-0002-002"].unitPrice).toBe(91.2);
  });

  it("ORDER-0003-001 unitPrice = bankerRound(123.49 × 1.00) = 123.49", () => {
    const r = runAllocate();
    expect(r["ORDER-0003-001"].unitPrice).toBe(123.49);
  });

  it("ORDER-0001-001 unitPrice = bankerRound(123.49 × 0.90) = 111.14", () => {
    const r = runAllocate();
    expect(r["ORDER-0001-001"].unitPrice).toBe(111.14);
  });

  it("ORDER-0001-002 unitPrice = bankerRound(76.00 × 0.90) = 68.4", () => {
    const r = runAllocate();
    expect(r["ORDER-0001-002"].unitPrice).toBe(68.4);
  });
});

// ─── T-10 Check 6: Full allocation result correctness ────────────────────────

describe("T-10 — full allocation correctness with grooming data", () => {
  it("ORDER-0002-001: fully allocated 300 units at 118.5 each", () => {
    const r = runAllocate();
    expect(r["ORDER-0002-001"].allocatedQty).toBe(300);
    expect(r["ORDER-0002-001"].totalPrice).toBeCloseTo(35550, 2);
    expect(r["ORDER-0002-001"].status).toBe("FULLY_ALLOCATED");
  });

  it("ORDER-0002-002: fully allocated 100 units at 91.2 each", () => {
    const r = runAllocate();
    expect(r["ORDER-0002-002"].allocatedQty).toBe(100);
    expect(r["ORDER-0002-002"].totalPrice).toBeCloseTo(9120, 2);
    expect(r["ORDER-0002-002"].status).toBe("FULLY_ALLOCATED");
  });

  it("ORDER-0003-001: fully allocated 50 units at 123.49 each", () => {
    const r = runAllocate();
    expect(r["ORDER-0003-001"].allocatedQty).toBe(50);
    expect(r["ORDER-0003-001"].totalPrice).toBeCloseTo(6174.5, 2);
    expect(r["ORDER-0003-001"].status).toBe("FULLY_ALLOCATED");
  });

  it("ORDER-0001-001: fully allocated 11 units at 111.14 each", () => {
    const r = runAllocate();
    expect(r["ORDER-0001-001"].allocatedQty).toBe(11);
    expect(r["ORDER-0001-001"].totalPrice).toBeCloseTo(1222.54, 2);
    expect(r["ORDER-0001-001"].status).toBe("FULLY_ALLOCATED");
  });

  it("ORDER-0001-002: fully allocated 20 units at 68.4 each", () => {
    const r = runAllocate();
    expect(r["ORDER-0001-002"].allocatedQty).toBe(20);
    expect(r["ORDER-0001-002"].totalPrice).toBeCloseTo(1368, 2);
    expect(r["ORDER-0001-002"].status).toBe("FULLY_ALLOCATED");
  });
});

// ─── T-10 Check 7: Edge cases ────────────────────────────────────────────────

describe("T-10 — edge cases", () => {
  it("returns empty array when no orders provided", () => {
    expect(allocate([], STOCKS, PRICES, CUSTOMERS)).toEqual([]);
  });

  it("stock = 0 → UNALLOCATED with allocatedQty = 0", () => {
    const zeroStock: Stock[] = [
      { warehouseId: "WH-001", supplierId: "SP-001", itemId: "Item-1", availableStock: 0 },
    ];
    const order: Order = {
      orderId: "ORDER-X",
      subOrderId: "ORDER-X-001",
      itemId: "Item-1",
      warehouseId: "WH-001",
      supplierId: "SP-001",
      requestQty: 10,
      type: "DAILY",
      createDate: "2025-01-01",
      customerId: "CT-0001",
      remark: "",
    };
    const results = allocate([order], zeroStock, PRICES, CUSTOMERS);
    expect(results[0].allocatedQty).toBe(0);
    expect(results[0].status).toBe("UNALLOCATED");
  });

  it("credit = 0 → UNALLOCATED with allocatedQty = 0", () => {
    const zeroCredit: Customer[] = [
      { customerId: "CT-0001", name: "Zero", creditLimit: 0, usedCredit: 0 },
    ];
    const order: Order = {
      orderId: "ORDER-X",
      subOrderId: "ORDER-X-001",
      itemId: "Item-1",
      warehouseId: "WH-001",
      supplierId: "SP-001",
      requestQty: 10,
      type: "DAILY",
      createDate: "2025-01-01",
      customerId: "CT-0001",
      remark: "",
    };
    const results = allocate([order], STOCKS, PRICES, zeroCredit);
    expect(results[0].allocatedQty).toBe(0);
    expect(results[0].status).toBe("UNALLOCATED");
  });

  it("no price entry found → unitPrice = 0, UNALLOCATED", () => {
    const order: Order = {
      orderId: "ORDER-X",
      subOrderId: "ORDER-X-001",
      itemId: "Item-99",
      warehouseId: "WH-001",
      supplierId: "SP-001",
      requestQty: 10,
      type: "DAILY",
      createDate: "2025-01-01",
      customerId: "CT-0001",
      remark: "",
    };
    const results = allocate([order], STOCKS, PRICES, CUSTOMERS);
    expect(results[0].unitPrice).toBe(0);
    expect(results[0].allocatedQty).toBe(0);
    expect(results[0].status).toBe("UNALLOCATED");
  });

  it("all orders with WH-000 + SP-000 wildcards → resolves correctly and allocates", () => {
    const allWildcard: Order[] = ORDERS.map((o) => ({
      ...o,
      warehouseId: "WH-000",
      supplierId: "SP-000",
    }));
    const results = allocate(allWildcard, STOCKS, PRICES, CUSTOMERS);
    expect(results).toHaveLength(ORDERS.length);
    for (const r of results) {
      expect(r.resolvedWarehouseId).not.toBe("WH-000");
      expect(r.resolvedSupplierId).not.toBe("SP-000");
    }
  });

  it("partial allocation when stock < requestQty", () => {
    const smallStock: Stock[] = [
      { warehouseId: "WH-001", supplierId: "SP-001", itemId: "Item-1", availableStock: 3 },
    ];
    const order: Order = {
      orderId: "ORDER-X",
      subOrderId: "ORDER-X-001",
      itemId: "Item-1",
      warehouseId: "WH-001",
      supplierId: "SP-001",
      requestQty: 100,
      type: "DAILY",
      createDate: "2025-01-01",
      customerId: "CT-0001",
      remark: "",
    };
    const results = allocate([order], smallStock, PRICES, CUSTOMERS);
    expect(results[0].allocatedQty).toBe(3);
    expect(results[0].status).toBe("PARTIALLY_ALLOCATED");
  });

  it("does not mutate the original orders, stocks, prices, or customers arrays", () => {
    const ordersCopy = ORDERS.map((o) => ({ ...o }));
    const stocksCopy = STOCKS.map((s) => ({ ...s }));
    const pricesCopy = PRICES.map((p) => ({ ...p }));
    const customersCopy = CUSTOMERS.map((c) => ({ ...c }));

    allocate(ORDERS, STOCKS, PRICES, CUSTOMERS);

    expect(ORDERS).toEqual(ordersCopy);
    expect(STOCKS).toEqual(stocksCopy);
    expect(PRICES).toEqual(pricesCopy);
    expect(CUSTOMERS).toEqual(customersCopy);
  });

  it("sequential orders deplete stock correctly — second order gets reduced allocation", () => {
    const limitedStock: Stock[] = [
      { warehouseId: "WH-001", supplierId: "SP-001", itemId: "Item-1", availableStock: 15 },
    ];
    const orders: Order[] = [
      {
        orderId: "ORDER-A",
        subOrderId: "ORDER-A-001",
        itemId: "Item-1",
        warehouseId: "WH-001",
        supplierId: "SP-001",
        requestQty: 10,
        type: "EMERGENCY",
        createDate: "2025-01-01",
        customerId: "CT-0001",
        remark: "",
      },
      {
        orderId: "ORDER-B",
        subOrderId: "ORDER-B-001",
        itemId: "Item-1",
        warehouseId: "WH-001",
        supplierId: "SP-001",
        requestQty: 10,
        type: "EMERGENCY",
        createDate: "2025-01-02",
        customerId: "CT-0002",
        remark: "",
      },
    ];
    const results = allocate(orders, limitedStock, PRICES, CUSTOMERS);
    const byId = Object.fromEntries(results.map((r) => [r.subOrderId, r]));
    // First order (older date = higher priority) gets full 10
    expect(byId["ORDER-A-001"].allocatedQty).toBe(10);
    expect(byId["ORDER-A-001"].status).toBe("FULLY_ALLOCATED");
    // Second order only gets remaining 5
    expect(byId["ORDER-B-001"].allocatedQty).toBe(5);
    expect(byId["ORDER-B-001"].status).toBe("PARTIALLY_ALLOCATED");
    // Total never exceeds original stock
    expect(byId["ORDER-A-001"].allocatedQty + byId["ORDER-B-001"].allocatedQty).toBeLessThanOrEqual(15);
  });
});
