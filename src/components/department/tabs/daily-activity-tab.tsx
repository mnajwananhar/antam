"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  Clock,
  Calendar,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import {
  OperationalReport as OperationalReportType,
  Equipment as EquipmentType,
  Department as DepartmentType,
  ActivityDetailFormData,
  SHIFT_TYPES,
  ShiftType,
} from "@/types/daily-activity";

interface Equipment {
  id: number;
  name: string;
  code: string;
  category: string;
  status: "Working" | "Standby" | "Breakdown";
}

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
}

interface DailyActivityTabProps {
  equipment: Equipment[];
  department: Department;
  session: Session;
}

interface ActivityDetail {
  id?: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  maintenanceType: string;
  description: string;
  object: string;
  cause: string;
  effect: string;
}

export function DailyActivityTab({
  equipment,
  department,
  session,
}: DailyActivityTabProps) {
  // Sort equipment by category and number for better UX
  const sortedEquipment = React.useMemo(() => {
    return [...equipment].sort((a, b) => {
      // First, extract base category name (remove numbers/codes)
      const getCategoryBase = (name: string) => {
        return name.replace(/\s+\d+.*$/, "").trim();
      };

      const categoryA = getCategoryBase(a.name);
      const categoryB = getCategoryBase(b.name);

      // If different categories, sort alphabetically
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }

      // Same category, extract numbers for sorting
      const extractNumber = (name: string) => {
        const match = name.match(/\s(\d+)(?:\s|$)/);
        return match ? parseInt(match[1], 10) : 999; // Put non-numbered items at end
      };

      const numberA = extractNumber(a.name);
      const numberB = extractNumber(b.name);

      // Sort by number within same category
      if (numberA !== numberB) {
        return numberA - numberB;
      }

      // If same number or both non-numbered, sort by full name
      return a.name.localeCompare(b.name);
    });
  }, [equipment]);
  const [reportDate, setReportDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [shiftType, setShiftType] = useState<ShiftType>("shift-1");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Operational Report State
  const [operationalReport, setOperationalReport] =
    useState<OperationalReportType | null>(null);
  const [totalWorking, setTotalWorking] = useState<number>(0);
  const [totalStandby, setTotalStandby] = useState<number>(0);
  const [totalBreakdown, setTotalBreakdown] = useState<number>(0);

  // Activity Details State
  const [workingActivities, setWorkingActivities] = useState<ActivityDetail[]>(
    []
  );
  const [standbyActivities, setStandbyActivities] = useState<ActivityDetail[]>(
    []
  );
  const [breakdownActivities, setBreakdownActivities] = useState<
    ActivityDetail[]
  >([]);

  const targetHours =
    SHIFT_TYPES.find((s) => s.value === shiftType)?.targetHours || 8;
  const totalHours = totalWorking + totalStandby + totalBreakdown;
  const isTargetMet = totalHours >= targetHours;

  const loadOperationalReport = async () => {
    if (!selectedEquipment || !reportDate) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/operational-report?equipmentId=${selectedEquipment}&reportDate=${reportDate}&departmentId=${department.id}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.report) {
          setOperationalReport(data.report);
          setTotalWorking(data.report.totalWorking);
          setTotalStandby(data.report.totalStandby);
          setTotalBreakdown(data.report.totalBreakdown);

          // Group activity details by status
          const activities = data.report.activityDetails;
          setWorkingActivities(
            activities
              .filter((a: any) => a.status === "WORKING")
              .map(mapActivityDetail)
          );
          setStandbyActivities(
            activities
              .filter((a: any) => a.status === "STANDBY")
              .map(mapActivityDetail)
          );
          setBreakdownActivities(
            activities
              .filter((a: any) => a.status === "BREAKDOWN")
              .map(mapActivityDetail)
          );
        } else {
          // No existing report
          setOperationalReport(null);
          resetForm();
        }
      } else {
        throw new Error("Failed to load operational report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const mapActivityDetail = (activity: any): ActivityDetail => ({
    id: activity.id,
    startDate: activity.startDateTime
      ? format(new Date(activity.startDateTime), "yyyy-MM-dd")
      : "",
    startTime: activity.startDateTime
      ? format(new Date(activity.startDateTime), "HH:mm")
      : "",
    endDate: activity.endDateTime
      ? format(new Date(activity.endDateTime), "yyyy-MM-dd")
      : "",
    endTime: activity.endDateTime
      ? format(new Date(activity.endDateTime), "HH:mm")
      : "",
    maintenanceType: activity.maintenanceType || "",
    description: activity.description || "",
    object: activity.object || "",
    cause: activity.cause || "",
    effect: activity.effect || "",
  });

  const resetForm = () => {
    setTotalWorking(0);
    setTotalStandby(0);
    setTotalBreakdown(0);
    setWorkingActivities([]);
    setStandbyActivities([]);
    setBreakdownActivities([]);
  };

  // Clear activity details when total hours drops below target
  useEffect(() => {
    if (totalHours < targetHours) {
      setWorkingActivities([]);
      setStandbyActivities([]);
      setBreakdownActivities([]);
    }
  }, [totalHours, targetHours]);

  const saveProgress = async () => {
    if (!selectedEquipment || !reportDate) {
      setError("Pilih tanggal dan alat terlebih dahulu");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/operational-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportDate,
          equipmentId: parseInt(selectedEquipment),
          departmentId: department.id,
          totalWorking,
          totalStandby,
          totalBreakdown,
          shiftType,
          isComplete: false,
          activityDetails:
            totalHours >= targetHours
              ? [
                  ...workingActivities.map((a) => mapToApiFormat(a, "WORKING")),
                  ...standbyActivities.map((a) => mapToApiFormat(a, "STANDBY")),
                  ...breakdownActivities.map((a) =>
                    mapToApiFormat(a, "BREAKDOWN")
                  ),
                ]
              : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOperationalReport(data.report);
        setSuccess("Progres berhasil disimpan");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save progress");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const finalizeReport = async () => {
    if (!isTargetMet) {
      setError(
        `Total jam harus mencapai target ${targetHours} jam untuk shift ini`
      );
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/operational-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportDate,
          equipmentId: parseInt(selectedEquipment),
          departmentId: department.id,
          totalWorking,
          totalStandby,
          totalBreakdown,
          shiftType,
          isComplete: true,
          activityDetails:
            totalHours >= targetHours
              ? [
                  ...workingActivities.map((a) => mapToApiFormat(a, "WORKING")),
                  ...standbyActivities.map((a) => mapToApiFormat(a, "STANDBY")),
                  ...breakdownActivities.map((a) =>
                    mapToApiFormat(a, "BREAKDOWN")
                  ),
                ]
              : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOperationalReport(data.report);
        setSuccess("Laporan berhasil diselesaikan");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to finalize report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const mapToApiFormat = (activity: ActivityDetail, status: string) => {
    const startDateTime =
      activity.startDate && activity.startTime
        ? new Date(`${activity.startDate}T${activity.startTime}:00`)
        : null;
    const endDateTime =
      activity.endDate && activity.endTime
        ? new Date(`${activity.endDate}T${activity.endTime}:00`)
        : null;

    return {
      startDateTime: startDateTime?.toISOString(),
      endDateTime: endDateTime?.toISOString(),
      maintenanceType: activity.maintenanceType || null,
      description: activity.description || null,
      object: activity.object || null,
      cause: activity.cause || null,
      effect: activity.effect || null,
      status,
    };
  };

  const addActivity = (type: "working" | "standby" | "breakdown") => {
    const newActivity: ActivityDetail = {
      startDate: reportDate,
      startTime: "",
      endDate: reportDate,
      endTime: "",
      maintenanceType: "",
      description: "",
      object: "",
      cause: "",
      effect: "",
    };

    switch (type) {
      case "working":
        setWorkingActivities([...workingActivities, newActivity]);
        break;
      case "standby":
        setStandbyActivities([...standbyActivities, newActivity]);
        break;
      case "breakdown":
        setBreakdownActivities([...breakdownActivities, newActivity]);
        break;
    }
  };

  const updateActivity = (
    type: "working" | "standby" | "breakdown",
    index: number,
    field: keyof ActivityDetail,
    value: string
  ) => {
    const setter =
      type === "working"
        ? setWorkingActivities
        : type === "standby"
        ? setStandbyActivities
        : setBreakdownActivities;
    const activities =
      type === "working"
        ? workingActivities
        : type === "standby"
        ? standbyActivities
        : breakdownActivities;

    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setter(updated);
  };

  const removeActivity = (
    type: "working" | "standby" | "breakdown",
    index: number
  ) => {
    const setter =
      type === "working"
        ? setWorkingActivities
        : type === "standby"
        ? setStandbyActivities
        : setBreakdownActivities;
    const activities =
      type === "working"
        ? workingActivities
        : type === "standby"
        ? standbyActivities
        : breakdownActivities;

    setter(activities.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (selectedEquipment && reportDate) {
      loadOperationalReport();
    }
  }, [selectedEquipment, reportDate]);

  const renderActivityForm = (
    activity: ActivityDetail,
    type: "working" | "standby" | "breakdown",
    index: number
  ) => (
    <div
      key={index}
      className="border border-muted/50 rounded-lg p-4 space-y-4 bg-card"
    >
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Detail Aktivitas #{index + 1}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeActivity(type, index)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Tanggal Mulai</Label>
          <Input
            type="date"
            value={activity.startDate}
            onChange={(e) =>
              updateActivity(type, index, "startDate", e.target.value)
            }
          />
        </div>
        <div>
          <Label>Jam Mulai</Label>
          <Input
            type="time"
            value={activity.startTime}
            onChange={(e) =>
              updateActivity(type, index, "startTime", e.target.value)
            }
          />
        </div>
        <div>
          <Label>Tanggal Selesai</Label>
          <Input
            type="date"
            value={activity.endDate}
            onChange={(e) =>
              updateActivity(type, index, "endDate", e.target.value)
            }
          />
        </div>
        <div>
          <Label>Jam Selesai</Label>
          <Input
            type="time"
            value={activity.endTime}
            onChange={(e) =>
              updateActivity(type, index, "endTime", e.target.value)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Tipe MTC</Label>
          <Input
            value={activity.maintenanceType}
            onChange={(e) =>
              updateActivity(type, index, "maintenanceType", e.target.value)
            }
            placeholder="Contoh: Preventive, Corrective, dll"
          />
        </div>
        <div>
          <Label>Object (Komponen)</Label>
          <Input
            value={activity.object}
            onChange={(e) =>
              updateActivity(type, index, "object", e.target.value)
            }
            placeholder="Komponen yang terkait"
          />
        </div>
      </div>

      <div>
        <Label>Keterangan</Label>
        <Textarea
          value={activity.description}
          onChange={(e) =>
            updateActivity(type, index, "description", e.target.value)
          }
          placeholder="Deskripsi detail aktivitas"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Penyebab (Opsional)</Label>
          <Textarea
            value={activity.cause}
            onChange={(e) =>
              updateActivity(type, index, "cause", e.target.value)
            }
            placeholder="Penyebab masalah atau kondisi"
            rows={2}
          />
        </div>
        <div>
          <Label>Dampak/Akibat (Opsional)</Label>
          <Textarea
            value={activity.effect}
            onChange={(e) =>
              updateActivity(type, index, "effect", e.target.value)
            }
            placeholder="Dampak atau akibat yang ditimbulkan"
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitas Harian - {department.name}
        </CardTitle>
        <CardDescription>
          Pencatatan aktivitas harian peralatan dengan sistem kolaboratif antar
          shift
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date and Equipment Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-date" className="text-sm font-medium">
              Tanggal Laporan
            </Label>

            <CustomCalendar
              value={reportDate}
              onChange={setReportDate}
              placeholder="Pilih tanggal laporan..."
              max={format(new Date(), "yyyy-MM-dd")}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipment-select" className="text-sm font-medium">
              Pilih Alat
            </Label>
            <Select
              value={selectedEquipment}
              onValueChange={setSelectedEquipment}
            >
              <SelectTrigger id="equipment-select">
                <SelectValue placeholder="Pilih alat..." />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Group equipment by category for better display
                  const grouped = sortedEquipment.reduce((acc, eq) => {
                    const categoryBase = eq.name
                      .replace(/\s+\d+.*$/, "")
                      .trim();
                    if (!acc[categoryBase]) acc[categoryBase] = [];
                    acc[categoryBase].push(eq);
                    return acc;
                  }, {} as Record<string, typeof sortedEquipment>);

                  return Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b bg-muted/50">
                        {category}
                      </div>
                      {/* Equipment Items */}
                      {items.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{eq.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({eq.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift-select" className="text-sm font-medium">
              Shift
            </Label>
            <Select
              value={shiftType}
              onValueChange={(value: ShiftType) => setShiftType(value)}
            >
              <SelectTrigger id="shift-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_TYPES.map((shift) => (
                  <SelectItem key={shift.value} value={shift.value}>
                    {shift.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Indicator */}
        {operationalReport && (
          <div className="flex items-center gap-2">
            <Badge
              variant={operationalReport.isComplete ? "default" : "secondary"}
            >
              {operationalReport.isComplete ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </>
              ) : (
                <>
                  <Settings className="h-3 w-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
            {operationalReport.lastUpdatedBy && (
              <span className="text-sm text-muted-foreground">
                Terakhir diupdate oleh:{" "}
                {operationalReport.lastUpdatedBy.username}
              </span>
            )}
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Memuat data...</p>
          </div>
        ) : selectedEquipment ? (
          <>
            {/* Information Alert */}
            {totalHours < targetHours && (
              <Alert className="border-muted bg-muted/20">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-foreground">
                  <strong>Informasi:</strong> Anda harus mengisi total jam
                  hingga mencapai target <strong>{targetHours} jam</strong>{" "}
                  terlebih dahulu sebelum dapat menambahkan detail aktivitas.
                  Saat ini baru <strong>{totalHours} jam</strong> dari target
                  yang diperlukan.
                </AlertDescription>
              </Alert>
            )}

            {/* Hours Input */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Jam Working</Label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  step="1"
                  value={totalWorking || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setTotalWorking(Math.min(Math.max(value, 0), 12));
                  }}
                  className="custom-number-input"
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Jam Standby</Label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  step="1"
                  value={totalStandby || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setTotalStandby(Math.min(Math.max(value, 0), 12));
                  }}
                  className="custom-number-input"
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Jam Breakdown</Label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  step="1"
                  value={totalBreakdown || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setTotalBreakdown(Math.min(Math.max(value, 0), 12));
                  }}
                  className="custom-number-input"
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Total Jam</Label>
                <div className="flex items-center gap-2">
                  <Input value={totalHours} readOnly className="bg-muted" />
                  <Badge variant={isTargetMet ? "default" : "secondary"}>
                    Target: {targetHours}h
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Working Activities */}
            {totalHours >= targetHours ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-700">
                    Detail Aktivitas Working ({workingActivities.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addActivity("working")}
                    disabled={
                      operationalReport?.isComplete &&
                      session.user.role !== "ADMIN"
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-4">
                  {workingActivities.map((activity, index) =>
                    renderActivityForm(activity, "working", index)
                  )}
                  {workingActivities.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Belum ada detail aktivitas working
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-muted/50 rounded-lg bg-muted/10">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Total Jam Belum Mencapai Target
                </h3>
                <p className="text-muted-foreground mb-4">
                  Anda harus mengisi total jam hingga mencapai {targetHours} jam
                  untuk dapat menambah detail aktivitas working.
                </p>
                <p className="text-sm text-muted-foreground">
                  Saat ini: {totalHours} jam dari target {targetHours} jam
                </p>
              </div>
            )}

            <Separator />

            {/* Standby Activities */}
            {totalHours >= targetHours ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-yellow-700">
                    Detail Aktivitas Standby ({standbyActivities.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addActivity("standby")}
                    disabled={
                      operationalReport?.isComplete &&
                      session.user.role !== "ADMIN"
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-4">
                  {standbyActivities.map((activity, index) =>
                    renderActivityForm(activity, "standby", index)
                  )}
                  {standbyActivities.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Belum ada detail aktivitas standby
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-muted/50 rounded-lg bg-muted/10">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Total Jam Belum Mencapai Target
                </h3>
                <p className="text-muted-foreground mb-4">
                  Anda harus mengisi total jam hingga mencapai {targetHours} jam
                  untuk dapat menambah detail aktivitas standby.
                </p>
                <p className="text-sm text-muted-foreground">
                  Saat ini: {totalHours} jam dari target {targetHours} jam
                </p>
              </div>
            )}

            <Separator />

            {/* Breakdown Activities */}
            {totalHours >= targetHours ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-red-700">
                    Detail Aktivitas Breakdown ({breakdownActivities.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addActivity("breakdown")}
                    disabled={
                      operationalReport?.isComplete &&
                      session.user.role !== "ADMIN"
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-4">
                  {breakdownActivities.map((activity, index) =>
                    renderActivityForm(activity, "breakdown", index)
                  )}
                  {breakdownActivities.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Belum ada detail aktivitas breakdown
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-muted/50 rounded-lg bg-muted/10">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Total Jam Belum Mencapai Target
                </h3>
                <p className="text-muted-foreground mb-4">
                  Anda harus mengisi total jam hingga mencapai {targetHours} jam
                  untuk dapat menambah detail aktivitas breakdown.
                </p>
                <p className="text-sm text-muted-foreground">
                  Saat ini: {totalHours} jam dari target {targetHours} jam
                </p>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={saveProgress}
                disabled={isSaving || !selectedEquipment}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Menyimpan..." : "Simpan Progres"}
              </Button>
              <Button
                onClick={finalizeReport}
                disabled={isSaving || !isTargetMet || !selectedEquipment}
                title={
                  !isTargetMet
                    ? `Total jam harus mencapai ${targetHours} jam untuk menyelesaikan laporan`
                    : ""
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSaving ? "Menyelesaikan..." : "Selesaikan Laporan"}
              </Button>
            </div>

            {/* Info untuk tombol disabled */}
            {!isTargetMet && (
              <div className="text-center text-sm text-muted-foreground/80">
                <p>
                  💡 <strong className="text-foreground">Simpan Progres</strong>{" "}
                  dapat dilakukan kapan saja.
                  <strong className="text-foreground">
                    Selesaikan Laporan
                  </strong>{" "}
                  memerlukan total {targetHours} jam.
                </p>
              </div>
            )}

            {/* User Context */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Logged in as:{" "}
                <span className="font-medium">{session.user.username}</span> (
                {session.user.role})
                {session.user.departmentName && (
                  <span> - {session.user.departmentName}</span>
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Pilih Tanggal dan Alat
            </h3>
            <p className="text-muted-foreground">
              Silakan pilih tanggal laporan dan alat untuk mulai input aktivitas
              harian
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
