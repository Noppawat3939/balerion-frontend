import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bankerRound(value: number, decimals = 2) {
  const formatter = new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    roundingMode: "halfEven",
    useGrouping: false, // Disables thousand separator commas
  });
  return parseFloat(formatter.format(value));
}

export function calculatePricePerUnit(
  basePrice: number,
  multiplier: number,
): number {
  return bankerRound(basePrice * multiplier);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
