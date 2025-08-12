"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";

interface StatusFiltersProps {
  onFilterChange: (filters: StatusFilterState) => void;
  currentFilters: StatusFilterState;
}

export interface StatusFilterState {
  dateRange: "7d" | "30d" | "90d" | "1y" | "all";
  statusTypes: {
    open: boolean;
    close: boolean;
  };
  departments: string[];
  year: number;
}

export function StatusFilters({ onFilterChange, currentFilters }: StatusFiltersProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  
  const dateRangeOptions = [
    { value: "30d", label: "30 Hari" },
    { value: "90d", label: "3 Bulan" },
    { value: "1y", label: "1 Tahun" },
    { value: "all", label: "Semua" },
  ];

  const handleDateRangeChange = (range: string): void => {
    onFilterChange({ 
      ...currentFilters, 
      dateRange: range as StatusFilterState["dateRange"] 
    });
  };

  const handleYearChange = (year: string): void => {
    onFilterChange({ ...currentFilters, year: parseInt(year) });
  };

  const resetFilters = (): void => {
    onFilterChange({
      dateRange: "all",
      statusTypes: { open: true, close: true },
      departments: ["MTC&ENG Bureau"],
      year: currentYear,
    });
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-yellow-400" />
        <span className="text-sm text-gray-300">Filter:</span>
      </div>
      
      <Select value={currentFilters.year.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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

      <Button variant="outline" size="sm" onClick={resetFilters}>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
