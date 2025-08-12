"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardCarousel } from "@/components/dashboard/dashboard-carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENTS } from "@/lib/constants";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardPage(): React.JSX.Element {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return <DashboardContent />;
}

function DashboardContent(): React.JSX.Element {
  const [currentDeptIndex, setCurrentDeptIndex] = useState<number>(0);
  const departmentsPerPage = 5;
  const maxIndex = Math.ceil(DEPARTMENTS.length / departmentsPerPage) - 1;

  const handlePrevious = (): void => {
    setCurrentDeptIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = (): void => {
    setCurrentDeptIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const currentDepartments = DEPARTMENTS.slice(
    currentDeptIndex * departmentsPerPage,
    (currentDeptIndex + 1) * departmentsPerPage
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-primary">
          Dashboard Operasional ANTAM
        </h1>
        <p className="text-secondary-600 dark:text-secondary-300 max-w-2xl mx-auto">
          Monitoring dan pengelolaan sistem informasi operasional pertambangan
        </p>
      </div>

      {/* Dashboard Carousel */}
      <div className="w-full">
        <DashboardCarousel autoRotate={true} rotateInterval={8000} />
      </div>

      {/* Department Navigation */}
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={maxIndex === 0}
              className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-secondary-500 dark:text-secondary-400 min-w-[60px] text-center">
              {currentDeptIndex + 1} / {maxIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={maxIndex === 0}
              className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Department Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
          {currentDepartments.map((department) => (
            <Card
              key={`${currentDeptIndex}-${department.id}`}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-secondary-50 dark:bg-secondary-800 border-primary/20 dark:border-primary/30 hover:border-primary/50 dark:hover:border-primary/60"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <CardTitle className="text-base font-bold text-secondary-800 dark:text-primary truncate">
                    {department.code}
                  </CardTitle>
                  <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                    <Activity className="h-3 w-3 text-primary" />
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit text-xs border-primary/30 text-primary bg-primary/10"
                >
                  {department.code === "MTCENG" ? "Bureau" : "Dept."}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-xs text-secondary-700 dark:text-secondary-300">
                  {department.name}
                </div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400">
                  Equipment Management System
                </div>

                <Link
                  href={`/dashboard/${department.code.toLowerCase()}`}
                  className="block"
                >
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-secondary font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    size="sm"
                  >
                    Detail
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Dots */}
        {maxIndex > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentDeptIndex(index)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === currentDeptIndex
                    ? "bg-primary w-6"
                    : "bg-secondary-300 dark:bg-secondary-600 hover:bg-secondary-400 dark:hover:bg-secondary-500"
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
