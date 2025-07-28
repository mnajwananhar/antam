"use client";

import { useState } from "react";
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
import { Plus, Wrench, Calendar, CheckCircle2 } from "lucide-react";
import { MaintenanceType } from "@prisma/client";

interface MaintenanceRoutineTabProps {
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

interface MaintenanceRoutine {
  id: number;
  uniqueNumber: string;
  jobName: string;
  startDate: string;
  endDate?: string;
  description?: string;
  type: MaintenanceType;
  createdAt: string;
}

export function MaintenanceRoutineTab({
  department,
}: MaintenanceRoutineTabProps) {
  const [routines] = useState<MaintenanceRoutine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    jobName: "",
    startDate: "",
    endDate: "",
    description: "",
    type: MaintenanceType.PREM as MaintenanceType,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call would go here
      console.log("Submitting maintenance routine:", newRoutine);

      // Reset form
      setNewRoutine({
        jobName: "",
        startDate: "",
        endDate: "",
        description: "",
        type: MaintenanceType.PREM as MaintenanceType,
      });
    } catch (error) {
      console.error("Error submitting maintenance routine:", error);
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Form Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Penjadwalan Maintenance Routine
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
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipe Maintenance</label>
                <Select
                  value={newRoutine.type}
                  onValueChange={(value: MaintenanceType) =>
                    setNewRoutine((prev) => ({ ...prev, type: value }))
                  }
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
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Menyimpan..." : "Jadwalkan Maintenance"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Routines List */}
      {routines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jadwal Maintenance Routine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routines.map((routine) => (
                <div key={routine.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-medium">{routine.jobName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {routine.description}
                      </p>
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
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getTypeBadge(routine.type)}
                      <Badge variant="outline" className="text-xs">
                        {routine.uniqueNumber}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {routines.length === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Belum ada maintenance routine yang dijadwalkan untuk{" "}
            {department.name}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
