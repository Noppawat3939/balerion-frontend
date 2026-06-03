import type { AllocationResult } from "@/types/mock.type"

const STATUS_LABEL: Record<string, string> = {
  FULLY_ALLOCATED: "Fully Allocated",
  PARTIALLY_ALLOCATED: "Partially Allocated",
  UNALLOCATED: "Unallocated",
}

function getFilename(ext: "csv" | "json"): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `salmon_allocation_${date}.${ext}`
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToCSV(results: AllocationResult[]) {
  const headers = [
    "Sub Order ID",
    "Item",
    "Warehouse",
    "Supplier",
    "Type",
    "Request Qty",
    "Allocated Qty",
    "Unit Price (THB)",
    "Total Price (THB)",
    "Customer",
    "Status",
  ]

  const rows = results.map((r) => [
    r.subOrderId,
    r.itemId,
    r.resolvedWarehouseId,
    r.resolvedSupplierId,
    r.type,
    r.requestQty,
    r.allocatedQty,
    r.unitPrice.toFixed(2),
    r.totalPrice.toFixed(2),
    r.customerId,
    STATUS_LABEL[r.status] ?? r.status,
  ])

  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n")

  triggerDownload(csv, getFilename("csv"), "text/csv;charset=utf-8;")
}

export function exportToJSON(results: AllocationResult[]) {
  const data = results.map((r) => ({
    subOrderId: r.subOrderId,
    itemId: r.itemId,
    warehouseId: r.resolvedWarehouseId,
    supplierId: r.resolvedSupplierId,
    type: r.type,
    requestQty: r.requestQty,
    allocatedQty: r.allocatedQty,
    unitPrice: Number(r.unitPrice.toFixed(2)),
    totalPrice: Number(r.totalPrice.toFixed(2)),
    customerId: r.customerId,
    status: r.status,
  }))

  triggerDownload(
    JSON.stringify(data, null, 2),
    getFilename("json"),
    "application/json",
  )
}
