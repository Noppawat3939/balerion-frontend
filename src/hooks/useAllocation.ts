import { useEffect, useMemo, useState } from "react";

import { allocate } from "@/lib/allocation-engine";
import {
  computeCustomersAfterAllocation,
  computeRemainingStocks,
} from "@/lib/allocation-view-helpers";
import { bankerRound } from "@/lib/utils";
import { customers as initialCustomers } from "@/mock/customers";
import { orders } from "@/mock/orders";
import { prices } from "@/mock/prices";
import { stocks as initialStocks } from "@/mock/stocks";
import {
  type AllocationResult,
  AllocationStatus,
  type Customer,
  type Stock,
} from "@/types/mock.type";

export interface AllocationSummaryStats {
  totalOrders: number;
  totalRequested: number;
  totalAllocated: number;
  fulfillmentRate: number;
  fullyAllocated: number;
  partiallyAllocated: number;
  unallocated: number;
}

interface UseAllocationReturn {
  isLoading: boolean;
  allocationResults: AllocationResult[];
  stocks: Stock[];
  customers: Customer[];
  totalOrders: number;
  allocated: number;
  pending: number;
  summaryStats: AllocationSummaryStats;
  updateAllocatedQty: (subOrderId: string, newQty: number) => void;
  updateCreditLimit: (customerId: string, newLimit: number) => void;
  resetAndReallocate: () => void;
  applyExternalResults: (results: AllocationResult[], creditOverrides?: Record<string, number>) => void;
}

const CUSTOMER_CREDIT_LIMIT_KEY = "customCreditLimits" as const;

export function useAllocation(): UseAllocationReturn {
  const [allocationResults, setAllocationResults] = useState<
    AllocationResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customCreditLimits, setCustomCreditLimits] = useState<
    Record<string, number>
  >(() => {
    try {
      const stored = sessionStorage.getItem(CUSTOMER_CREDIT_LIMIT_KEY);
      return stored ? (JSON.parse(stored) as Record<string, number>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    // defer allocate() so React paints the skeleton before the computation runs
    const id = setTimeout(() => {
      const results = allocate(orders, initialStocks, prices, initialCustomers);

      setAllocationResults(results);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const stocks = useMemo(
    () => computeRemainingStocks(allocationResults),
    [allocationResults],
  );

  const customers = useMemo(() => {
    const base = computeCustomersAfterAllocation(allocationResults);
    if (Object.keys(customCreditLimits).length === 0) return base;
    return base.map((c) =>
      customCreditLimits[c.customerId] !== undefined
        ? { ...c, creditLimit: customCreditLimits[c.customerId] }
        : c,
    );
  }, [allocationResults, customCreditLimits]);

  const { totalOrders, allocated, pending, summaryStats } = useMemo(() => {
    let allocated = 0;
    let pending = 0;
    let totalRequested = 0;
    let totalAllocated = 0;
    let fullyAllocated = 0;
    let partiallyAllocated = 0;
    let unallocated = 0;
    for (const r of allocationResults) {
      totalRequested += r.requestQty;
      totalAllocated += r.allocatedQty;
      if (r.status === AllocationStatus.FULLY_ALLOCATED) {
        allocated++;
        fullyAllocated++;
      } else if (r.status === AllocationStatus.PARTIALLY_ALLOCATED) {
        pending++;
        partiallyAllocated++;
      } else {
        pending++;
        unallocated++;
      }
    }
    const fulfillmentRate =
      totalRequested > 0
        ? Math.round((totalAllocated / totalRequested) * 100 * 10) / 10
        : 0;
    const summaryStats: AllocationSummaryStats = {
      totalOrders: allocationResults.length,
      totalRequested,
      totalAllocated,
      fulfillmentRate,
      fullyAllocated,
      partiallyAllocated,
      unallocated,
    };
    return {
      totalOrders: allocationResults.length,
      allocated,
      pending,
      summaryStats,
    };
  }, [allocationResults]);

  function updateCreditLimit(customerId: string, newLimit: number) {
    setCustomCreditLimits((prev) => {
      const updated = { ...prev, [customerId]: newLimit };
      sessionStorage.setItem(
        CUSTOMER_CREDIT_LIMIT_KEY,
        JSON.stringify(updated),
      );
      return updated;
    });
  }

  function updateAllocatedQty(subOrderId: string, newQty: number) {
    setAllocationResults((prev) =>
      prev.map((r) => {
        if (r.subOrderId !== subOrderId) return r;
        const totalPrice = bankerRound(newQty * r.unitPrice);
        const status =
          newQty === 0
            ? AllocationStatus.UNALLOCATED
            : newQty < r.requestQty
              ? AllocationStatus.PARTIALLY_ALLOCATED
              : AllocationStatus.FULLY_ALLOCATED;
        return { ...r, allocatedQty: newQty, totalPrice, status };
      }),
    );
  }

  function resetAndReallocate() {
    setIsLoading(true);
    const id = setTimeout(() => {
      const customersForReset = initialCustomers.map((c) => ({
        ...c,
        creditLimit: customCreditLimits[c.customerId] ?? c.creditLimit,
        usedCredit: 0,
      }));
      const results = allocate(orders, initialStocks, prices, customersForReset);
      setAllocationResults(results);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }

  function applyExternalResults(
    results: AllocationResult[],
    creditOverrides?: Record<string, number>,
  ) {
    setAllocationResults(results);
    if (creditOverrides) {
      setCustomCreditLimits((prev) => {
        const updated = { ...prev, ...creditOverrides };
        sessionStorage.setItem(CUSTOMER_CREDIT_LIMIT_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }

  return {
    allocated,
    allocationResults,
    customers,
    isLoading,
    pending,
    stocks,
    summaryStats,
    totalOrders,
    updateAllocatedQty,
    updateCreditLimit,
    resetAndReallocate,
    applyExternalResults,
  };
}
