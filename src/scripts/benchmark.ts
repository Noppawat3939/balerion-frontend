/// <reference types="node" />

/**
 * @file benchmark.ts
 * @description Performance benchmark for the salmon allocation system.
 *
 * Measures two critical paths:
 *   1. Order generation  — `generateOrders(N)`
 *   2. Allocation engine — `allocate(orders, stocks, prices, customers)`
 *
 * Targets (T-20):
 *   - Allocation calc  < 1,000 ms
 *   - Full critical path (gen + alloc) treated as proxy for page-load budget
 *
 * @usage
 *   bun run benchmark
 */

import { allocate } from "@/lib/allocation-engine";
import { generateOrders } from "@/lib/order-helper";
import { customers } from "@/mock/customers";
import { orders as baseOrders } from "@/mock/orders";
import { prices } from "@/mock/prices";
import { stocks } from "@/mock/stocks";

const arg = process.argv[2];
const ORDER_COUNT = arg ? parseInt(arg, 10) : 5_000;

/** Formats milliseconds with colour coding based on a threshold. */
function fmt(ms: number, limitMs: number): string {
  const label = `${ms.toFixed(2)} ms`;
  const pass = ms < limitMs;
  const icon = pass ? "✓" : "✗";
  return `${icon}  ${label}  (limit ${limitMs} ms)`;
}

function run() {
  console.log("=".repeat(52));
  console.log(" Salmon Allocation — Performance Benchmark");
  console.log("=".repeat(52));

  // ── 1. Order generation ───────────────────────────────
  const t0 = performance.now();
  const generated = generateOrders(ORDER_COUNT);
  const genMs = performance.now() - t0;

  const orders = arg ? generated : baseOrders;

  console.log(`generateOrders(${ORDER_COUNT.toLocaleString()})`);
  console.log(`  Generated : ${generated.length.toLocaleString()} sub-orders`);
  console.log(`  Time      : ${genMs.toFixed(2)} ms`);
  console.log();

  // ── 2. Allocation engine ──────────────────────────────
  const t1 = performance.now();
  const results = allocate(orders, stocks, prices, customers);
  const allocMs = performance.now() - t1;

  console.log(`allocate(${orders.length.toLocaleString()} orders)`);
  console.log(`  Results   : ${results.length.toLocaleString()} rows`);
  console.log(`  Time      : ${fmt(allocMs, 1_000)}`);
  console.log();

  // ── Summary ───────────────────────────────────────────
  const totalMs = genMs + allocMs;
  console.log("─".repeat(52));
  console.log(`Critical path total : ${fmt(totalMs, 2_000)}`);
  console.log("─".repeat(52));

  if (allocMs >= 1_000 || totalMs >= 2_000) {
    console.error("\nOne or more targets FAILED — see above.");
    process.exit(1);
  }

  console.log("\nAll targets PASSED.");
}

run();
