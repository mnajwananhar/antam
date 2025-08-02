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
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { EquipmentStatus } from "@prisma/client";

interface CriticalIssueTabProps {
  department: Department;
  session: Session;
  editId?: number;
}

interface AccessibleDepartment {
  id: number;
  name: string;
  code: string;
}

interface CriticalIssue {
  id: number;
  issueName: string;
  status: EquipmentStatus;
  description: string;
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
}

export function CriticalIssueTab({
  department,
  session,
}: CriticalIssueTabProps) {
  const [issues, setIssues] = useState<CriticalIssue[]>([]);
  const [accessibleDepartments, setAccessibleDepartments] = useState<
    AccessibleDepartment[]
  >([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(
    department.id
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [newIssue, setNewIssue] = useState({
    issueName: "",
    status: EquipmentStatus.BREAKDOWN as EquipmentStatus,
    description: "",
  });

  const loadAccessibleDepartments = useCallback(async () => {
    // Only load departments for users who can access multiple departments
    if (session.user.role === "PLANNER" && session.user.departmentId) {
      // PLANNER users are restricted to their own department
      setAccessibleDepartments([
        {
          id: department.id,
          name: department.name,
          code: department.code,
        },
      ]);
      setIsLoadingDepartments(false);
      return;
    }

    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const result = await response.json();
        const departments = result.data || [];
        setAccessibleDepartments(departments);
      } else {
        console.error("Failed to load departments");
        // Fallback to current department only
        setAccessibleDepartments([
          {
            id: department.id,
            name: department.name,
            code: department.code,
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      // Fallback to current department only
      setAccessibleDepartments([
        {
          id: department.id,
          name: department.name,
          code: department.code,
        },
      ]);
    } finally {
      setIsLoadingDepartments(false);
    }
  }, [session.user.role, session.user.departmentId, department]);

  const loadCriticalIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/critical-issue?departmentId=${selectedDepartmentId}`
      );

      if (response.ok) {
        const result = await response.json();
        setIssues(result.data || []);
      } else {
        console.error("Failed to load critical issues");
        setMessage({
          type: "error",
          text: "Gagal memuat data critical issues",
        });
      }
    } catch (error) {
      console.error("Error loading critical issues:", error);
      setMessage({
        type: "error",
        text: "Error saat memuat data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartmentId]);

  // Load departments and critical issues on component mount
  useEffect(() => {
    loadAccessibleDepartments();
  }, [loadAccessibleDepartments]);

  useEffect(() => {
    loadCriticalIssues();
  }, [loadCriticalIssues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newIssue.issueName.trim() || !newIssue.description.trim()) {
      setMessage({
        type: "error",
        text: "Nama issue dan deskripsi wajib diisi",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/critical-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newIssue,
          departmentId: selectedDepartmentId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Critical issue berhasil dibuat",
        });

        // Reset form
        setNewIssue({
          issueName: "",
          status: EquipmentStatus.BREAKDOWN as EquipmentStatus,
          description: "",
        });

        // Reload data
        loadCriticalIssues();
      } else {
        throw new Error(result.error || "Failed to create critical issue");
      }
    } catch (error) {
      console.error("Error submitting critical issue:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan critical issue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (issueId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus critical issue ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/critical-issue/${issueId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Critical issue berhasil dihapus",
        });
        loadCriticalIssues();
      } else {
        throw new Error(result.error || "Failed to delete critical issue");
      }
    } catch (error) {
      console.error("Error deleting critical issue:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Gagal menghapus critical issue",
      });
    }
  };

  const getSelectedDepartmentName = () => {
    const selectedDept = accessibleDepartments.find(
      (dept) => dept.id === selectedDepartmentId
    );
    return selectedDept?.name || department.name;
  };

  const canSelectDepartment = () => {
    // Only ADMIN and INPUTTER can select different departments
    // PLANNER is restricted to their own department
    return session.user.role === "ADMIN" || session.user.role === "INPUTTER";
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    const variants = {
      [EquipmentStatus.WORKING]: "default",
      [EquipmentStatus.STANDBY]: "secondary",
      [EquipmentStatus.BREAKDOWN]: "destructive",
    } as const;

    const icons = {
      [EquipmentStatus.WORKING]: <CheckCircle2 className="h-3 w-3" />,
      [EquipmentStatus.STANDBY]: <AlertTriangle className="h-3 w-3" />,
      [EquipmentStatus.BREAKDOWN]: <XCircle className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Form Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Laporan Critical Issue - {getSelectedDepartmentName()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Department Selection - Only show if user can select departments */}
            {canSelectDepartment() && !isLoadingDepartments && (
              <div>
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={selectedDepartmentId.toString()}
                  onValueChange={(value) =>
                    setSelectedDepartmentId(parseInt(value))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Issue</label>
                <Input
                  value={newIssue.issueName}
                  onChange={(e) =>
                    setNewIssue((prev) => ({
                      ...prev,
                      issueName: e.target.value,
                    }))
                  }
                  placeholder="Masukkan nama critical issue"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newIssue.status}
                  onValueChange={(value: EquipmentStatus) =>
                    setNewIssue((prev) => ({ ...prev, status: value }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EquipmentStatus.BREAKDOWN}>
                      Breakdown
                    </SelectItem>
                    <SelectItem value={EquipmentStatus.STANDBY}>
                      Standby
                    </SelectItem>
                    <SelectItem value={EquipmentStatus.WORKING}>
                      Working
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea
                value={newIssue.description}
                onChange={(e) =>
                  setNewIssue((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Jelaskan detail critical issue..."
                rows={4}
                required
                disabled={isSubmitting}
              />
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
                    Simpan Critical Issue
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Critical Issues - {getSelectedDepartmentName()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : issues.length > 0 ? (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{issue.issueName}</h4>
                        {getStatusBadge(issue.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {issue.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Department: {issue.department.name}</span>
                        <span>
                          Dibuat:{" "}
                          {new Date(issue.createdAt).toLocaleString("id-ID")}
                        </span>
                        <span>
                          Oleh: {issue.createdBy.username} (
                          {issue.createdBy.role})
                        </span>
                      </div>
                    </div>

                    {/* Action buttons - only show for ADMIN */}
                    {session.user.role === "ADMIN" && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(issue.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Belum Ada Critical Issues
              </h3>
              <p className="text-muted-foreground">
                Belum ada critical issue yang dilaporkan untuk{" "}
                {getSelectedDepartmentName()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
