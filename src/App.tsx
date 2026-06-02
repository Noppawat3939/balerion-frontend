import { useAllocation } from "@/hooks/useAllocation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StockSummaryPanel } from "@/components/panels/StockSummaryPanel";
import { CreditSummaryPanel } from "@/components/panels/CreditSummaryPanel";
import { AllocationTable } from "@/components/panels/AllocationTable";
import { AllocationTableSkeleton } from "@/components/panels/AllocationTableSkeleton";

function App() {
  const {
    isLoading,
    allocationResults,
    liveStocks,
    liveCustomers,
    totalOrders,
    allocated,
    pending,
  } = useAllocation();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <PageHeader
        totalOrders={totalOrders}
        allocated={allocated}
        pending={pending}
      />
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col p-6 gap-3">
          {isLoading ? (
            <AllocationTableSkeleton />
          ) : (
            <AllocationTable
              results={allocationResults}
              customers={liveCustomers}
            />
          )}
        </main>
        <aside className="w-72 border-l bg-white p-4 flex flex-col gap-5 shrink-0">
          <StockSummaryPanel stocks={liveStocks} />
          <div className="border-t border-gray-100" />
          <CreditSummaryPanel customers={liveCustomers} />
        </aside>
      </div>
    </div>
  );
}

export default App;
