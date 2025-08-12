"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { Department } from "@prisma/client";
import { EquipmentWithStatus } from "@/types/equipment";
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
  Calendar,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Edit as EditIcon,
  Timer,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  OperationalReport,
  ActivityDetail as ActivityDetailType,
  SHIFT_TYPES,
  ShiftType,
} from "@/types/daily-activity";
// ...existing code...

// Custom Toast Component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Timer className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-orange-50 border-orange-200 text-orange-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg transition-all duration-300 ${getColors()}`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-70 transition-opacity"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

interface DailyActivityTabProps {
  equipment: EquipmentWithStatus[];
  department: Department;
  session: Session;
  editId?: number;
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
  editId,
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  // Operational Report State
  const [operationalReport, setOperationalReport] =
    useState<OperationalReport | null>(null);

  // State for hours and minutes separately
  const [workingHours, setWorkingHours] = useState<number>(0);
  const [workingMinutes, setWorkingMinutes] = useState<number>(0);
  const [standbyHours, setStandbyHours] = useState<number>(0);
  const [standbyMinutes, setStandbyMinutes] = useState<number>(0);
  const [breakdownHours, setBreakdownHours] = useState<number>(0);
  const [breakdownMinutes, setBreakdownMinutes] = useState<number>(0);

  // Convert hours + minutes to decimal hours
  const totalWorking = workingHours + workingMinutes / 60;
  const totalStandby = standbyHours + standbyMinutes / 60;
  const totalBreakdown = breakdownHours + breakdownMinutes / 60;

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
  const isOverLimit = totalHours > 12;

