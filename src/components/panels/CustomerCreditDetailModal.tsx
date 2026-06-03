import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";
import type { Customer } from "@/types/mock.type";

interface CustomerCreditDetailModalProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function creditBarColor(pct: number) {
  if (pct > 90) return "bg-red-500";
  if (pct > 70) return "bg-yellow-400";
  return "bg-green-500";
}

export function CustomerCreditDetailModal({
  customer,
  open,
  onOpenChange,
}: CustomerCreditDetailModalProps) {
  if (!customer) return null;

  const usedPct =
    customer.creditLimit > 0
      ? (customer.usedCredit / customer.creditLimit) * 100
      : 0;
  const remaining = customer.creditLimit - customer.usedCredit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">ข้อมูล Credit ลูกค้า</DialogTitle>
        </DialogHeader>

        <div className="mt-1 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-0.5">
            <p className="text-xs font-mono text-gray-400">
              {customer.customerId}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {customer.name}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500">การใช้ Credit</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-gray-700">
                  {Math.round(usedPct)}%
                </span>
              </div>
            </div>
            <Progress
              value={Math.min(usedPct, 100)}
              className="h-2"
              indicatorClassName={creditBarColor(usedPct)}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-3">
              <p className="text-xs text-gray-400 mb-1">วงเงินทั้งหมด (฿)</p>
              <p className="text-sm font-bold text-gray-700 tabular-nums">
                {formatNumber(customer.creditLimit)}
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 border border-orange-100 px-2 py-3">
              <p className="text-xs text-orange-400 mb-1">ใช้แล้ว (฿)</p>
              <p className="text-sm font-bold text-orange-700 tabular-nums">
                {formatNumber(customer.usedCredit)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-3">
              <p className="text-xs text-blue-400 mb-1">คงเหลือ (฿)</p>
              <p className="text-sm font-bold text-blue-700 tabular-nums">
                {formatNumber(remaining)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
