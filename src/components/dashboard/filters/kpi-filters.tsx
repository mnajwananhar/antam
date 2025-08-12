"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";

interface KpiFiltersProps {
  onFilterChange: (filters: KpiFilterState) => void;
  currentFilters: KpiFilterState;
}

export interface KpiFilterState {
  year: number;
  month: number | null;
  department: string;
}

export function KpiFilters({ onFilterChange, currentFilters }: KpiFiltersProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const handleYearChange = (year: string): void => {
    onFilterChange({ ...currentFilters, year: parseInt(year) });
  };

  const handleMonthChange = (month: string): void => {
    const monthValue = month === "all" ? null : parseInt(month);
    onFilterChange({ ...currentFilters, month: monthValue });
  };

  const resetFilters = (): void => {
    onFilterChange({
      year: currentYear,
      month: null,
      department: "MTC&ENG Bureau",
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

      <Select 
        value={currentFilters.month?.toString() || "all"} 
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Bulan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua</SelectItem>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
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
