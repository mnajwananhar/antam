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
import { notifyDataUpdate, DATA_CATEGORIES } from "@/lib/utils/data-sync";
import { Plus, Shield, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

interface SafetyIncidentTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

interface SafetyIncident {
  id: number;
  month: number;
  year: number;
  nearmiss: number;
  kecAlat: number;
  kecKecil: number;
  kecRingan: number;
  kecBerat: number;
  fatality: number;
  createdAt: string;
  updatedAt: string;
}

export function SafetyIncidentTab({ department }: SafetyIncidentTabProps) {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menggunakan toast system yang robust
  const { showError } = useToastContext();
  const { executeCreate } = useApiToast();

  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().getMonth() + 1);

  const [newIncident, setNewIncident] = useState({
    month: currentMonth,
    year: currentYear,
    nearmiss: 0,
    kecAlat: 0,
    kecKecil: 0,
    kecRingan: 0,
    kecBerat: 0,
    fatality: 0,
  });

  const loadSafetyIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/safety-incident");

      if (response.ok) {
        const result = await response.json();
        setIncidents(result.data || []);
      } else {
        const error = await response.json();
        console.error("Failed to load safety incidents:", error);
        showError(error.error || "Gagal memuat data safety incidents");
      }
    } catch (error) {
      console.error("Error loading safety incidents:", error);
      showError("Error saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Load safety incidents on component mount
  useEffect(() => {
    if (department.code === "MTCENG") {
      loadSafetyIncidents();
    }
  }, [department.code, loadSafetyIncidents]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await executeCreate(
      () =>
        fetch("/api/safety-incident", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newIncident),
        }),
      "safety incident"
    );

    if (result.success) {
      // Reset form to current month/year
      setNewIncident({
        month: currentMonth,
        year: currentYear,
        nearmiss: 0,
        kecAlat: 0,
        kecKecil: 0,
        kecRingan: 0,
        kecBerat: 0,
        fatality: 0,
      });

      // Reload data
      loadSafetyIncidents();
      // Notify other tabs about the data change
      notifyDataUpdate(DATA_CATEGORIES.SAFETY_INCIDENTS);
    }

    setIsSubmitting(false);
  };

  const handleNumberChange = (
    field: keyof typeof newIncident,
    value: string
  ) => {
    // Remove leading zeros and convert to number
    const cleanValue = value.replace(/^0+/, "") || "0";
    const numValue = parseInt(cleanValue) || 0;
    setNewIncident((prev) => ({ ...prev, [field]: Math.max(0, numValue) }));
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

  const getTotalIncidents = (incident: SafetyIncident) => {
    return (
      incident.nearmiss +
      incident.kecAlat +
      incident.kecKecil +
      incident.kecRingan +
      incident.kecBerat +
      incident.fatality
    );
  };

  // Only show if department is MTC&ENG
  if (department.code !== "MTCENG") {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Data Safety Incident hanya tersedia untuk MTC&ENG Bureau.
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
            <Shield className="h-5 w-5" />
            Input Data Safety Incident
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Bulan</label>
                <Select
                  value={newIncident.month.toString()}
                  onValueChange={(value) =>
                    setNewIncident((prev) => ({
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
                  value={newIncident.year}
                  onChange={(e) => {
                    const cleanValue =
                      e.target.value.replace(/^0+/, "") ||
                      currentYear.toString();
                    const numValue = parseInt(cleanValue) || currentYear;
                    setNewIncident((prev) => ({
                      ...prev,
                      year: Math.max(2020, Math.min(currentYear + 1, numValue)),
                    }));
                  }}
                  min={2020}
                  max={currentYear + 1}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Near Miss</label>
                <Input
                  type="number"
                  value={newIncident.nearmiss}
                  onChange={(e) =>
                    handleNumberChange("nearmiss", e.target.value)
                  }
                  min={0}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Alat</label>
                <Input
                  type="number"
                  value={newIncident.kecAlat}
                  onChange={(e) =>
                    handleNumberChange("kecAlat", e.target.value)
                  }
                  min={0}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Kecil</label>
                <Input
                  type="number"
                  value={newIncident.kecKecil}
                  onChange={(e) =>
                    handleNumberChange("kecKecil", e.target.value)
                  }
                  min={0}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Ringan</label>
                <Input
                  type="number"
                  value={newIncident.kecRingan}
                  onChange={(e) =>
                    handleNumberChange("kecRingan", e.target.value)
                  }
                  min={0}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Berat</label>
                <Input
                  type="number"
                  value={newIncident.kecBerat}
                  onChange={(e) =>
                    handleNumberChange("kecBerat", e.target.value)
                  }
                  min={0}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Fatality</label>
                <Input
                  type="number"
                  value={newIncident.fatality}
                  onChange={(e) =>
                    handleNumberChange("fatality", e.target.value)
                  }
                  min={0}
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
                    Simpan Data Safety
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ringkasan Data Safety Incident
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : incidents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.map((incident) => (
                <div
                  key={`${incident.year}-${incident.month}`}
                  className="border rounded-lg p-4"
                >
                  <h4 className="font-medium mb-3">
                    {monthNames[incident.month - 1]} {incident.year}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Near Miss:</span>
                      <span className="font-medium">{incident.nearmiss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kec. Alat:</span>
                      <span className="font-medium">{incident.kecAlat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kec. Kecil:</span>
                      <span className="font-medium">{incident.kecKecil}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kec. Ringan:</span>
                      <span className="font-medium">{incident.kecRingan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kec. Berat:</span>
                      <span className="font-medium text-orange-600">
                        {incident.kecBerat}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fatality:</span>
                      <span className="font-medium text-red-600">
                        {incident.fatality}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold">
                          {getTotalIncidents(incident)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Update:{" "}
                    {new Date(incident.updatedAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Belum ada data safety incident yang tercatat.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
