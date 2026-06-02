import type { Customer } from "@/types/mock.type";

/**
 * Calculates the remaining credit available for a customer.
 * @param customer - Customer record with creditLimit and usedCredit
 * @returns Remaining credit in ฿ (can be negative if over-limit)
 */
export function calculateRemainingCredit(customer: Customer): number {
  return customer.creditLimit - customer.usedCredit;
}

/**
 * Calculates the maximum quantity a customer can receive based on remaining credit.
 * Uses `Math.floor` so partial units are never over-allocated.
 * Returns 0 when remainingCredit ≤ 0 or unitPrice ≤ 0.
 * @param remainingCredit - Remaining credit in ฿
 * @param unitPrice       - Price per unit in ฿
 * @returns Maximum allocatable quantity
 */
export function calculateMaxQtyByCredit(
  remainingCredit: number,
  unitPrice: number,
): number {
  if (remainingCredit <= 0 || unitPrice <= 0) return 0;
  return Math.floor(remainingCredit / unitPrice);
}
