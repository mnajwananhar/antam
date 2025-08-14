"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, RefreshCw } from "lucide-react";

export interface OperationalFilterState {
  timeRange: "daily" | "weekly" | "monthly" | "yearly";
  equipmentIds: number[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface OperationalFiltersProps {
  currentFilters: OperationalFilterState;
  onFilterChange: (filters: OperationalFilterState) => void;
  availableEquipment: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  onRefresh?: () => void;
}

export function OperationalFilters({
  currentFilters,
  onFilterChange,
  availableEquipment,
  onRefresh,
}: OperationalFiltersProps): React.JSX.Element {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<number>>(
    new Set(currentFilters.equipmentIds)
  );

  const handleTimeRangeChange = (
    timeRange: "daily" | "weekly" | "monthly" | "yearly"
  ): void => {
    const now = new Date();
    let start: Date;
    const end: Date = new Date(now);

    switch (timeRange) {
      case "daily":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case "weekly":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84); // 12 weeks
        break;
      case "monthly":
        start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case "yearly":
        start = new Date(now.getFullYear() - 3, 0, 1);
        break;
    }

    onFilterChange({
      ...currentFilters,
      timeRange,
      dateRange: { start, end },
    });
  };

  const handleEquipmentToggle = (equipmentId: number): void => {
    const newSelection = new Set(selectedEquipment);
    if (newSelection.has(equipmentId)) {
      newSelection.delete(equipmentId);
    } else {
      newSelection.add(equipmentId);
    }
    setSelectedEquipment(newSelection);
    
    onFilterChange({
      ...currentFilters,
      equipmentIds: Array.from(newSelection),
    });
  };

  const handleSelectAllEquipment = (): void => {
    const allIds = availableEquipment.map(eq => eq.id);
    setSelectedEquipment(new Set(allIds));
    
    onFilterChange({
      ...currentFilters,
      equipmentIds: allIds,
    });
  };

  const handleClearAllEquipment = (): void => {
    setSelectedEquipment(new Set());
    
    onFilterChange({
      ...currentFilters,
      equipmentIds: [],
    });
  };

  const timeRangeOptions = [
    { value: "daily", label: "Harian", icon: "📅" },
    { value: "weekly", label: "Mingguan", icon: "📊" },
    { value: "monthly", label: "Bulanan", icon: "📈" },
    { value: "yearly", label: "Tahunan", icon: "📋" },
  ];

  return (
    <Card className="bg-secondary-50 dark:bg-secondary-800/50 border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-secondary-800 dark:text-primary">
          <Filter className="h-5 w-5" />
          Filter Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Range Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Periode Waktu
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={currentFilters.timeRange === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeRangeChange(option.value as "daily" | "weekly" | "monthly" | "yearly")}
                className={`justify-start ${
                  currentFilters.timeRange === option.value
                    ? "bg-primary text-secondary"
                    : "border-primary/30 text-primary hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Equipment Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Filter Alat ({selectedEquipment.size}/{availableEquipment.length})
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllEquipment}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                Pilih Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllEquipment}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                Hapus Semua
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {availableEquipment.map((equipment) => (
              <Button
                key={equipment.id}
                variant={selectedEquipment.has(equipment.id) ? "default" : "outline"}
                size="sm"
                onClick={() => handleEquipmentToggle(equipment.id)}
                className={`justify-start text-xs h-8 ${
                  selectedEquipment.has(equipment.id)
                    ? "bg-primary text-secondary"
                    : "border-primary/30 text-primary hover:bg-primary/10"
                }`}
              >
                <span className="truncate">{equipment.code}</span>
              </Button>
            ))}
          </div>

          {selectedEquipment.size > 0 && (
            <div className="flex flex-wrap gap-1">
              {Array.from(selectedEquipment).slice(0, 5).map((equipmentId) => {
                const equipment = availableEquipment.find(eq => eq.id === equipmentId);
                return equipment ? (
                  <Badge
                    key={equipmentId}
                    variant="secondary"
                    className="text-xs bg-primary/10 text-primary border-primary/30"
                  >
                    {equipment.code}
                  </Badge>
                ) : null;
              })}
              {selectedEquipment.size > 5 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-primary/30"
                >
                  +{selectedEquipment.size - 5} lainnya
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <div className="pt-2 border-t border-primary/10">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}