import type { Order, OrderType } from "@/types/mock.type";

export const orders: Order[] = [
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
