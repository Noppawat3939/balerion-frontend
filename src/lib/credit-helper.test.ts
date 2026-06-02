import { describe, it, expect } from "vitest";
import {
  calculateRemainingCredit,
  calculateMaxQtyByCredit,
} from "./credit-helper";
import type { Customer } from "@/types/mock.type";

const makeCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  customerId: "CT-0001",
  name: "บริษัท ปลาทอง จำกัด",
  creditLimit: 50000,
  usedCredit: 0,
  ...overrides,
});

// ─── calculateRemainingCredit ─────────────────────────────────────────────────

describe("calculateRemainingCredit", () => {
  it("returns full creditLimit when usedCredit is 0", () => {
    const customer = makeCustomer({ creditLimit: 50000, usedCredit: 0 });
    expect(calculateRemainingCredit(customer)).toBe(50000);
  });

  it("returns correct remaining after partial usage", () => {
    const customer = makeCustomer({ creditLimit: 80000, usedCredit: 30000 });
    expect(calculateRemainingCredit(customer)).toBe(50000);
  });

  it("returns 0 when usedCredit equals creditLimit", () => {
    const customer = makeCustomer({ creditLimit: 30000, usedCredit: 30000 });
    expect(calculateRemainingCredit(customer)).toBe(0);
  });

  it("returns negative when usedCredit exceeds creditLimit", () => {
    const customer = makeCustomer({ creditLimit: 10000, usedCredit: 12000 });
    expect(calculateRemainingCredit(customer)).toBe(-2000);
  });

  it("handles decimal credit values correctly", () => {
    const customer = makeCustomer({ creditLimit: 1000.50, usedCredit: 400.25 });
    expect(calculateRemainingCredit(customer)).toBeCloseTo(600.25);
  });

  it("returns 0 when both creditLimit and usedCredit are 0", () => {
    const customer = makeCustomer({ creditLimit: 0, usedCredit: 0 });
    expect(calculateRemainingCredit(customer)).toBe(0);
  });
});

// ─── calculateMaxQtyByCredit ──────────────────────────────────────────────────

describe("calculateMaxQtyByCredit", () => {
  it("returns correct floor quantity from remaining credit and unit price", () => {
    expect(calculateMaxQtyByCredit(50000, 123.49)).toBe(Math.floor(50000 / 123.49));
  });

  it("floors the result — never returns fractional units", () => {
    // 1000 / 3 = 333.33... → 333
    expect(calculateMaxQtyByCredit(1000, 3)).toBe(333);
  });

  it("returns 0 when remainingCredit is 0", () => {
    expect(calculateMaxQtyByCredit(0, 100)).toBe(0);
  });

  it("returns 0 when remainingCredit is negative", () => {
    expect(calculateMaxQtyByCredit(-500, 100)).toBe(0);
  });

  it("returns 0 when unitPrice is 0", () => {
    expect(calculateMaxQtyByCredit(50000, 0)).toBe(0);
  });

  it("returns 0 when unitPrice is negative", () => {
    expect(calculateMaxQtyByCredit(50000, -10)).toBe(0);
  });

  it("returns 1 when remainingCredit is exactly equal to unitPrice", () => {
    expect(calculateMaxQtyByCredit(100, 100)).toBe(1);
  });

  it("returns 1 when remainingCredit is just over unitPrice", () => {
    expect(calculateMaxQtyByCredit(100.01, 100)).toBe(1);
  });

  it("returns 0 when remainingCredit is just under unitPrice", () => {
    expect(calculateMaxQtyByCredit(99.99, 100)).toBe(0);
  });

  it("handles large credit and small unit price correctly", () => {
    expect(calculateMaxQtyByCredit(1000000, 0.01)).toBe(100000000);
  });

  it("returns exact integer when credit divides evenly by price", () => {
    expect(calculateMaxQtyByCredit(500, 50)).toBe(10);
  });

  it("uses grooming example: CT-0002 credit 80000 with EMERGENCY Item-1 SP-002 price (98.75 × 1.20 = 118.50)", () => {
    const unitPrice = 98.75 * 1.2; // 118.5
    expect(calculateMaxQtyByCredit(80000, unitPrice)).toBe(Math.floor(80000 / 118.5));
  });
});
