import { PageHeader } from "@/components/layout/PageHeader";
import { AllocationSummaryDashboard } from "@/components/panels/AllocationSummaryDashboard";
import { AllocationTable } from "@/components/panels/AllocationTable";
import { AllocationTableSkeleton } from "@/components/panels/AllocationTableSkeleton";
import { CreditSummaryPanel } from "@/components/panels/CreditSummaryPanel";
import { StockSummaryPanel } from "@/components/panels/StockSummaryPanel";
import { WhatIfModal } from "@/components/panels/WhatIfModal";
import { useAllocation } from "@/hooks/useAllocation";
import { useWhatIf } from "@/hooks/useWhatIf";

function App() {
  const {
    isLoading,
    allocationResults,
    stocks,
    customers,
    totalOrders,
    allocated,
    pending,
    summaryStats,
    updateAllocatedQty,
    updateCreditLimit,
    resetAndReallocate,
    applyExternalResults,
  } = useAllocation();

  const whatIf = useWhatIf();

  return (
    <div className="h-screen flex flex-col bg-gray-50 min-w-7xl">
      <PageHeader
        totalOrders={totalOrders}
        allocated={allocated}
        pending={pending}
        allocationResults={allocationResults}
        onReset={resetAndReallocate}
        onOpenWhatIf={whatIf.openWhatIf}
      />
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col p-6 gap-3">
          {isLoading ? (
            <AllocationTableSkeleton />
          ) : (
            <>
              <div className="max-h-[40vh] shrink-0 overflow-auto">
                <AllocationSummaryDashboard stats={summaryStats} customers={customers} />
              </div>
              <div className="flex-1 min-h-0">
                <AllocationTable
                  results={allocationResults}
                  customers={customers}
                  stocks={stocks}
                  onUpdateAllocatedQty={updateAllocatedQty}
                />
              </div>
            </>
          )}
        </main>

        <aside className="w-72 border-l bg-white p-4 flex flex-col gap-5 shrink-0 overflow-y-auto">
          <StockSummaryPanel stocks={stocks} />
          <div className="border-t border-gray-100" />
          <CreditSummaryPanel
            customers={customers}
            onEditCreditLimit={updateCreditLimit}
          />
        </aside>
      </div>

      <WhatIfModal
        open={whatIf.isOpen}
        stockDeltas={whatIf.stockDeltas}
        creditOverrides={whatIf.creditOverrides}
        extraOrders={whatIf.extraOrders}
        simResults={whatIf.simResults}
        diffs={whatIf.diffs}
        simSummary={whatIf.simSummary}
        currentResults={allocationResults}
        currentCustomers={customers}
        onSetStockDelta={whatIf.setStockDelta}
        onSetCreditOverride={whatIf.setCreditOverride}
        onAddExtraOrder={whatIf.addExtraOrder}
        onRemoveExtraOrder={whatIf.removeExtraOrder}
        onSimulate={whatIf.simulate}
        onApply={() => {
          whatIf.applySimulation(applyExternalResults);
        }}
        onDiscard={whatIf.discardSimulation}
      />
    </div>
  );
}

export default App;
