import { useMemo, useState } from "react";

import { allocate } from "@/lib/allocation-engine";
import { orders as allOrders } from "@/mock/orders";
import { prices } from "@/mock/prices";
import { stocks as initialStocks } from "@/mock/stocks";
import {
  type AllocationResult,
  type Customer,
  type OrderType,
} from "@/types/mock.type";

export interface WhatIfExtraOrder {
  tempId: string;
  itemId: string;
  warehouseId: string;
  supplierId: string;
  requestQty: number;
  type: OrderType;
  customerId: string;
}

export interface WhatIfDiff {
  subOrderId: string;
  itemId: string;
  resolvedWarehouseId: string;
  resolvedSupplierId: string;
  type: OrderType;
  requestQty: number;
  customerId: string;
  beforeAllocated: number;
  afterAllocated: number;
  diff: number;
  isExtra: boolean;
}

export interface WhatIfSimSummary {
  beforeTotal: number;
  afterTotal: number;
  beforeRequested: number;
  afterRequested: number;
  beforeFulfillment: number;
  afterFulfillment: number;
  deltaTotal: number;
  deltaFulfillment: number;
}

interface UseWhatIfReturn {
  isOpen: boolean;
  stockDeltas: Record<string, number>;
  creditOverrides: Record<string, number>;
  extraOrders: WhatIfExtraOrder[];
  simResults: AllocationResult[] | null;
  diffs: WhatIfDiff[];
  simSummary: WhatIfSimSummary | null;
  openWhatIf: () => void;
  closeWhatIf: () => void;
  setStockDelta: (key: string, delta: number) => void;
  setCreditOverride: (customerId: string, limit: number) => void;
  addExtraOrder: (order: WhatIfExtraOrder) => void;
  removeExtraOrder: (tempId: string) => void;
  simulate: (currentResults: AllocationResult[], currentCustomers: Customer[]) => void;
  applySimulation: (onApply: (results: AllocationResult[], creditOverrides: Record<string, number>) => void) => void;
  discardSimulation: () => void;
}

