import { FlaskConical, RefreshCw } from "lucide-react"
import { useState } from "react"

import { ResetConfirmDialog } from "@/components/panels/ResetConfirmDialog"
import { exportToCSV, exportToJSON } from "@/lib/export-helpers"
import type { AllocationResult } from "@/types/mock.type"

interface SummaryBadgeProps {
  label: string
  value: number
  variant: 'default' | 'success' | 'warning'
}

function SummaryBadge({ label, value, variant }: SummaryBadgeProps) {
  const colors: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${colors[variant]}`}>
      <span className="text-xl font-bold leading-tight">{value}</span>
      <span className="text-xs mt-0.5">{label}</span>
    </div>
  )
}

interface PageHeaderProps {
  totalOrders: number
  allocated: number
  pending: number
  allocationResults: AllocationResult[]
  onReset: () => void
  onOpenWhatIf: () => void
}

export function PageHeader({
  totalOrders,
  allocated,
  pending,
  allocationResults,
  onReset,
  onOpenWhatIf,
}: PageHeaderProps) {
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <>
      <header className="border-b bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              ระบบจัดสรรปลาแซลมอน
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Salmon Allocation Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <SummaryBadge label="Orders ทั้งหมด" value={totalOrders} variant="default" />
            <SummaryBadge label="จัดสรรแล้ว" value={allocated} variant="success" />
            <SummaryBadge label="รอดำเนินการ" value={pending} variant="warning" />
            <div className="w-px h-10 bg-gray-200 mx-1" />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => exportToCSV(allocationResults)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => exportToJSON(allocationResults)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Export JSON
              </button>
            </div>
            <div className="w-px h-10 bg-gray-200 mx-1" />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
              <button
                type="button"
                onClick={onOpenWhatIf}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <FlaskConical className="h-3 w-3" /> What-If
              </button>
            </div>
          </div>
        </div>
      </header>

      <ResetConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={onReset}
      />
    </>
  )
}
