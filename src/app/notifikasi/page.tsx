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
import {
  Bell,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";

interface NotificationItem {
  id: string;
  uniqueNumber: string;
  department: string;
  urgency: string;
  problemDetail: string;
  status: string;
  reportTime: string;
  createdAt: string;
  createdBy: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
}

export default function NotifikasiPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) {
      redirect("/auth/signin");
    }
  }, [session]);

  // Empty notifications array - will be populated from database
  const [notifications] = useState<NotificationItem[]>([]);

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      NORMAL: "default",
      URGENT: "warning", 
      EMERGENCY: "destructive",
    };
    return colors[urgency as keyof typeof colors] || "secondary";
  };

  const getUrgencyIcon = (urgency: string) => {
    const icons = {
      NORMAL: Bell,
      URGENT: AlertTriangle,
      EMERGENCY: AlertCircle,
    };
    const Icon = icons[urgency as keyof typeof icons] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    return status === "COMPLETE" ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
            <p className="text-muted-foreground">
              Kelola laporan masalah dan permintaan dari seluruh departemen
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Buat Notifikasi
          </Button>
        </div>

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
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Data akan dimuat dari database</p>
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
              <div className="text-2xl font-bold text-orange-600">-</div>
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
              <div className="text-2xl font-bold text-green-600">-</div>
              <p className="text-xs text-muted-foreground">Telah ditangani</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-</div>
              <p className="text-xs text-muted-foreground">Prioritas tinggi</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Notifikasi</CardTitle>
            <CardDescription>
              Semua laporan masalah dan permintaan yang telah dibuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Belum Ada Notifikasi
                </h3>
                <p className="text-muted-foreground mb-4">
                  Belum ada laporan masalah atau permintaan yang dibuat
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Notifikasi Pertama
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
