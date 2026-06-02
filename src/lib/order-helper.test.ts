import { describe, expect,it } from "vitest";

import type { Order } from "@/types/mock.type";

import { generateOrders, sortingOrderByPriority } from "./order-helper";

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

// ─── generateOrders ───────────────────────────────────────────────────────────

describe("generateOrders", () => {
  it("returns exactly the requested count", () => {
    expect(generateOrders(1)).toHaveLength(1);
    expect(generateOrders(10)).toHaveLength(10);
    expect(generateOrders(100)).toHaveLength(100);
  });

  it("returns empty array when count is 0", () => {
    expect(generateOrders(0)).toHaveLength(0);
  });

  it("each order has required fields with valid values", () => {
    const orders = generateOrders(5);
    for (const order of orders) {
      expect(order.orderId).toMatch(/^ORDER-\d{4}$/);
      expect(order.subOrderId).toMatch(/^ORDER-\d{4}-\d{3}$/);
      expect(["Item-1", "Item-2"]).toContain(order.itemId);
      expect(["WH-001", "WH-002", "WH-003", "WH-000"]).toContain(
        order.warehouseId,
      );
      expect(["SP-001", "SP-002", "SP-000"]).toContain(order.supplierId);
      expect(["EMERGENCY", "OVERDUE", "DAILY"]).toContain(order.type);
      expect(["CT-0001", "CT-0002", "CT-0003"]).toContain(order.customerId);
      expect(order.requestQty).toBeGreaterThanOrEqual(10);
      expect(order.requestQty).toBeLessThanOrEqual(499);
      expect(order.remark).toBe("");
    }
  });

  it("createDate is within expected range (2024-01-01 to 2025-06-01)", () => {
    const orders = generateOrders(20);
    const start = new Date("2024-01-01").getTime();
    const end = new Date("2025-06-01").getTime();
    for (const order of orders) {
      const d = new Date(order.createDate).getTime();
      expect(d).toBeGreaterThanOrEqual(start);
      expect(d).toBeLessThanOrEqual(end);
    }
  });

  it("order IDs start from ORDER-0004", () => {
    const orders = generateOrders(1);
    expect(orders[0].orderId).toBe("ORDER-0004");
  });

  it("sub-orders under the same orderId share the same type and createDate", () => {
    const orders = generateOrders(50);
    const grouped: Record<string, Order[]> = {};
    for (const o of orders) {
      (grouped[o.orderId] ??= []).push(o);
    }
    for (const group of Object.values(grouped)) {
      const firstType = group[0].type;
      const firstDate = group[0].createDate;
      for (const o of group) {
        expect(o.type).toBe(firstType);
        expect(o.createDate).toBe(firstDate);
      }
    }
  });

  it("sub-order IDs are sequential within the same orderId", () => {
    const orders = generateOrders(50);
    const grouped: Record<string, Order[]> = {};
    for (const o of orders) {
      (grouped[o.orderId] ??= []).push(o);
    }
    for (const group of Object.values(grouped)) {
      group.forEach((o, idx) => {
        const expectedSuffix = String(idx + 1).padStart(3, "0");
        expect(o.subOrderId.endsWith(`-${expectedSuffix}`)).toBe(true);
      });
    }
  });
});

// ─── sortingOrderByPriority ───────────────────────────────────────────────────

describe("sortingOrderByPriority", () => {
  it("returns empty array when input is empty", () => {
    expect(sortingOrderByPriority([])).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    const order = makeOrder({ type: "DAILY" });
    expect(sortingOrderByPriority([order])).toEqual([order]);
  });

  it("sorts EMERGENCY before OVERDUE before DAILY", () => {
    const daily = makeOrder({ subOrderId: "A", type: "DAILY" });
    const overdue = makeOrder({ subOrderId: "B", type: "OVERDUE" });
    const emergency = makeOrder({ subOrderId: "C", type: "EMERGENCY" });

    const result = sortingOrderByPriority([daily, overdue, emergency]);

    expect(result[0].type).toBe("EMERGENCY");
    expect(result[1].type).toBe("OVERDUE");
    expect(result[2].type).toBe("DAILY");
  });

  it("sorts by createDate ascending (FIFO) within the same type", () => {
    const a = makeOrder({
      subOrderId: "A",
      type: "DAILY",
      createDate: "2025-03-01",
    });
    const b = makeOrder({
      subOrderId: "B",
      type: "DAILY",
      createDate: "2025-01-01",
    });
    const c = makeOrder({
      subOrderId: "C",
      type: "DAILY",
      createDate: "2025-02-01",
    });

    const result = sortingOrderByPriority([a, b, c]);

    expect(result[0].createDate).toBe("2025-01-01");
    expect(result[1].createDate).toBe("2025-02-01");
    expect(result[2].createDate).toBe("2025-03-01");
  });

  it("applies both type priority and date ordering together", () => {
    const orders: Order[] = [
      makeOrder({ subOrderId: "A", type: "DAILY", createDate: "2025-01-01" }),
      makeOrder({
        subOrderId: "B",
        type: "EMERGENCY",
        createDate: "2025-02-01",
      }),
      makeOrder({ subOrderId: "C", type: "OVERDUE", createDate: "2025-01-15" }),
      makeOrder({
        subOrderId: "D",
        type: "EMERGENCY",
        createDate: "2025-01-01",
      }),
      makeOrder({ subOrderId: "E", type: "OVERDUE", createDate: "2025-01-05" }),
    ];

    const result = sortingOrderByPriority(orders);

    expect(result.map((o) => o.subOrderId)).toEqual(["D", "B", "E", "C", "A"]);
  });

  it("does not mutate the original array", () => {
    const orders: Order[] = [
      makeOrder({ subOrderId: "A", type: "DAILY" }),
      makeOrder({ subOrderId: "B", type: "EMERGENCY" }),
    ];
    const original = [...orders];
    sortingOrderByPriority(orders);
    expect(orders).toEqual(original);
  });

  it("preserves all orders in the output (no item lost)", () => {
    const orders = generateOrders(30);
    const result = sortingOrderByPriority(orders);
    expect(result).toHaveLength(orders.length);
    expect(result.map((o) => o.subOrderId).sort()).toEqual(
      orders.map((o) => o.subOrderId).sort(),
    );
  });

  it("handles all orders with the same type — sorted by date only", () => {
    const orders: Order[] = [
      makeOrder({ subOrderId: "A", type: "OVERDUE", createDate: "2025-06-01" }),
      makeOrder({ subOrderId: "B", type: "OVERDUE", createDate: "2024-01-01" }),
      makeOrder({ subOrderId: "C", type: "OVERDUE", createDate: "2025-01-01" }),
    ];

    const result = sortingOrderByPriority(orders);

    expect(result[0].createDate).toBe("2024-01-01");
    expect(result[1].createDate).toBe("2025-01-01");
    expect(result[2].createDate).toBe("2025-06-01");
  });

  it("handles orders with duplicate type and date — all items preserved", () => {
    const a = makeOrder({
      subOrderId: "A",
      type: "EMERGENCY",
      createDate: "2025-01-01",
    });
    const b = makeOrder({
      subOrderId: "B",
      type: "EMERGENCY",
      createDate: "2025-01-01",
    });

    const result = sortingOrderByPriority([a, b]);

    expect(result).toHaveLength(2);
    expect(result.every((o) => o.type === "EMERGENCY")).toBe(true);
  });
});
