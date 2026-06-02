import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type {
  AllocationResult,
  Customer,
  OrderType,
  AllocationStatus,
} from "@/types/mock.type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const PAGE_SIZE = 100;

const TYPE_VARIANT: Record<OrderType, BadgeVariant> = {
  EMERGENCY: "emergency",
  OVERDUE: "overdue",
  DAILY: "daily",
};

const STATUS_VARIANT: Record<AllocationStatus, BadgeVariant> = {
  FULLY_ALLOCATED: "success",
  PARTIALLY_ALLOCATED: "warning",
  UNALLOCATED: "danger",
};

const STATUS_LABEL: Record<AllocationStatus, string> = {
  FULLY_ALLOCATED: "fully",
  PARTIALLY_ALLOCATED: "partially",
  UNALLOCATED: "unallocated",
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface AllocationTableProps {
  results: AllocationResult[];
  customers: Customer[];
}

export function AllocationTable({ results, customers }: AllocationTableProps) {
  const [page, setPage] = useState(1);

  const customerMap = new Map(customers.map((c) => [c.customerId, c.name]));

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = results.slice(pageStart, pageStart + PAGE_SIZE);

  const rangeStart = results.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PAGE_SIZE, results.length);

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="rounded-lg border border-gray-200 bg-white flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-xs uppercase tracking-wide">
              <TableHead>Sub Order ID</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Request Qty</TableHead>
              <TableHead className="text-right">Allocated Qty</TableHead>
              <TableHead className="text-right">Unit Price (฿)</TableHead>
              <TableHead className="text-right">Total Price (฿)</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="py-12 text-center text-muted-foreground"
                >
                  ไม่มีข้อมูล allocation
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
                    <Badge variant={TYPE_VARIANT[row.type]}>{row.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-700">
                    {row.requestQty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    <span
                      className={
                        row.allocatedQty === 0
                          ? "text-red-600"
                          : row.allocatedQty < row.requestQty
                            ? "text-orange-600"
                            : "text-gray-900"
                      }
                    >
                      {row.allocatedQty.toLocaleString()}
                    </span>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {results.length === 0
            ? "ไม่มีข้อมูล"
            : `แสดง ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} จาก ${results.length.toLocaleString()} รายการ`}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
            aria-label="หน้าแรก"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="หน้าถัดไป"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="หน้าสุดท้าย"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
