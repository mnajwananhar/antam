"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp } from "lucide-react";

interface NotificationSpeedometerProps {
  totalNotifications: number;
  completedNotifications: number;
  isLoading?: boolean;
  departmentFilter?: string;
}

export function NotificationSpeedometer({
  totalNotifications,
  completedNotifications,
  isLoading = false,
  departmentFilter,
}: NotificationSpeedometerProps): React.JSX.Element {
  const completionRate = totalNotifications > 0 
    ? Math.round((completedNotifications / totalNotifications) * 100) 
    : 0;

  const getSpeedometerColor = (rate: number): string => {
    if (rate >= 80) return "#10B981"; // Green
    if (rate >= 60) return "#F59E0B"; // Yellow
    if (rate >= 40) return "#EF4444"; // Red
    return "#6B7280"; // Gray
  };

  const speedometerColor = getSpeedometerColor(completionRate);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  if (isLoading) {
    return (
      <Card className="bg-secondary-800/50 border-primary/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div className="animate-pulse bg-secondary-700 h-6 w-32 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="animate-pulse bg-secondary-700 h-32 w-32 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-800/50 border-primary/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Progress
          {departmentFilter && (
            <Badge variant="outline" className="ml-2 text-xs">
              {departmentFilter}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Speedometer SVG */}
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#374151"
                strokeWidth="8"
                fill="transparent"
                className="opacity-30"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={speedometerColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-secondary-200">
                {completionRate}%
              </span>
              <span className="text-xs text-secondary-400">Complete</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-400">Total Notifications</span>
              <Badge variant="outline" className="border-blue-400 text-blue-400">
                {totalNotifications}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-400">Completed</span>
              <Badge className="bg-green-600 text-white">
                {completedNotifications}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-400">In Progress</span>
              <Badge className="bg-yellow-600 text-black">
                {totalNotifications - completedNotifications}
              </Badge>
            </div>
          </div>

          {/* Performance indicator */}
          <div className="w-full pt-3 border-t border-secondary-600">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className={`h-4 w-4 ${
                completionRate >= 70 ? 'text-green-500' : 
                completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                completionRate >= 70 ? 'text-green-400' : 
                completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {completionRate >= 70 ? 'Excellent' : 
                 completionRate >= 50 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
            {departmentFilter && (
              <p className="text-xs text-secondary-500 text-center mt-1">
                Department: {departmentFilter}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
