"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { Department } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useToastContext,
  useApiToast,
} from "@/components/providers/toast-provider";
// ...existing code...
import {
  Plus,
  Battery,
  Factory,
  Pickaxe,
  Building,
  Loader2,
} from "lucide-react";

interface EnergyConsumptionTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

interface EnergyConsumption {
  id: number;
  year: number;
  month: number;
  tambangConsumption: number;
  pabrikConsumption: number;
  supportingConsumption: number;
  totalConsumption: number;
  breakdown: {
    tambangPercentage: number;
    pabrikPercentage: number;
    supportingPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function EnergyConsumptionTab({
  department,
}: EnergyConsumptionTabProps) {
  const [, setConsumptionData] = useState<EnergyConsumption[]>(
    []
  );
  const [, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CLEAN NOTIFICATION SYSTEM
  const { showError } = useToastContext();
  const { executeCreate } = useApiToast();

  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().getMonth() + 1);

  const [newConsumption, setNewConsumption] = useState({
    month: currentMonth,
    year: currentYear,
    tambangConsumption: "",
    pabrikConsumption: "",
    supportingConsumption: "",
  });

  const handleNumberChange = (
    field: keyof typeof newConsumption,
    value: string
  ) => {
    // Handle year field (integer only)
    if (field === 'year') {
      const numericValue = value.replace(/\D/g, '');
      const numValue = parseInt(numericValue) || currentYear;
      const clampedValue = Math.max(2020, Math.min(currentYear + 5, numValue));
      setNewConsumption((prev) => ({ ...prev, [field]: clampedValue }));
    } 
    // Handle month field (integer only) 
    else if (field === 'month') {
      const numericValue = value.replace(/\D/g, '');
      const numValue = parseInt(numericValue) || currentMonth;
      setNewConsumption((prev) => ({ ...prev, [field]: numValue }));
    } 
    // Handle consumption fields (allow decimal)
    else {
      let cleanValue = value.replace(/[^\d.]/g, '');
      
      // Prevent multiple decimal points
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        cleanValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // For consumption fields, store the clean string value (preserve decimals)
      setNewConsumption((prev) => ({ ...prev, [field]: cleanValue }));
    }
  };

  const loadEnergyConsumption = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/energy-consumption");

      if (response.ok) {
        const result = await response.json();
        setConsumptionData(result.data || []);
      } else {
        const error = await response.json();
        console.error("Failed to load energy consumption:", error);
        showError(error.error || "Gagal memuat data energy consumption");
      }
    } catch (error) {
      console.error("Error loading energy consumption:", error);
      showError("Error saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Load energy consumption data on component mount
  useEffect(() => {
    if (department.code === "MTCENG") {
      loadEnergyConsumption();
    }
  }, [department.code, loadEnergyConsumption]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    // Convert string inputs to numbers
    const submitData = {
      month: newConsumption.month,
      year: newConsumption.year,
      tambangConsumption: parseFloat(newConsumption.tambangConsumption) || 0,
      pabrikConsumption: parseFloat(newConsumption.pabrikConsumption) || 0,
      supportingConsumption:
        parseFloat(newConsumption.supportingConsumption) || 0,
    };

    await executeCreate(
      () =>
        fetch("/api/energy-consumption", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }),
      "Data energy consumption"
    );

    // Reset form
    setNewConsumption({
      month: currentMonth,
      year: currentYear,
      tambangConsumption: "",
      pabrikConsumption: "",
      supportingConsumption: "",
    });
    
    setIsSubmitting(false);
  };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];


  // Only show if department is MTC&ENG
  if (department.code !== "MTCENG") {
    return (
      <Alert>
        <Battery className="h-4 w-4" />
        <AlertDescription>
          Data Energy Consumption hanya tersedia untuk MTC&ENG Bureau.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Input Data Energy Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Bulan</label>
                <Select
                  value={newConsumption.month.toString()}
                  onValueChange={(value) =>
                    setNewConsumption((prev) => ({
                      ...prev,
                      month: parseInt(value),
                    }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem
                        key={index + 1}
                        value={(index + 1).toString()}
                      >
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tahun</label>
                <Input
                  type="text"
                  value={newConsumption.year.toString()}
                  onChange={(e) =>
                    handleNumberChange("year", e.target.value)
                  }
                  placeholder="2025"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Pickaxe className="h-4 w-4" />
                  Tambang Consumption (MWh)
                </label>
                <Input
                  type="text"
                  value={newConsumption.tambangConsumption}
                  onChange={(e) =>
                    handleNumberChange("tambangConsumption", e.target.value)
                  }
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Pabrik Consumption (MWh)
                </label>
                <Input
                  type="text"
                  value={newConsumption.pabrikConsumption}
                  onChange={(e) =>
                    handleNumberChange("pabrikConsumption", e.target.value)
                  }
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Supporting Consumption (MWh)
                </label>
                <Input
                  type="text"
                  value={newConsumption.supportingConsumption}
                  onChange={(e) =>
                    handleNumberChange("supportingConsumption", e.target.value)
                  }
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Simpan Data Konsumsi
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
