"use client";

import { useState } from "react";
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
import { Plus, Zap, TrendingUp, Target, Activity } from "lucide-react";

interface EnergyIkesTabProps {
  department: {
    id: number;
    name: string;
    code: string;
  };
  session: {
    user: {
      id: string;
      username: string;
      role: string;
    };
  };
}

interface EnergyData {
  id: number;
  year: number;
  month: number;
  ikesTarget?: number;
  emissionTarget?: number;
  ikesRealization?: number;
  emissionRealization?: number;
}

export function EnergyIkesTab({ department }: EnergyIkesTabProps) {
  const [energyData] = useState<EnergyData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call would go here
      console.log("Submitting energy data:", { ...newData, dataType });

      // Reset form
      setNewData({
        month: currentMonth,
        year: currentYear,
        ikesTarget: 0,
        emissionTarget: 0,
        ikesRealization: 0,
        emissionRealization: 0,
      });
    } catch (error) {
      console.error("Error submitting energy data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberChange = (field: keyof typeof newData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setNewData((prev) => ({ ...prev, [field]: Math.max(0, numValue) }));
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
                  onChange={(e) =>
                    setNewData((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value) || currentYear,
                    }))
                  }
                  min={2020}
                  max={currentYear + 5}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  IKES {dataType === "target" ? "Target" : "Realisasi"}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    dataType === "target"
                      ? newData.ikesTarget
                      : newData.ikesRealization
                  }
                  onChange={(e) =>
                    handleNumberChange(
                      dataType === "target" ? "ikesTarget" : "ikesRealization",
                      e.target.value
                    )
                  }
                  min={0}
                  placeholder="Masukkan nilai IKES"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Emission {dataType === "target" ? "Target" : "Realisasi"}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    dataType === "target"
                      ? newData.emissionTarget
                      : newData.emissionRealization
                  }
                  onChange={(e) =>
                    handleNumberChange(
                      dataType === "target"
                        ? "emissionTarget"
                        : "emissionRealization",
                      e.target.value
                    )
                  }
                  min={0}
                  placeholder="Masukkan nilai emission"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? "Menyimpan..."
                  : `Simpan ${dataType === "target" ? "Target" : "Realisasi"}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Data Summary */}
      {energyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Data Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {energyData
                  .filter(
                    (data) =>
                      data.ikesTarget !== undefined ||
                      data.emissionTarget !== undefined
                  )
                  .map((data) => (
                    <div
                      key={`target-${data.year}-${data.month}`}
                      className="border rounded-lg p-4"
                    >
                      <h4 className="font-medium mb-2">
                        {monthNames[data.month - 1]} {data.year}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>IKES Target:</span>
                          <span className="font-medium">
                            {data.ikesTarget?.toFixed(2) || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Emission Target:</span>
                          <span className="font-medium">
                            {data.emissionTarget?.toFixed(2) || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Realization Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Data Realisasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {energyData
                  .filter(
                    (data) =>
                      data.ikesRealization !== undefined ||
                      data.emissionRealization !== undefined
                  )
                  .map((data) => (
                    <div
                      key={`realization-${data.year}-${data.month}`}
                      className="border rounded-lg p-4"
                    >
                      <h4 className="font-medium mb-2">
                        {monthNames[data.month - 1]} {data.year}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>IKES Realisasi:</span>
                          <span className="font-medium">
                            {data.ikesRealization?.toFixed(2) || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Emission Realisasi:</span>
                          <span className="font-medium">
                            {data.emissionRealization?.toFixed(2) || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {energyData.length === 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Belum ada data energy & IKES yang tercatat untuk tahun ini.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
