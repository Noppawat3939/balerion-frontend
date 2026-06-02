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
}

export function PageHeader({ totalOrders, allocated, pending }: PageHeaderProps) {
  return (
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
        </div>
      </div>
    </header>
  )
}
