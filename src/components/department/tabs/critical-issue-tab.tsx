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
import {
  useToastContext,
  useApiToast,
} from "@/components/providers/toast-provider";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { departmentUtils } from "@/lib/utils";
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Menggunakan toast system yang robust
  const { showError } = useToastContext();
  const { executeWithToast } = useApiToast();

  const [newIssue, setNewIssue] = useState({
    issueName: "",
    status: EquipmentStatus.BREAKDOWN as EquipmentStatus,
    description: "",
  });

  const loadAccessibleDepartments = useCallback(async (): Promise<void> => {
    // Check if current selected department tab is MTC&ENG - they have special privileges to select any department
    const isMtcEng =
      department.name && departmentUtils.isMtcEngBureau(department.name);

    if (!isMtcEng) {
      // All departments except MTC&ENG tab are restricted to their own department only
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

    // Only MTC&ENG tab can load and select all departments
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
  }, [department]);

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
        showError("Gagal memuat data critical issues");
      }
    } catch (error) {
      console.error("Error loading critical issues:", error);
      showError("Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartmentId, showError]);

  // Load departments and critical issues on component mount
  useEffect(() => {
    loadAccessibleDepartments();
  }, [loadAccessibleDepartments]);

  useEffect(() => {
    loadCriticalIssues();
  }, [loadCriticalIssues]);

  // Client-side validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newIssue.issueName.trim()) {
      errors.issueName = "Nama issue wajib diisi";
    } else if (newIssue.issueName.trim().length < 3) {
      errors.issueName = "Nama issue minimal 3 karakter";
    }

    if (!newIssue.description.trim()) {
      errors.description = "Deskripsi wajib diisi";
    } else if (newIssue.description.trim().length < 5) {
      errors.description = "Deskripsi minimal 5 karakter";
    } else if (newIssue.description.trim().length > 500) {
      errors.description = "Deskripsi maksimal 500 karakter";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      showError("Mohon periksa kembali form input");
      return;
    }

    setIsSubmitting(true);

    await executeWithToast(
      () =>
        fetch("/api/critical-issue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newIssue,
            departmentId: selectedDepartmentId,
          }),
        }),
      undefined, // Let the API response determine success message
      undefined, // Let the API response determine error message
      {
        showLoading: true,
        onSuccess: () => {
          // Reset form and errors on success
          setNewIssue({
            issueName: "",
            status: EquipmentStatus.BREAKDOWN as EquipmentStatus,
            description: "",
          });
          setFormErrors({});

          // Reload data
          loadCriticalIssues();
        },
        onError: (error) => {
          // Handle validation errors
          if (error && typeof error === "object" && "details" in error) {
            const errorData = error as {
              details: Array<{ field: string; message: string }>;
            };
            if (Array.isArray(errorData.details)) {
              const serverErrors: Record<string, string> = {};
              errorData.details.forEach((validationError) => {
                serverErrors[validationError.field] = validationError.message;
              });
              setFormErrors(serverErrors);
            }
          }
        },
      }
    );

    setIsSubmitting(false);
  };

  const handleDelete = async (issueId: number): Promise<void> => {
    if (!confirm("Apakah Anda yakin ingin menghapus critical issue ini?")) {
      return;
    }

    await executeWithToast(
      () =>
        fetch(`/api/critical-issue/${issueId}`, {
          method: "DELETE",
        }),
      undefined, // Let API response determine success message
      undefined, // Let API response determine error message
      {
        showLoading: true,
        onSuccess: () => {
          loadCriticalIssues();
        },
      }
    );
  };

  const getSelectedDepartmentName = () => {
    const selectedDept = accessibleDepartments.find(
      (dept) => dept.id === selectedDepartmentId
    );
    return selectedDept?.name || department.name;
  };

  const canSelectDepartment = (): boolean => {
    // Debug log
    console.log("Debug canSelectDepartment:", {
      departmentTabName: department.name,
      isMtcEng:
        department.name && departmentUtils.isMtcEngBureau(department.name),
      result:
        department.name && departmentUtils.isMtcEngBureau(department.name),
    });

    // Only when user is on MTC&ENG tab, they can select different departments
    // When on other department tabs (ECDC, MMTC, PMTC, HETU), they can only input to that department
    if (department.name && departmentUtils.isMtcEngBureau(department.name)) {
      return true;
    }

    // All other department tabs cannot select different departments
    return false;
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

  return (
    <div className="space-y-6">
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
                  onChange={(e) => {
                    setNewIssue((prev) => ({
                      ...prev,
                      issueName: e.target.value,
                    }));
                    // Clear error when user starts typing
                    if (formErrors.issueName) {
                      setFormErrors((prev) => ({ ...prev, issueName: "" }));
                    }
                  }}
                  placeholder="Masukkan nama critical issue"
                  required
                  disabled={isSubmitting}
                  className={formErrors.issueName ? "border-red-500" : ""}
                />
                {formErrors.issueName && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.issueName}
                  </p>
                )}
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
                onChange={(e) => {
                  setNewIssue((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  // Clear error when user starts typing
                  if (formErrors.description) {
                    setFormErrors((prev) => ({ ...prev, description: "" }));
                  }
                }}
                placeholder="Jelaskan detail critical issue... (minimal 5 karakter)"
                rows={4}
                required
                disabled={isSubmitting}
                className={formErrors.description ? "border-red-500" : ""}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.description}
                </p>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {newIssue.description.length}/500 karakter
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
