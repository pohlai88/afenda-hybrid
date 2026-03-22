"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../primitives/table";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "../lib/utils";

export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key] || "").toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });
  }, [data, filters]);

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn] as string | number | Date;
      const bValue = b[sortColumn] as string | number | Date;

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const paginatedData = React.useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id}>
                  <div className="flex flex-col gap-2">
                    <button
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        column.sortable && "cursor-pointer hover:text-foreground"
                      )}
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      {column.header}
                      {column.sortable && sortColumn === column.id && (
                        <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                    {column.filterable && (
                      <Input
                        placeholder={`Filter ${column.header.toLowerCase()}...`}
                        value={filters[column.id] || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            [column.id]: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell
                        ? column.cell(row)
                        : column.accessorKey
                          ? String(row[column.accessorKey] ?? "")
                          : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to{" "}
            {Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length}{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
