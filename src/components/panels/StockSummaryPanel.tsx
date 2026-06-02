import { Badge } from '@/components/ui/badge'
import type { Stock } from '@/types/mock.type'

interface StockSummaryPanelProps {
  stocks: Stock[]
}

export function StockSummaryPanel({ stocks }: StockSummaryPanelProps) {
  const byWarehouse = stocks.reduce<Record<string, Stock[]>>((acc, s) => {
    if (!acc[s.warehouseId]) acc[s.warehouseId] = []
    acc[s.warehouseId].push(s)
    return acc
  }, {})

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-700 mb-2">Stock คงเหลือ</h2>
      <div className="space-y-2">
        {Object.entries(byWarehouse).map(([whId, whStocks]) => (
          <div key={whId}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {whId}
            </p>
            <div className="space-y-0.5">
              {whStocks.map((s) => {
                const isEmpty = s.availableStock === 0
                const isLow = s.availableStock > 0 && s.availableStock < 50
                const badgeVariant = isEmpty ? 'danger' : isLow ? 'warning' : 'success'
                return (
                  <div
                    key={`${s.supplierId}-${s.itemId}`}
                    className="flex justify-between items-center text-xs px-2 py-1 bg-gray-50 rounded"
                  >
                    <span className="text-gray-600">
                      {s.itemId} / {s.supplierId}
                    </span>
                    <Badge variant={badgeVariant}>
                      {s.availableStock.toLocaleString()}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
