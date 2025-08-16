"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";

interface EnergyFiltersProps {
  onFilterChange: (filters: EnergyFilterState) => void;
  currentFilters: EnergyFilterState;
  chartType: "ikes" | "emission";
  availableYears?: number[];
}

export interface EnergyFilterState {
  year: number;
  monthRange: { start: number; end: number };
  showTarget: boolean;
  showRealization: boolean;
  comparisonMode: "target_only" | "real_only" | "target_vs_real";
  smoothLine: boolean;
}

export function EnergyFilters({ 
  onFilterChange, 
  currentFilters, 
  chartType,
  availableYears
}: EnergyFiltersProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();
  const years = availableYears && availableYears.length > 0 
    ? availableYears 
    : Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  const comparisonOptions = [
    { value: "target_vs_real", label: "Target vs Real" },
    { value: "target_only", label: "Target Only" },
    { value: "real_only", label: "Real Only" },
  ];

  const handleYearChange = (year: string): void => {
    onFilterChange({ ...currentFilters, year: parseInt(year) });
  };

  const handleComparisonModeChange = (mode: string): void => {
    const newMode = mode as EnergyFilterState["comparisonMode"];
    onFilterChange({
      ...currentFilters,
      comparisonMode: newMode,
      showTarget: newMode === "target_only" || newMode === "target_vs_real",
      showRealization: newMode === "real_only" || newMode === "target_vs_real",
    });
  };

  const resetFilters = (): void => {
    onFilterChange({
      year: currentYear,
      monthRange: { start: 1, end: 12 },
      showTarget: true,
      showRealization: true,
      comparisonMode: "target_vs_real",
      smoothLine: false,
    });
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-yellow-400" />
        <span className="text-sm text-gray-300">Filter {chartType.toUpperCase()}:</span>
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

      <Select value={currentFilters.comparisonMode} onValueChange={handleComparisonModeChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {comparisonOptions.map((option) => (
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
