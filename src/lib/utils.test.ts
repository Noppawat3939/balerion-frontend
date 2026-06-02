import { describe, expect,it } from "vitest";

import { bankerRound, calculatePricePerUnit, cn, formatCurrency } from "./utils";

describe("cn", () => {
  it("combines class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("returns empty string when no args", () => {
    expect(cn()).toBe("");
  });
});

describe("bankerRound", () => {
  it("rounds normally when remainder is not exactly 0.5", () => {
    expect(bankerRound(1.4)).toBe(1.4);
    expect(bankerRound(1.6)).toBe(1.6);
    expect(bankerRound(2.34)).toBe(2.34);
  });

  it("rounds half to even (banker's rounding) at 0.5", () => {
    // 0.5 → nearest even is 0
    expect(bankerRound(0.5)).toBe(0.5);
    // 1.5 → nearest even is 2
    expect(bankerRound(1.5)).toBe(1.5);
    // 2.5 → nearest even is 2
    expect(bankerRound(2.5)).toBe(2.5);
  });

  it("supports custom decimal places", () => {
    expect(bankerRound(1.005, 2)).toBe(1.0);
    expect(bankerRound(1.2345, 3)).toBe(1.234); // 4 is even → round down
  });

  it("handles negative numbers", () => {
    expect(bankerRound(-1.5)).toBe(-1.5);
    expect(bankerRound(-2.55, 1)).toBe(-2.6);
  });

  it("handles zero", () => {
    expect(bankerRound(0)).toBe(0);
  });

  describe("2 decimal precision — half-even validation", () => {
    // x.xx5 → round 2nd decimal to nearest even
    it("rounds down when 2nd decimal is even", () => {
      expect(bankerRound(1.125)).toBe(1.12); // 2 is even → down
      expect(bankerRound(1.145)).toBe(1.14); // 4 is even → down
      expect(bankerRound(1.165)).toBe(1.16); // 6 is even → down
      expect(bankerRound(1.185)).toBe(1.18); // 8 is even → down
    });

    it("rounds up when 2nd decimal is odd", () => {
      expect(bankerRound(1.135)).toBe(1.14); // 3 is odd → up
      expect(bankerRound(1.155)).toBe(1.16); // 5 is odd → up
      expect(bankerRound(1.175)).toBe(1.18); // 7 is odd → up
      expect(bankerRound(1.195)).toBe(1.2); // 9 is odd → up
    });

    it("does not apply half-even when digit after 5 exists (normal round)", () => {
      expect(bankerRound(1.1251)).toBe(1.13); // > .5 → always round up
      expect(bankerRound(1.1449)).toBe(1.14); // < .5 → always round down
    });

    it("handles negative values with half-even", () => {
      expect(bankerRound(-1.125)).toBe(-1.12); // 2 is even → toward zero
      expect(bankerRound(-1.135)).toBe(-1.14); // 3 is odd → away from zero
    });
  });
});

describe("calculatePricePerUnit", () => {
  it("multiplies basePrice by multiplier and applies banker's rounding", () => {
    // 123.49 × 1.20 = 148.188 → rounds up (8 > 5)
    expect(calculatePricePerUnit(123.49, 1.2)).toBe(148.19);
    // 123.49 × 1.00 = 123.49 → no change
    expect(calculatePricePerUnit(123.49, 1.0)).toBe(123.49);
    // 123.49 × 0.90 = 111.141 → rounds down (1 < 5)
    expect(calculatePricePerUnit(123.49, 0.9)).toBe(111.14);
  });

  it("handles OVERDUE multiplier (1.00) — returns basePrice unchanged", () => {
    expect(calculatePricePerUnit(98.75, 1.0)).toBe(98.75);
    expect(calculatePricePerUnit(76.0, 1.0)).toBe(76.0);
  });

  it("handles DAILY multiplier (0.90) — discount pricing", () => {
    // 76.00 × 0.90 = 68.40
    expect(calculatePricePerUnit(76.0, 0.9)).toBe(68.4);
    // 65.50 × 0.90 = 58.95
    expect(calculatePricePerUnit(65.5, 0.9)).toBe(58.95);
  });

  it("handles zero basePrice", () => {
    expect(calculatePricePerUnit(0, 1.2)).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats positive amount as Thai Baht", () => {
    const result = formatCurrency(1000);
    expect(result).toContain("1,000");
    expect(result).toMatch(/฿|THB|บาท/);
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0.00");
  });

  it("formats decimal amounts with 2 decimal places", () => {
    const result = formatCurrency(123.49);
    expect(result).toContain("123.49");
  });

  it("formats large amounts with thousand separators", () => {
    const result = formatCurrency(50000);
    expect(result).toContain("50,000");
  });
});
