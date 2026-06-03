import { Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  type AllocationResult,
  type Customer,
  type Stock,
} from "@/types/mock.type";

interface ManualAllocationModalProps {
  row: AllocationResult;
  stocks: Stock[];
  customers: Customer[];
  onUpdate: (subOrderId: string, newQty: number) => void;
}

export function ManualAllocationModal({
  row,
  stocks,
  customers,
  onUpdate,
}: ManualAllocationModalProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(row.allocatedQty));
  const [error, setError] = useState<string | null>(null);

  const stockKey = `${row.resolvedWarehouseId}|${row.resolvedSupplierId}|${row.itemId}`;
  const liveStock = stocks.find(
    (s) => `${s.warehouseId}|${s.supplierId}|${s.itemId}` === stockKey,
  );
  const maxByStock = (liveStock?.availableStock ?? 0) + row.allocatedQty;

  const liveCustomer = customers.find((c) => c.customerId === row.customerId);
  const availableCredit = liveCustomer
    ? liveCustomer.creditLimit - liveCustomer.usedCredit + row.totalPrice
    : 0;
  const maxByCredit =
    row.unitPrice > 0 ? Math.floor(availableCredit / row.unitPrice) : 0;

  function validate(val: string): string | null {
    const n = Number(val);
    if (val === "" || !Number.isInteger(n) || n < 0)
      return "ต้องเป็นจำนวนเต็ม ≥ 0";
    if (n > maxByStock)
      return `เกิน stock คงเหลือ (สูงสุด ${maxByStock.toLocaleString()})`;
    if (n > maxByCredit)
      return `เกิน credit คงเหลือ (สูงสุด ${maxByCredit.toLocaleString()})`;
    return null;
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setValue(String(row.allocatedQty));
      setError(null);
    }
    setOpen(next);
  }

  function handleConfirm() {
    const err = validate(value);
    if (err) {
      setError(err);
      return;
    }
    onUpdate(row.subOrderId, Number(value));
    setOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setError(validate(e.target.value));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") setOpen(false);
  }

  const formatCurrency = (n: number) =>
    n.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="แก้ไข qty">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Allocation</DialogTitle>
          <DialogDescription>{row.subOrderId}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Item</span>
            <span className="font-medium text-gray-800">{row.itemId}</span>
            <span className="text-gray-500">Warehouse</span>
            <span className="font-medium text-gray-800">
              {row.resolvedWarehouseId}
            </span>
            <span className="text-gray-500">Supplier</span>
            <span className="font-medium text-gray-800">
              {row.resolvedSupplierId}
            </span>
            <span className="text-gray-500">Request Qty</span>
            <span className="font-medium text-gray-800">
              {row.requestQty.toLocaleString()}
            </span>
            <span className="text-gray-500">Unit Price</span>
            <span className="font-medium text-gray-800">
              ฿{formatCurrency(row.unitPrice)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
            <span className="text-blue-600">Stock คงเหลือ</span>
            <span className="font-semibold text-blue-800">
              {maxByStock.toLocaleString()}
            </span>
            <span className="text-blue-600">Credit คงเหลือ (qty)</span>
            <span className="font-semibold text-blue-800">
              {maxByCredit.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Allocated Qty ใหม่
            </label>
            <input
              autoFocus
              type="number"
              min={0}
              max={Math.min(maxByStock, maxByCredit)}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-right text-sm tabular-nums outline-none",
                error
                  ? "border-red-400 focus:ring-2 focus:ring-red-300"
                  : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200",
              )}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">ยกเลิก</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={!!error}>
            ยืนยัน
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
