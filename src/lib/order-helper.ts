import type { Order, OrderType } from "@/types/mock.type";

const WAREHOUSES = ["WH-001", "WH-002", "WH-003", "WH-000"];
const SUPPLIERS = ["SP-001", "SP-002", "SP-000"];
const ITEMS = ["Item-1", "Item-2"];
const TYPES: OrderType[] = ["EMERGENCY", "OVERDUE", "DAILY"];
const CUSTOMERS = ["CT-0001", "CT-0002", "CT-0003"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
  return d.toISOString().split("T")[0];
}

export function generateOrders(count: number): Order[] {
  const result: Order[] = [];
  let orderCounter = 4;
  let remaining = count;

  while (remaining > 0) {
    const orderId = `ORDER-${String(orderCounter).padStart(4, "0")}`;
    const subCount = Math.min(Math.floor(Math.random() * 3) + 1, remaining);
    const type = randomFrom(TYPES);
    const customerId = randomFrom(CUSTOMERS);
    const createDate = randomDate(
      new Date("2024-01-01"),
      new Date("2025-06-01"),
    );

    for (let s = 1; s <= subCount; s++) {
      result.push({
        orderId,
        subOrderId: `${orderId}-${String(s).padStart(3, "0")}`,
        itemId: randomFrom(ITEMS),
        warehouseId: randomFrom(WAREHOUSES),
        supplierId: randomFrom(SUPPLIERS),
        requestQty: Math.floor(Math.random() * 490) + 10,
        type,
        createDate,
        customerId,
        remark: "",
      });
      remaining--;
      if (remaining <= 0) break;
    }
    orderCounter++;
  }

  return result;
}

const TYPE_PRIORITY: Record<string, number> = {
  EMERGENCY: 0,
  OVERDUE: 1,
  DAILY: 2,
};

/**
 * Sorts orders by type priority (EMERGENCY → OVERDUE → DAILY).
 * Within the same type, orders are sorted by `createDate` ascending (FIFO).
 * @param orders - Array of orders to sort
 * @returns New sorted array (does not mutate the original)
 */
export function sortingOrderByPriority(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const priorityDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    return a.createDate.localeCompare(b.createDate);
  });
}
