"use client";

import React from "react";
import { Pagination } from "./pagination";

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  disabled?: boolean;
}

export function DataTablePagination({
  page,
  totalPages,
  total,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  pageSize = 20,
  onPageSizeChange,
  className,
  disabled = false,
}: DataTablePaginationProps) {
  const handleFirstPage = () => onPageChange(1);
  const handleLastPage = () => onPageChange(totalPages);
  const handleNextPage = () => onPageChange(page + 1);
  const handlePrevPage = () => onPageChange(page - 1);

  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      pageSize={pageSize}
      totalItems={total}
      hasNextPage={hasNextPage}
      hasPrevPage={hasPrevPage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange || (() => {})}
      onFirstPage={handleFirstPage}
      onLastPage={handleLastPage}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
      showPageSizeSelector={!!onPageSizeChange}
      showInfo={true}
      className={className}
      disabled={disabled}
    />
  );
}