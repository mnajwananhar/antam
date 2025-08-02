"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardCarousel } from "@/components/dashboard/dashboard-carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENTS } from "@/lib/constants";
import { departmentUtils } from "@/lib/utils";
import { Activity } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout className="!p-0">
      <DashboardContent />
    </AppLayout>
  );
}

function DashboardContent() {
  const [currentDeptIndex, setCurrentDeptIndex] = useState(0);
  const departmentsPerPage = 5;

  // Auto-rotate department cards every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDeptIndex((prev) => {
        const maxIndex = Math.ceil(DEPARTMENTS.length / departmentsPerPage) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const currentDepartments = DEPARTMENTS.slice(
    currentDeptIndex * departmentsPerPage,
    (currentDeptIndex + 1) * departmentsPerPage
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Dashboard Carousel - Mengambil sebagian besar ruang */}
      <div className="flex-1 p-6 pb-2">
        <DashboardCarousel autoRotate={true} rotateInterval={5000} />
      </div>

      {/* Department Cards - Compact di bagian bawah */}
      <div className="flex-shrink-0 bg-black px-6 py-4">
        <div className="grid grid-cols-5 gap-3">
          {currentDepartments.map((department) => (
            <Card
              key={`${currentDeptIndex}-${department.id}`}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 h-32"
            >
              <CardHeader className="pb-1 px-3 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <CardTitle className="text-sm font-bold text-yellow-400 truncate">
                    {department.code}
                  </CardTitle>
                  <div className="h-5 w-5 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-3 w-3 text-yellow-400" />
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs w-fit border-gray-600 text-gray-300 bg-gray-800/50 px-1 py-0"
                >
                  {department.code === "MTCENG" ? "Bureau" : "Dept."}
                </Badge>
              </CardHeader>

              <CardContent className="px-3 pb-3 flex flex-col justify-between flex-1">
                <div className="text-xs text-gray-500 font-medium mb-2 line-clamp-2">
                  Equipment management
                </div>

                <Link
                  href={`/dashboard/${departmentUtils.nameToSlug(
                    department.name
                  )}`}
                >
                  <Button
                    size="sm"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all duration-300 text-xs h-7"
                  >
                    Detail
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
