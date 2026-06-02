import type { Stock } from "@/types/mock.type";

export const stocks: Stock[] = [
  {
    warehouseId: "WH-001",
    supplierId: "SP-001",
    itemId: "Item-1",
    availableStock: 500,
  },
  {
    warehouseId: "WH-001",
    supplierId: "SP-002",
    itemId: "Item-1",
    availableStock: 300,
  },
  {
    warehouseId: "WH-002",
    supplierId: "SP-001",
    itemId: "Item-1",
    availableStock: 150,
  },
  {
    warehouseId: "WH-002",
    supplierId: "SP-001",
    itemId: "Item-2",
    availableStock: 200,
  },
  {
    warehouseId: "WH-002",
    supplierId: "SP-002",
    itemId: "Item-2",
    availableStock: 80,
  },
  {
    warehouseId: "WH-003",
    supplierId: "SP-001",
    itemId: "Item-1",
    availableStock: 600,
  },
  {
    warehouseId: "WH-003",
    supplierId: "SP-002",
    itemId: "Item-2",
    availableStock: 120,
  },
];
