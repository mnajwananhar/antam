"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { Department } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useToastContext,
  useApiToast,
} from "@/components/providers/toast-provider";
import {
  Plus,
  Wrench,
  Calendar,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { MaintenanceType } from "@prisma/client";

interface MaintenanceRoutineTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

interface MaintenanceActivity {
  id: number;
  activity: string;
  object: string;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRoutine {
  id: number;
  uniqueNumber: string;
  jobName: string;
  startDate: string;
  endDate?: string;
  description?: string;
  type: MaintenanceType;
  createdAt: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
  activities: MaintenanceActivity[];
}

export function MaintenanceRoutineTab({
  department,
  session,
}: MaintenanceRoutineTabProps) {
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menggunakan toast system yang robust
  const { showError } = useToastContext();
  const { executeWithToast } = useApiToast();

  const [newRoutine, setNewRoutine] = useState({
    jobName: "",
    startDate: "",
    endDate: "",
    description: "",
    type: MaintenanceType.PREM as MaintenanceType,
  });

  const [activities, setActivities] = useState<
    { activity: string; object: string }[]
  >([{ activity: "", object: "" }]);

  // Check if user can access maintenance routine
  const canAccess =
    session.user.role === "ADMIN" || session.user.role === "PLANNER";

  const loadMaintenanceRoutines = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/maintenance-routine?departmentId=${department.id}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load maintenance routines");
      }

      setRoutines(result.data || []);
    } catch (error) {
      console.error("Error loading maintenance routines:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memuat data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [department.id, showError]);

  // Load maintenance routines on component mount
  useEffect(() => {
    if (canAccess) {
      loadMaintenanceRoutines();
    }
  }, [canAccess, loadMaintenanceRoutines]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!newRoutine.jobName.trim() || !newRoutine.startDate) {
      showError("Nama pekerjaan dan tanggal mulai wajib diisi");
      return;
    }

    // Validate activities
    const validActivities = activities.filter(
      (act) => act.activity.trim() && act.object.trim()
    );

    setIsSubmitting(true);

    await executeWithToast(
      () =>
        fetch("/api/maintenance-routine", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newRoutine,
            departmentId: department.id,
            activities: validActivities,
          }),
        }),
      undefined, // Let API response determine success message
      undefined, // Let API response determine error message
      {
        showLoading: true,
        onSuccess: () => {
          // Reset form
          setNewRoutine({
            jobName: "",
            startDate: "",
            endDate: "",
            description: "",
            type: MaintenanceType.PREM as MaintenanceType,
          });
          setActivities([{ activity: "", object: "" }]);

          // Reload data
          loadMaintenanceRoutines();
        },
      }
    );

    setIsSubmitting(false);
  };

  const addActivity = (): void => {
    setActivities([...activities, { activity: "", object: "" }]);
  };

  const removeActivity = (index: number): void => {
    if (activities.length > 1) {
      setActivities(activities.filter((_: unknown, i: number) => i !== index));
    }
  };

  const updateActivity = (
    index: number,
    field: "activity" | "object",
    value: string
  ): void => {
    const updated = [...activities];
    updated[index][field] = value;
    setActivities(updated);
  };

  const getTypeBadge = (type: MaintenanceType) => {
    const variants = {
      [MaintenanceType.PREM]: "default",
      [MaintenanceType.CORM]: "destructive",
    } as const;

    return (
      <Badge variant={variants[type]}>
        {type === MaintenanceType.PREM ? "Preventive" : "Corrective"}
      </Badge>
    );
  };

  if (!canAccess) {
    return (
      <Alert>
        <Wrench className="h-4 w-4" />
        <AlertDescription>
          Fitur Maintenance Routine hanya dapat diakses oleh Admin dan Planner.
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
            <Wrench className="h-5 w-5" />
            Penjadwalan Maintenance Routine - {department.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Pekerjaan</label>
                <Input
                  value={newRoutine.jobName}
                  onChange={(e) =>
                    setNewRoutine((prev) => ({
                      ...prev,
                      jobName: e.target.value,
                    }))
                  }
                  placeholder="Masukkan nama pekerjaan maintenance"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipe Maintenance</label>
                <Select
                  value={newRoutine.type}
                  onValueChange={(value: MaintenanceType) =>
                    setNewRoutine((prev) => ({ ...prev, type: value }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MaintenanceType.PREM}>
                      Preventive Maintenance
                    </SelectItem>
                    <SelectItem value={MaintenanceType.CORM}>
                      Corrective Maintenance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={newRoutine.startDate}
                  onChange={(e) =>
                    setNewRoutine((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Tanggal Selesai (Opsional)
                </label>
                <Input
                  type="date"
                  value={newRoutine.endDate}
                  onChange={(e) =>
                    setNewRoutine((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea
                value={newRoutine.description}
                onChange={(e) =>
                  setNewRoutine((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Jelaskan detail maintenance routine..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Activities Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">
                  Aktivitas & Object
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addActivity}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Aktivitas"
                        value={activity.activity}
                        onChange={(e) =>
                          updateActivity(index, "activity", e.target.value)
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Object"
                        value={activity.object}
                        onChange={(e) =>
                          updateActivity(index, "object", e.target.value)
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    {activities.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(index)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
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
                    Jadwalkan Maintenance
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Routines List */}
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Maintenance Routine</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : routines.length > 0 ? (
            <div className="space-y-4">
              {routines.map((routine) => (
                <div key={routine.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{routine.jobName}</h4>
                        {getTypeBadge(routine.type)}
                      </div>

                      {routine.description && (
                        <p className="text-sm text-muted-foreground">
                          {routine.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(routine.startDate).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                        {routine.endDate && (
                          <>
                            <span>-</span>
                            <span>
                              {new Date(routine.endDate).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Activities */}
                      {routine.activities && routine.activities.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">
                            Aktivitas:
                          </h5>
                          <div className="space-y-1">
                            {routine.activities.map((activity, index) => (
                              <div
                                key={activity.id}
                                className="text-xs bg-muted rounded px-2 py-1"
                              >
                                {index + 1}. {activity.activity} -{" "}
                                {activity.object}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Dibuat:{" "}
                          {new Date(routine.createdAt).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                        <span>
                          Oleh: {routine.createdBy.username} (
                          {routine.createdBy.role})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge variant="outline" className="text-xs">
                        {routine.uniqueNumber}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Belum ada maintenance routine yang dijadwalkan untuk{" "}
                {department.name}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
