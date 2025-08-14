"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar, Filter, RotateCcw } from "lucide-react";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

interface EquipmentOption {
  id: number;
  name: string;
  code: string;
  category: string;
}

interface ProductivityFiltersProps {
  selectedPeriod: PeriodType;
  selectedEquipment: number[];
  availableEquipment: EquipmentOption[];
  onPeriodChange: (period: PeriodType) => void;
  onEquipmentChange: (equipmentIds: number[]) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function ProductivityFilters({
  selectedPeriod,
  selectedEquipment,
  availableEquipment,
  onPeriodChange,
  onEquipmentChange,
  onReset,
  isLoading = false,
}: ProductivityFiltersProps): React.JSX.Element {
  const [equipmentDropdownOpen, setEquipmentDropdownOpen] = useState<boolean>(false);

  const periodOptions: Array<{ value: PeriodType; label: string }> = [
    { value: "daily", label: "Harian" },
    { value: "weekly", label: "Mingguan" },
    { value: "monthly", label: "Bulanan" },
    { value: "yearly", label: "Tahunan" },
  ];

  const handleEquipmentToggle = (equipmentId: number): void => {
    const isSelected = selectedEquipment.includes(equipmentId);
    if (isSelected) {
      onEquipmentChange(selectedEquipment.filter(id => id !== equipmentId));
    } else {
      onEquipmentChange([...selectedEquipment, equipmentId]);
    }
  };

  const handleSelectAllEquipment = (): void => {
    if (selectedEquipment.length === availableEquipment.length) {
      onEquipmentChange([]);
    } else {
      onEquipmentChange(availableEquipment.map(eq => eq.id));
    }
  };

  const getSelectedEquipmentNames = (): string => {
    if (selectedEquipment.length === 0) return "All Equipment";
    if (selectedEquipment.length === availableEquipment.length) return "All Equipment";
    if (selectedEquipment.length === 1) {
      const equipment = availableEquipment.find(eq => eq.id === selectedEquipment[0]);
      return equipment?.name || "Unknown";
    }
    return `${selectedEquipment.length} Equipment Selected`;
  };

  const getPeriodLabel = (period: PeriodType): string => {
    return periodOptions.find(opt => opt.value === period)?.label || period;
  };

  if (isLoading) {
    return (
      <Card className="bg-secondary-800/50 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="animate-pulse bg-secondary-700 h-10 w-32 rounded"></div>
            <div className="animate-pulse bg-secondary-700 h-10 w-48 rounded"></div>
            <div className="animate-pulse bg-secondary-700 h-10 w-24 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-800/50 border-primary/30">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-secondary-300">Period:</span>
            <Select value={selectedPeriod} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-32 bg-secondary-700 border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipment Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-secondary-300">Equipment:</span>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setEquipmentDropdownOpen(!equipmentDropdownOpen)}
                className="min-w-48 justify-start bg-secondary-700 border-primary/30 text-left"
              >
                {getSelectedEquipmentNames()}
                <Badge variant="secondary" className="ml-2">
                  {selectedEquipment.length}
                </Badge>
              </Button>
              
              {equipmentDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-secondary-800 border border-primary/30 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-secondary-600">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllEquipment}
                      className="w-full justify-start text-xs"
                    >
                      {selectedEquipment.length === availableEquipment.length 
                        ? "Deselect All" 
                        : "Select All"
                      }
                    </Button>
                  </div>
                  <div className="p-1">
                    {availableEquipment.map((equipment) => (
                      <button
                        key={equipment.id}
                        onClick={() => handleEquipmentToggle(equipment.id)}
                        className={`w-full text-left p-2 rounded text-sm hover:bg-secondary-700 transition-colors ${
                          selectedEquipment.includes(equipment.id)
                            ? "bg-primary/20 text-primary"
                            : "text-secondary-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{equipment.name}</div>
                            <div className="text-xs text-secondary-400">
                              {equipment.code} • {equipment.category}
                            </div>
                          </div>
                          {selectedEquipment.includes(equipment.id) && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-secondary-600 text-secondary-400 hover:bg-secondary-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>

          {/* Active Filters Summary */}
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {getPeriodLabel(selectedPeriod)}
            </Badge>
            {selectedEquipment.length > 0 && selectedEquipment.length < availableEquipment.length && (
              <Badge variant="outline" className="border-blue-400 text-blue-400">
                {selectedEquipment.length} Equipment
              </Badge>
            )}
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {equipmentDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setEquipmentDropdownOpen(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
