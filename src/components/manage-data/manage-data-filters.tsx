"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  Search,
  X,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FilterOptions {
  types: Array<{ value: string; label: string; count: number }>;
  departments: Array<{ value: string; label: string; count: number }>;
}

interface ManageDataFiltersProps {
  filters: FilterOptions;
  selectedType: string;
  selectedDepartment: string;
  searchQuery: string;
  startDate: string;
  endDate: string;
  onFiltersChange: (filters: {
    type?: string;
    department?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
  onClearFilters: () => void;
}

export function ManageDataFilters({
  filters,
  selectedType,
  selectedDepartment,
  searchQuery,
  startDate,
  endDate,
  onFiltersChange,
  onClearFilters,
}: ManageDataFiltersProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onFiltersChange({ search: localSearch });
  };

  const handleDateChange = (field: "startDate" | "endDate", date: Date | undefined): void => {
    if (date) {
      onFiltersChange({ [field]: date.toISOString().split('T')[0] });
    } else {
      onFiltersChange({ [field]: "" });
    }
  };

  const activeFiltersCount = [selectedType, selectedDepartment, searchQuery, startDate, endDate]
    .filter(Boolean).length;

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Pencarian</Label>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari berdasarkan judul, nama, lokasi, atau keterangan..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" size="sm">
                Cari
              </Button>
            </form>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="type-filter">Jenis Data</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => onFiltersChange({ type: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua jenis</SelectItem>
                  {filters.types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label htmlFor="department-filter">Departemen</Label>
              <Select
                value={selectedDepartment}
                onValueChange={(value) => onFiltersChange({ department: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua departemen</SelectItem>
                  {filters.departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label} ({dept.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <CustomCalendar
                value={startDate}
                onChange={(value) => handleDateChange("startDate", value ? new Date(value) : undefined)}
                placeholder="Pilih tanggal mulai"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <CustomCalendar
                value={endDate}
                onChange={(value) => handleDateChange("endDate", value ? new Date(value) : undefined)}
                placeholder="Pilih tanggal akhir"
              />
            </div>
          </div>

          {/* Active Filters & Clear Button */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {selectedType && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    Jenis: {filters.types.find(t => t.value === selectedType)?.label}
                    <button
                      onClick={() => onFiltersChange({ type: "" })}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {selectedDepartment && (
                  <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    Dept: {selectedDepartment}
                    <button
                      onClick={() => onFiltersChange({ department: "" })}
                      className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {searchQuery && (
                  <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                    Cari: &quot;{searchQuery}&quot;
                    <button
                      onClick={() => {
                        setLocalSearch("");
                        onFiltersChange({ search: "" });
                      }}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {startDate && (
                  <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                    <Calendar className="h-3 w-3" />
                    Dari: {new Date(startDate).toLocaleDateString()}
                    <button
                      onClick={() => onFiltersChange({ startDate: "" })}
                      className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {endDate && (
                  <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                    <Calendar className="h-3 w-3" />
                    Sampai: {new Date(endDate).toLocaleDateString()}
                    <button
                      onClick={() => onFiltersChange({ endDate: "" })}
                      className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocalSearch("");
                  onClearFilters();
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Hapus Filter
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
