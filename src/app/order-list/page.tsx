"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToastContext } from "@/lib/hooks";
import { Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { roleUtils, dateUtils } from "@/lib/utils";

interface Order {
  id: number;
  notificationId: number;
  jobName: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  notification: {
    id: number;
    uniqueNumber: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
    urgency: "NORMAL" | "URGENT" | "EMERGENCY";
    problemDetail: string;
  };
  activities: Array<{
    id: number;
    activity: string;
    object: string;
    isCompleted: boolean;
  }>;
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
}

export default function OrderListPage(): React.JSX.Element {
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
      <OrderListContent
        session={session}
        showSuccess={showSuccess}
        showError={showError}
      />
    </AppLayout>
  );
}

function OrderListContent({
  session,
  showSuccess,
  showError,
}: {
  session: {
    user: {
      id: string;
      role: string;
      departmentId?: number | null;
      username: string;
    };
  };
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Load orders with stable reference to prevent infinite loops
  const loadOrders = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/orders?${params.toString()}`);

      if (response.ok) {
        const apiResponse = await response.json();
        const orders = apiResponse.data?.orders || apiResponse.orders || [];
        setOrders(orders);
      } else {
        showError(`Gagal memuat order list: ${response.status}`);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      showError("Terjadi kesalahan saat memuat order list");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle toggle expand order
  const toggleExpandOrder = (orderId: number): void => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Handle real-time activity status update
  const handleUpdateActivityStatus = async (
    orderId: number,
    activityId: number,
    isCompleted: boolean
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });

      if (response.ok) {
        // Real-time update without full reload
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  activities: order.activities.map((activity) =>
                    activity.id === activityId
                      ? { ...activity, isCompleted }
                      : activity
                  ),
                }
              : order
          )
        );
        showSuccess("Status berhasil diperbarui");
      } else {
        const error = await response.json();
        showError(error.error || "Gagal memperbarui status aktivitas");
      }
    } catch (error) {
      console.error("Error updating activity status:", error);
      showError("Terjadi kesalahan saat memperbarui status aktivitas");
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case "EMERGENCY":
        return "bg-red-900/20 text-red-400 border-red-700";
      case "URGENT":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-700";
      default:
        return "bg-gray-800/50 text-gray-300 border-gray-600";
    }
  };

  const getProgressPercentage = (activities: Order["activities"]): number => {
    if (activities.length === 0) return 0;
    const completed = activities.filter((a) => a.isCompleted).length;
    return Math.round((completed / activities.length) * 100);
  };

  const canUpdateActivity =
    session?.user &&
    roleUtils.canModifyData(
      session.user.role as "ADMIN" | "PLANNER" | "INPUTTER" | "VIEWER"
    );

  const filteredOrders = orders.filter((order): boolean => {
    const matchesSearch =
      searchTerm === "" ||
      order.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notification.uniqueNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.notification.department.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex-shrink-0 bg-black px-6 py-4 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Memuat order list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 bg-black px-6 py-4 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Wrench className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-yellow-400">
                Order List
              </h1>
              <p className="text-gray-300">
                Kelola dan pantau work order departemen
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="space-y-4">
          <Input
            placeholder="Cari berdasarkan nama pekerjaan, nomor notifikasi, atau departemen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-gray-600 text-gray-300 placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20"
          />
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-yellow-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Wrench className="h-10 w-10 text-yellow-400" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-yellow-400">
                Tidak ada order
              </h3>
              <p className="text-gray-300">
                {searchTerm
                  ? "Tidak ditemukan order yang sesuai dengan pencarian"
                  : "Belum ada order yang dibuat dari notifikasi"}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const progress = getProgressPercentage(order.activities);
              const isExpanded = expandedOrders.has(order.id);

              return (
                <div
                  key={order.id}
                  className="border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-all duration-300"
                >
                  {/* Order Header - Always Visible */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-800/30 rounded-t-lg"
                    onClick={() => toggleExpandOrder(order.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-3">
                          {order.jobName}
                          <span className="text-xs bg-gray-800/50 text-gray-300 border border-gray-600 px-2 py-1 rounded-md font-normal">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        </h3>
                        <div className="flex items-center gap-6 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{dateUtils.formatDate(order.startDate)}</span>
                            {order.endDate && (
                              <span>
                                {" "}
                                - {dateUtils.formatDate(order.endDate)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span>
                              Dari:{" "}
                              <span className="font-medium text-yellow-400">
                                {order.notification.uniqueNumber}
                              </span>
                            </span>
                            <Badge
                              className={`border font-medium ${getUrgencyColor(
                                order.notification.urgency
                              )}`}
                            >
                              {order.notification.urgency}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-yellow-400">
                            {progress}% Selesai
                          </div>
                          <div className="text-xs text-gray-500">
                            {
                              order.activities.filter((a) => a.isCompleted)
                                .length
                            }{" "}
                            / {order.activities.length} aktivitas
                          </div>
                        </div>
                        {progress === 100 ? (
                          <CheckCircle className="h-6 w-6 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-yellow-400" />
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-700 bg-gray-800/20 p-6 rounded-b-lg">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-300">
                              Departemen:
                            </p>
                            <p className="text-yellow-400">
                              {order.notification.department.name}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-300">
                              Dibuat oleh:
                            </p>
                            <p className="text-yellow-400">
                              {order.createdBy.username}
                            </p>
                          </div>
                        </div>

                        {order.description && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-300">
                              Deskripsi:
                            </p>
                            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                              <p className="text-sm text-gray-300">
                                {order.description}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-300">
                            Aktivitas & Status:
                          </p>
                          <div className="space-y-3">
                            {order.activities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600 hover:border-yellow-500/50 transition-colors"
                              >
                                {canUpdateActivity ? (
                                  <Checkbox
                                    checked={activity.isCompleted}
                                    onCheckedChange={(checked) =>
                                      handleUpdateActivityStatus(
                                        order.id,
                                        activity.id,
                                        checked as boolean
                                      )
                                    }
                                    className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 border-gray-500"
                                  />
                                ) : (
                                  <Checkbox
                                    checked={activity.isCompleted}
                                    disabled
                                    className="data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500 border-gray-600"
                                  />
                                )}
                                <div className="flex-1">
                                  <span
                                    className={
                                      activity.isCompleted
                                        ? "line-through text-gray-500"
                                        : "text-gray-300"
                                    }
                                  >
                                    <span className="font-medium">
                                      {activity.activity}
                                    </span>{" "}
                                    - {activity.object}
                                  </span>
                                </div>
                                <div className="text-xs font-medium">
                                  {activity.isCompleted ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Selesai
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Belum
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
