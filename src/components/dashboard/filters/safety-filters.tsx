"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";

interface SafetyFiltersProps {
  onFilterChange: (filters: SafetyFilterState) => void;
  currentFilters: SafetyFilterState;
  availableYears?: number[];
}

export interface SafetyFilterState {
  year: number;
  monthRange: { start: number; end: number };
  incidentTypes: {
    nearmiss: boolean;
    kecAlat: boolean;
    kecKecil: boolean;
    kecRingan: boolean;
    kecBerat: boolean;
    fatality: boolean;
  };
  chartType: "stacked" | "grouped" | "line";
}

export function SafetyFilters({ onFilterChange, currentFilters, availableYears }: SafetyFiltersProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();
  const years = availableYears && availableYears.length > 0 
    ? availableYears 
    : Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  
  const chartTypeOptions = [
    { value: "stacked", label: "Stacked" },
    { value: "grouped", label: "Grouped" },
    { value: "line", label: "Line" },
  ];

  const handleYearChange = (year: string): void => {
    onFilterChange({ ...currentFilters, year: parseInt(year) });
  };

  const handleChartTypeChange = (type: string): void => {
    onFilterChange({
      ...currentFilters,
      chartType: type as SafetyFilterState["chartType"]
    });
  };

  const resetFilters = (): void => {
    onFilterChange({
      year: currentYear,
      monthRange: { start: 1, end: 12 },
      incidentTypes: {
        nearmiss: true,
        kecAlat: true,
        kecKecil: true,
        kecRingan: true,
        kecBerat: true,
        fatality: true,
      },
      chartType: "stacked",
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

      <Select value={currentFilters.chartType} onValueChange={handleChartTypeChange}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {chartTypeOptions.map((option) => (
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
