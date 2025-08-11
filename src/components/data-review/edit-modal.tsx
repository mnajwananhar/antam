"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, X } from "lucide-react";
import { notifyDataUpdate } from "@/lib/utils/data-sync";
import { useStandardFeedback } from "@/lib/hooks/use-standard-feedback";
import { LoadingState } from "@/components/ui/loading";
import { shouldRequireApproval, getCategoryTableName, createApprovalRequest } from "@/lib/utils/approval-helper";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  recordId: number | null;
  onSuccess: () => void;
}

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "date";
  options?: { value: string; label: string; }[];
  required?: boolean;
  min?: number;
  max?: number;
}

const FIELD_CONFIGS: Record<string, FieldConfig[]> = {
  "kta-tta": [
    { key: "statusTindakLanjut", label: "Status Tindak Lanjut", type: "select", required: true,
      options: [
        { value: "OPEN", label: "Open" },
        { value: "CLOSE", label: "Close" }
      ]
    }
  ],
  "maintenance-routine": [
    { key: "jobName", label: "Nama Pekerjaan", type: "text", required: true },
    { key: "startDate", label: "Tanggal Mulai", type: "date", required: true },
    { key: "endDate", label: "Tanggal Selesai", type: "date", required: false },
    { key: "uniqueNumber", label: "Nomor Unik", type: "text", required: false },
    { key: "type", label: "Tipe", type: "select", required: true,
      options: [
        { value: "PREM", label: "Preventive" },
        { value: "CORM", label: "Corrective" }
      ]
    }
  ],
  "critical-issues": [
    { key: "issueName", label: "Nama Issue", type: "text", required: true },
    { key: "status", label: "Status", type: "select", required: true, 
      options: [
        { value: "WORKING", label: "Working" },
        { value: "STANDBY", label: "Standby" },
        { value: "BREAKDOWN", label: "Breakdown" }
      ]
    },
    { key: "description", label: "Deskripsi", type: "textarea", required: true }
  ],
  "safety-incidents": [
    { key: "month", label: "Bulan", type: "number", required: true, min: 1, max: 12 },
    { key: "year", label: "Tahun", type: "number", required: true, min: 2020, max: 2030 },
    { key: "nearmiss", label: "Near Miss", type: "number", required: true, min: 0 },
    { key: "kecAlat", label: "Kecelakaan Alat", type: "number", required: true, min: 0 },
    { key: "kecKecil", label: "Kecelakaan Kecil", type: "number", required: true, min: 0 },
    { key: "kecRingan", label: "Kecelakaan Ringan", type: "number", required: true, min: 0 },
    { key: "kecBerat", label: "Kecelakaan Berat", type: "number", required: true, min: 0 },
    { key: "fatality", label: "Fatality", type: "number", required: true, min: 0 }
  ],
  "energy-targets": [
    { key: "month", label: "Bulan", type: "number", required: true, min: 1, max: 12 },
    { key: "year", label: "Tahun", type: "number", required: true, min: 2020, max: 2030 },
    { key: "ikesTarget", label: "IKES Target", type: "number", required: false, min: 0 },
    { key: "emissionTarget", label: "Emission Target", type: "number", required: false, min: 0 }
  ],
  "energy-consumption": [
    { key: "month", label: "Bulan", type: "number", required: true, min: 1, max: 12 },
    { key: "year", label: "Tahun", type: "number", required: true, min: 2020, max: 2030 },
    { key: "plnConsumption", label: "PLN Consumption (MWh)", type: "number", required: true, min: 0 },
    { key: "tambangConsumption", label: "Tambang Consumption (MWh)", type: "number", required: true, min: 0 },
    { key: "pabrikConsumption", label: "Pabrik Consumption (MWh)", type: "number", required: true, min: 0 },
    { key: "supportingConsumption", label: "Supporting Consumption (MWh)", type: "number", required: true, min: 0 }
  ]
};

const API_ENDPOINTS: Record<string, string> = {
  "kta-tta": "kta-tta",
  "maintenance-routine": "maintenance-routine",
  "critical-issues": "critical-issue",
  "safety-incidents": "safety-incident", 
  "energy-targets": "energy-ikes",
  "energy-consumption": "energy-consumption"
};

