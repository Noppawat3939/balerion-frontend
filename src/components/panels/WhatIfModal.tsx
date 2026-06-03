import { useState } from "react"
import { Plus, Trash2, FlaskConical, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { stocks as initialStocks } from "@/mock/stocks"
import { customers as initialCustomers } from "@/mock/customers"
import type { WhatIfDiff, WhatIfExtraOrder, WhatIfSimSummary } from "@/hooks/useWhatIf"
import type { AllocationResult, Customer, OrderType } from "@/types/mock.type"

const ORDER_TYPES: OrderType[] = ["EMERGENCY", "OVERDUE", "DAILY"]
const ITEMS = ["Item-1", "Item-2"]
const WAREHOUSES = ["WH-000", "WH-001", "WH-002", "WH-003"]
const SUPPLIERS = ["SP-000", "SP-001", "SP-002"]

type Tab = "config" | "results"

interface WhatIfModalProps {
  open: boolean
  stockDeltas: Record<string, number>
  creditOverrides: Record<string, number>
  extraOrders: WhatIfExtraOrder[]
  simResults: AllocationResult[] | null
  diffs: WhatIfDiff[]
  simSummary: WhatIfSimSummary | null
  currentResults: AllocationResult[]
  currentCustomers: Customer[]
  onSetStockDelta: (key: string, delta: number) => void
  onSetCreditOverride: (customerId: string, limit: number) => void
  onAddExtraOrder: (order: WhatIfExtraOrder) => void
  onRemoveExtraOrder: (tempId: string) => void
  onSimulate: (currentResults: AllocationResult[], currentCustomers: Customer[]) => void
  onApply: (results: AllocationResult[], creditOverrides: Record<string, number>) => void
  onDiscard: () => void
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-gray-400 text-xs">—</span>
  const cls = delta > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
  return <span className={`text-xs ${cls}`}>{delta > 0 ? `+${delta}` : delta}</span>
}

function SummaryBar({ summary }: { summary: WhatIfSimSummary }) {
  const totalColor = summary.deltaTotal > 0 ? "text-green-700" : summary.deltaTotal < 0 ? "text-red-600" : "text-gray-500"
  const rateColor = summary.deltaFulfillment > 0 ? "text-green-700" : summary.deltaFulfillment < 0 ? "text-red-600" : "text-gray-500"

  return (
    <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Allocated ก่อน:</span>
        <span className="font-medium">{summary.beforeTotal.toLocaleString()}</span>
        <span className="text-gray-300">→</span>
        <span className="font-medium">{summary.afterTotal.toLocaleString()}</span>
        <span className={`font-bold text-xs ${totalColor}`}>
          ({summary.deltaTotal >= 0 ? "+" : ""}{summary.deltaTotal.toLocaleString()})
        </span>
      </div>
      <div className="w-px bg-gray-200" />
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Fulfillment:</span>
        <span className="font-medium">{summary.beforeFulfillment}%</span>
        <span className="text-gray-300">→</span>
        <span className="font-medium">{summary.afterFulfillment}%</span>
        <span className={`font-bold text-xs ${rateColor}`}>
          ({summary.deltaFulfillment >= 0 ? "+" : ""}{summary.deltaFulfillment}%)
        </span>
      </div>
    </div>
  )
}

export function WhatIfModal({
  open,
  stockDeltas,
  creditOverrides,
  extraOrders,
  simResults,
  diffs,
  simSummary,
  currentResults,
  currentCustomers,
  onSetStockDelta,
  onSetCreditOverride,
  onAddExtraOrder,
  onRemoveExtraOrder,
  onSimulate,
  onApply,
  onDiscard,
}: WhatIfModalProps) {
  const [tab, setTab] = useState<Tab>("config")
  const [newOrder, setNewOrder] = useState<Partial<WhatIfExtraOrder>>({
    type: "DAILY",
    itemId: "Item-1",
    warehouseId: "WH-000",
    supplierId: "SP-000",
    customerId: initialCustomers[0]?.customerId ?? "CT-0001",
    requestQty: 100,
  })

  function handleAddOrder() {
    if (!newOrder.itemId || !newOrder.requestQty || !newOrder.customerId) return
    onAddExtraOrder({
      tempId: `tmp-${Date.now()}`,
      itemId: newOrder.itemId!,
      warehouseId: newOrder.warehouseId ?? "WH-000",
      supplierId: newOrder.supplierId ?? "SP-000",
      requestQty: newOrder.requestQty!,
      type: newOrder.type ?? "DAILY",
      customerId: newOrder.customerId!,
    })
  }

  const hasChanges =
    Object.values(stockDeltas).some((d) => d !== 0) ||
    Object.keys(creditOverrides).length > 0 ||
    extraOrders.length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDiscard() }}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              <DialogTitle className="text-base">What-If Simulation</DialogTitle>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTab("config")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab === "config" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                Configuration
              </button>
              <button
                type="button"
                onClick={() => setTab("results")}
                disabled={!simResults}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${tab === "results" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                Results {simResults && <span className="ml-1 text-purple-500">({diffs.length})</span>}
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
          {tab === "config" && (
            <>
              {/* Stock Adjustments */}
              <section>
                <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Stock Adjustments</h3>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Warehouse</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Supplier</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Item</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Stock ปัจจุบัน</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">เพิ่ม/ลด</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">จะเป็น</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {initialStocks.map((s) => {
                        const key = `${s.warehouseId}|${s.supplierId}|${s.itemId}`
                        const delta = stockDeltas[key] ?? 0
                        const projected = Math.max(0, s.availableStock + delta)
                        return (
                          <tr key={key} className={delta !== 0 ? "bg-purple-50" : ""}>
                            <td className="px-3 py-1.5 font-mono text-gray-700">{s.warehouseId}</td>
                            <td className="px-3 py-1.5 font-mono text-gray-700">{s.supplierId}</td>
                            <td className="px-3 py-1.5 text-gray-700">{s.itemId}</td>
                            <td className="px-3 py-1.5 text-right text-gray-700">{s.availableStock.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-center">
                              <input
                                type="number"
                                value={delta === 0 ? "" : delta}
                                placeholder="0"
                                onChange={(e) => onSetStockDelta(key, Number(e.target.value) || 0)}
                                className="w-20 text-center border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                              />
                            </td>
                            <td className={`px-3 py-1.5 text-right font-medium ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-gray-700"}`}>
                              {projected.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Credit Limit Adjustments */}
              <section>
                <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Credit Limit Adjustments</h3>
                <div className="space-y-2">
                  {currentCustomers.map((c) => {
                    const override = creditOverrides[c.customerId]
                    return (
                      <div key={c.customerId} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${override !== undefined ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-white"}`}>
                        <span className="text-xs text-gray-700 flex-1 font-medium">{c.name}</span>
                        <span className="text-xs text-gray-400">ปัจจุบัน: {formatCurrency(c.creditLimit)}</span>
                        <input
                          type="number"
                          min={0}
                          placeholder={String(c.creditLimit)}
                          value={override ?? ""}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            if (e.target.value === "") {
                              onSetCreditOverride(c.customerId, c.creditLimit)
                            } else {
                              onSetCreditOverride(c.customerId, v)
                            }
                          }}
                          className="w-32 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        {override !== undefined && (
                          <span className={`text-xs font-medium ${override > c.creditLimit ? "text-green-600" : override < c.creditLimit ? "text-red-500" : "text-gray-500"}`}>
                            {formatCurrency(override)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Extra Orders */}
              <section>
                <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Extra Orders (จำลอง)</h3>
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                  <select value={newOrder.itemId} onChange={(e) => setNewOrder((p) => ({ ...p, itemId: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {ITEMS.map((i) => <option key={i}>{i}</option>)}
                  </select>
                  <select value={newOrder.warehouseId} onChange={(e) => setNewOrder((p) => ({ ...p, warehouseId: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
                  </select>
                  <select value={newOrder.supplierId} onChange={(e) => setNewOrder((p) => ({ ...p, supplierId: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {SUPPLIERS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <select value={newOrder.type} onChange={(e) => setNewOrder((p) => ({ ...p, type: e.target.value as OrderType }))} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {ORDER_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <select value={newOrder.customerId} onChange={(e) => setNewOrder((p) => ({ ...p, customerId: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {initialCustomers.map((c) => <option key={c.customerId} value={c.customerId}>{c.customerId}</option>)}
                  </select>
                  <input type="number" min={1} value={newOrder.requestQty ?? ""} placeholder="Qty" onChange={(e) => setNewOrder((p) => ({ ...p, requestQty: Number(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  <Button type="button" size="sm" onClick={handleAddOrder} className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7">
                    <Plus className="h-3 w-3 mr-1" /> เพิ่ม
                  </Button>
                </div>
                {extraOrders.length > 0 && (
                  <div className="space-y-1">
                    {extraOrders.map((eo) => (
                      <div key={eo.tempId} className="flex items-center gap-2 text-xs bg-purple-50 border border-purple-200 rounded px-3 py-1.5">
                        <span className="font-mono text-purple-700">{eo.itemId}</span>
                        <span className="text-gray-400">{eo.warehouseId} / {eo.supplierId}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${eo.type === "EMERGENCY" ? "bg-red-100 text-red-700" : eo.type === "OVERDUE" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>{eo.type}</span>
                        <span className="text-gray-600">Qty: {eo.requestQty}</span>
                        <span className="text-gray-400">{eo.customerId}</span>
                        <button type="button" onClick={() => onRemoveExtraOrder(eo.tempId)} className="ml-auto text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {tab === "results" && simResults && (
            <>
              {simSummary && <SummaryBar summary={simSummary} />}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Sub Order ID</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Item</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">WH / Supplier</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Req Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">ก่อน</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">หลัง</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600">+/-</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {diffs.map((d) => {
                      const rowCls = d.diff > 0
                        ? "bg-green-50"
                        : d.diff < 0
                          ? "bg-red-50"
                          : d.isExtra
                            ? "bg-purple-50"
                            : ""
                      return (
                        <tr key={d.subOrderId} className={rowCls}>
                          <td className="px-3 py-1.5 font-mono text-gray-700">
                            {d.isExtra && <span className="inline-block mr-1 text-purple-500 font-bold">✦</span>}
                            {d.subOrderId}
                          </td>
                          <td className="px-3 py-1.5 text-gray-700">{d.itemId}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-600">{d.resolvedWarehouseId} / {d.resolvedSupplierId}</td>
                          <td className="px-3 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${d.type === "EMERGENCY" ? "bg-red-100 text-red-700" : d.type === "OVERDUE" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                              {d.type}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right text-gray-600">{d.requestQty}</td>
                          <td className="px-3 py-1.5 text-right text-gray-700">{d.isExtra ? "—" : d.beforeAllocated}</td>
                          <td className="px-3 py-1.5 text-right font-medium text-gray-700">{d.afterAllocated}</td>
                          <td className="px-3 py-1.5 text-center"><DeltaBadge delta={d.diff} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block border border-green-300" /> ได้มากขึ้น</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block border border-red-300" /> ได้น้อยลง</span>
                <span className="flex items-center gap-1"><span className="text-purple-500 font-bold">✦</span> Extra order (จำลอง)</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <Button
            type="button"
            onClick={() => { onSimulate(currentResults, currentCustomers); setTab("results") }}
            disabled={!hasChanges}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            size="sm"
          >
            <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
            Simulate
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDiscard}
              className="text-xs"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!simResults}
              onClick={() => onApply(simResults!, {})}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