export function useWhatIf(): UseWhatIfReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [stockDeltas, setStockDeltas] = useState<Record<string, number>>({});
  const [creditOverrides, setCreditOverrides] = useState<Record<string, number>>({});
  const [extraOrders, setExtraOrders] = useState<WhatIfExtraOrder[]>([]);
  const [simResults, setSimResults] = useState<AllocationResult[] | null>(null);
  const [currentResultsSnapshot, setCurrentResultsSnapshot] = useState<AllocationResult[]>([]);

  const { diffs, simSummary } = useMemo(() => {
    if (!simResults) return { diffs: [], simSummary: null };

    const beforeMap = new Map<string, AllocationResult>();
    for (const r of currentResultsSnapshot) {
      beforeMap.set(r.subOrderId, r);
    }

    const afterMap = new Map<string, AllocationResult>();
    for (const r of simResults) {
      afterMap.set(r.subOrderId, r);
    }

    const allIds = new Set([...beforeMap.keys(), ...afterMap.keys()]);
    const diffs: WhatIfDiff[] = [];

    for (const id of allIds) {
      const before = beforeMap.get(id);
      const after = afterMap.get(id);
      const isExtra = id.startsWith("WHATIF-");
      const beforeAllocated = before?.allocatedQty ?? 0;
      const afterAllocated = after?.allocatedQty ?? 0;
      diffs.push({
        subOrderId: id,
        itemId: (after ?? before)!.itemId,
        resolvedWarehouseId: (after ?? before)!.resolvedWarehouseId,
        resolvedSupplierId: (after ?? before)!.resolvedSupplierId,
        type: (after ?? before)!.type,
        requestQty: (after ?? before)!.requestQty,
        customerId: (after ?? before)!.customerId,
        beforeAllocated,
        afterAllocated,
        diff: afterAllocated - beforeAllocated,
        isExtra,
      });
    }

    const beforeRequested = currentResultsSnapshot.reduce((s, r) => s + r.requestQty, 0);
    const afterRequested = simResults.reduce((s, r) => s + r.requestQty, 0);
    const beforeTotal = currentResultsSnapshot.reduce((s, r) => s + r.allocatedQty, 0);
    const afterTotal = simResults.reduce((s, r) => s + r.allocatedQty, 0);
    const beforeFulfillment = beforeRequested > 0
      ? Math.round((beforeTotal / beforeRequested) * 1000) / 10
      : 0;
    const afterFulfillment = afterRequested > 0
      ? Math.round((afterTotal / afterRequested) * 1000) / 10
      : 0;

    const simSummary: WhatIfSimSummary = {
      beforeTotal,
      afterTotal,
      beforeRequested,
      afterRequested,
      beforeFulfillment,
      afterFulfillment,
      deltaTotal: afterTotal - beforeTotal,
      deltaFulfillment: Math.round((afterFulfillment - beforeFulfillment) * 10) / 10,
    };

    return { diffs, simSummary };
  }, [simResults, currentResultsSnapshot]);

  function openWhatIf() {
    setIsOpen(true);
  }

  function closeWhatIf() {
    setIsOpen(false);
    setSimResults(null);
    setCurrentResultsSnapshot([]);
    setStockDeltas({});
    setCreditOverrides({});
    setExtraOrders([]);
  }

  function setStockDelta(key: string, delta: number) {
    setStockDeltas((prev) => ({ ...prev, [key]: delta }));
  }

  function setCreditOverride(customerId: string, limit: number) {
    setCreditOverrides((prev) => ({ ...prev, [customerId]: limit }));
  }

  function addExtraOrder(order: WhatIfExtraOrder) {
    setExtraOrders((prev) => [...prev, order]);
  }

  function removeExtraOrder(tempId: string) {
    setExtraOrders((prev) => prev.filter((o) => o.tempId !== tempId));
  }

  function simulate(currentResults: AllocationResult[], currentCustomers: Customer[]) {
    setCurrentResultsSnapshot(currentResults);

    const simStocks = initialStocks.map((s) => {
      const key = `${s.warehouseId}|${s.supplierId}|${s.itemId}`;
      return { ...s, availableStock: Math.max(0, s.availableStock + (stockDeltas[key] ?? 0)) };
    });

    const simCustomers = currentCustomers.map((c) => ({
      ...c,
      creditLimit: creditOverrides[c.customerId] ?? c.creditLimit,
      usedCredit: 0,
    }));

    const simExtraOrders = extraOrders.map((eo, i) => ({
      orderId: `WHATIF-${String(i + 1).padStart(3, "0")}`,
      subOrderId: `WHATIF-${String(i + 1).padStart(3, "0")}-001`,
      itemId: eo.itemId,
      warehouseId: eo.warehouseId,
      supplierId: eo.supplierId,
      requestQty: eo.requestQty,
      type: eo.type,
      createDate: new Date().toISOString().slice(0, 10),
      customerId: eo.customerId,
      remark: "What-If",
    }));

    const results = allocate([...allOrders, ...simExtraOrders], simStocks, prices, simCustomers);
    setSimResults(results);
  }

  function applySimulation(
    onApply: (results: AllocationResult[], creditOverrides: Record<string, number>) => void,
  ) {
    if (!simResults) return;
    const realResults = simResults.filter((r) => !r.subOrderId.startsWith("WHATIF-"));
    onApply(realResults, creditOverrides);
    closeWhatIf();
  }

  function discardSimulation() {
    closeWhatIf();
  }

  return {
    isOpen,
    stockDeltas,
    creditOverrides,
    extraOrders,
    simResults,
    diffs,
    simSummary,
    openWhatIf,
    closeWhatIf,
    setStockDelta,
    setCreditOverride,
    addExtraOrder,
    removeExtraOrder,
    simulate,
    applySimulation,
    discardSimulation,
  };
}
