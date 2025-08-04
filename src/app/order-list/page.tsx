"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Wrench,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";

import { usePaginatedData } from "@/hooks/use-paginated-data";
import { 
  DataTableHeader, 
  Pagination,
  FilterOption 
} from "@/components/data-table";

interface OrderActivity {
  id: number;
  activity: string;
  object: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: number;
  jobName: string;
  startDate: string;
  endDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  totalActivities: number;
  completedActivities: number;
  notification: {
    id: number;
    uniqueNumber: string;
    urgency: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
  activities: OrderActivity[];
}

interface NotificationItem {
  id: number;
  uniqueNumber: string;
  urgency: string;
  problemDetail: string;
  status: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
}

interface OrderStats {
  total: number;
  inProgress: number;
  completed: number;
  averageProgress: number;
}

export default function OrderListPage(): React.JSX.Element {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    averageProgress: 0,
  });

  // Use paginated data hook
  const {
    data: orders,
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
  } = usePaginatedData<OrderItem>({
    endpoint: "/api/orders",
    defaultLimit: 10,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    enableAutoRefresh: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [newOrder, setNewOrder] = useState({
    notificationId: "",
    jobName: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [activities, setActivities] = useState<
    { activity: string; object: string; isCompleted: boolean }[]
  >([{ activity: "", object: "", isCompleted: false }]);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadNotifications();
      loadStats();
    }
  }, [status, session]);

  // Update stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      loadStats();
    }
  }, [orders]);

  const loadNotifications = async (): Promise<void> => {
    try {
      const response = await fetch("/api/notifications?status=PROCESS");

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
      } else {
        console.error("Failed to load notifications");
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      const response = await fetch("/api/orders?limit=1&page=1");

      if (response.ok) {
        const result = await response.json();
        setStats(
          result.stats || {
            total: 0,
            inProgress: 0,
            completed: 0,
            averageProgress: 0,
          }
        );
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (
      !newOrder.notificationId.trim() ||
      !newOrder.jobName.trim() ||
      !newOrder.startDate
    ) {
      setMessage({
        type: "error",
        text: "Notifikasi, nama pekerjaan, dan tanggal mulai wajib diisi",
      });
      return;
    }

    // Validate activities
    const validActivities = activities.filter(
      (act) => act.activity.trim() && act.object.trim()
    );

    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = editingOrder
        ? `/api/orders/${editingOrder.id}`
        : "/api/orders";
      const method = editingOrder ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newOrder,
          notificationId: parseInt(newOrder.notificationId),
          activities: validActivities,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text:
            result.message ||
            (editingOrder
              ? "Order berhasil diupdate"
              : "Order berhasil dibuat"),
        });

        // Reset form and close dialog
        resetForm();
        setIsDialogOpen(false);

        // Reload data
        await refresh();
      } else {
        throw new Error(result.error || "Failed to save order");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal menyimpan order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (order: OrderItem): void => {
    setEditingOrder(order);
    setNewOrder({
      notificationId: order.notification.id.toString(),
      jobName: order.jobName,
      startDate: order.startDate,
      endDate: order.endDate || "",
      description: order.description || "",
    });
    setActivities(
      order.activities.length > 0
        ? order.activities.map((act) => ({
            activity: act.activity,
            object: act.object,
            isCompleted: act.isCompleted,
          }))
        : [{ activity: "", object: "", isCompleted: false }]
    );
    setIsDialogOpen(true);
  };

  const handleDelete = async (orderId: number): Promise<void> => {
    if (!confirm("Apakah Anda yakin ingin menghapus order ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Order berhasil dihapus",
        });
        await refresh();
      } else {
        throw new Error(result.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal menghapus order",
      });
    }
  };

  const toggleActivityCompletion = useCallback(
    async (orderId: number, activityIndex: number): Promise<void> => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const updatedActivities = order.activities.map((act, index) =>
        index === activityIndex
          ? { ...act, isCompleted: !act.isCompleted }
          : act
      );

      // Update state immediately for instant UI feedback
      // Note: Since we're using usePaginatedData, we can't directly update the orders state
      // We'll just refresh the data after the API call

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activities: updatedActivities.map((act) => ({
              id: act.id,
              activity: act.activity,
              object: act.object,
              isCompleted: act.isCompleted,
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update activity");
        }

        // Refresh data to get updated state
        await refresh();
      } catch (error) {
        console.error("Error updating activity:", error);
        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Gagal mengupdate aktivitas",
        });

        // Refresh to revert UI changes
        await refresh();
      }
    },
    [orders, refresh]
  );

  const resetForm = (): void => {
    setEditingOrder(null);
    setNewOrder({
      notificationId: "",
      jobName: "",
      startDate: "",
      endDate: "",
      description: "",
    });
    setActivities([{ activity: "", object: "", isCompleted: false }]);
  };

  const addActivity = (): void => {
    setActivities([
      ...activities,
      { activity: "", object: "", isCompleted: false },
    ]);
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

  const getStatusColor = (progress: number): "default" | "secondary" | "outline" => {
    if (progress === 100) return "default"; // Completed
    if (progress > 0) return "secondary"; // In Progress
    return "outline"; // Pending
  };

  const getUrgencyColor = (
    urgency: string
  ): "default" | "secondary" | "destructive" | "outline" | "warning" => {
    const colors = {
      NORMAL: "default" as const,
      URGENT: "warning" as const,
      EMERGENCY: "destructive" as const,
    };
    return colors[urgency as keyof typeof colors] || "secondary";
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "Status Progress",
      type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "inProgress", label: "Dalam Proses" },
        { value: "completed", label: "Selesai" },
      ],
      placeholder: "Pilih Status",
    },
  ];

  const sortOptions = [
    { key: "createdAt", label: "Tanggal Dibuat" },
    { key: "updatedAt", label: "Tanggal Update" },
    { key: "startDate", label: "Tanggal Mulai" },
    { key: "endDate", label: "Tanggal Selesai" },
    { key: "jobName", label: "Nama Pekerjaan" },
    { key: "departmentName", label: "Departemen" },
    { key: "progress", label: "Progress" },
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
          title="Order List"
          description="Daftar perintah kerja formal dari notifikasi yang telah diproses"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari order, departemen, atau aktivitas..."
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
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Order Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrder ? "Edit Order" : "Buat Order Baru"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrder
                      ? "Edit perintah kerja yang sudah ada"
                      : "Buat perintah kerja dari notifikasi"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">Notifikasi</label>
                      <Select
                        value={newOrder.notificationId}
                        onValueChange={(value) =>
                          setNewOrder((prev) => ({
                            ...prev,
                            notificationId: value,
                          }))
                        }
                        disabled={isSubmitting || !!editingOrder}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih notifikasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {notifications.map((notification) => (
                            <SelectItem
                              key={notification.id}
                              value={notification.id.toString()}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {notification.uniqueNumber}
                                </Badge>
                                <Badge
                                  variant={getUrgencyColor(notification.urgency)}
                                  className="text-xs"
                                >
                                  {notification.urgency}
                                </Badge>
                                <span className="text-sm">
                                  {notification.department.name}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Nama Pekerjaan
                      </label>
                      <Input
                        value={newOrder.jobName}
                        onChange={(e) =>
                          setNewOrder((prev) => ({
                            ...prev,
                            jobName: e.target.value,
                          }))
                        }
                        placeholder="Masukkan nama pekerjaan"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Tanggal Mulai
                        </label>
                        <Input
                          type="date"
                          value={newOrder.startDate}
                          onChange={(e) =>
                            setNewOrder((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                                  updateActivity(
                                    index,
                                    "activity",
                                    e.target.value
                                  )
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
                      ) : editingOrder ? (
                        "Update Order"
                      ) : (
                        "Buat Order"
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
              <CardTitle className="text-sm font-medium">Total Order</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Semua perintah kerja
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Dalam Proses
              </CardTitle>
              <Clock className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-600">
                {stats.inProgress}
              </div>
              <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
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
              <p className="text-xs text-muted-foreground">Telah selesai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rata-rata Progress
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageProgress}%</div>
              <p className="text-xs text-muted-foreground">Semua order aktif</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Order</CardTitle>
            <CardDescription>
              Menampilkan {pagination.total} order
              {search && ` dengan pencarian "${search}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Memuat Data</h3>
                <p className="text-muted-foreground">
                  Sedang memuat daftar orders...
                </p>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className="space-y-6">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">
                                {order.jobName}
                              </CardTitle>
                              <Badge variant={getStatusColor(order.progress)}>
                                {order.progress === 100
                                  ? "Selesai"
                                  : order.progress > 0
                                  ? "Dalam Proses"
                                  : "Pending"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.startDate).toLocaleDateString(
                                  "id-ID"
                                )}
                                {order.endDate &&
                                  ` - ${new Date(order.endDate).toLocaleDateString(
                                    "id-ID"
                                  )}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {order.createdBy.username}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(order)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {session?.user.role === "ADMIN" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(order.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Related Notification */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              Dari Notifikasi:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {order.notification.uniqueNumber}
                            </Badge>
                            <Badge
                              variant={getUrgencyColor(order.notification.urgency)}
                              className="text-xs"
                            >
                              {order.notification.urgency}
                            </Badge>
                            <span>{order.notification.department.name}</span>
                          </div>

                          {order.description && (
                            <p className="text-sm text-muted-foreground">
                              {order.description}
                            </p>
                          )}

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>
                                Progress: {order.completedActivities}/
                                {order.totalActivities} aktivitas
                              </span>
                              <span className="font-medium">{order.progress}%</span>
                            </div>
                            <Progress value={order.progress} className="h-2" />
                          </div>

                          {/* Activities */}
                          {order.activities.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Aktivitas:</h4>
                              <div className="space-y-2">
                                {order.activities.map((activity, index) => (
                                  <div
                                    key={activity.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                      activity.isCompleted
                                        ? "bg-muted/30 border-muted-foreground/20"
                                        : "bg-card border-border"
                                    }`}
                                  >
                                    <button
                                      onClick={() =>
                                        toggleActivityCompletion(order.id, index)
                                      }
                                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                        activity.isCompleted
                                          ? "bg-muted border-muted-foreground text-foreground hover:bg-muted/80"
                                          : "border-border hover:border-muted-foreground hover:bg-muted/50"
                                      }`}
                                    >
                                      {activity.isCompleted && (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <div
                                        className={`text-sm ${
                                          activity.isCompleted
                                            ? "line-through text-muted-foreground"
                                            : ""
                                        }`}
                                      >
                                        <span className="font-medium">
                                          {activity.activity}
                                        </span>{" "}
                                        - {activity.object}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {search || Object.keys(filters).length > 0
                    ? "Tidak Ada Hasil"
                    : "Belum Ada Order"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search || Object.keys(filters).length > 0
                    ? "Tidak ditemukan order yang sesuai dengan pencarian atau filter"
                    : "Belum ada perintah kerja yang dibuat dari notifikasi"}
                </p>
                {!search && Object.keys(filters).length === 0 && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Order Pertama
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
