export type OrderType = "EMERGENCY" | "OVERDUE" | "DAILY";

export type PriceTier = "EMERGENCY" | "OVERDUE" | "DAILY";

export const AllocationStatus = {
  FULLY_ALLOCATED: "FULLY_ALLOCATED",
  PARTIALLY_ALLOCATED: "PARTIALLY_ALLOCATED",
  UNALLOCATED: "UNALLOCATED",
} as const;

export type AllocationStatus = (typeof AllocationStatus)[keyof typeof AllocationStatus];

export interface Order {
  orderId: string;
  subOrderId: string;
  itemId: string;
  warehouseId: string;
  supplierId: string;
  requestQty: number;
  type: OrderType;
  createDate: string;
  customerId: string;
  remark: string;
}

export interface Stock {
  warehouseId: string;
  supplierId: string;
  itemId: string;
  availableStock: number;
}

export interface Price {
  itemId: string;
  supplierId: string;
  basePrice: number;
  priceTier: PriceTier;
  multiplier: number;
}

export interface Customer {
  customerId: string;
  name: string;
  creditLimit: number;
  usedCredit: number;
}

export interface AllocationResult {
  subOrderId: string;
  orderId: string;
  itemId: string;
  resolvedWarehouseId: string;
  resolvedSupplierId: string;
  customerId: string;
  type: OrderType;
  requestQty: number;
  allocatedQty: number;
  unitPrice: number;
  totalPrice: number;
  status: AllocationStatus;
  createDate: string;
}
