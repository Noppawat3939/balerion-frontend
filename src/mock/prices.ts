import type { Price } from "@/types/mock.type";

export const prices: Price[] = [
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
