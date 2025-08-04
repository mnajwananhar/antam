import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Filter } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "boolean";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface FilterBarProps {
  filters: Record<string, string | number | boolean>;
  filterOptions: FilterOption[];
  onFilterChange: (key: string, value: string | number | boolean) => void;
  onFilterRemove: (key: string) => void;
  onClearFilters: () => void;
  className?: string;
  disabled?: boolean;
}

export function FilterBar({
  filters,
  filterOptions,
  onFilterChange,
  onFilterRemove,
  onClearFilters,
  className = "",
  disabled = false,
}: FilterBarProps): React.JSX.Element {
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  const renderFilterSelect = (option: FilterOption): React.JSX.Element => {
    const currentValue = filters[option.key]?.toString() || "";

    if (option.type === "boolean") {
      return (
        <Select
          value={currentValue}
          onValueChange={(value) => onFilterChange(option.key, value === "true")}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={option.placeholder || option.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ya</SelectItem>
            <SelectItem value="false">Tidak</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Select
        value={currentValue}
        onValueChange={(value) => onFilterChange(option.key, value)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={option.placeholder || `Pilih ${option.label}`} />
        </SelectTrigger>
        <SelectContent>
          {option.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const getFilterDisplayValue = (key: string, value: string | number | boolean): string => {
    const option = filterOptions.find(opt => opt.key === key);
    
    if (option?.type === "boolean") {
      return value ? "Ya" : "Tidak";
    }
    
    if (option?.options) {
      const optionItem = option.options.find(opt => opt.value === value.toString());
      return optionItem?.label || value.toString();
    }
    
    return value.toString();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filter:
        </div>
        
        {filterOptions.map((option) => (
          <div key={option.key}>
            {renderFilterSelect(option)}
          </div>
        ))}
        
        {activeFilters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            disabled={disabled}
            className="ml-2"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map(([key, value]) => {
            const option = filterOptions.find(opt => opt.key === key);
            const displayValue = getFilterDisplayValue(key, value);
            
            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span>{option?.label}: {displayValue}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                  onClick={() => onFilterRemove(key)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
