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
  liveStocks: Stock[];
  liveCustomers: Customer[];
  totalOrders: number;
  allocated: number;
  pending: number;
  updateAllocatedQty: (subOrderId: string, newQty: number) => void;
}

export function useAllocation(): UseAllocationReturn {
  const [allocationResults, setAllocationResults] = useState<
    AllocationResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // defer allocate() so React paints the skeleton before the computation runs
    const id = setTimeout(() => {
      const results = allocate(orders, initialStocks, prices, initialCustomers);

      setAllocationResults(results);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const liveStocks = useMemo(
    () => computeRemainingStocks(allocationResults),
    [allocationResults],
  );
  const liveCustomers = useMemo(
    () => computeCustomersAfterAllocation(allocationResults),
    [allocationResults],
  );

  const totalOrders = allocationResults.length;
  const allocated = allocationResults.filter(
    (r) => r.status === AllocationStatus.FULLY_ALLOCATED,
  ).length;
  const pending = allocationResults.filter(
    (r) => r.status !== AllocationStatus.FULLY_ALLOCATED,
  ).length;

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
    isLoading,
    allocationResults,
    liveStocks,
    liveCustomers,
    totalOrders,
    allocated,
    pending,
    updateAllocatedQty,
  };
}
