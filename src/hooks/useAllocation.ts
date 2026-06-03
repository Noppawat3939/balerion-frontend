import { useEffect, useMemo, useState } from "react";

import { allocate } from "@/lib/allocation-engine";
import {
  computeCustomersAfterAllocation,
  computeRemainingStocks,
} from "@/lib/allocation-view-helpers";
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

interface UseAllocationReturn {
  isLoading: boolean;
  allocationResults: AllocationResult[];
  stocks: Stock[];
  customers: Customer[];
  totalOrders: number;
  allocated: number;
  pending: number;
  updateAllocatedQty: (subOrderId: string, newQty: number) => void;
  updateCreditLimit: (customerId: string, newLimit: number) => void;
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

  const totalOrders = allocationResults.length;

  const allocated = allocationResults.filter(
    (r) => r.status === AllocationStatus.FULLY_ALLOCATED,
  ).length;

  const pending = allocationResults.filter(
    (r) => r.status !== AllocationStatus.FULLY_ALLOCATED,
  ).length;

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
        const totalPrice = newQty * r.unitPrice;
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

  return {
    allocated,
    allocationResults,
    customers,
    isLoading,
    pending,
    stocks,
    totalOrders,
    updateAllocatedQty,
    updateCreditLimit,
  };
}
