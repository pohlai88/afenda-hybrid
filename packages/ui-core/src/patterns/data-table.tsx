"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../primitives/table";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Checkbox } from "../primitives/checkbox";
import { Skeleton } from "../primitives/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../primitives/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  Columns3,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  align?: "left" | "center" | "right";
  hidden?: boolean;
  width?: string;
  enableHiding?: boolean;
}

export type DataTableDensity = "compact" | "comfortable" | "spacious";

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  density?: DataTableDensity;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  initialSorting?: Array<{ id: string; desc: boolean }>;
  emptyMessage?: string;
  stickyHeader?: boolean;
  actionBar?: (selectedRows: T[]) => React.ReactNode;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  exportFilename?: string;
  virtualized?: boolean;
  virtualizedHeight?: number;
}

const densityClasses: Record<DataTableDensity, string> = {
  compact: "[&_td]:py-1.5 [&_td]:px-2 [&_th]:py-1.5 [&_th]:px-2 text-xs",
  comfortable: "[&_td]:py-2.5 [&_td]:px-3 [&_th]:py-2.5 [&_th]:px-3 text-sm",
  spacious: "[&_td]:py-3.5 [&_td]:px-4 [&_th]:py-3.5 [&_th]:px-4 text-sm",
};

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  className,
  onRowClick,
  selectable = false,
  onSelectionChange,
  density = "comfortable",
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  searchFields,
  initialSorting,
  emptyMessage = "No results found.",
  stickyHeader = false,
  actionBar,
  enableColumnVisibility = false,
  enableExport = false,
  exportFilename = "export",
  virtualized = false,
  virtualizedHeight = 600,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [sortColumn, setSortColumn] = React.useState<string | null>(
    initialSorting?.[0]?.id ?? null
  );
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    initialSorting?.[0]?.desc ? "desc" : "asc"
  );
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = React.useState("");
  const [selectedRowIndices, setSelectedRowIndices] = React.useState<Set<number>>(new Set());
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.id] = !col.hidden;
    });
    return initial;
  });

  const parentRef = React.useRef<HTMLDivElement>(null);

  const visibleColumns = React.useMemo(
    () => columns.filter((c) => columnVisibility[c.id] !== false),
    [columns, columnVisibility]
  );

  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      if (globalSearch) {
        // If searchFields is provided, only search those fields
        const fieldsToSearch = searchFields ?? Object.keys(row);
        const haystack = fieldsToSearch
          .map((key) => String(row[key] ?? ""))
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(globalSearch.toLowerCase())) return false;
      }
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key] ?? "").toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });
  }, [data, filters, globalSearch, searchFields]);

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

  React.useEffect(() => {
    setCurrentPage(0);
  }, [globalSearch, filters]);

  React.useEffect(() => {
    if (onSelectionChange) {
      const rows = Array.from(selectedRowIndices).map((i) => sortedData[i]!);
      onSelectionChange(rows.filter(Boolean));
    }
  }, [selectedRowIndices, sortedData, onSelectionChange]);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const toggleRowSelection = (globalIndex: number) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(globalIndex)) next.delete(globalIndex);
      else next.add(globalIndex);
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedRowIndices.size === sortedData.length) {
      setSelectedRowIndices(new Set());
    } else {
      setSelectedRowIndices(new Set(sortedData.map((_, i) => i)));
    }
  };

  const selectedRows = React.useMemo(
    () =>
      Array.from(selectedRowIndices)
        .map((i) => sortedData[i])
        .filter(Boolean) as T[],
    [selectedRowIndices, sortedData]
  );

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortColumn !== columnId) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const exportToCSV = () => {
    const headers = visibleColumns.map((col) => col.header).join(",");
    const rows = sortedData.map((row) =>
      visibleColumns
        .map((col) => {
          const value = col.accessorKey ? row[col.accessorKey] : "";
          const stringValue = String(value ?? "");
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${exportFilename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rowVirtualizer = useVirtualizer({
    count: virtualized ? sortedData.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (density === "compact" ? 40 : density === "spacious" ? 56 : 48),
    overscan: 10,
    enabled: virtualized,
  });

  const virtualRows = virtualized ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = virtualized ? rowVirtualizer.getTotalSize() : 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        {searchable && (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-9"
              compact
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Columns3 className="h-3.5 w-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns
                  .filter((col) => col.enableHiding !== false)
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={columnVisibility[column.id] !== false}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({
                          ...prev,
                          [column.id]: checked,
                        }))
                      }
                    >
                      {column.header}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {enableExport && (
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {virtualized ? (
        <div
          ref={parentRef}
          className={cn("rounded-lg border overflow-auto", densityClasses[density])}
          style={{ height: `${virtualizedHeight}px` }}
        >
          <Table>
            <TableHeader className={cn("sticky top-0 z-10 bg-muted/90 backdrop-blur-sm")}>
              <TableRow className="hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selectedRowIndices.size === sortedData.length && sortedData.length > 0
                      }
                      onCheckedChange={toggleAllSelection}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center"
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="flex flex-col gap-1.5">
                      {column.sortable ? (
                        <button
                          className="inline-flex items-center font-semibold uppercase tracking-wider hover:text-foreground"
                          onClick={() => handleSort(column.id)}
                        >
                          {column.header}
                          <SortIcon columnId={column.id} />
                        </button>
                      ) : (
                        <span>{column.header}</span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <tr style={{ height: `${totalSize}px` }}>
                <td />
              </tr>
              {virtualRows.map((virtualRow) => {
                const row = sortedData[virtualRow.index]!;
                const isSelected = selectedRowIndices.has(virtualRow.index);

                return (
                  <TableRow
                    key={virtualRow.index}
                    className={cn(onRowClick && "cursor-pointer")}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={() => onRowClick?.(row)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRowSelection(virtualRow.index)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select row ${virtualRow.index + 1}`}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.align === "right" && "text-right tabular-nums",
                          column.align === "center" && "text-center"
                        )}
                      >
                        {column.cell
                          ? column.cell(row)
                          : column.accessorKey
                            ? String(row[column.accessorKey] ?? "")
                            : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className={cn("rounded-lg border", densityClasses[density])}>
          <Table>
            <TableHeader
              className={cn(stickyHeader && "sticky top-0 z-10 bg-muted/90 backdrop-blur-sm")}
            >
              <TableRow className="hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selectedRowIndices.size === sortedData.length && sortedData.length > 0
                      }
                      onCheckedChange={toggleAllSelection}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center"
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="flex flex-col gap-1.5">
                      {column.sortable ? (
                        <button
                          className="inline-flex items-center font-semibold uppercase tracking-wider hover:text-foreground"
                          onClick={() => handleSort(column.id)}
                        >
                          {column.header}
                          <SortIcon columnId={column.id} />
                        </button>
                      ) : (
                        <span>{column.header}</span>
                      )}
                      {column.filterable && (
                        <Input
                          placeholder={`Filter...`}
                          value={filters[column.id] || ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              [column.id]: e.target.value,
                            }))
                          }
                          compact
                          className="h-7 text-xs"
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <TableRow key={idx}>
                    {selectable && (
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    )}
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, idx) => {
                  const globalIdx = currentPage * pageSize + idx;
                  const isSelected = selectedRowIndices.has(globalIdx);

                  return (
                    <TableRow
                      key={idx}
                      className={cn(onRowClick && "cursor-pointer")}
                      data-state={isSelected ? "selected" : undefined}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRowSelection(globalIdx)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select row ${idx + 1}`}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={cn(
                            column.align === "right" && "text-right tabular-nums",
                            column.align === "center" && "text-center"
                          )}
                        >
                          {column.cell
                            ? column.cell(row)
                            : column.accessorKey
                              ? String(row[column.accessorKey] ?? "")
                              : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectable && selectedRows.length > 0 && actionBar && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedRows.length} selected</span>
          <div className="flex items-center gap-2">{actionBar(selectedRows)}</div>
        </div>
      )}

      {!virtualized && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Showing {currentPage * pageSize + 1}&ndash;
            {Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              aria-label="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              aria-label="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      {virtualized && (
        <div className="px-1">
          <p className="text-xs text-muted-foreground">
            Showing all {sortedData.length} rows (virtualized)
          </p>
        </div>
      )}
    </div>
  );
}