  // Calculate duration from activity details
  const calculateActivityDuration = (activities: ActivityDetail[]) => {
    return activities.reduce((total, activity) => {
      if (
        activity.startDate &&
        activity.startTime &&
        activity.endDate &&
        activity.endTime
      ) {
        // Enhanced time normalization
        const normalizeTime = (time: string) => {
          if (!time) return "00:00";

          // Remove any non-numeric characters except colon
          time = time.replace(/[^0-9:]/g, "");

          // If it's 4 digits (2100), format to HH:MM
          if (/^\d{4}$/.test(time)) {
            const hours = time.substring(0, 2);
            const minutes = time.substring(2, 4);
            const h = parseInt(hours);
            const m = parseInt(minutes);

            if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
              return `${hours}:${minutes}`;
            }
          }

          // If it's 3 digits (800), format to H:MM then HH:MM
          if (/^\d{3}$/.test(time)) {
            const hours = time.substring(0, 1);
            const minutes = time.substring(1, 3);
            const h = parseInt(hours);
            const m = parseInt(minutes);

            if (h >= 0 && h <= 9 && m >= 0 && m <= 59) {
              return `${hours.padStart(2, "0")}:${minutes}`;
            }
          }

          // If it's just a number (8, 12), convert to HH:00
          if (/^\d{1,2}$/.test(time)) {
            const hour = parseInt(time);
            if (hour >= 0 && hour <= 23) {
              return `${hour.toString().padStart(2, "0")}:00`;
            }
          }

          // If it's already in HH:MM format, return as is
          if (/^\d{1,2}:\d{2}$/.test(time)) {
            const [h, m] = time.split(":");
            const hour = parseInt(h);
            const minute = parseInt(m);

            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
              return `${hour.toString().padStart(2, "0")}:${minute
                .toString()
                .padStart(2, "0")}`;
            }
          }

          return time; // Return as is if can't normalize
        };

        const normalizedStartTime = normalizeTime(activity.startTime);
        const normalizedEndTime = normalizeTime(activity.endTime);

        const startDateTime = new Date(
          `${activity.startDate}T${normalizedStartTime}:00`
        );
        const endDateTime = new Date(
          `${activity.endDate}T${normalizedEndTime}:00`
        );

        if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
          const durationMs = endDateTime.getTime() - startDateTime.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          return total + Math.max(0, durationHours);
        }
      }
      return total;
    }, 0);
  };

  const workingDuration = calculateActivityDuration(workingActivities);
  const standbyDuration = calculateActivityDuration(standbyActivities);
  const breakdownDuration = calculateActivityDuration(breakdownActivities);

  const isWorkingValid = Math.abs(workingDuration - totalWorking) < 0.01;
  const isStandbyValid = Math.abs(standbyDuration - totalStandby) < 0.01;
  const isBreakdownValid = Math.abs(breakdownDuration - totalBreakdown) < 0.01;

  // Check if we can add more activities (duration not yet reached target)
  const canAddWorking =
    totalWorking > 0 && workingDuration < totalWorking - 0.01;
  const canAddStandby =
    totalStandby > 0 && standbyDuration < totalStandby - 0.01;
  const canAddBreakdown =
    totalBreakdown > 0 && breakdownDuration < totalBreakdown - 0.01;

  const areActivitiesValid =
    isWorkingValid && isStandbyValid && isBreakdownValid;
  const canFinalize =
    isTargetMet && areActivitiesValid && totalHours >= targetHours;

  // Enhanced time validation function
  const validateTimeInput = (
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ) => {
    if (!startDate || !startTime || !endDate || !endTime) {
      return { isValid: true, message: "", duration: 0 };
    }

    try {
      // Enhanced time normalization for validation
      const normalizeTime = (time: string) => {
        if (!time) return "00:00";

        // Remove any non-numeric characters except colon
        time = time.replace(/[^0-9:]/g, "");

        // If it's 4 digits (2100), format to HH:MM
        if (/^\d{4}$/.test(time)) {
          const hours = time.substring(0, 2);
          const minutes = time.substring(2, 4);
          const h = parseInt(hours);
          const m = parseInt(minutes);

          if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            return `${hours}:${minutes}`;
          }
          return "00:00";
        }

        // If it's 3 digits (800), format to H:MM then HH:MM
        if (/^\d{3}$/.test(time)) {
          const hours = time.substring(0, 1);
          const minutes = time.substring(1, 3);
          const h = parseInt(hours);
          const m = parseInt(minutes);

          if (h >= 0 && h <= 9 && m >= 0 && m <= 59) {
            return `${hours.padStart(2, "0")}:${minutes}`;
          }
          return "00:00";
        }

        // If it's just a number (1, 10, 23)
        if (/^\d{1,2}$/.test(time)) {
          const hour = parseInt(time);
          if (hour >= 0 && hour <= 23) {
            return `${hour.toString().padStart(2, "0")}:00`;
          }
          return "00:00";
        }

        // If it's in H:MM or HH:MM format
        if (/^\d{1,2}:\d{1,2}$/.test(time)) {
          const [h, m] = time.split(":");
          const hour = parseInt(h);
          const minute = parseInt(m);

          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return `${hour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")}`;
          }
        }

        return time; // Return as is if can't normalize
      };

      const normalizedStartTime = normalizeTime(startTime);
      const normalizedEndTime = normalizeTime(endTime);

      const startDateTime = new Date(`${startDate}T${normalizedStartTime}:00`);
      const endDateTime = new Date(`${endDate}T${normalizedEndTime}:00`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return {
          isValid: false,
          message: "Format waktu tidak valid",
          duration: 0,
        };
      }

      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      if (durationHours <= 0) {
        return {
          isValid: false,
          message: "Waktu selesai harus lebih besar dari waktu mulai",
          duration: 0,
        };
      }

      if (durationHours > 12) {
        return {
          isValid: false,
          message: "Durasi aktivitas tidak boleh lebih dari 12 jam",
          duration: durationHours,
        };
      }

      if (durationHours < 0.1) {
        // Less than 6 minutes
        return {
          isValid: false,
          message: "Durasi aktivitas terlalu singkat (minimal 6 menit)",
          duration: durationHours,
        };
      }

      return { isValid: true, message: "", duration: durationHours };
    } catch {
      return {
        isValid: false,
        message: "Error dalam validasi waktu",
        duration: 0,
      };
    }
  };

  // Show toast notification
  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    setToastMessage({ message, type });
  };

  const mapActivityDetail = useCallback(
    (activity: ActivityDetailType): ActivityDetail => ({
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
    }),
    []
  );

  const loadDataForEdit = useCallback(
    async (recordId: number) => {
      setIsLoading(true);
      setIsEditMode(true);
      setError(null);

      try {
        console.log(`Loading operational report data for ID: ${recordId}`);

        const response = await fetch(`/api/operational-report/${recordId}`);

        console.log("API response status:", response.status);
        console.log("API response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(
            `Failed to load data: HTTP ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();

        if (data.report) {
          const report = data.report;

          // Pre-fill basic fields
          setReportDate(format(new Date(report.reportDate), "yyyy-MM-dd"));
          setSelectedEquipment(report.equipmentId.toString());
          setShiftType(report.shiftType || "shift-1");

          // Pre-fill hours (convert from integer hours to hours + minutes)
          const workingTotal = report.totalWorking || 0;
          const standbyTotal = report.totalStandby || 0;
          const breakdownTotal = report.totalBreakdown || 0;

          setWorkingHours(Math.floor(workingTotal));
          setWorkingMinutes(Math.round((workingTotal % 1) * 60));
          setStandbyHours(Math.floor(standbyTotal));
          setStandbyMinutes(Math.round((standbyTotal % 1) * 60));
          setBreakdownHours(Math.floor(breakdownTotal));
          setBreakdownMinutes(Math.round((breakdownTotal % 1) * 60));

          // Pre-fill activity details
          const activities = report.activityDetails || [];
          setWorkingActivities(
            activities
              .filter((a: ActivityDetailType) => a.status === "WORKING")
              .map(mapActivityDetail)
          );
          setStandbyActivities(
            activities
              .filter((a: ActivityDetailType) => a.status === "STANDBY")
              .map(mapActivityDetail)
          );
          setBreakdownActivities(
            activities
              .filter((a: ActivityDetailType) => a.status === "BREAKDOWN")
              .map(mapActivityDetail)
          );

          setOperationalReport(report);
          setSuccess("Data berhasil dimuat untuk edit");

          console.log("Successfully loaded data for edit:", {
            id: recordId,
            equipment: report.equipment?.name,
            date: report.reportDate,
            isComplete: report.isComplete,
          });
        } else {
          throw new Error("Data not found");
        }
      } catch (err) {
        console.error("Failed to load data for edit:", err);
        setError(
          `Gagal memuat data untuk edit: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [mapActivityDetail]
  );

  // AUTO-LOAD DATA FOR EDIT MODE
  useEffect(() => {
    if (editId) {
      console.log(`Edit mode activated for operational report ID: ${editId}`);
      loadDataForEdit(editId);
    }
  }, [editId, loadDataForEdit]);

  const loadOperationalReport = useCallback(async () => {
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
          // Convert integer hours back to hours and minutes for UI
          const workingTotal = data.report.totalWorking || 0;
          const standbyTotal = data.report.totalStandby || 0;
          const breakdownTotal = data.report.totalBreakdown || 0;

          setWorkingHours(Math.floor(workingTotal));
          setWorkingMinutes(Math.round((workingTotal % 1) * 60));
          setStandbyHours(Math.floor(standbyTotal));
          setStandbyMinutes(Math.round((standbyTotal % 1) * 60));
          setBreakdownHours(Math.floor(breakdownTotal));
          setBreakdownMinutes(Math.round((breakdownTotal % 1) * 60));

          // Group activity details by status
          const activities = data.report.activityDetails || [];
          setWorkingActivities(
            activities
              .filter((a: ActivityDetailType) => a.status === "WORKING")
              .map(mapActivityDetail)
          );
          setStandbyActivities(
            activities
              .filter((a: ActivityDetailType) => a.status === "STANDBY")
              .map(mapActivityDetail)
          );
          setBreakdownActivities(
            activities
              .filter((a: ActivityDetailType) => a.status === "BREAKDOWN")
              .map(mapActivityDetail)
          );

          setSuccess(
            `Data berhasil dimuat - Status: ${
              data.report.isComplete ? "Complete" : "Draft"
            }`
          );
        } else {
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
  }, [selectedEquipment, reportDate, department.id, mapActivityDetail]);

  const resetForm = () => {
    setWorkingHours(0);
    setWorkingMinutes(0);
    setStandbyHours(0);
    setStandbyMinutes(0);
    setBreakdownHours(0);
    setBreakdownMinutes(0);
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
      const method = editId ? "PUT" : "POST";
      const url = editId
        ? `/api/operational-report/${editId}`
        : "/api/operational-report";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          equipmentId: parseInt(selectedEquipment),
          departmentId: department.id,
          totalWorking: Math.round(totalWorking),
          totalStandby: Math.round(totalStandby),
          totalBreakdown: Math.round(totalBreakdown),
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
        setSuccess(
          editId ? "Data berhasil diperbarui" : "Progres berhasil disimpan"
        );
        showToast(
          editId ? "Data berhasil diperbarui!" : "Progres berhasil disimpan!",
          "success"
        );
        // Notify other tabs about the data change
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save progress");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      showToast(
        err instanceof Error ? err.message : "Gagal menyimpan data",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const finalizeReport = async () => {
    if (!canFinalize) {
      setError(
        "Total jam harus mencapai target dan durasi aktivitas harus sesuai"
      );
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const method = editId ? "PUT" : "POST";
      const url = editId
        ? `/api/operational-report/${editId}`
        : "/api/operational-report";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          equipmentId: parseInt(selectedEquipment),
          departmentId: department.id,
          totalWorking: Math.round(totalWorking),
          totalStandby: Math.round(totalStandby),
          totalBreakdown: Math.round(totalBreakdown),
          shiftType,
          isComplete: true,
          activityDetails: [
            ...workingActivities.map((a) => mapToApiFormat(a, "WORKING")),
            ...standbyActivities.map((a) => mapToApiFormat(a, "STANDBY")),
            ...breakdownActivities.map((a) => mapToApiFormat(a, "BREAKDOWN")),
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOperationalReport(data.report);
        setSuccess(
          editId ? "Data berhasil diupdate" : "Laporan berhasil diselesaikan"
        );
        showToast(
          editId ? "Data berhasil diupdate!" : "Laporan berhasil diselesaikan!",
          "success"
        );
        // Notify other tabs about the data change
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to finalize report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      showToast(
        err instanceof Error ? err.message : "Gagal menyelesaikan laporan",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const mapToApiFormat = (activity: ActivityDetail, status: string) => {
    // Enhanced time normalization before sending to API
    const normalizeTime = (time: string) => {
      if (!time) return null;

      // Remove any non-numeric characters except colon
      time = time.replace(/[^0-9:]/g, "");

      // If it's 4 digits (2100), format to HH:MM
      if (/^\d{4}$/.test(time)) {
        const hours = time.substring(0, 2);
        const minutes = time.substring(2, 4);
        const h = parseInt(hours);
        const m = parseInt(minutes);

        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          return `${hours}:${minutes}`;
        }
        return null;
      }

      // If it's 3 digits (800), format to H:MM then HH:MM
      if (/^\d{3}$/.test(time)) {
        const hours = time.substring(0, 1);
        const minutes = time.substring(1, 3);
        const h = parseInt(hours);
        const m = parseInt(minutes);

        if (h >= 0 && h <= 9 && m >= 0 && m <= 59) {
          return `${hours.padStart(2, "0")}:${minutes}`;
        }
        return null;
      }

      // If it's just a number (8, 12), convert to HH:00
      if (/^\d{1,2}$/.test(time)) {
        const hour = parseInt(time);
        if (hour >= 0 && hour <= 23) {
          return `${hour.toString().padStart(2, "0")}:00`;
        }
        return null;
      }

      // If it's already in HH:MM format
      if (/^\d{1,2}:\d{1,2}$/.test(time)) {
        const [h, m] = time.split(":");
        const hour = parseInt(h);
        const minute = parseInt(m);

        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
        }
      }

      return time; // Return as is if can't normalize
    };

    const normalizedStartTime = normalizeTime(activity.startTime);
    const normalizedEndTime = normalizeTime(activity.endTime);

    const startDateTime =
      activity.startDate && normalizedStartTime
        ? new Date(`${activity.startDate}T${normalizedStartTime}:00`)
        : null;
    const endDateTime =
      activity.endDate && normalizedEndTime
        ? new Date(`${activity.endDate}T${normalizedEndTime}:00`)
        : null;

    return {
      id: activity.id,
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

    // Real-time validation for time fields with toast notification
    if (field === "endTime" && value) {
      const activity = updated[index];

      // Validate time input with enhanced feedback
      const validation = validateTimeInput(
        activity.startDate,
        activity.startTime,
        activity.endDate,
        value
      );

      // Show toast for validation errors (not browser alert)
      if (!validation.isValid && activity.startTime && activity.startDate) {
        setTimeout(() => {
          showToast(validation.message, "warning");
        }, 500);
      }
    }
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

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load data when equipment or date changes (but not in edit mode initial load)
  useEffect(() => {
    if (selectedEquipment && reportDate && !editId) {
      loadOperationalReport();
    }
  }, [selectedEquipment, reportDate, editId, loadOperationalReport]);

  const formatDuration = (duration: number) => {
    if (!duration || isNaN(duration)) return "0:00";
    const hours = Math.floor(duration);
    const minutes = Math.round((duration % 1) * 60);
    return `${hours}:${String(minutes).padStart(2, "0")}`;
  };

  const renderActivityForm = (
    activity: ActivityDetail,
    type: "working" | "standby" | "breakdown",
    index: number
  ) => {
    // Real-time validation for this activity
    const validation = validateTimeInput(
      activity.startDate,
      activity.startTime,
      activity.endDate,
      activity.endTime
    );

    return (
      <div
        key={index}
        className={`border rounded-lg p-4 space-y-4 bg-card transition-colors ${
          validation.isValid ? "border-muted/50" : "border-red-300 bg-red-50/30"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Detail Aktivitas #{index + 1}</h4>
            {validation.duration > 0 && (
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <Timer className="h-3 w-3" />
                {formatDuration(validation.duration)}
              </Badge>
            )}
          </div>
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
            <CustomCalendar
              value={activity.startDate}
              onChange={(date) =>
                updateActivity(type, index, "startDate", date)
              }
              placeholder="Pilih tanggal..."
              className="w-full"
            />
          </div>
          <div>
            <Label>Jam Mulai</Label>
            <Input
              type="text"
              value={activity.startTime}
              onChange={(e) => {
                let value = e.target.value.replace(/[^0-9]/g, ""); // Only numbers

                // Prevent input longer than 4 digits
                if (value.length > 4) {
                  value = value.substring(0, 4);
                }

                // Auto-format as user types
                if (value.length === 4) {
                  // 2100 → 21:00, reject invalid like 9090 (jam 90 invalid)
                  const hours = parseInt(value.substring(0, 2));
                  const minutes = parseInt(value.substring(2, 4));

                  if (hours <= 23 && minutes <= 59) {
                    value = `${hours.toString().padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`;
                  } else {
                    // Invalid time (jam >23 atau menit >59), truncate
                    value = value.substring(0, 3);
                  }
                } else if (value.length === 3) {
                  // 800 → 8:00, check validity
                  const hours = parseInt(value.substring(0, 1));
                  const minutes = parseInt(value.substring(1, 3));

                  if (hours <= 9 && minutes <= 59) {
                    value = `${hours}:${minutes.toString().padStart(2, "0")}`;
                  } else {
                    // Invalid, truncate
                    value = value.substring(0, 2);
                  }
                }

                updateActivity(type, index, "startTime", value);
              }}
              onBlur={(e) => {
                let value = e.target.value;

                // Auto-format on blur: add leading zeros
                if (/^\d{1}:\d{2}$/.test(value)) {
                  // 7:30 → 07:30
                  value = `0${value}`;
                  updateActivity(type, index, "startTime", value);
                } else if (/^\d{1,2}$/.test(value)) {
                  // 8 → 08:00, 12 → 12:00
                  const hour = parseInt(value);
                  if (hour >= 0 && hour <= 23) {
                    value = `${hour.toString().padStart(2, "0")}:00`;
                    updateActivity(type, index, "startTime", value);
                  }
                }
              }}
              maxLength={5}
              className={!validation.isValid ? "border-red-500" : ""}
            />
          </div>
          <div>
            <Label>Tanggal Selesai</Label>
            <CustomCalendar
              value={activity.endDate}
              onChange={(date) => updateActivity(type, index, "endDate", date)}
              placeholder="Pilih tanggal..."
              className="w-full"
            />
          </div>
          <div>
            <Label>Jam Selesai</Label>
            <Input
              type="text"
              value={activity.endTime}
              onChange={(e) => {
                let value = e.target.value.replace(/[^0-9]/g, ""); // Only numbers

                // Prevent input longer than 4 digits
                if (value.length > 4) {
                  value = value.substring(0, 4);
                }

                // Auto-format as user types
                if (value.length === 4) {
                  // 2100 → 21:00, reject invalid like 9090 (jam 90 invalid)
                  const hours = parseInt(value.substring(0, 2));
                  const minutes = parseInt(value.substring(2, 4));

                  if (hours <= 23 && minutes <= 59) {
                    value = `${hours.toString().padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`;
                  } else {
                    // Invalid time (jam >23 atau menit >59), truncate
                    value = value.substring(0, 3);
                  }
                } else if (value.length === 3) {
                  // 800 → 8:00, check validity
                  const hours = parseInt(value.substring(0, 1));
                  const minutes = parseInt(value.substring(1, 3));

                  if (hours <= 9 && minutes <= 59) {
                    value = `${hours}:${minutes.toString().padStart(2, "0")}`;
                  } else {
                    // Invalid, truncate
                    value = value.substring(0, 2);
                  }
                }

                updateActivity(type, index, "endTime", value);
              }}
              onBlur={(e) => {
                let value = e.target.value;

                // Auto-format on blur: add leading zeros
                if (/^\d{1}:\d{2}$/.test(value)) {
                  // 7:30 → 07:30
                  value = `0${value}`;
                  updateActivity(type, index, "endTime", value);
                } else if (/^\d{1,2}$/.test(value)) {
                  // 8 → 08:00, 12 → 12:00
                  const hour = parseInt(value);
                  if (hour >= 0 && hour <= 23) {
                    value = `${hour.toString().padStart(2, "0")}:00`;
                    updateActivity(type, index, "endTime", value);
                  }
                }
              }}
              maxLength={5}
              className={!validation.isValid ? "border-red-500" : ""}
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
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>
                {isEditMode
                  ? "Edit Aktivitas Harian"
                  : `Aktivitas Harian - ${department.name}`}
              </CardTitle>
            </div>
            {isEditMode && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                <EditIcon className="h-3 w-3 mr-1" />
                Edit Mode
              </Badge>
            )}
          </div>
          <CardDescription>
            {editId
              ? "Perbarui data aktivitas harian peralatan yang dipilih"
              : "Pencatatan aktivitas harian peralatan dengan sistem kolaboratif antar shift"}
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
                className="w-full"
                disabled={isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment-select" className="text-sm font-medium">
                Pilih Alat
              </Label>
              <Select
                value={selectedEquipment}
                onValueChange={setSelectedEquipment}
                disabled={isEditMode}
              >
                <SelectTrigger id="equipment-select">
                  <SelectValue placeholder="Pilih alat..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
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
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b bg-muted/50">
                          {category}
                        </div>
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
                    <CheckCircle2 className="h-3 w-3 mr-1" />
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
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                {editId ? "Memuat data untuk edit..." : "Memuat data..."}
              </p>
            </div>
          ) : selectedEquipment ? (
            <>
              {/* Check if report is completed */}
              {operationalReport?.isComplete && !isEditMode ? (
                <div className="text-center py-8 border-2 border-green-500 rounded-lg bg-green-50">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Laporan Sudah Diselesaikan
                  </h3>
                  <p className="text-green-700 mb-4">
                    Laporan aktivitas harian untuk{" "}
                    {
                      equipment.find(
                        (e) => e.id.toString() === selectedEquipment
                      )?.name
                    }
                    tanggal {reportDate} telah diselesaikan.
                  </p>
                  <p className="text-sm text-green-600">
                    Laporan yang sudah complete tidak dapat diedit.
                  </p>
                </div>
              ) : (
                <>
                  {/* Information Alert */}
                  {totalHours < targetHours && (
                    <Alert className="border-muted bg-muted/20">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <AlertDescription className="text-foreground">
                        <strong>Informasi:</strong> Anda harus mengisi total jam
                        hingga mencapai target{" "}
                        <strong>{targetHours} jam</strong> terlebih dahulu
                        sebelum dapat menambahkan detail aktivitas. Saat ini
                        baru <strong>{formatDuration(totalHours)}</strong> dari
                        target yang diperlukan.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Hours Input */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Jam Working</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="12"
                              value={workingHours || ""}
                              onChange={(e) => {
                                const hours = parseInt(e.target.value) || 0;
                                const totalHoursNew =
                                  hours +
                                  workingMinutes / 60 +
                                  totalStandby +
                                  totalBreakdown;
                                if (totalHoursNew <= 12) {
                                  setWorkingHours(Math.min(hours, 12));
                                }
                              }}
                              placeholder="Jam"
                              className="text-center"
                            />
                          </div>
                          <span className="self-center text-muted-foreground">
                            :
                          </span>
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={workingMinutes || ""}
                              onChange={(e) => {
                                const minutes = parseInt(e.target.value) || 0;
                                const totalHoursNew =
                                  workingHours +
                                  minutes / 60 +
                                  totalStandby +
                                  totalBreakdown;
                                if (totalHoursNew <= 12 && minutes <= 59) {
                                  setWorkingMinutes(minutes);
                                }
                              }}
                              placeholder="Menit"
                              className="text-center"
                            />
                          </div>
                        </div>
                        {totalHours >= targetHours && (
                          <p
                            className={`text-xs mt-1 flex items-center gap-1 ${
                              isWorkingValid ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isWorkingValid ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            Durasi aktivitas: {formatDuration(workingDuration)}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Jam Standby</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="12"
                              value={standbyHours || ""}
                              onChange={(e) => {
                                const hours = parseInt(e.target.value) || 0;
                                const totalHoursNew =
                                  totalWorking +
                                  hours +
                                  standbyMinutes / 60 +
                                  totalBreakdown;
                                if (totalHoursNew <= 12) {
                                  setStandbyHours(Math.min(hours, 12));
                                }
                              }}
                              placeholder="Jam"
                              className="text-center"
                            />
                          </div>
                          <span className="self-center text-muted-foreground">
                            :
                          </span>
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={standbyMinutes || ""}
                              onChange={(e) => {
                                const minutes = parseInt(e.target.value) || 0;
                                const totalHoursNew =
                                  totalWorking +
                                  standbyHours +
                                  minutes / 60 +
                                  totalBreakdown;
                                if (totalHoursNew <= 12 && minutes <= 59) {
                                  setStandbyMinutes(minutes);
                                }
                              }}
                              placeholder="Menit"
                              className="text-center"
                            />
                          </div>
                        </div>
                        {totalHours >= targetHours && (
                          <p
                            className={`text-xs mt-1 flex items-center gap-1 ${
                              isStandbyValid ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isStandbyValid ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            Durasi aktivitas: {formatDuration(standbyDuration)}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Jam Breakdown</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="12"
                              value={breakdownHours || ""}
                              onChange={(e) => {
                                const hours = parseInt(e.target.value) || 0;
                                const totalHoursNew =
                                  totalWorking +
                                  totalStandby +
                                  hours +
                                  breakdownMinutes / 60;
                                if (totalHoursNew <= 12) {
                                  setBreakdownHours(Math.min(hours, 12));
                                }
                              }}
                              placeholder="Jam"
                              className="text-center"
                            />
                          </div>
                          <span className="self-center text-muted-foreground">
                            :
                          </span>
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={breakdownMinutes || ""}
                              onChange={(e) => {
                                const minutes = parseInt(e.target.value) || 0;
                                const totalHoursNew =
                                  totalWorking +
                                  totalStandby +
                                  breakdownHours +
                                  minutes / 60;
                                if (totalHoursNew <= 12 && minutes <= 59) {
                                  setBreakdownMinutes(minutes);
                                }
                              }}
                              placeholder="Menit"
                              className="text-center"
                            />
                          </div>
                        </div>
                        {totalHours >= targetHours && (
                          <p
                            className={`text-xs mt-1 flex items-center gap-1 ${
                              isBreakdownValid
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {isBreakdownValid ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            Durasi aktivitas:{" "}
                            {formatDuration(breakdownDuration)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="text-center">
                        <Label>Total Jam</Label>
                        <div className="flex items-center gap-2 justify-center">
                          <Input
                            value={formatDuration(totalHours)}
                            readOnly
                            className={`bg-muted w-20 text-center ${
                              isOverLimit ? "border-red-500 bg-red-50" : ""
                            }`}
                          />
                          <Badge
                            variant={isTargetMet ? "default" : "secondary"}
                          >
                            Target: {targetHours}h
                          </Badge>
                        </div>
                        {isOverLimit && (
                          <p className="text-xs text-red-600 mt-1">
                            Maksimal 12 jam per hari
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alert for maximum hours */}
                  {isOverLimit && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Peringatan:</strong> Total jam tidak boleh
                        melebihi 12 jam per hari. Saat ini total jam:{" "}
                        <strong>{formatDuration(totalHours)}</strong>
                      </AlertDescription>
                    </Alert>
                  )}

                  {totalHours === 12 && (
                    <Alert className="border-orange-400 bg-orange-50">
                      <Timer className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Informasi:</strong> Anda telah mencapai batas
                        maksimal 12 jam per hari.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Duration validation alert */}
                  {totalHours >= targetHours && !areActivitiesValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Validasi Durasi:</strong> Total durasi aktivitas
                        harus sama dengan jam yang diinput.
                        <br />
                        {!isWorkingValid &&
                          `Working: Input ${formatDuration(
                            totalWorking
                          )}, Aktivitas ${formatDuration(workingDuration)} `}
                        {!isStandbyValid &&
                          `Standby: Input ${formatDuration(
                            totalStandby
                          )}, Aktivitas ${formatDuration(standbyDuration)} `}
                        {!isBreakdownValid &&
                          `Breakdown: Input ${formatDuration(
                            totalBreakdown
                          )}, Aktivitas ${formatDuration(breakdownDuration)}`}
                      </AlertDescription>
                    </Alert>
                  )}

                  {totalHours >= targetHours && (
                    <>
                      <Separator />

                      {/* Working Activities */}
                      {totalWorking > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-green-700">
                                Detail Aktivitas Working (
                                {workingActivities.length})
                              </h3>
                              <Badge
                                variant={
                                  isWorkingValid ? "default" : "destructive"
                                }
                                className="text-xs"
                              >
                                {formatDuration(workingDuration)} /{" "}
                                {formatDuration(totalWorking)}
                              </Badge>
                              {isWorkingValid && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-green-600 flex items-center gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Sesuai
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addActivity("working")}
                              disabled={
                                (operationalReport?.isComplete &&
                                  session.user.role !== "ADMIN") ||
                                !canAddWorking
                              }
                              title={
                                !canAddWorking
                                  ? `Durasi aktivitas sudah mencapai target ${formatDuration(
                                      totalWorking
                                    )}. Tidak bisa menambah lagi!`
                                  : "Tambah aktivitas working"
                              }
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Tambah
                            </Button>
                          </div>

                          {/* Alert if duration exceeds target */}
                          {workingDuration > totalWorking && (
                            <Alert variant="destructive" className="mb-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>⚠️ Durasi Melebihi Target!</strong>{" "}
                                Total durasi aktivitas (
                                {formatDuration(workingDuration)}) melebihi
                                target working ({formatDuration(totalWorking)}).
                                Silakan hapus atau edit beberapa aktivitas.
                              </AlertDescription>
                            </Alert>
                          )}

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
                      )}

                      {/* Standby Activities */}
                      {totalStandby > 0 && (
                        <>
                          {totalWorking > 0 && <Separator />}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-yellow-700">
                                  Detail Aktivitas Standby (
                                  {standbyActivities.length})
                                </h3>
                                <Badge
                                  variant={
                                    isStandbyValid ? "default" : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {formatDuration(standbyDuration)} /{" "}
                                  {formatDuration(totalStandby)}
                                </Badge>
                                {isStandbyValid && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-yellow-600 flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Sesuai
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addActivity("standby")}
                                disabled={
                                  (operationalReport?.isComplete &&
                                    session.user.role !== "ADMIN") ||
                                  !canAddStandby
                                }
                                title={
                                  !canAddStandby
                                    ? `Durasi aktivitas sudah mencapai target ${formatDuration(
                                        totalStandby
                                      )}. Tidak bisa menambah lagi!`
                                    : "Tambah aktivitas standby"
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Tambah
                              </Button>
                            </div>

                            {/* Alert if duration exceeds target */}
                            {standbyDuration > totalStandby && (
                              <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>⚠️ Durasi Melebihi Target!</strong>{" "}
                                  Total durasi aktivitas (
                                  {formatDuration(standbyDuration)}) melebihi
                                  target standby ({formatDuration(totalStandby)}
                                  ). Silakan hapus atau edit beberapa aktivitas.
                                </AlertDescription>
                              </Alert>
                            )}

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
                        </>
                      )}

                      {/* Breakdown Activities */}
                      {totalBreakdown > 0 && (
                        <>
                          {(totalWorking > 0 || totalStandby > 0) && (
                            <Separator />
                          )}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-red-700">
                                  Detail Aktivitas Breakdown (
                                  {breakdownActivities.length})
                                </h3>
                                <Badge
                                  variant={
                                    isBreakdownValid ? "default" : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {formatDuration(breakdownDuration)} /{" "}
                                  {formatDuration(totalBreakdown)}
                                </Badge>
                                {isBreakdownValid && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-red-600 flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Sesuai
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addActivity("breakdown")}
                                disabled={
                                  (operationalReport?.isComplete &&
                                    session.user.role !== "ADMIN") ||
                                  !canAddBreakdown
                                }
                                title={
                                  !canAddBreakdown
                                    ? `Durasi aktivitas sudah mencapai target ${formatDuration(
                                        totalBreakdown
                                      )}. Tidak bisa menambah lagi!`
                                    : "Tambah aktivitas breakdown"
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Tambah
                              </Button>
                            </div>

                            {/* Alert if duration exceeds target */}
                            {breakdownDuration > totalBreakdown && (
                              <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>⚠️ Durasi Melebihi Target!</strong>{" "}
                                  Total durasi aktivitas (
                                  {formatDuration(breakdownDuration)}) melebihi
                                  target breakdown (
                                  {formatDuration(totalBreakdown)}). Silakan
                                  hapus atau edit beberapa aktivitas.
                                </AlertDescription>
                              </Alert>
                            )}

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
                        </>
                      )}
                    </>
                  )}

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="outline"
                      onClick={saveProgress}
                      disabled={isSaving || !selectedEquipment}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving
                        ? "Menyimpan..."
                        : editId
                        ? "Perbarui Data"
                        : "Simpan Progres"}
                    </Button>
                    <Button
                      onClick={finalizeReport}
                      disabled={isSaving || !canFinalize || !selectedEquipment}
                      title={
                        !isTargetMet
                          ? `Total jam harus mencapai ${targetHours} jam untuk menyelesaikan laporan`
                          : !areActivitiesValid
                          ? "Durasi aktivitas harus sama dengan jam yang diinput"
                          : ""
                      }
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isSaving
                        ? "Menyimpan..."
                        : editId
                        ? "Perbarui & Selesaikan"
                        : "Selesaikan Laporan"}
                    </Button>
                  </div>

                  {/* Info untuk tombol disabled */}
                  {(!isTargetMet || !areActivitiesValid) && (
                    <div className="text-center text-sm text-muted-foreground">
                      <p>
                        {editId
                          ? "Perbarui & Selesaikan memerlukan total"
                          : "Selesaikan Laporan memerlukan total"}{" "}
                        {targetHours} jam dan detail aktivitas yang sesuai
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {editId
                  ? "Memuat Data untuk Edit..."
                  : "Pilih Tanggal dan Alat"}
              </h3>
              <p className="text-muted-foreground">
                {editId
                  ? "Data sedang dimuat untuk mode edit"
                  : "Silakan pilih tanggal laporan dan alat untuk mulai input aktivitas harian"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
