import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { SearchBar } from "./search-bar";
import { FilterBar, FilterOption } from "./filter-bar";
import { SortButton } from "./sort-button";

interface DataTableHeaderProps {
  // Search props
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filter props
  filters: Record<string, string | number | boolean>;
  filterOptions: FilterOption[];
  onFilterChange: (key: string, value: string | number | boolean) => void;
  onFilterRemove: (key: string) => void;
  onClearFilters: () => void;
  
  // Sort props
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  sortOptions: Array<{ key: string; label: string }>;
  
  // Refresh props
  onRefresh?: () => void;
  isRefreshing?: boolean;
  
  // Additional props
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function DataTableHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  filterOptions,
  onFilterChange,
  onFilterRemove,
  onClearFilters,
  sortBy,
  sortOrder,
  onSort,
  sortOptions,
  onRefresh,
  isRefreshing = false,
  title,
  description,
  actions,
  disabled = false,
  className = "",
}: DataTableHeaderProps): React.JSX.Element {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title and Actions */}
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            disabled={disabled}
          />
        </div>
        
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={disabled || isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Filters */}
      {filterOptions.length > 0 && (
        <FilterBar
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={onFilterChange}
          onFilterRemove={onFilterRemove}
          onClearFilters={onClearFilters}
          disabled={disabled}
        />
      )}

      {/* Sort Options */}
      {sortOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Urutkan berdasarkan:
          </span>
          {sortOptions.map((option) => (
            <SortButton
              key={option.key}
              sortKey={option.key}
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSort={onSort}
              disabled={disabled}
            >
              {option.label}
            </SortButton>
          ))}
        </div>
      )}
    </div>
  );
}
