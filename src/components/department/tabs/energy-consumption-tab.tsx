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
import {
  Plus,
  Battery,
  BarChart3,
  Factory,
  Pickaxe,
  Building,
} from "lucide-react";

interface EnergyConsumptionTabProps {
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

interface EnergyConsumption {
  id: number;
  year: number;
  month: number;
  plnConsumption: number;
  tambangConsumption: number;
  pabrikConsumption: number;
  supportingConsumption: number;
}

export function EnergyConsumptionTab({
  department,
}: EnergyConsumptionTabProps) {
  const [consumptionData] = useState<EnergyConsumption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [newConsumption, setNewConsumption] = useState({
    month: currentMonth,
    year: currentYear,
    plnConsumption: 0,
    tambangConsumption: 0,
    pabrikConsumption: 0,
    supportingConsumption: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call would go here
      console.log("Submitting energy consumption:", newConsumption);

      // Reset form
      setNewConsumption({
        month: currentMonth,
        year: currentYear,
        plnConsumption: 0,
        tambangConsumption: 0,
        pabrikConsumption: 0,
        supportingConsumption: 0,
      });
    } catch (error) {
      console.error("Error submitting energy consumption:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberChange = (
    field: keyof typeof newConsumption,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setNewConsumption((prev) => ({ ...prev, [field]: Math.max(0, numValue) }));
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
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Menyimpan..." : "Simpan Data Konsumsi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Consumption Data */}
      {consumptionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data Energy Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consumptionData.map((data) => (
                <div
                  key={`${data.year}-${data.month}`}
                  className="border rounded-lg p-4"
                >
                  <h4 className="font-medium mb-3">
                    {monthNames[data.month - 1]} {data.year}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">PLN</span>
                      <span className="font-medium text-blue-600">
                        {data.plnConsumption.toFixed(2)} MWh
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Tambang</span>
                      <span className="font-medium text-amber-600">
                        {data.tambangConsumption.toFixed(2)} MWh
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Pabrik</span>
                      <span className="font-medium text-green-600">
                        {data.pabrikConsumption.toFixed(2)} MWh
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Supporting</span>
                      <span className="font-medium text-purple-600">
                        {data.supportingConsumption.toFixed(2)} MWh
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Total Consumption:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {getTotalConsumption(data).toFixed(2)} MWh
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {consumptionData.length === 0 && (
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertDescription>
            Belum ada data energy consumption yang tercatat untuk tahun ini.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