const DATA_CATEGORIES: Record<string, string> = {
  "kta-tta": "kta-tta",
  "maintenance-routine": "maintenance-routine",
  "critical-issues": "critical-issues",
  "safety-incidents": "safety-incidents", 
  "energy-targets": "energy-targets",
  "energy-consumption": "energy-consumption"
};

export function EditModal({ isOpen, onClose, categoryId, recordId, onSuccess }: EditModalProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<Record<string, string | number>>({});
  const [originalData, setOriginalData] = useState<Record<string, string | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Standard feedback system
  const { feedback } = useStandardFeedback();

  const fields = FIELD_CONFIGS[categoryId] || [];
  const apiEndpoint = API_ENDPOINTS[categoryId];

  const loadData = useCallback(async () => {
    if (!apiEndpoint || !recordId) {
      setErrors({ general: "Parameter tidak lengkap untuk memuat data" });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch(`/api/${apiEndpoint}/${recordId}`);
      if (response.ok) {
        const result = await response.json();
        const loadedData = result.data || {};
        setData(loadedData);
        setOriginalData(loadedData); // Store original data for approval comparison
      } else if (response.status === 404) {
        throw new Error("Data tidak ditemukan");
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data untuk edit";
      feedback.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, recordId, feedback]);

  // Load data for edit
  useEffect(() => {
    if (isOpen && recordId && apiEndpoint && !errors.general) {
      loadData();
    }
    
    // Reset data when modal closes
    if (!isOpen) {
      setData({});
      setOriginalData({});
      setErrors({});
    }
  }, [isOpen, recordId, apiEndpoint]); // Removed loadData from dependencies to prevent infinite loop

  const handleSave = async () => {
    setIsSaving(true);
    setErrors({});

    // Validate required fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && (!data[field.key] || data[field.key] === "")) {
        newErrors[field.key] = `${field.label} wajib diisi`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSaving(false);
      return;
    }

    try {
      // Check if user requires approval for data changes
      if (session?.user && shouldRequireApproval(session.user.role)) {
        // Create approval request instead of direct update
        const tableName = getCategoryTableName(categoryId);
        
        if (!session.user.id) {
          throw new Error("User ID tidak ditemukan");
        }
        
        const result = await createApprovalRequest({
          requestType: "data_change",
          tableName,
          recordId: recordId as number,
          oldData: originalData as Record<string, unknown>,
          newData: data as Record<string, unknown>,
          requesterId: parseInt(session.user.id),
        });

        if (result.success) {
          feedback.success("Permintaan perubahan data telah dikirim untuk approval");
          onSuccess();
          onClose();
        } else {
          throw new Error(result.error || "Gagal membuat permintaan approval");
        }
      } else {
        // Direct update for ADMIN/PLANNER
        const response = await fetch(`/api/${apiEndpoint}/${recordId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          // Notify other components about data change
          notifyDataUpdate(DATA_CATEGORIES[categoryId]);
          feedback.updated("Data");
          onSuccess();
          onClose();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal menyimpan data");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      feedback.updateFailed("data", error instanceof Error ? error.message : undefined);
      setErrors({ 
        general: error instanceof Error ? error.message : "Gagal menyimpan data" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: string | number) => {
    setData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = data[field.key] || "";
    const error = errors[field.key];

    switch (field.type) {
      case "select":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={String(value || "")} onValueChange={(val) => handleFieldChange(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Pilih ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.key}
              value={String(value || "")}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Masukkan ${field.label}`}
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={String(value || "")}
              onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
              placeholder={`Masukkan ${field.label}`}
              min={field.min}
              max={field.max}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case "date":
        const formatDateValue = (val: unknown): string => {
          if (!val) return "";
          try {
            const dateStr = String(val);
            // If already in YYYY-MM-DD format, return as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              return dateStr;
            }
            // Try to parse and format the date
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
              return "";
            }
            return date.toISOString().split('T')[0];
          } catch {
            return "";
          }
        };
        
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.key}
              type="date"
              value={formatDateValue(value)}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.key}
              value={String(value || "")}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Masukkan ${field.label}`}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
    }
  };

  if (!fields.length) {
    return null; // Category not supported for inline edit
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Data</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Memuat data untuk edit..." />
        ) : (
          <div className="space-y-4">
            {errors.general && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {fields.map(renderField)}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}