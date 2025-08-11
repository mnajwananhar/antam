"use client";

import React from "react";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  className?: string;
}

export function TableSkeleton({
  columns,
  rows = 5,
  showSearch = true,
  showFilters = false,
  showPagination = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={className}>
      {/* Search and Filter Skeleton */}
      {(showSearch || showFilters) && (
        <div className="space-y-4 mb-6">
          {showSearch && (
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <Skeleton className="h-10 w-full max-w-sm" />
              <Skeleton className="h-10 w-32" />
            </div>
          )}
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          )}
        </div>
      )}

      {/* Table Skeleton */}
      <div className="border bg-background overflow-auto w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={`header-${index}`} className="h-12">
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={`cell-${rowIndex}-${colIndex}`} className="p-4">
                    <Skeleton 
                      className={`h-5 ${
                        colIndex === 0 
                          ? "w-16" 
                          : colIndex === 1
                          ? "w-32"
                          : colIndex === columns - 1 
                          ? "w-20" 
                          : colIndex % 2 === 0
                          ? "w-24"
                          : "w-full"
                      }`} 
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      {showPagination && (
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-5 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}
    </div>
  );
}

export default TableSkeleton;