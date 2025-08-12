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
import { Plus, Zap, TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [energyData, setEnergyData] = useState<{
    targets?: EnergyTarget[];
    realizations?: EnergyRealization[];
    combined?: CombinedEnergyData[];
  }>({});
  const [isLoading, setIsLoading] = useState(true);
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

    // Reload data
    loadEnergyData();
    // Notify other tabs about the data change
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

  const getVarianceColor = (target?: number, realization?: number) => {
    if (!target || !realization) return "secondary";
    const variance = ((realization - target) / target) * 100;
    if (variance >= 0) return "default"; // Green for positive variance
    if (variance >= -10) return "warning"; // Yellow for small negative variance
    return "destructive"; // Red for large negative variance
  };

  const calculateVariance = (target?: number, realization?: number) => {
    if (!target || !realization) return null;
    return ((realization - target) / target) * 100;
  };

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
                  type="number"
                  value={newData.year}
                  onChange={(e) => {
                    const cleanValue =
                      e.target.value.replace(/^0+/, "") ||
                      currentYear.toString();
                    const numValue = parseInt(cleanValue) || currentYear;
                    setNewData((prev) => ({
                      ...prev,
                      year: Math.max(2020, Math.min(currentYear + 5, numValue)),
                    }));
                  }}
                  min={2020}
                  max={currentYear + 5}
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
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999"
                  value={
                    dataType === "target"
                      ? newData.ikesTarget
                      : newData.ikesRealization
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+/, "") || "0";
                    setNewData((prev) => ({
                      ...prev,
                      [dataType === "target"
                        ? "ikesTarget"
                        : "ikesRealization"]: parseFloat(value) || 0,
                    }));
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
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999"
                  value={
                    dataType === "target"
                      ? newData.emissionTarget
                      : newData.emissionRealization
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+/, "") || "0";
                    setNewData((prev) => ({
                      ...prev,
                      [dataType === "target"
                        ? "emissionTarget"
                        : "emissionRealization"]: parseFloat(value) || 0,
                    }));
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

      {/* Data Summary - Combined View */}
      {energyData.combined && energyData.combined.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Target vs Realisasi Energy & IKES
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {energyData.combined.map((data) => {
                  const ikesVariance = calculateVariance(
                    data.ikesTarget,
                    data.ikesRealization
                  );
                  const emissionVariance = calculateVariance(
                    data.emissionTarget,
                    data.emissionRealization
                  );

                  return (
                    <div
                      key={`${data.year}-${data.month}`}
                      className="border rounded-lg p-4"
                    >
                      <h4 className="font-medium mb-3">
                        {monthNames[data.month - 1]} {data.year}
                      </h4>

                      {/* IKES Data */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">
                          IKES (kWh/wmt)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Target:
                            </span>
                            <div className="font-medium">
                              {data.ikesTarget?.toFixed(2) || "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Realisasi:
                            </span>
                            <div className="font-medium">
                              {data.ikesRealization?.toFixed(2) || "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Variance:
                            </span>
                            <div className="font-medium">
                              {ikesVariance !== null ? (
                                <Badge
                                  variant={getVarianceColor(
                                    data.ikesTarget,
                                    data.ikesRealization
                                  )}
                                >
                                  {ikesVariance > 0 ? "+" : ""}
                                  {ikesVariance.toFixed(1)}%
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            <div className="font-medium">
                              {data.ikesTarget && data.ikesRealization ? (
                                data.ikesRealization <= data.ikesTarget ? (
                                  <span className="text-green-600">✓ Baik</span>
                                ) : (
                                  <span className="text-red-600">
                                    ✗ Over Target
                                  </span>
                                )
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Emission Data */}
                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">
                          Total Emission (tCO2e)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Target:
                            </span>
                            <div className="font-medium">
                              {data.emissionTarget?.toFixed(2) || "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Realisasi:
                            </span>
                            <div className="font-medium">
                              {data.emissionRealization?.toFixed(2) || "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Variance:
                            </span>
                            <div className="font-medium">
                              {emissionVariance !== null ? (
                                <Badge
                                  variant={getVarianceColor(
                                    data.emissionTarget,
                                    data.emissionRealization
                                  )}
                                >
                                  {emissionVariance > 0 ? "+" : ""}
                                  {emissionVariance.toFixed(1)}%
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            <div className="font-medium">
                              {data.emissionTarget &&
                              data.emissionRealization ? (
                                data.emissionRealization <=
                                data.emissionTarget ? (
                                  <span className="text-green-600">✓ Baik</span>
                                ) : (
                                  <span className="text-red-600">
                                    ✗ Over Target
                                  </span>
                                )
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        energyData.combined &&
        energyData.combined.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Belum ada data energy & IKES yang tercatat untuk tahun ini.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
