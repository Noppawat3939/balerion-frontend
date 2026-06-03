import { PageHeader } from "@/components/layout/PageHeader";
import { AllocationTable } from "@/components/panels/AllocationTable";
import { AllocationTableSkeleton } from "@/components/panels/AllocationTableSkeleton";
import { CreditSummaryPanel } from "@/components/panels/CreditSummaryPanel";
import { StockSummaryPanel } from "@/components/panels/StockSummaryPanel";
import { useAllocation } from "@/hooks/useAllocation";

function App() {
  const {
    isLoading,
    allocationResults,
    liveStocks,
    liveCustomers,
    totalOrders,
    allocated,
    pending,
    updateAllocatedQty,
    updateCreditLimit,
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
              liveStocks={liveStocks}
              onUpdateAllocatedQty={updateAllocatedQty}
            />
          )}
        </main>
        <aside className="w-72 border-l bg-white p-4 flex flex-col gap-5 shrink-0">
          <StockSummaryPanel stocks={liveStocks} />
          <div className="border-t border-gray-100" />
          <CreditSummaryPanel customers={liveCustomers} onEditCreditLimit={updateCreditLimit} />
        </aside>
      </div>
    </div>
  );
}

export default App;
