import { Pencil, Users, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency } from "@/lib/utils";
import type { Customer } from "@/types/mock.type";

interface CustomerManagementModalProps {
  customers: Customer[];
  onEditCreditLimit: (customerId: string, newLimit: number) => void;
}

function creditBarColor(pct: number) {
  if (pct > 90) return "bg-red-500";
  if (pct > 70) return "bg-yellow-400";
  return "bg-green-500";
}

function creditBadgeStyle(pct: number): string {
  if (pct > 90) return "text-red-700 bg-red-50 border border-red-200";
  if (pct > 70) return "text-yellow-700 bg-yellow-50 border border-yellow-200";
  return "text-green-700 bg-green-50 border border-green-200";
}

interface CustomerRowProps {
  customer: Customer;
  onSave: (customerId: string, newLimit: number) => void;
}

function CustomerRow({ customer, onSave }: CustomerRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(customer.creditLimit));
  const [error, setError] = useState<string | null>(null);

  const usedPct =
    customer.creditLimit > 0
      ? (customer.usedCredit / customer.creditLimit) * 100
      : 0;

  function validate(val: string): string | null {
    const n = Number(val);
    if (val === "" || isNaN(n) || n < 0) return "ต้องเป็นจำนวนเต็ม ≥ 0";
    if (!Number.isInteger(n)) return "ต้องเป็นจำนวนเต็ม";
    if (n < customer.usedCredit)
      return `ต้องไม่น้อยกว่าที่ใช้ไปแล้ว (${formatCurrency(customer.usedCredit)})`;
    return null;
  }

  function handleEdit() {
    setValue(String(customer.creditLimit));
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setError(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setError(validate(e.target.value));
  }

  function handleConfirm() {
    const err = validate(value);
    if (err) {
      setError(err);
      return;
    }
    onSave(customer.customerId, Number(value));
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") handleCancel();
  }


  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-gray-400 mb-0.5">
            {customer.customerId}
          </p>
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {customer.name}
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${creditBadgeStyle(usedPct)}`}
        >
          {Math.round(usedPct)}%
        </span>
      </div>

      <Progress
        value={Math.min(usedPct, 100)}
        className="h-1.5 mb-3"
        indicatorClassName={creditBarColor(usedPct)}
      />

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="rounded-lg bg-gray-50 px-2 py-2">
          <p className="text-xs text-gray-400 mb-0.5">วงเงิน</p>
          <p className="text-xs font-semibold text-gray-700 tabular-nums">
            {formatCurrency(customer.creditLimit)}
          </p>
        </div>
        <div className="rounded-lg bg-orange-50 px-2 py-2">
          <p className="text-xs text-orange-400 mb-0.5">ใช้แล้ว</p>
          <p className="text-xs font-semibold text-orange-700 tabular-nums">
            {formatCurrency(customer.usedCredit)}
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 px-2 py-2">
          <p className="text-xs text-blue-400 mb-0.5">คงเหลือ</p>
          <p className="text-xs font-semibold text-blue-700 tabular-nums">
            {formatCurrency(customer.creditLimit - customer.usedCredit)}
          </p>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">
            Credit Limit ใหม่ (฿)
          </label>
          <div className="flex gap-2">
            <input
              autoFocus
              type="number"
              min={0}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex-1 rounded-lg border px-3 py-1.5 text-right text-sm tabular-nums outline-none",
                error
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
              )}
            />
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!!error}
              className="shrink-0"
            >
              บันทึก
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="shrink-0 px-2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleEdit}
          >
            <Pencil className="h-3 w-3" />
            แก้ไข Credit Limit
          </Button>
        </div>
      )}
    </div>
  );
}

export function CustomerManagementModal({
  customers,
  onEditCreditLimit,
}: CustomerManagementModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs mt-1"
        >
          <Users className="h-3.5 w-3.5" />
          จัดการ Credit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-gray-500" />
            จัดการ Credit ลูกค้า
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {customers.map((c) => (
            <CustomerRow
              key={c.customerId}
              customer={c}
              onSave={onEditCreditLimit}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
