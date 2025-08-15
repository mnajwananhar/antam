"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Edit,
  Save,
  X,
  Info,
} from "lucide-react";

interface ManageDataItem {
  id: number;
  type: string;
  title: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status?: string;
  canEdit: boolean;
  canDelete: boolean;
  data: Record<string, unknown>;
}

interface ManageDataEditDialogProps {
  item: ManageDataItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  getTypeLabel: (type: string) => string;
}

export function ManageDataEditDialog({
  item,
  isOpen,
  onClose,
  onSave,
  getTypeLabel,
}: ManageDataEditDialogProps): React.JSX.Element {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item && isOpen) {
      setFormData({ ...item.data });
      setErrors({});
    }
  }, [item, isOpen]);

  const handleInputChange = (field: string, value: unknown): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (item.type) {
      case "operational_report":
        if (!formData.shiftType) {
          newErrors.shiftType = "Shift type harus diisi";
        }
        if (typeof formData.totalWorking !== "number" || formData.totalWorking < 0) {
          newErrors.totalWorking = "Total working hours harus berupa angka positif";
        }
        if (typeof formData.totalStandby !== "number" || formData.totalStandby < 0) {
          newErrors.totalStandby = "Total standby hours harus berupa angka positif";
        }
        if (typeof formData.totalBreakdown !== "number" || formData.totalBreakdown < 0) {
          newErrors.totalBreakdown = "Total breakdown hours harus berupa angka positif";
        }
        break;

      case "kta_tta":
        if (!formData.namaPelapor || String(formData.namaPelapor).trim() === "") {
          newErrors.namaPelapor = "Nama pelapor harus diisi";
        }
        if (!formData.lokasi || String(formData.lokasi).trim() === "") {
          newErrors.lokasi = "Lokasi harus diisi";
        }
        break;

      case "critical_issue":
        if (!formData.issueName || String(formData.issueName).trim() === "") {
          newErrors.issueName = "Nama masalah harus diisi";
        }
        if (!formData.description || String(formData.description).trim() === "") {
          newErrors.description = "Deskripsi harus diisi";
        }
        break;

      case "maintenance_routine":
        if (!formData.jobName || String(formData.jobName).trim() === "") {
          newErrors.jobName = "Nama pekerjaan harus diisi";
        }
        if (!formData.startDate) {
          newErrors.startDate = "Tanggal mulai harus diisi";
        }
        break;

      case "safety_incident":
        // Validate numeric fields
        const numericFields = ["nearmiss", "kecAlat", "kecKecil", "kecRingan", "kecBerat", "fatality"];
        numericFields.forEach(field => {
          if (typeof formData[field] !== "number" || formData[field] < 0) {
            newErrors[field] = `${field} harus berupa angka positif`;
          }
        });
        break;

      case "energy_realization":
        if (typeof formData.ikesRealization !== "number" || formData.ikesRealization < 0) {
          newErrors.ikesRealization = "IKES realization harus berupa angka positif";
        }
        if (typeof formData.emissionRealization !== "number" || formData.emissionRealization < 0) {
          newErrors.emissionRealization = "Emission realization harus berupa angka positif";
        }
        break;

      case "energy_consumption":
        const consumptionFields = ["tambangConsumption", "pabrikConsumption", "supportingConsumption"];
        consumptionFields.forEach(field => {
          if (typeof formData[field] !== "number" || formData[field] < 0) {
            newErrors[field] = `${field} harus berupa angka positif`;
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = (): React.JSX.Element => {
    switch (item.type) {
      case "operational_report":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalWorking">Total Working (jam)</Label>
                <Input
                  id="totalWorking"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.totalWorking?.toString() ?.toString() || ""}
                  onChange={(e) => handleInputChange("totalWorking", parseFloat(e.target.value) || 0)}
                  className={errors.totalWorking ? "border-red-500" : ""}
                />
                {errors.totalWorking && (
                  <p className="text-sm text-red-600">{errors.totalWorking}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalStandby">Total Standby (jam)</Label>
                <Input
                  id="totalStandby"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.totalStandby ?.toString() || ""}
                  onChange={(e) => handleInputChange("totalStandby", parseFloat(e.target.value) || 0)}
                  className={errors.totalStandby ? "border-red-500" : ""}
                />
                {errors.totalStandby && (
                  <p className="text-sm text-red-600">{errors.totalStandby}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalBreakdown">Total Breakdown (jam)</Label>
                <Input
                  id="totalBreakdown"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.totalBreakdown ?.toString() || ""}
                  onChange={(e) => handleInputChange("totalBreakdown", parseFloat(e.target.value) || 0)}
                  className={errors.totalBreakdown ? "border-red-500" : ""}
                />
                {errors.totalBreakdown && (
                  <p className="text-sm text-red-600">{errors.totalBreakdown}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftType">Shift Type</Label>
                <Select
                  value={String(formData.shiftType ?.toString() || "")}
                  onValueChange={(value) => handleInputChange("shiftType", value)}
                >
                  <SelectTrigger className={errors.shiftType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Pilih shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHIFT_1">Shift 1</SelectItem>
                    <SelectItem value="SHIFT_2">Shift 2</SelectItem>
                    <SelectItem value="SHIFT_3">Shift 3</SelectItem>
                    <SelectItem value="LONG_SHIFT_1">Long Shift 1</SelectItem>
                    <SelectItem value="LONG_SHIFT_2">Long Shift 2</SelectItem>
                  </SelectContent>
                </Select>
                {errors.shiftType && (
                  <p className="text-sm text-red-600">{errors.shiftType}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={String(formData.notes ?.toString() || "")}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Tambahkan catatan..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isComplete"
                checked={Boolean(formData.isComplete)}
                onCheckedChange={(checked) => handleInputChange("isComplete", checked)}
              />
              <Label htmlFor="isComplete">Laporan selesai</Label>
            </div>
          </div>
        );

      case "kta_tta":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="namaPelapor">Nama Pelapor</Label>
                <Input
                  id="namaPelapor"
                  value={String(formData.namaPelapor ?.toString() || "")}
                  onChange={(e) => handleInputChange("namaPelapor", e.target.value)}
                  className={errors.namaPelapor ? "border-red-500" : ""}
                />
                {errors.namaPelapor && (
                  <p className="text-sm text-red-600">{errors.namaPelapor}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lokasi">Lokasi</Label>
                <Input
                  id="lokasi"
                  value={String(formData.lokasi ?.toString() || "")}
                  onChange={(e) => handleInputChange("lokasi", e.target.value)}
                  className={errors.lokasi ? "border-red-500" : ""}
                />
                {errors.lokasi && (
                  <p className="text-sm text-red-600">{errors.lokasi}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="picDepartemen">PIC Departemen</Label>
                <Input
                  id="picDepartemen"
                  value={String(formData.picDepartemen ?.toString() || "")}
                  onChange={(e) => handleInputChange("picDepartemen", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusTindakLanjut">Status Tindak Lanjut</Label>
                <Select
                  value={String(formData.statusTindakLanjut ?.toString() || "")}
                  onValueChange={(value) => handleInputChange("statusTindakLanjut", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSE">Close</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <CustomCalendar
                value={formData.dueDate ? new Date(formData.dueDate as string).toISOString().split('T')[0] : ""}
                onChange={(value) => handleInputChange("dueDate", value ? new Date(value).toISOString() : undefined)}
                placeholder="Pilih tanggal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={String(formData.keterangan ?.toString() || "")}
                onChange={(e) => handleInputChange("keterangan", e.target.value)}
                placeholder="Tambahkan keterangan..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tindakLanjutLangsung">Tindak Lanjut Langsung</Label>
              <Textarea
                id="tindakLanjutLangsung"
                value={String(formData.tindakLanjutLangsung ?.toString() || "")}
                onChange={(e) => handleInputChange("tindakLanjutLangsung", e.target.value)}
                placeholder="Tambahkan tindak lanjut..."
              />
            </div>
          </div>
        );

      case "critical_issue":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueName">Nama Masalah</Label>
              <Input
                id="issueName"
                value={String(formData.issueName ?.toString() || "")}
                onChange={(e) => handleInputChange("issueName", e.target.value)}
                className={errors.issueName ? "border-red-500" : ""}
              />
              {errors.issueName && (
                <p className="text-sm text-red-600">{errors.issueName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={String(formData.status ?.toString() || "")}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INVESTIGASI">Investigasi</SelectItem>
                  <SelectItem value="PROSES">Proses</SelectItem>
                  <SelectItem value="SELESAI">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={String(formData.description ?.toString() || "")}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={errors.description ? "border-red-500" : ""}
                placeholder="Tambahkan deskripsi masalah..."
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>
        );

      case "maintenance_routine":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobName">Nama Pekerjaan</Label>
              <Input
                id="jobName"
                value={String(formData.jobName ?.toString() || "")}
                onChange={(e) => handleInputChange("jobName", e.target.value)}
                className={errors.jobName ? "border-red-500" : ""}
              />
              {errors.jobName && (
                <p className="text-sm text-red-600">{errors.jobName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <CustomCalendar
                  value={formData.startDate ? new Date(formData.startDate as string).toISOString().split('T')[0] : ""}
                  onChange={(value) => handleInputChange("startDate", value ? new Date(value).toISOString() : undefined)}
                  placeholder="Pilih tanggal mulai"
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <CustomCalendar
                  value={formData.endDate ? new Date(formData.endDate as string).toISOString().split('T')[0] : ""}
                  onChange={(value) => handleInputChange("endDate", value ? new Date(value).toISOString() : undefined)}
                  placeholder="Pilih tanggal selesai"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={String(formData.description ?.toString() || "")}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tambahkan deskripsi pekerjaan..."
              />
            </div>
          </div>
        );

      case "safety_incident":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nearmiss">Near Miss</Label>
                <Input
                  id="nearmiss"
                  type="number"
                  min="0"
                  value={formData.nearmiss ?.toString() || ""}
                  onChange={(e) => handleInputChange("nearmiss", parseInt(e.target.value) || 0)}
                  className={errors.nearmiss ? "border-red-500" : ""}
                />
                {errors.nearmiss && (
                  <p className="text-sm text-red-600">{errors.nearmiss}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecAlat">Kecelakaan Alat</Label>
                <Input
                  id="kecAlat"
                  type="number"
                  min="0"
                  value={formData.kecAlat ?.toString() || ""}
                  onChange={(e) => handleInputChange("kecAlat", parseInt(e.target.value) || 0)}
                  className={errors.kecAlat ? "border-red-500" : ""}
                />
                {errors.kecAlat && (
                  <p className="text-sm text-red-600">{errors.kecAlat}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kecKecil">Kec. Kecil</Label>
                <Input
                  id="kecKecil"
                  type="number"
                  min="0"
                  value={formData.kecKecil ?.toString() || ""}
                  onChange={(e) => handleInputChange("kecKecil", parseInt(e.target.value) || 0)}
                  className={errors.kecKecil ? "border-red-500" : ""}
                />
                {errors.kecKecil && (
                  <p className="text-sm text-red-600">{errors.kecKecil}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecRingan">Kec. Ringan</Label>
                <Input
                  id="kecRingan"
                  type="number"
                  min="0"
                  value={formData.kecRingan ?.toString() || ""}
                  onChange={(e) => handleInputChange("kecRingan", parseInt(e.target.value) || 0)}
                  className={errors.kecRingan ? "border-red-500" : ""}
                />
                {errors.kecRingan && (
                  <p className="text-sm text-red-600">{errors.kecRingan}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecBerat">Kec. Berat</Label>
                <Input
                  id="kecBerat"
                  type="number"
                  min="0"
                  value={formData.kecBerat ?.toString() || ""}
                  onChange={(e) => handleInputChange("kecBerat", parseInt(e.target.value) || 0)}
                  className={errors.kecBerat ? "border-red-500" : ""}
                />
                {errors.kecBerat && (
                  <p className="text-sm text-red-600">{errors.kecBerat}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatality">Fatality</Label>
              <Input
                id="fatality"
                type="number"
                min="0"
                value={formData.fatality ?.toString() || ""}
                onChange={(e) => handleInputChange("fatality", parseInt(e.target.value) || 0)}
                className={errors.fatality ? "border-red-500" : ""}
              />
              {errors.fatality && (
                <p className="text-sm text-red-600">{errors.fatality}</p>
              )}
            </div>
          </div>
        );

      case "energy_realization":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ikesRealization">IKES Realization</Label>
                <Input
                  id="ikesRealization"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.ikesRealization ?.toString() || ""}
                  onChange={(e) => handleInputChange("ikesRealization", parseFloat(e.target.value) || 0)}
                  className={errors.ikesRealization ? "border-red-500" : ""}
                />
                {errors.ikesRealization && (
                  <p className="text-sm text-red-600">{errors.ikesRealization}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emissionRealization">Emission Realization</Label>
                <Input
                  id="emissionRealization"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.emissionRealization ?.toString() || ""}
                  onChange={(e) => handleInputChange("emissionRealization", parseFloat(e.target.value) || 0)}
                  className={errors.emissionRealization ? "border-red-500" : ""}
                />
                {errors.emissionRealization && (
                  <p className="text-sm text-red-600">{errors.emissionRealization}</p>
                )}
              </div>
            </div>
          </div>
        );

      case "energy_consumption":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tambangConsumption">Tambang Consumption</Label>
                <Input
                  id="tambangConsumption"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.tambangConsumption ?.toString() || ""}
                  onChange={(e) => handleInputChange("tambangConsumption", parseFloat(e.target.value) || 0)}
                  className={errors.tambangConsumption ? "border-red-500" : ""}
                />
                {errors.tambangConsumption && (
                  <p className="text-sm text-red-600">{errors.tambangConsumption}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pabrikConsumption">Pabrik Consumption</Label>
                <Input
                  id="pabrikConsumption"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pabrikConsumption ?.toString() || ""}
                  onChange={(e) => handleInputChange("pabrikConsumption", parseFloat(e.target.value) || 0)}
                  className={errors.pabrikConsumption ? "border-red-500" : ""}
                />
                {errors.pabrikConsumption && (
                  <p className="text-sm text-red-600">{errors.pabrikConsumption}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportingConsumption">Supporting Consumption</Label>
                <Input
                  id="supportingConsumption"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.supportingConsumption ?.toString() || ""}
                  onChange={(e) => handleInputChange("supportingConsumption", parseFloat(e.target.value) || 0)}
                  className={errors.supportingConsumption ? "border-red-500" : ""}
                />
                {errors.supportingConsumption && (
                  <p className="text-sm text-red-600">{errors.supportingConsumption}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Form untuk tipe data &quot;{item.type}&quot; belum tersedia.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit {getTypeLabel(item.type)}
          </DialogTitle>
          <DialogDescription>
            Edit data untuk &quot;{item.title}&quot;
            {session?.user.role === "INPUTTER" && (
              <span className="block mt-1 text-orange-600">
                Perubahan akan diajukan untuk persetujuan
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {session?.user.role === "INPUTTER" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Sebagai Inputter, perubahan yang Anda buat akan dikirim ke sistem approval. 
              Planner atau Admin akan meninjau dan menyetujui perubahan Anda.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {renderFormFields()}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
