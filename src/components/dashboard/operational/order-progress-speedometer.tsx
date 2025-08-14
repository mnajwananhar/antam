"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface OrderProgressSpeedometerProps {
  totalActivities: number;
  completedActivities: number;
  totalOrders: number;
  completedOrders: number;
  loading?: boolean;
}

export function OrderProgressSpeedometer({
  totalActivities,
  completedActivities,
  totalOrders,
  completedOrders,
  loading = false,
}: OrderProgressSpeedometerProps): React.JSX.Element {
  
  const activityCompletionRate = totalActivities > 0 
    ? (completedActivities / totalActivities) * 100 
    : 0;

  const orderCompletionRate = totalOrders > 0 
    ? (completedOrders / totalOrders) * 100 
    : 0;

  // Use activity completion rate as main metric for speedometer
  const mainCompletionRate = activityCompletionRate;
  const pendingActivities = totalActivities - completedActivities;
  
  // Calculate speedometer needle angle (0 to 180 degrees)
  const needleAngle = (mainCompletionRate / 100) * 180;
  
  // Determine color based on completion rate
  const getSpeedometerColor = (rate: number): string => {
    if (rate >= 85) return "#22c55e"; // Green
    if (rate >= 70) return "#84cc16"; // Light green
    if (rate >= 50) return "#eab308"; // Yellow
    if (rate >= 30) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getPerformanceIcon = (rate: number): React.JSX.Element => {
    if (rate >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (rate >= 40) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getPerformanceLabel = (rate: number): string => {
    if (rate >= 85) return "Sangat Baik";
    if (rate >= 70) return "Baik";
    if (rate >= 50) return "Cukup";
    if (rate >= 30) return "Perlu Perhatian";
    return "Kritis";
  };

  if (loading) {
    return (
      <Card className="bg-secondary-50 dark:bg-secondary-800/50 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-secondary-800 dark:text-primary">
            <ClipboardList className="h-5 w-5" />
            Order Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse">
              <div className="h-32 w-32 bg-secondary-300 dark:bg-secondary-600 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-50 dark:bg-secondary-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-secondary-800 dark:text-primary">
          <ClipboardList className="h-5 w-5" />
          Order Progress
        </CardTitle>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Progres penyelesaian work order dan aktivitas
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Speedometer */}
          <div className="relative w-48 h-24">
            <svg
              viewBox="0 0 200 100"
              className="w-full h-full"
            >
              {/* Background Arc */}
              <path
                d="M 20 80 A 80 80 0 0 1 180 80"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
              
              {/* Progress Arc */}
              <path
                d="M 20 80 A 80 80 0 0 1 180 80"
                stroke={getSpeedometerColor(mainCompletionRate)}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(mainCompletionRate / 100) * 251.2} 251.2`}
                className="transition-all duration-1000 ease-in-out"
              />
              
              {/* Needle */}
              <g transform={`translate(100, 80) rotate(${needleAngle - 90})`}>
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-60"
                  stroke={getSpeedometerColor(mainCompletionRate)}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="4"
                  fill={getSpeedometerColor(mainCompletionRate)}
                />
              </g>
              
              {/* Scale markers */}
              {[0, 25, 50, 75, 100].map((value) => {
                const angle = (value / 100) * 180 - 90;
                const x1 = 100 + 70 * Math.cos((angle * Math.PI) / 180);
                const y1 = 80 + 70 * Math.sin((angle * Math.PI) / 180);
                const x2 = 100 + 75 * Math.cos((angle * Math.PI) / 180);
                const y2 = 80 + 75 * Math.sin((angle * Math.PI) / 180);
                
                return (
                  <g key={value}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#6b7280"
                      strokeWidth="2"
                    />
                    <text
                      x={100 + 85 * Math.cos((angle * Math.PI) / 180)}
                      y={80 + 85 * Math.sin((angle * Math.PI) / 180)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Main Metric */}
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-800 dark:text-primary">
              {mainCompletionRate.toFixed(1)}%
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              {getPerformanceIcon(mainCompletionRate)}
              <span className="text-sm font-medium text-secondary-600 dark:text-secondary-300">
                {getPerformanceLabel(mainCompletionRate)}
              </span>
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
              Aktivitas Selesai
            </p>
          </div>

          {/* Dual Statistics - Activities and Orders */}
          <div className="grid grid-cols-2 gap-6 w-full">
            {/* Activities Statistics */}
            <div className="text-center space-y-2">
              <h4 className="text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                Aktivitas
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    Total
                  </p>
                  <p className="text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                    {totalActivities}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    Selesai
                  </p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {completedActivities}
                  </p>
                </div>
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400">
                Tersisa: {pendingActivities}
              </div>
            </div>

            {/* Orders Statistics */}
            <div className="text-center space-y-2">
              <h4 className="text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                Order
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    Total
                  </p>
                  <p className="text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                    {totalOrders}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    Selesai
                  </p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {completedOrders}
                  </p>
                </div>
              </div>
              <div className="text-xs text-secondary-500 dark:text-secondary-400">
                Rate: {orderCompletionRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Performance Insight */}
          <div className="text-center bg-secondary-100 dark:bg-secondary-700/50 rounded-lg p-3 w-full">
            <p className="text-xs text-secondary-600 dark:text-secondary-400">
              {mainCompletionRate >= 85 
                ? "Eksekusi work order sangat baik! Tim maintenance bekerja dengan efisien." 
                : mainCompletionRate >= 70
                ? "Progres work order baik, pertahankan momentum ini."
                : mainCompletionRate >= 50
                ? "Progres work order cukup, perlu peningkatan koordinasi tim."
                : mainCompletionRate >= 30
                ? "Perhatian khusus dibutuhkan untuk percepatan eksekusi order."
                : "Status kritis: Perlu intervensi manajemen untuk mengatasi bottleneck."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}