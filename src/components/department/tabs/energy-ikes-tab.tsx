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
import { Plus, Zap, Loader2 } from "lucide-react";

interface EnergyIkesTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

interface EnergyTarget {
  id: number;
  year: number;
  month: number;
  ikesTarget?: number;
  emissionTarget?: number;
  createdAt: string;
  updatedAt: string;
}

interface EnergyRealization {
  id: number;
  year: number;
  month: number;
  ikesRealization?: number;
  emissionRealization?: number;
  createdAt: string;
  updatedAt: string;
}

interface CombinedEnergyData {
  year: number;
  month: number;
  ikesTarget?: number;
  emissionTarget?: number;
  ikesRealization?: number;
  emissionRealization?: number;
}

export function EnergyIkesTab({ department }: EnergyIkesTabProps) {
  const [, setEnergyData] = useState<{
    targets?: EnergyTarget[];
    realizations?: EnergyRealization[];
    combined?: CombinedEnergyData[];
  }>({});
  const [, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CLEAN NOTIFICATION SYSTEM
  const { showError } = useToastContext();
  const { executeCreate } = useApiToast();

  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [dataType, setDataType] = useState<"target" | "realization">("target");

  const [newData, setNewData] = useState({
    month: currentMonth,
    year: currentYear,
    ikesTarget: 0,
    emissionTarget: 0,
    ikesRealization: 0,
    emissionRealization: 0,
  });

  const handleNumberChange = (field: keyof typeof newData, value: string) => {
    // Allow digits and decimal point for numeric values
    let cleanValue = value.replace(/[^\d.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Convert to number for validation, but keep as string for input
    const numValue = parseFloat(cleanValue) || 0;
    const clampedValue = Math.max(0, Math.min(999999, numValue));

    // Update state with the clamped numeric value
    setNewData((prev) => ({
      ...prev,
      [field]: clampedValue,
    }));
  };

  const loadEnergyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/energy-ikes");

      if (response.ok) {
        const result = await response.json();
        setEnergyData(result.data || {});
      } else {
        const error = await response.json();
        console.error("Failed to load energy data:", error);
        showError(error.error || "Gagal memuat data energy");
      }
    } catch (error) {
      console.error("Error loading energy data:", error);
      showError("Error saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Load energy data on component mount
  useEffect(() => {
    if (department.code === "MTCENG") {
      loadEnergyData();
    }
  }, [department.code, loadEnergyData]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare data based on dataType
    const submitData: Record<string, string | number | undefined> = {
      dataType,
      month: newData.month,
      year: newData.year,
    };

    if (dataType === "target") {
      submitData.ikesTarget =
        newData.ikesTarget > 0 ? newData.ikesTarget : undefined;
      submitData.emissionTarget =
        newData.emissionTarget > 0 ? newData.emissionTarget : undefined;
    } else {
      submitData.ikesRealization =
        newData.ikesRealization > 0 ? newData.ikesRealization : undefined;
      submitData.emissionRealization =
        newData.emissionRealization > 0
          ? newData.emissionRealization
          : undefined;
    }

    await executeCreate(
      () =>
        fetch("/api/energy-ikes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }),
      `Data ${dataType}`
    );

    // Reset form
    setNewData({
      month: currentMonth,
      year: currentYear,
      ikesTarget: 0,
      emissionTarget: 0,
      ikesRealization: 0,
      emissionRealization: 0,
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
        <Zap className="h-4 w-4" />
        <AlertDescription>
          Data Energy & IKES hanya tersedia untuk MTC&ENG Bureau.
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
            <Zap className="h-5 w-5" />
            Input Data Energy & IKES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Tipe Data</label>
                <Select
                  value={dataType}
                  onValueChange={(value: "target" | "realization") =>
                    setDataType(value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="target">Target</SelectItem>
                    <SelectItem value="realization">Realisasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Bulan</label>
                <Select
                  value={newData.month.toString()}
                  onValueChange={(value) =>
                    setNewData((prev) => ({ ...prev, month: parseInt(value) }))
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
                  value={newData.year.toString()}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    const numValue = parseInt(numericValue) || currentYear;
                    setNewData((prev) => ({
                      ...prev,
                      year: Math.max(2020, Math.min(currentYear + 5, numValue)),
                    }));
                  }}
                  placeholder="2025"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  IKES {dataType === "target" ? "Target" : "Realisasi"}{" "}
                  (kWh/wmt)
                </label>
                <Input
                  type="text"
                  value={
                    dataType === "target"
                      ? newData.ikesTarget === 0
                        ? ""
                        : newData.ikesTarget.toString()
                      : newData.ikesRealization === 0
                      ? ""
                      : newData.ikesRealization.toString()
                  }
                  onChange={(e) => {
                    handleNumberChange(
                      dataType === "target" ? "ikesTarget" : "ikesRealization",
                      e.target.value
                    );
                  }}
                  placeholder="0.00"
                  disabled={isSubmitting}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Emission {dataType === "target" ? "Target" : "Realisasi"}{" "}
                  (tCO2e)
                </label>
                <Input
                  type="text"
                  value={
                    dataType === "target"
                      ? newData.emissionTarget === 0
                        ? ""
                        : newData.emissionTarget.toString()
                      : newData.emissionRealization === 0
                      ? ""
                      : newData.emissionRealization.toString()
                  }
                  onChange={(e) => {
                    handleNumberChange(
                      dataType === "target"
                        ? "emissionTarget"
                        : "emissionRealization",
                      e.target.value
                    );
                  }}
                  placeholder="0.00"
                  disabled={isSubmitting}
                  className="w-full mt-1"
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
                    Simpan {dataType === "target" ? "Target" : "Realisasi"}
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
