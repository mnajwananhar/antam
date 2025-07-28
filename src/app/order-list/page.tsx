import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  Settings,
  Calendar,
  User,
  Wrench,
} from "lucide-react";

export default async function OrderListPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Empty orders array - will be populated from database
  const orders: any[] = [];

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "yellow",
      IN_PROGRESS: "default",
      COMPLETED: "success",
      CANCELLED: "destructive",
    };
    return colors[status as keyof typeof colors] || "secondary";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: "Pending",
      IN_PROGRESS: "Dalam Proses",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan",
    };
    return labels[status as keyof typeof labels] || status;
  };

  interface ActivityItem {
    activity: string;
    object: string;
    isCompleted: boolean;
  }

  const calculateProgress = (activities: ActivityItem[]) => {
    if (activities.length === 0) return 0;
    const completed = activities.filter((a) => a.isCompleted).length;
    return Math.round((completed / activities.length) * 100);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Order List</h1>
            <p className="text-muted-foreground">
              Daftar perintah kerja formal dari notifikasi yang telah diproses
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Buat Order Baru
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Order</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data akan dimuat dari database</p>
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
              <div className="text-2xl font-bold text-primary-600">-</div>
              <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">-</div>
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
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Semua order aktif</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Belum Ada Order
                </h3>
                <p className="text-muted-foreground mb-4">
                  Belum ada perintah kerja yang dibuat dari notifikasi
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Order Pertama
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
