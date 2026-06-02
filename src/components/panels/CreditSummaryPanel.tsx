import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import type { Customer } from "@/types/mock.type"

interface CreditSummaryPanelProps {
  customers: Customer[]
}

export function CreditSummaryPanel({ customers }: CreditSummaryPanelProps) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-700 mb-2">วงเงินลูกค้า</h2>
      <div className="space-y-2">
        {customers.map((c) => {
          const remaining = c.creditLimit - c.usedCredit
          const usedPct = c.creditLimit > 0 ? (c.usedCredit / c.creditLimit) * 100 : 0
          const pctBadge = usedPct > 90 ? "danger" : usedPct > 70 ? "warning" : "success"
          const barColor =
            usedPct > 90 ? "bg-red-500" : usedPct > 70 ? "bg-orange-400" : "bg-green-500"

          return (
            <div key={c.customerId} className="p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-800 truncate max-w-36">
                  {c.name}
                </span>
                <Badge variant={pctBadge} className="ml-1 shrink-0 text-xs">
                  {Math.round(usedPct)}%
                </Badge>
              </div>
              <Progress
                value={Math.min(usedPct, 100)}
                className="h-1 mb-1.5"
                indicatorClassName={barColor}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>ใช้: {formatCurrency(c.usedCredit)}</span>
                <span>คงเหลือ: {formatCurrency(remaining)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
