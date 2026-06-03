import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import type { AllocationSummaryStats } from "@/hooks/useAllocation"
import type { Customer } from "@/types/mock.type"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: "blue" | "green" | "orange" | "purple"
}

function StatCard({ label, value, sub, accent = "blue" }: StatCardProps) {
  const accentMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    orange: "border-orange-200 bg-orange-50",
    purple: "border-purple-200 bg-purple-50",
  }
  const textMap: Record<string, string> = {
    blue: "text-blue-700",
    green: "text-green-700",
    orange: "text-orange-700",
    purple: "text-purple-700",
  }
  return (
    <div className={`rounded-lg border px-3 py-2 flex flex-col gap-0.5 flex-1 min-w-0 ${accentMap[accent]}`}>
      <span className="text-xs text-gray-500 font-medium truncate">{label}</span>
      <span className={`text-lg font-bold leading-tight ${textMap[accent]}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400 truncate">{sub}</span>}
    </div>
  )
}

interface AllocationSummaryDashboardProps {
  stats: AllocationSummaryStats
  customers: Customer[]
}

export function AllocationSummaryDashboard({ stats, customers }: AllocationSummaryDashboardProps) {
  const {
    totalOrders,
    totalRequested,
    totalAllocated,
    fulfillmentRate,
    fullyAllocated,
    partiallyAllocated,
    unallocated,
  } = stats

  const fullPct = totalOrders > 0 ? (fullyAllocated / totalOrders) * 100 : 0
  const partialPct = totalOrders > 0 ? (partiallyAllocated / totalOrders) * 100 : 0
  const unallocPct = totalOrders > 0 ? (unallocated / totalOrders) * 100 : 0

  return (
    <div className="flex gap-2 items-stretch">
      {/* 4 Stat Cards */}
      <div className="flex gap-2 flex-2 min-w-0">
        <StatCard label="Sub-orders" value={totalOrders.toLocaleString()} accent="blue" />
        <StatCard label="ขอรวม (units)" value={totalRequested.toLocaleString()} accent="purple" />
        <StatCard label="จัดสรรได้ (units)" value={totalAllocated.toLocaleString()} accent="green" />
        <StatCard
          label="Fulfillment Rate"
          value={`${fulfillmentRate}%`}
          sub={`${totalAllocated.toLocaleString()} / ${totalRequested.toLocaleString()}`}
          accent={fulfillmentRate >= 90 ? "green" : "orange"}
        />
      </div>

      <div className="w-px bg-gray-200 shrink-0" />

      {/* Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 w-48 shrink-0">
        <h3 className="text-xs font-semibold text-gray-600 mb-1.5">สถานะการจัดสรร</h3>
        {totalOrders > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden mb-2">
            {fullPct > 0 && <div className="bg-green-500" style={{ width: `${fullPct}%` }} />}
            {partialPct > 0 && <div className="bg-orange-400" style={{ width: `${partialPct}%` }} />}
            {unallocPct > 0 && <div className="bg-red-300" style={{ width: `${unallocPct}%` }} />}
          </div>
        )}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-gray-500">ครบ</span>
            </div>
            <span className="text-sm font-bold text-green-600">{fullyAllocated}</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
              <span className="text-xs text-gray-500">บางส่วน</span>
            </div>
            <span className="text-sm font-bold text-orange-500">{partiallyAllocated}</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" />
              <span className="text-xs text-gray-500">ไม่ได้</span>
            </div>
            <span className="text-sm font-bold text-red-500">{unallocated}</span>
          </div>
        </div>
      </div>

      <div className="w-px bg-gray-200 shrink-0" />

      {/* Credit Utilization */}
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 w-64 shrink-0">
        <h3 className="text-xs font-semibold text-gray-600 mb-1.5">วงเงินต่อลูกค้า</h3>
        <div className="space-y-1.5">
          {customers.map((c) => {
            const usedPct = c.creditLimit > 0 ? (c.usedCredit / c.creditLimit) * 100 : 0
            const barColor =
              usedPct > 90 ? "bg-red-500" : usedPct > 70 ? "bg-orange-400" : "bg-green-500"
            const textColor =
              usedPct > 90 ? "text-red-600" : usedPct > 70 ? "text-orange-500" : "text-green-600"
            return (
              <div key={c.customerId}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-gray-700 truncate max-w-36">{c.name}</span>
                  <span className={`text-xs font-bold ml-1 shrink-0 ${textColor}`}>{Math.round(usedPct)}%</span>
                </div>
                <Progress value={Math.min(usedPct, 100)} className="h-1" indicatorClassName={barColor} />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{formatCurrency(c.usedCredit)}</span>
                  <span>/ {formatCurrency(c.creditLimit)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
