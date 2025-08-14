"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { MtcEngDashboard } from "@/components/dashboard/mtceng/mtc-eng-dashboard";
import { OperationalDashboard } from "@/components/dashboard";

export default function DepartmentDetailPage(): React.JSX.Element {
  const params = useParams();
  const departmentCode = params.department as string;

  const department = DEPARTMENTS.find(
    (dept) => dept.code === departmentCode?.toUpperCase()
  );

  if (!department) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">
              Departemen Tidak Ditemukan
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-secondary-600 dark:text-secondary-400">
              Departemen dengan kode &quot;{departmentCode}&quot; tidak
              ditemukan.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show MTCENG specific dashboard
  if (department.code === "MTCENG") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 to-secondary-800">
        <div className="container mx-auto px-4 py-6">
          <MtcEngDashboard />
        </div>
      </div>
    );
  }

  // Show operational dashboard for other departments (MMTC, PMTC, ECDC, HETU)
  const operationalDepartments = ["MMTC", "PMTC", "ECDC", "HETU"];
  if (operationalDepartments.includes(department.code)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 to-secondary-800">
        <div className="container mx-auto px-4 py-6">
          <OperationalDashboard
            departmentCode={department.code}
            departmentName={department.name}
          />
        </div>
      </div>
    );
  }

  // Default coming soon for any other departments
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-secondary-800 dark:text-primary">
            {department.code}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-300">
            {department.name}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Coming Soon Content */}
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl text-secondary-800 dark:text-primary">
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-secondary-600 dark:text-secondary-400">
              Halaman detail untuk departemen <strong>{department.code}</strong>{" "}
              sedang dalam pengembangan.
            </p>
            <p className="text-secondary-600 dark:text-secondary-400">
              Belum ada data untuk department ini, silakan klik tombol &quot;+
              Tambah Data&quot; untuk menambah data baru.
            </p>
            <p className="text-sm text-secondary-500 dark:text-secondary-500">
              Fitur ini akan segera tersedia dengan informasi lengkap mengenai:
            </p>
            <ul className="text-sm text-secondary-600 dark:text-secondary-400 space-y-1">
              <li>• Status operasional real-time</li>
              <li>• Laporan kinerja departemen</li>
              <li>• Manajemen equipment</li>
              <li>• Analytics dan dashboard khusus</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
