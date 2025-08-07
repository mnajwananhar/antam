"use client";

import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ TYPES YANG STRICT DAN COMPREHENSIVE
export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableAction<T = unknown> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T, index: number) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
  className?: string;
}

export interface TableFilter {
  key: string;
  label: string;
  type: "select" | "search";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export interface UniversalTableProps<T = unknown> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  filters?: TableFilter[];
  searchable?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  loading?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  className?: string;
  tableClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  stickyHeader?: boolean;
  maxHeight?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string, order: "asc" | "desc") => void;
}

export function UniversalTable<T = Record<string, unknown>>({
  data,
  columns,
  actions = [],
  filters = [],
  searchable,
  pagination,
  loading = false,
  emptyState,
  className,
  tableClassName,
  rowClassName,
  stickyHeader = false,
  maxHeight = "600px",
  sortBy,
  sortOrder,
  onSort,
}: UniversalTableProps<T>): React.JSX.Element {
  // ✅ COMPUTED VALUES DENGAN MEMOIZATION
  const hasActions = useMemo(() => actions.length > 0, [actions.length]);

  const visibleActions = useMemo(
    () => (row: T) => actions.filter((action) => !action.hidden?.(row)),
    [actions]
  );

  // ✅ SORT HANDLER
  const handleSort = (columnKey: string): void => {
    if (!onSort) return;

    const newOrder =
      sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
    onSort(columnKey, newOrder);
  };

  // ✅ RENDER CELL VALUE
  const renderCellValue = (
    column: TableColumn<T>,
    row: T,
    index: number
  ): React.ReactNode => {
    if (column.render) {
      return column.render((row as Record<string, unknown>)[column.key], row, index);
    }

    const value = (row as Record<string, unknown>)[column.key];
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }

    return String(value);
  };

  // ✅ GET ROW CLASSNAME
  const getRowClassName = (row: T, index: number): string => {
    if (typeof rowClassName === "function") {
      return rowClassName(row, index);
    }
    return rowClassName || "";
  };

  // ✅ RENDER EMPTY STATE
  const renderEmptyState = (): React.ReactNode => {
    if (loading) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length + (hasActions ? 1 : 0)}
            className="h-32 text-center"
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Memuat data...</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (emptyState) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length + (hasActions ? 1 : 0)}
            className="h-32 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              {emptyState.icon && (
                <div className="text-4xl">{emptyState.icon}</div>
              )}
              <div className="space-y-2">
                <h3 className="font-medium">{emptyState.title}</h3>
                {emptyState.description && (
                  <p className="text-sm text-muted-foreground">
                    {emptyState.description}
                  </p>
                )}
              </div>
              {emptyState.action}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow>
        <TableCell
          colSpan={columns.length + (hasActions ? 1 : 0)}
          className="h-32 text-center text-muted-foreground"
        >
          Tidak ada data
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* FILTERS AND SEARCH */}
      {(searchable || filters.length > 0) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchable.placeholder}
                  value={searchable.value}
                  onChange={(e) => searchable.onChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            {filters.map((filter) => (
              <div key={filter.key} className="min-w-[150px]">
                {filter.type === "select" ? (
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={filter.placeholder}
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div
        className={cn(
          "border bg-background overflow-auto w-full",
          stickyHeader && "max-h-[600px]"
        )}
        style={stickyHeader ? { maxHeight } : undefined}
      >
        <Table className={cn("w-full", tableClassName)}>
          <TableHeader
            className={cn(stickyHeader && "sticky top-0 bg-background z-10")}
          >
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.width && `w-${column.width}`,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer hover:bg-muted/50",
                    column.className
                  )}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={
                    column.sortable
                      ? () => handleSort(column.key)
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortBy === column.key && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="w-32 text-center">Aksi</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 || loading
              ? renderEmptyState()
              : data.map((row, index) => (
                  <TableRow
                    key={`row-${index}`}
                    className={getRowClassName(row, index)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${index}-${column.key}`}
                        className={cn(
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                          column.className
                        )}
                      >
                        {renderCellValue(column, row, index)}
                      </TableCell>
                    ))}
                    {hasActions && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {visibleActions(row).map((action, actionIndex) => (
                            <Button
                              key={`action-${actionIndex}`}
                              size={action.size || "sm"}
                              variant={action.variant || "ghost"}
                              onClick={() => action.onClick(row, index)}
                              disabled={action.disabled?.(row)}
                              className={cn(
                                "h-8 w-8 p-0",
                                action.className
                              )}
                              title={action.label}
                            >
                              {action.icon && (
                                <action.icon className="h-4 w-4" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan{" "}
            {(pagination.currentPage - 1) * pagination.pageSize + 1}-
            {Math.min(
              pagination.currentPage * pagination.pageSize,
              pagination.totalItems
            )}{" "}
            dari {pagination.totalItems.toLocaleString("id-ID")} data
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pagination.onPageChange(pagination.currentPage - 1)
              }
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.currentPage) <= 1
                )
                .map((page, index, array) => {
                  const showEllipsis =
                    index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={
                          page === pagination.currentPage
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => pagination.onPageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pagination.onPageChange(pagination.currentPage + 1)
              }
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}