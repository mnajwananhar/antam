"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Trash2,
  Edit,
} from "lucide-react";

import { usePaginatedData } from "@/hooks/use-paginated-data";
import { 
  DataTableHeader, 
  Pagination,
  FilterOption 
} from "@/components/data-table";

interface NotificationItem {
  id: number;
  uniqueNumber: string;
  reportTime: string;
  urgency: string;
  problemDetail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  orders: Array<{
    id: number;
    jobName: string;
    startDate: string;
    endDate?: string;
  }>;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface NotificationStats {
  total: number;
  inProcess: number;
  completed: number;
  emergency: number;
}

export default function NotifikasiPage(): React.JSX.Element {
  const { data: session, status } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    inProcess: 0,
    completed: 0,
    emergency: 0,
  });

  // Use paginated data hook
  const {
    data: notifications,
    isLoading,
    isRefreshing,
    error: dataError,
    pagination,
    search,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setLimit,
    setSearch,
    setSortBy,
    setSortOrder,
    updateFilter,
    removeFilter,
    clearFilters,
    refresh,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
  } = usePaginatedData<NotificationItem>({
    endpoint: "/api/notifications",
    defaultLimit: 10,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    enableAutoRefresh: false,
  });

  // Helper function to format time from database
  const formatTime = (timeString: string): string => {
    try {
      // If it's already in HH:MM format, return as is
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
        return timeString;
      }

      // If it's in ISO format, extract time part
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toTimeString().slice(0, 5); // Extract HH:MM
      }

      return timeString;
    } catch {
      return timeString;
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<NotificationItem | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [newNotification, setNewNotification] = useState({
    departmentId: "",
    reportTime: "",
    urgency: "NORMAL" as "NORMAL" | "URGENT" | "EMERGENCY",
    problemDetail: "",
  });

  const [editNotification, setEditNotification] = useState({
    departmentId: "",
    reportTime: "",
    urgency: "NORMAL" as "NORMAL" | "URGENT" | "EMERGENCY",
    problemDetail: "",
    status: "PROCESS" as "PROCESS" | "COMPLETE",
  });

  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    jobName: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [activities, setActivities] = useState<
    { activity: string; object: string }[]
  >([{ activity: "", object: "" }]);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadDepartments();
      loadStats();
    }
  }, [status, session]);

  // Update stats when notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      loadStats();
    }
  }, [notifications]);

  const loadDepartments = async (): Promise<void> => {
    try {
      const response = await fetch("/api/departments");

      if (response.ok) {
        const result = await response.json();
        setDepartments(result.data || []);
      } else {
        console.error("Failed to load departments");
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      const response = await fetch("/api/notifications?limit=1&page=1");

      if (response.ok) {
        const result = await response.json();
        setStats(
          result.stats || { total: 0, inProcess: 0, completed: 0, emergency: 0 }
        );
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Trim problemDetail to remove extra spaces
    const trimmedProblemDetail = newNotification.problemDetail.trim();

    if (
      !newNotification.departmentId.trim() ||
      !newNotification.reportTime.trim() ||
      !trimmedProblemDetail
    ) {
      setMessage({
        type: "error",
        text: "Semua field wajib diisi",
      });
      return;
    }

    if (trimmedProblemDetail.length < 5) {
      setMessage({
        type: "error",
        text: "Detail masalah minimal 5 karakter",
      });
      return;
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newNotification.reportTime)) {
      setMessage({
        type: "error",
        text: "Format waktu tidak valid. Gunakan format HH:MM",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newNotification,
          departmentId: parseInt(newNotification.departmentId),
          problemDetail: trimmedProblemDetail,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Notifikasi berhasil dibuat",
        });

        // Reset form and close dialog
        setNewNotification({
          departmentId: "",
          reportTime: "",
          urgency: "NORMAL",
          problemDetail: "",
        });
        setIsDialogOpen(false);

        // Reload data
        await refresh();
      } else {
        // Handle validation errors more gracefully
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details
            .map((detail: { field: string; message: string }) => detail.message)
            .join(", ");
          setMessage({
            type: "error",
            text: errorMessages,
          });
        } else {
          setMessage({
            type: "error",
            text: result.error || "Gagal membuat notifikasi",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting notification:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Gagal menyimpan notifikasi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    notificationId: number,
    newStatus: "PROCESS" | "COMPLETE"
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Status berhasil diupdate",
        });
        await refresh();
      } else {
        throw new Error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Gagal mengupdate status",
      });
    }
  };

  const handleEdit = (notification: NotificationItem): void => {
    setEditingNotification(notification);
    setEditNotification({
      departmentId: notification.department.id.toString(),
      reportTime: formatTime(notification.reportTime),
      urgency: notification.urgency as "NORMAL" | "URGENT" | "EMERGENCY",
      problemDetail: notification.problemDetail,
      status: notification.status as "PROCESS" | "COMPLETE",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!editingNotification) return;

    // Trim problemDetail to remove extra spaces
    const trimmedProblemDetail = editNotification.problemDetail.trim();

    if (
      !editNotification.departmentId.trim() ||
      !editNotification.reportTime.trim() ||
      !trimmedProblemDetail
    ) {
      setMessage({
        type: "error",
        text: "Semua field wajib diisi",
      });
      return;
    }

    if (trimmedProblemDetail.length < 5) {
      setMessage({
        type: "error",
        text: "Detail masalah minimal 5 karakter",
      });
      return;
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(editNotification.reportTime)) {
      setMessage({
        type: "error",
        text: "Format waktu tidak valid. Gunakan format HH:MM",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/notifications/${editingNotification.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editNotification,
            departmentId: parseInt(editNotification.departmentId),
            problemDetail: trimmedProblemDetail,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Notifikasi berhasil diupdate",
        });

        // Reset form and close dialog
        setEditNotification({
          departmentId: "",
          reportTime: "",
          urgency: "NORMAL",
          problemDetail: "",
          status: "PROCESS",
        });
        setEditingNotification(null);
        setIsEditDialogOpen(false);

        // Reload data
        await refresh();
      } else {
        // Handle validation errors more gracefully
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details
            .map((detail: { field: string; message: string }) => detail.message)
            .join(", ");
          setMessage({
            type: "error",
            text: errorMessages,
          });
        } else {
          setMessage({
            type: "error",
            text: result.error || "Gagal mengupdate notifikasi",
          });
        }
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Gagal mengupdate notifikasi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (notificationId: number): Promise<void> => {
    if (!confirm("Apakah Anda yakin ingin menghapus notifikasi ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Notifikasi berhasil dihapus",
        });
        await refresh();
      } else {
        throw new Error(result.error || "Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Gagal menghapus notifikasi",
      });
    }
  };

  const handleCreateOrder = (notification: NotificationItem): void => {
    setSelectedNotification(notification);
    setNewOrder({
      jobName: "",
      startDate: "",
      endDate: "",
      description: "",
    });
    setActivities([{ activity: "", object: "" }]);
    setIsOrderDialogOpen(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (
      !selectedNotification ||
      !newOrder.jobName.trim() ||
      !newOrder.startDate
    ) {
      setMessage({
        type: "error",
        text: "Nama pekerjaan dan tanggal mulai wajib diisi",
      });
      return;
    }

    // Validate activities
    const validActivities = activities.filter(
      (act) => act.activity.trim() && act.object.trim()
    );

    setIsCreatingOrder(true);
    setMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: selectedNotification.id,
          jobName: newOrder.jobName,
          startDate: newOrder.startDate,
          endDate: newOrder.endDate || undefined,
          description: newOrder.description,
          activities: validActivities,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Order berhasil dibuat",
        });

        // Reset form and close dialog
        setIsOrderDialogOpen(false);
        setSelectedNotification(null);

        // Reload notifications data to show updated orders
        await refresh();
      } else {
        throw new Error(result.error || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal membuat order",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const addActivity = (): void => {
    setActivities([...activities, { activity: "", object: "" }]);
  };

  const removeActivity = (index: number): void => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
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

  const getUrgencyColor = (
    urgency: string
  ):
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "working"
    | "standby"
    | "breakdown"
    | "normal"
    | "urgent"
    | "emergency" => {
    const colors = {
      NORMAL: "default" as const,
      URGENT: "warning" as const,
      EMERGENCY: "destructive" as const,
    };
    return colors[urgency as keyof typeof colors] || "secondary";
  };

  const getUrgencyIcon = (urgency: string): React.JSX.Element => {
    const icons = {
      NORMAL: Bell,
      URGENT: AlertTriangle,
      EMERGENCY: AlertCircle,
    };
    const Icon = icons[urgency as keyof typeof icons] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string): React.JSX.Element => {
    return status === "COMPLETE" ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    );
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter departments based on user role
  const availableDepartments = departments.filter((dept) => {
    if (session?.user.role === "PLANNER" && session.user.departmentId) {
      return dept.id === session.user.departmentId;
    }
    return true; // ADMIN and INPUTTER can see all departments
  });

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "PROCESS", label: "Proses" },
        { value: "COMPLETE", label: "Selesai" },
      ],
      placeholder: "Pilih Status",
    },
    {
      key: "urgency",
      label: "Urgensi",
      type: "select",
      options: [
        { value: "NORMAL", label: "Normal" },
        { value: "URGENT", label: "Urgent" },
        { value: "EMERGENCY", label: "Emergency" },
      ],
      placeholder: "Pilih Urgensi",
    },
    ...(session?.user.role !== "PLANNER"
      ? [
          {
            key: "departmentId",
            label: "Departemen",
            type: "select" as const,
            options: departments.map((dept) => ({
              value: dept.id.toString(),
              label: `${dept.name} (${dept.code})`,
            })),
            placeholder: "Pilih Departemen",
          },
        ]
      : []),
  ];

  const sortOptions = [
    { key: "createdAt", label: "Tanggal Dibuat" },
    { key: "updatedAt", label: "Tanggal Update" },
    { key: "reportTime", label: "Waktu Laporan" },
    { key: "urgency", label: "Urgensi" },
    { key: "departmentName", label: "Departemen" },
    { key: "uniqueNumber", label: "Nomor Unik" },
  ];

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Memuat Aplikasi</h3>
            <p className="text-muted-foreground">
              Sedang memverifikasi sesi...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === "unauthenticated" || !session) {
    return <div></div>;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Messages */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Error from paginated data */}
        {dataError && (
          <Alert variant="destructive">
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        )}

        {/* Header with Search, Filter, and Sort */}
        <DataTableHeader
          title="Notifikasi"
          description="Kelola laporan masalah dan permintaan dari seluruh departemen"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari notifikasi, departemen, atau nomor unik..."
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={updateFilter}
          onFilterRemove={removeFilter}
          onClearFilters={clearFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(sortBy, sortOrder) => {
            setSortBy(sortBy);
            setSortOrder(sortOrder);
          }}
          sortOptions={sortOptions}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          disabled={isLoading}
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Notifikasi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Buat Notifikasi Baru</DialogTitle>
                  <DialogDescription>
                    Buat laporan masalah atau permintaan untuk departemen
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">Departemen</label>
                      <Select
                        value={newNotification.departmentId}
                        onValueChange={(value) =>
                          setNewNotification((prev) => ({
                            ...prev,
                            departmentId: value,
                          }))
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih departemen" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Jam Laporan</label>
                      <Input
                        type="time"
                        value={newNotification.reportTime}
                        onChange={(e) =>
                          setNewNotification((prev) => ({
                            ...prev,
                            reportTime: e.target.value,
                          }))
                        }
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Tingkat Urgensi
                      </label>
                      <Select
                        value={newNotification.urgency}
                        onValueChange={(
                          value: "NORMAL" | "URGENT" | "EMERGENCY"
                        ) =>
                          setNewNotification((prev) => ({
                            ...prev,
                            urgency: value,
                          }))
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                          <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Detail Masalah
                      </label>
                      <Textarea
                        value={newNotification.problemDetail}
                        onChange={(e) =>
                          setNewNotification((prev) => ({
                            ...prev,
                            problemDetail: e.target.value,
                          }))
                        }
                        placeholder="Jelaskan detail masalah atau permintaan..."
                        rows={4}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimal 5 karakter. Saat ini:{" "}
                        {newNotification.problemDetail.length} karakter
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Buat Notifikasi"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Notifikasi
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Semua notifikasi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Dalam Proses
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.inProcess}
              </div>
              <p className="text-xs text-muted-foreground">
                Memerlukan tindakan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <p className="text-xs text-muted-foreground">Telah ditangani</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.emergency}
              </div>
              <p className="text-xs text-muted-foreground">Prioritas tinggi</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Notifikasi</CardTitle>
            <CardDescription>
              Menampilkan {pagination.total} notifikasi
              {search && ` dengan pencarian "${search}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Memuat Data</h3>
                <p className="text-muted-foreground">
                  Sedang memuat daftar notifikasi...
                </p>
              </div>
            ) : notifications.length > 0 ? (
              <>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.uniqueNumber}
                            </Badge>
                            <Badge
                              variant={getUrgencyColor(notification.urgency)}
                              className="flex items-center gap-1"
                            >
                              {getUrgencyIcon(notification.urgency)}
                              {notification.urgency}
                            </Badge>
                            <Badge
                              variant={
                                notification.status === "COMPLETE"
                                  ? "default"
                                  : "secondary"
                              }
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(notification.status)}
                              {notification.status === "COMPLETE"
                                ? "Selesai"
                                : "Proses"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Departemen: {notification.department.name}
                            </span>
                            <span>
                              Waktu: {formatTime(notification.reportTime)}
                            </span>
                            <span>
                              Dibuat:{" "}
                              {new Date(
                                notification.createdAt
                              ).toLocaleDateString("id-ID")}
                            </span>
                          </div>

                          <p className="text-sm">{notification.problemDetail}</p>

                          {notification.orders.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">
                                Orders:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {notification.orders.map((order) => (
                                  <Badge
                                    key={order.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {order.jobName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Dibuat oleh: {notification.createdBy.username} (
                            {notification.createdBy.role})
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 ml-4">
                          {notification.status === "PROCESS" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCreateOrder(notification)}
                              className="flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              Create Order
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(
                                notification.id,
                                notification.status === "PROCESS"
                                  ? "COMPLETE"
                                  : "PROCESS"
                              )
                            }
                          >
                            {notification.status === "PROCESS"
                              ? "Selesaikan"
                              : "Buka Kembali"}
                          </Button>

                          {session?.user.role === "ADMIN" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(notification)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  pageSize={pagination.limit}
                  totalItems={pagination.total}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                  onPageChange={setPage}
                  onPageSizeChange={setLimit}
                  onFirstPage={goToFirstPage}
                  onLastPage={goToLastPage}
                  onNextPage={goToNextPage}
                  onPrevPage={goToPrevPage}
                  pageSizeOptions={[5, 10, 20, 50]}
                  disabled={isLoading}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {search || Object.keys(filters).length > 0
                    ? "Tidak Ada Hasil"
                    : "Belum Ada Notifikasi"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search || Object.keys(filters).length > 0
                    ? "Tidak ditemukan notifikasi yang sesuai dengan pencarian atau filter"
                    : "Belum ada laporan masalah atau permintaan yang dibuat"}
                </p>
                {!search && Object.keys(filters).length === 0 && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Notifikasi Pertama
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Notification Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Notifikasi</DialogTitle>
              <DialogDescription>
                Update informasi notifikasi yang sudah ada.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={editNotification.departmentId}
                    onValueChange={(value) =>
                      setEditNotification((prev) => ({
                        ...prev,
                        departmentId: value,
                      }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Waktu Laporan</label>
                  <Input
                    type="time"
                    value={editNotification.reportTime}
                    onChange={(e) =>
                      setEditNotification((prev) => ({
                        ...prev,
                        reportTime: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Tingkat Urgensi
                  </label>
                  <Select
                    value={editNotification.urgency}
                    onValueChange={(
                      value: "NORMAL" | "URGENT" | "EMERGENCY"
                    ) =>
                      setEditNotification((prev) => ({
                        ...prev,
                        urgency: value,
                      }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat urgensi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editNotification.status}
                    onValueChange={(value: "PROCESS" | "COMPLETE") =>
                      setEditNotification((prev) => ({
                        ...prev,
                        status: value,
                      }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROCESS">Proses</SelectItem>
                      <SelectItem value="COMPLETE">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Detail Masalah</label>
                  <Textarea
                    value={editNotification.problemDetail}
                    onChange={(e) =>
                      setEditNotification((prev) => ({
                        ...prev,
                        problemDetail: e.target.value,
                      }))
                    }
                    placeholder="Jelaskan detail masalah atau permintaan..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimal 5 karakter. Saat ini:{" "}
                    {editNotification.problemDetail.length} karakter
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingNotification(null);
                  }}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengupdate...
                    </>
                  ) : (
                    "Update Notifikasi"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Order Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Order dari Notifikasi</DialogTitle>
              <DialogDescription>
                Buat perintah kerja formal dari notifikasi{" "}
                {selectedNotification?.uniqueNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedNotification && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedNotification.uniqueNumber}
                  </Badge>
                  <Badge
                    variant={getUrgencyColor(selectedNotification.urgency)}
                    className="text-xs"
                  >
                    {selectedNotification.urgency}
                  </Badge>
                  <span className="text-sm font-medium">
                    {selectedNotification.department.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedNotification.problemDetail}
                </p>
              </div>
            )}

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">Nama Pekerjaan</label>
                  <Input
                    value={newOrder.jobName}
                    onChange={(e) =>
                      setNewOrder((prev) => ({
                        ...prev,
                        jobName: e.target.value,
                      }))
                    }
                    placeholder="Masukkan nama pekerjaan"
                    disabled={isCreatingOrder}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tanggal Mulai</label>
                    <Input
                      type="date"
                      value={newOrder.startDate}
                      onChange={(e) =>
                        setNewOrder((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      disabled={isCreatingOrder}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Tanggal Selesai (Opsional)
                    </label>
                    <Input
                      type="date"
                      value={newOrder.endDate}
                      onChange={(e) =>
                        setNewOrder((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      disabled={isCreatingOrder}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Deskripsi</label>
                  <Textarea
                    value={newOrder.description}
                    onChange={(e) =>
                      setNewOrder((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Deskripsi pekerjaan (opsional)"
                    rows={3}
                    disabled={isCreatingOrder}
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
                      disabled={isCreatingOrder}
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
                            disabled={isCreatingOrder}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Object"
                            value={activity.object}
                            onChange={(e) =>
                              updateActivity(index, "object", e.target.value)
                            }
                            disabled={isCreatingOrder}
                          />
                        </div>
                        {activities.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeActivity(index)}
                            disabled={isCreatingOrder}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOrderDialogOpen(false)}
                  disabled={isCreatingOrder}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isCreatingOrder}>
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membuat Order...
                    </>
                  ) : (
                    "Buat Order"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
