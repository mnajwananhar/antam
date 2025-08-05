"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToastContext } from "@/lib/hooks";
import { Bell, Plus, Edit, Trash2, Clock, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { roleUtils, dateUtils } from "@/lib/utils";

interface Notification {
  id: number;
  uniqueNumber: string;
  departmentId: number;
  reportTime: string;
  urgency: "NORMAL" | "URGENT" | "EMERGENCY";
  problemDetail: string;
  status: "PROCESS" | "COMPLETE";
  type: "CORM";
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
    endDate: string | null;
  }>;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface CreateNotificationForm {
  departmentId: string;
  reportTime: string;
  urgency: "NORMAL" | "URGENT" | "EMERGENCY";
  problemDetail: string;
}

interface CreateOrderForm {
  jobName: string;
  startDate: string;
  endDate: string;
  description: string;
  activities: Array<{
    activity: string;
    object: string;
  }>;
}

export default function NotifikasiPage() {
  const { data: session, status } = useSession();
  const { showSuccess, showError } = useToastContext();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout>
      <NotifikasiContent session={session} showSuccess={showSuccess} showError={showError} />
    </AppLayout>
  );
}

function NotifikasiContent({ 
  session, 
  showSuccess, 
  showError 
}: { 
  session: { user: { id: string; role: string; departmentId?: number | null; username: string } };
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}) {
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [selectedNotificationForOrder, setSelectedNotificationForOrder] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PROCESS" | "COMPLETE">("ALL");
  
  const [createForm, setCreateForm] = useState<CreateNotificationForm>({
    departmentId: "",
    reportTime: dateUtils.getCurrentTime(),
    urgency: "NORMAL",
    problemDetail: "",
  });

  const [createOrderForm, setCreateOrderForm] = useState<CreateOrderForm>({
    jobName: "",
    startDate: dateUtils.getCurrentDate(),
    endDate: "",
    description: "",
    activities: [{ activity: "", object: "" }],
  });

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch("/api/departments");
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.data || []);
        }
      } catch (error) {
        console.error("Error loading departments:", error);
      }
    };
    loadDepartments();
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data?.notifications || []);
      } else {
        showError("Gagal memuat notifikasi");
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      showError("Terjadi kesalahan saat memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, showError]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleCreateNotification = async () => {
    try {
      if (!createForm.departmentId || !createForm.problemDetail) {
        showError("Mohon lengkapi semua field yang wajib diisi");
        return;
      }

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: parseInt(createForm.departmentId),
          reportTime: createForm.reportTime,
          urgency: createForm.urgency,
          problemDetail: createForm.problemDetail,
        }),
      });

      if (response.ok) {
        showSuccess("Notifikasi berhasil dibuat");
        setIsCreateDialogOpen(false);
        setCreateForm({
          departmentId: "",
          reportTime: dateUtils.getCurrentTime(),
          urgency: "NORMAL",
          problemDetail: "",
        });
        loadNotifications();
      } else {
        const error = await response.json();
        showError(error.error || "Gagal membuat notifikasi");
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      showError("Terjadi kesalahan saat membuat notifikasi");
    }
  };

  // Handle Edit Notification
  const handleEditNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setIsEditDialogOpen(true);
  };

  const handleUpdateNotification = async () => {
    if (!editingNotification) return;

    try {
      const response = await fetch(`/api/notifications/${editingNotification.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: editingNotification.departmentId,
          reportTime: editingNotification.reportTime,
          urgency: editingNotification.urgency,
          problemDetail: editingNotification.problemDetail,
          status: editingNotification.status,
        }),
      });

      if (response.ok) {
        showSuccess("Notifikasi berhasil diperbarui");
        setIsEditDialogOpen(false);
        setEditingNotification(null);
        loadNotifications();
      } else {
        const error = await response.json();
        showError(error.error || "Gagal memperbarui notifikasi");
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      showError("Terjadi kesalahan saat memperbarui notifikasi");
    }
  };

  // Handle Close Notification (change status to COMPLETE)
  const handleCloseNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETE" }),
      });

      if (response.ok) {
        showSuccess("Notifikasi berhasil ditutup");
        loadNotifications();
      } else {
        const error = await response.json();
        showError(error.error || "Gagal menutup notifikasi");
      }
    } catch (error) {
      console.error("Error closing notification:", error);
      showError("Terjadi kesalahan saat menutup notifikasi");
    }
  };

  // Handle Delete Notification
  const handleDeleteNotification = async (notificationId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus notifikasi ini?")) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showSuccess("Notifikasi berhasil dihapus");
        loadNotifications();
      } else {
        const error = await response.json();
        showError(error.error || "Gagal menghapus notifikasi");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      showError("Terjadi kesalahan saat menghapus notifikasi");
    }
  };

  // Handle Create Order - open modal in notification page
  const handleCreateOrder = (notification: Notification) => {
    setSelectedNotificationForOrder(notification);
    setIsCreateOrderDialogOpen(true);
  };

  // Handle Submit Create Order
  const handleSubmitCreateOrder = async () => {
    if (!selectedNotificationForOrder) {
      showError("Notifikasi tidak ditemukan");
      return;
    }

    try {
      if (!createOrderForm.jobName) {
        showError("Mohon lengkapi nama pekerjaan");
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: selectedNotificationForOrder.id,
          jobName: createOrderForm.jobName,
          startDate: createOrderForm.startDate,
          endDate: createOrderForm.endDate || null,
          description: createOrderForm.description,
          activities: createOrderForm.activities.filter(a => a.activity && a.object).map(a => ({
            activity: a.activity,
            object: a.object,
            isCompleted: false
          })),
        }),
      });

      if (response.ok) {
        showSuccess("Order berhasil dibuat");
        setIsCreateOrderDialogOpen(false);
        setSelectedNotificationForOrder(null);
        setCreateOrderForm({
          jobName: "",
          startDate: dateUtils.getCurrentDate(),
          endDate: "",
          description: "",
          activities: [{ activity: "", object: "" }],
        });
        loadNotifications(); // Refresh to show updated orders count
      } else {
        const error = await response.json();
        showError(error.error || "Gagal membuat order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      showError("Terjadi kesalahan saat membuat order");
    }
  };

  // Order form functions
  const addOrderActivity = () => {
    setCreateOrderForm({
      ...createOrderForm,
      activities: [...createOrderForm.activities, { activity: "", object: "" }]
    });
  };

  const removeOrderActivity = (index: number) => {
    setCreateOrderForm({
      ...createOrderForm,
      activities: createOrderForm.activities.filter((_, i) => i !== index)
    });
  };

  const updateOrderActivity = (index: number, field: keyof CreateOrderForm['activities'][0], value: string) => {
    const newActivities = [...createOrderForm.activities];
    newActivities[index][field] = value;
    setCreateOrderForm({
      ...createOrderForm,
      activities: newActivities
    });
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "EMERGENCY":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "URGENT":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "EMERGENCY":
        return "bg-red-100 text-red-800";
      case "URGENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "COMPLETE" 
      ? "bg-green-100 text-green-800" 
      : "bg-yellow-100 text-yellow-800";
  };

  const canCreateNotification = session?.user && roleUtils.canModifyData(session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER");
  
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = searchTerm === "" || 
      notification.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.problemDetail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.department.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || notification.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const availableDepartments = departments.filter(dept => {
    if (session?.user?.role === "PLANNER") {
      return dept.id === session.user.departmentId;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat notifikasi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notifikasi</h1>
        </div>
        
        {canCreateNotification && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Buat Notifikasi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Buat Notifikasi Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Departemen *</label>
                  <Select 
                    value={createForm.departmentId} 
                    onValueChange={(value) => setCreateForm({...createForm, departmentId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih departemen" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Jam Kejadian *</label>
                  <Input
                    type="time"
                    value={createForm.reportTime}
                    onChange={(e) => setCreateForm({...createForm, reportTime: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tingkat Urgensi *</label>
                  <Select 
                    value={createForm.urgency} 
                    onValueChange={(value: "NORMAL" | "URGENT" | "EMERGENCY") => 
                      setCreateForm({...createForm, urgency: value})
                    }
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
                  <label className="text-sm font-medium mb-2 block">Detail Masalah *</label>
                  <Textarea
                    placeholder="Deskripsikan masalah secara detail..."
                    value={createForm.problemDetail}
                    onChange={(e) => setCreateForm({...createForm, problemDetail: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateNotification}
                    className="flex-1"
                  >
                    Buat Notifikasi
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      {editingNotification && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Notifikasi - {editingNotification.uniqueNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Departemen *</label>
                <Select 
                  value={editingNotification.departmentId.toString()} 
                  onValueChange={(value) => setEditingNotification({
                    ...editingNotification, 
                    departmentId: parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Jam Kejadian *</label>
                <Input
                  type="time"
                  value={editingNotification.reportTime}
                  onChange={(e) => setEditingNotification({
                    ...editingNotification, 
                    reportTime: e.target.value
                  })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tingkat Urgensi *</label>
                <Select 
                  value={editingNotification.urgency} 
                  onValueChange={(value: "NORMAL" | "URGENT" | "EMERGENCY") => 
                    setEditingNotification({...editingNotification, urgency: value})
                  }
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
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select 
                  value={editingNotification.status} 
                  onValueChange={(value: "PROCESS" | "COMPLETE") => 
                    setEditingNotification({...editingNotification, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESS">Proses</SelectItem>
                    <SelectItem value="COMPLETE">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Detail Masalah *</label>
                <Textarea
                  placeholder="Deskripsikan masalah secara detail..."
                  value={editingNotification.problemDetail}
                  onChange={(e) => setEditingNotification({
                    ...editingNotification, 
                    problemDetail: e.target.value
                  })}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateNotification}
                  className="flex-1"
                >
                  Perbarui Notifikasi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingNotification(null);
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Order Dialog */}
      {selectedNotificationForOrder && (
        <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Order dari Notifikasi: {selectedNotificationForOrder.uniqueNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nama Pekerjaan *</label>
                <Input
                  placeholder="Masukkan nama pekerjaan"
                  value={createOrderForm.jobName}
                  onChange={(e) => setCreateOrderForm({...createOrderForm, jobName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tanggal Mulai *</label>
                  <Input
                    type="date"
                    value={createOrderForm.startDate}
                    onChange={(e) => setCreateOrderForm({...createOrderForm, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tanggal Selesai</label>
                  <Input
                    type="date"
                    value={createOrderForm.endDate}
                    onChange={(e) => setCreateOrderForm({...createOrderForm, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Keterangan</label>
                <Textarea
                  placeholder="Deskripsi detail pekerjaan..."
                  value={createOrderForm.description}
                  onChange={(e) => setCreateOrderForm({...createOrderForm, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Aktivitas & Objek</label>
                  <Button variant="outline" size="sm" onClick={addOrderActivity}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-3">
                  {createOrderForm.activities.map((activity, index) => (
                    <div key={index} className="grid grid-cols-11 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Aktivitas"
                          value={activity.activity}
                          onChange={(e) => updateOrderActivity(index, 'activity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          placeholder="Objek"
                          value={activity.object}
                          onChange={(e) => updateOrderActivity(index, 'object', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        {createOrderForm.activities.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeOrderActivity(index)}
                            className="text-red-600"
                          >
                            Hapus
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSubmitCreateOrder}
                  className="flex-1"
                >
                  Buat Order
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateOrderDialogOpen(false);
                    setSelectedNotificationForOrder(null);
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Cari berdasarkan nomor, masalah, atau departemen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: "ALL" | "PROCESS" | "COMPLETE") => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PROCESS">Proses</SelectItem>
                <SelectItem value="COMPLETE">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Tidak ada notifikasi</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "ALL" 
                  ? "Tidak ditemukan notifikasi yang sesuai dengan filter"
                  : "Belum ada notifikasi yang dibuat"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getUrgencyIcon(notification.urgency)}
                      {notification.uniqueNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {dateUtils.formatTime(notification.reportTime)} • {dateUtils.formatDate(notification.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getUrgencyColor(notification.urgency)}>
                      {notification.urgency}
                    </Badge>
                    <Badge className={getStatusColor(notification.status)}>
                      {notification.status === "COMPLETE" ? "Selesai" : "Proses"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Departemen:</p>
                    <p>{notification.department.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Detail Masalah:</p>
                    <p className="text-sm">{notification.problemDetail}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Dibuat oleh: {notification.createdBy.username}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditNotification(notification)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {notification.status === "PROCESS" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleCloseNotification(notification.id)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Close
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleCreateOrder(notification)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Order
                      </Button>
                      
                      {notification.orders.length === 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}