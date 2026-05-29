import { describe, it, expect } from "vitest";
import { cn, bankerRound } from "./utils";

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
