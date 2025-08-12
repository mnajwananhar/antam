"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";

interface ConsumptionFiltersProps {
  onFilterChange: (filters: ConsumptionFilterState) => void;
  currentFilters: ConsumptionFilterState;
}

export interface ConsumptionFilterState {
  year: number;
  monthRange: { start: number; end: number };
  areas: {
    pln: boolean;
    tambang: boolean;
    pabrik: boolean;
    supporting: boolean;
  };
  showTotal: boolean;
  chartType: "combined" | "stacked" | "grouped";
  showTable: boolean;
  showAverage: boolean;
}

export function ConsumptionFilters({ onFilterChange, currentFilters }: ConsumptionFiltersProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  const chartTypeOptions = [
    { value: "combined", label: "Combined" },
    { value: "stacked", label: "Stacked" },
    { value: "grouped", label: "Grouped" },
  ];

  const handleYearChange = (year: string): void => {
    onFilterChange({ ...currentFilters, year: parseInt(year) });
  };

  const handleChartTypeChange = (type: string): void => {
    onFilterChange({
      ...currentFilters,
      chartType: type as ConsumptionFilterState["chartType"]
    });
  };

  const resetFilters = (): void => {
    onFilterChange({
      year: currentYear,
      monthRange: { start: 1, end: 12 },
      areas: {
        pln: true,
        tambang: true,
        pabrik: true,
        supporting: true,
      },
      showTotal: true,
      chartType: "combined",
      showTable: true,
      showAverage: true,
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
        <SelectTrigger className="w-32">
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
