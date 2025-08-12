"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, RotateCcw } from "lucide-react";

interface CriticalIssuesFiltersProps {
  onFilterChange: (filters: CriticalIssuesFilterState) => void;
  currentFilters: CriticalIssuesFilterState;
  totalCount: number;
  filteredCount: number;
}

export interface CriticalIssuesFilterState {
  search: string;
  departments: string[];
  statuses: {
    WORKING: boolean;
    STANDBY: boolean;
    BREAKDOWN: boolean;
  };
  dateRange: "7d" | "30d" | "90d" | "1y" | "all";
  sortBy: "newest" | "oldest" | "department" | "status" | "priority";
  sortOrder: "asc" | "desc";
  pageSize: number;
}

export function CriticalIssuesFilters({ 
  onFilterChange, 
  currentFilters, 
  totalCount, 
  filteredCount 
}: CriticalIssuesFiltersProps): React.JSX.Element {
  const dateRangeOptions = [
    { value: "7d", label: "7 Hari" },
    { value: "30d", label: "30 Hari" },
    { value: "90d", label: "3 Bulan" },
    { value: "all", label: "Semua" },
  ];

  const sortByOptions = [
    { value: "newest", label: "Terbaru" },
    { value: "oldest", label: "Terlama" },
    { value: "priority", label: "Prioritas" },
  ];

  const handleSearchChange = (value: string): void => {
    onFilterChange({ ...currentFilters, search: value });
  };

  const handleDateRangeChange = (range: string): void => {
    onFilterChange({
      ...currentFilters,
      dateRange: range as CriticalIssuesFilterState["dateRange"]
    });
  };

  const handleSortByChange = (sortBy: string): void => {
    onFilterChange({
      ...currentFilters,
      sortBy: sortBy as CriticalIssuesFilterState["sortBy"]
    });
  };

  const resetFilters = (): void => {
    onFilterChange({
      search: "",
      departments: [],
      statuses: { WORKING: true, STANDBY: true, BREAKDOWN: true },
      dateRange: "all",
      sortBy: "newest",
      sortOrder: "desc",
      pageSize: 10,
    });
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-yellow-400" />
        <span className="text-sm text-gray-300">Filter ({filteredCount}/{totalCount}):</span>
      </div>
      
      <div className="relative">
        <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
        <Input
          placeholder="Cari issues..."
          value={currentFilters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-48 pl-8"
        />
      </div>

      <Select value={currentFilters.dateRange} onValueChange={handleDateRangeChange}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentFilters.sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortByOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={resetFilters}>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
