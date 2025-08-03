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
import {
  Plus,
  Battery,
  BarChart3,
  Factory,
  Pickaxe,
  Building,
  Loader2,
  AlertTriangle,
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
  plnConsumption: number;
  tambangConsumption: number;
  pabrikConsumption: number;
  supportingConsumption: number;
  totalConsumption: number;
  breakdown: {
    plnPercentage: number;
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
  const [consumptionData, setConsumptionData] = useState<EnergyConsumption[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CLEAN NOTIFICATION SYSTEM
  const { showError } = useToastContext();
  const { executeCreate } = useApiToast();

  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().getMonth() + 1);

  const [newConsumption, setNewConsumption] = useState({
    month: currentMonth,
    year: currentYear,
    plnConsumption: "",
    tambangConsumption: "",
    pabrikConsumption: "",
    supportingConsumption: "",
  });

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
      plnConsumption: parseFloat(newConsumption.plnConsumption) || 0,
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
      plnConsumption: "",
      tambangConsumption: "",
      pabrikConsumption: "",
      supportingConsumption: "",
    });

    // Reload data
    loadEnergyConsumption();
    setIsSubmitting(false);
  };

  const handleNumberChange = (
    field: keyof typeof newConsumption,
    value: string
  ) => {
    setNewConsumption((prev) => ({ ...prev, [field]: value }));
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

  const getTotalConsumption = (data: EnergyConsumption) => {
    return (
      data.totalConsumption ||
      data.plnConsumption +
        data.tambangConsumption +
        data.pabrikConsumption +
        data.supportingConsumption
    );
  };

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
                  type="number"
                  value={newConsumption.year}
                  onChange={(e) =>
                    setNewConsumption((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value) || currentYear,
                    }))
                  }
                  min={2020}
                  max={currentYear + 1}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  PLN Consumption (MWh)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newConsumption.plnConsumption}
                  onChange={(e) =>
                    handleNumberChange("plnConsumption", e.target.value)
                  }
                  min={0}
                  placeholder="Konsumsi PLN"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Pickaxe className="h-4 w-4" />
                  Tambang Consumption (MWh)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newConsumption.tambangConsumption}
                  onChange={(e) =>
                    handleNumberChange("tambangConsumption", e.target.value)
                  }
                  min={0}
                  placeholder="Konsumsi Tambang"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Pabrik Consumption (MWh)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newConsumption.pabrikConsumption}
                  onChange={(e) =>
                    handleNumberChange("pabrikConsumption", e.target.value)
                  }
                  min={0}
                  placeholder="Konsumsi Pabrik"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Supporting Consumption (MWh)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newConsumption.supportingConsumption}
                  onChange={(e) =>
                    handleNumberChange("supportingConsumption", e.target.value)
                  }
                  min={0}
                  placeholder="Konsumsi Supporting"
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

      {/* Consumption Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Energy Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : consumptionData.length > 0 ? (
            <div className="space-y-4">
              {consumptionData.map((data) => (
                <div
                  key={`${data.year}-${data.month}`}
                  className="border rounded-lg p-4"
                >
                  <h4 className="font-medium mb-3">
                    {monthNames[data.month - 1]} {data.year}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">PLN</span>
                      <span className="font-medium text-blue-600">
                        {data.plnConsumption.toFixed(2)} MWh
                      </span>
                      {data.breakdown && (
                        <span className="text-xs text-muted-foreground">
                          ({data.breakdown.plnPercentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Tambang</span>
                      <span className="font-medium text-amber-600">
                        {data.tambangConsumption.toFixed(2)} MWh
                      </span>
                      {data.breakdown && (
                        <span className="text-xs text-muted-foreground">
                          ({data.breakdown.tambangPercentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Pabrik</span>
                      <span className="font-medium text-green-600">
                        {data.pabrikConsumption.toFixed(2)} MWh
                      </span>
                      {data.breakdown && (
                        <span className="text-xs text-muted-foreground">
                          ({data.breakdown.pabrikPercentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Supporting</span>
                      <span className="font-medium text-purple-600">
                        {data.supportingConsumption.toFixed(2)} MWh
                      </span>
                      {data.breakdown && (
                        <span className="text-xs text-muted-foreground">
                          ({data.breakdown.supportingPercentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Total Consumption:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {getTotalConsumption(data).toFixed(2)} MWh
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Update:{" "}
                    {new Date(data.updatedAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Belum ada data energy consumption yang tercatat untuk tahun ini.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
