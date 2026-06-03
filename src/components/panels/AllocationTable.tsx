import type { VariantProps } from "class-variance-authority";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ManualAllocationModal } from "@/components/panels/ManualAllocationModal";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { formatDate } from "@/lib/utils";
import {
  type AllocationResult,
  AllocationStatus,
  type Customer,
  type OrderType,
  type Stock,
} from "@/types/mock.type";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const PAGE_SIZE = 100;

const TYPE_VARIANT: Record<OrderType, BadgeVariant> = {
  EMERGENCY: "emergency",
  OVERDUE: "overdue",
  DAILY: "daily",
};

const STATUS_VARIANT: Record<AllocationStatus, BadgeVariant> = {
  [AllocationStatus.FULLY_ALLOCATED]: "success",
  [AllocationStatus.PARTIALLY_ALLOCATED]: "warning",
  [AllocationStatus.UNALLOCATED]: "danger",
};

const STATUS_LABEL: Record<AllocationStatus, string> = {
  [AllocationStatus.FULLY_ALLOCATED]: "fully",
  [AllocationStatus.PARTIALLY_ALLOCATED]: "partially",
  [AllocationStatus.UNALLOCATED]: "unallocated",
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  rangeStart,
  rangeEnd,
  totalResults,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-muted-foreground">
        {totalResults === 0
          ? "ไม่มีข้อมูล"
          : `แสดง ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} จาก ${totalResults.toLocaleString()} รายการ`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="หน้าแรก"
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft />
        </Button>
        <span className="px-3 text-xs text-gray-600">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="หน้าสุดท้าย"
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}

interface AllocationTableProps {
  results: AllocationResult[];
  customers: Customer[];
  stocks: Stock[];
  onUpdateAllocatedQty: (subOrderId: string, newQty: number) => void;
}

const ORDER_TYPES: OrderType[] = ["EMERGENCY", "OVERDUE", "DAILY"];

export function AllocationTable({
  results,
  customers,
  stocks,
  onUpdateAllocatedQty,
}: AllocationTableProps) {
  const [page, setPage] = useState(1);
  const [rawSearch, setRawSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<OrderType>>(new Set());
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const debouncedSearch = useDebounceSearch(rawSearch.trim());

  const customerMap = new Map(customers.map((c) => [c.customerId, c.name]));

  const warehouseOptions = useMemo(
    () => [...new Set(results.map((r) => r.resolvedWarehouseId))].sort(),
    [results],
  );
  const supplierOptions = useMemo(
    () => [...new Set(results.map((r) => r.resolvedSupplierId))].sort(),
    [results],
  );
  const customerOptions = useMemo(
    () => [...new Set(results.map((r) => r.customerId))].sort(),
    [results],
  );

  const hasActiveFilters =
    rawSearch !== "" ||
    selectedTypes.size > 0 ||
    selectedCustomerId !== "" ||
    selectedWarehouseId !== "" ||
    selectedSupplierId !== "";

  const filteredResults = useMemo(() => {
    if (!hasActiveFilters) return results;

    const q = debouncedSearch.toLowerCase();

    return results.filter((r) => {
      if (q && !r.orderId.includes(q)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(r.type)) return false;
      if (selectedCustomerId && r.customerId !== selectedCustomerId)
        return false;
      if (selectedWarehouseId && r.resolvedWarehouseId !== selectedWarehouseId)
        return false;
      if (selectedSupplierId && r.resolvedSupplierId !== selectedSupplierId)
        return false;
      return true;
    });
  }, [
    hasActiveFilters,
    results,
    debouncedSearch,
    selectedTypes,
    selectedCustomerId,
    selectedWarehouseId,
    selectedSupplierId,
  ]);

  function clearAllFilters() {
    setRawSearch("");
    setSelectedTypes(new Set());
    setSelectedCustomerId("");
    setSelectedWarehouseId("");
    setSelectedSupplierId("");
    setPage(1);
  }

  function toggleType(type: OrderType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredResults.slice(pageStart, pageStart + PAGE_SIZE);

  const rangeStart = filteredResults.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PAGE_SIZE, filteredResults.length);

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหา Order ID หรือ Sub Order ID…"
            value={rawSearch}
            onChange={(e) => {
              setRawSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-gray-400"
          />
          {rawSearch && (
            <button
              onClick={() => setRawSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="ล้างการค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type multi-select toggles */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">Type:</span>
            {ORDER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedTypes.has(type)
                    ? type === "EMERGENCY"
                      ? "bg-red-100 border-red-400 text-red-700"
                      : type === "OVERDUE"
                        ? "bg-orange-100 border-orange-400 text-orange-700"
                        : "bg-green-100 border-green-400 text-green-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                {type.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200" />

          {/* Customer filter */}
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              setSelectedCustomerId(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ลูกค้าทั้งหมด</option>
            {customerOptions.map((id) => (
              <option key={id} value={id}>
                {customerMap.get(id) ?? id}
              </option>
            ))}
          </select>

          {/* Warehouse filter */}
          <select
            value={selectedWarehouseId}
            onChange={(e) => {
              setSelectedWarehouseId(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Warehouse ทั้งหมด</option>
            {warehouseOptions.map((wh) => (
              <option key={wh} value={wh}>
                {wh}
              </option>
            ))}
          </select>

          {/* Supplier filter */}
          <select
            value={selectedSupplierId}
            onChange={(e) => {
              setSelectedSupplierId(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Supplier ทั้งหมด</option>
            {supplierOptions.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          {/* Clear all filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-7 px-2 text-gray-500 hover:text-gray-800"
            >
              <X className="h-3 w-3 mr-1" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="text-xs tracking-wide">
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Sub Order ID
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Item
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Warehouse
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Supplier
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Type
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 text-right">
                Request Qty
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 text-right">
                Allocated Qty
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 text-right">
                Unit Price (฿)
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 text-right">
                Total Price (฿)
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Customer
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Status
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-gray-50 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Created date
              </TableHead>
              <TableHead className="w-12 sticky top-0 right-0 z-20 bg-gray-50 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08),0_2px_4px_-1px_rgba(0,0,0,0.08)]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="py-12 text-center text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "ไม่พบรายการที่ตรงกับการค้นหา / ตัวกรอง"
                    : "ไม่มีข้อมูล allocation"}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.subOrderId}>
                  <TableCell className="font-mono text-xs text-gray-700">
                    {row.subOrderId}
                  </TableCell>
                  <TableCell className="text-gray-700">{row.itemId}</TableCell>
                  <TableCell className="text-gray-700">
                    {row.resolvedWarehouseId}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {row.resolvedSupplierId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="lowercase"
                      variant={TYPE_VARIANT[row.type]}
                    >
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-700">
                    {row.requestQty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.allocatedQty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-700">
                    {formatCurrency(row.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-700">
                    {formatCurrency(row.totalPrice)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-700">
                    {customerMap.get(row.customerId) ?? row.customerId}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status]}>
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-700">
                    {formatDate(row.createDate)}
                  </TableCell>
                  <TableCell className="sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    <ManualAllocationModal
                      row={row}
                      stocks={stocks}
                      customers={customers}
                      onUpdate={onUpdateAllocatedQty}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalResults={results.length}
        onPageChange={setPage}
      />
    </div>
  );
}
