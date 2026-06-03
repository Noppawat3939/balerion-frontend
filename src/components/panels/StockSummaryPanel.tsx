import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { stocks as initialStocks } from "@/mock/stocks";
import type { Stock } from "@/types/mock.type";

interface StockSummaryPanelProps {
  stocks: Stock[];
}

// Static map built once — initial stock never changes at runtime
const initialStockMap = new Map(
  initialStocks.map((s) => [
    `${s.warehouseId}|${s.supplierId}|${s.itemId}`,
    s.availableStock,
  ]),
);

export function StockSummaryPanel({ stocks }: StockSummaryPanelProps) {
  const byWarehouse = stocks.reduce<Record<string, Stock[]>>((acc, s) => {
    if (!acc[s.warehouseId]) acc[s.warehouseId] = [];
    acc[s.warehouseId].push(s);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-700 mb-3">Stock คงเหลือ</h2>
      <div className="space-y-4">
        {Object.entries(byWarehouse).map(([whId, whStocks]) => {
          const totalRemaining = whStocks.reduce(
            (sum, s) => sum + s.availableStock,
            0,
          );
          return (
            <div key={whId}>
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {whId}
                </p>
                <span className="text-xs text-gray-400">
                  {totalRemaining.toLocaleString()} units
                </span>
              </div>
              <div className="space-y-2">
                {whStocks.map((s) => {
                  const key = `${s.warehouseId}|${s.supplierId}|${s.itemId}`;
                  const initial = initialStockMap.get(key) ?? s.availableStock;
                  const remainingPct =
                    initial === 0
                      ? 0
                      : Math.round((s.availableStock / initial) * 100);
                  const isEmpty = s.availableStock === 0;
                  const isLow = !isEmpty && remainingPct < 30;
                  const badgeVariant = isEmpty
                    ? "danger"
                    : isLow
                      ? "warning"
                      : "success";
                  const barColor = isEmpty
                    ? "bg-red-400"
                    : isLow
                      ? "bg-orange-400"
                      : "bg-teal-500";

                  return (
                    <div
                      key={`${s.supplierId}-${s.itemId}`}
                      className="p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">
                          {s.itemId} · {s.supplierId}
                        </span>
                        <Badge variant={badgeVariant} className="text-xs">
                          {remainingPct}%
                        </Badge>
                      </div>
                      <Progress
                        value={remainingPct}
                        className="h-1 mb-1"
                        indicatorClassName={barColor}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>คงเหลือ: {s.availableStock.toLocaleString()}</span>
                        <span className="text-gray-400">
                          / {initial.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
