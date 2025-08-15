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
import { Plus, Shield, Loader2 } from "lucide-react";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    }

    setIsSubmitting(false);
  };

  const handleNumberChange = (
    field: keyof typeof newIncident,
    value: string
  ) => {
    // Allow only digits, convert to number with max limit 1000
    const numericValue = value.replace(/\D/g, '');
    const numValue = parseInt(numericValue) || 0;
    setNewIncident((prev) => ({ 
      ...prev, 
      [field]: Math.max(0, Math.min(1000, numValue))
    }));
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
                  type="text"
                  value={newIncident.year.toString()}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    const numValue = parseInt(numericValue) || currentYear;
                    setNewIncident((prev) => ({
                      ...prev,
                      year: Math.max(2020, Math.min(currentYear + 1, numValue)),
                    }));
                  }}
                  placeholder="2025"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Near Miss</label>
                <Input
                  type="text"
                  value={newIncident.nearmiss.toString()}
                  onChange={(e) =>
                    handleNumberChange("nearmiss", e.target.value)
                  }
                  placeholder="0-1000"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Alat</label>
                <Input
                  type="text"
                  value={newIncident.kecAlat.toString()}
                  onChange={(e) =>
                    handleNumberChange("kecAlat", e.target.value)
                  }
                  placeholder="0-1000"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Kecil</label>
                <Input
                  type="text"
                  value={newIncident.kecKecil.toString()}
                  onChange={(e) =>
                    handleNumberChange("kecKecil", e.target.value)
                  }
                  placeholder="0-1000"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Ringan</label>
                <Input
                  type="text"
                  value={newIncident.kecRingan.toString()}
                  onChange={(e) =>
                    handleNumberChange("kecRingan", e.target.value)
                  }
                  placeholder="0-1000"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kecelakaan Berat</label>
                <Input
                  type="text"
                  value={newIncident.kecBerat.toString()}
                  onChange={(e) =>
                    handleNumberChange("kecBerat", e.target.value)
                  }
                  placeholder="0-1000"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Fatality</label>
                <Input
                  type="text"
                  value={newIncident.fatality.toString()}
                  onChange={(e) =>
                    handleNumberChange("fatality", e.target.value)
                  }
                  placeholder="0-1000"
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

    </div>
  );
}
