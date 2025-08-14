"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Activity } from "lucide-react";

interface AvailabilityDataPoint {
  period: string;
  physicalAvailability: number | null;
  mechanicalAvailability: number | null;
  totalWorkingHours: number;
  totalStandbyHours: number;
  totalBreakdownHours: number;
}

interface AvailabilityMetricsChartProps {
  data: AvailabilityDataPoint[];
  timeFilter: "daily" | "weekly" | "monthly" | "yearly";
  loading?: boolean;
}

export function AvailabilityMetricsChart({ 
  data, 
  timeFilter, 
  loading = false 
}: AvailabilityMetricsChartProps): React.JSX.Element {
  const [showTooltipDetails, setShowTooltipDetails] = useState<boolean>(false);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      period: item.period,
      PA: item.physicalAvailability ? Number(item.physicalAvailability.toFixed(1)) : null,
      MA: item.mechanicalAvailability ? Number(item.mechanicalAvailability.toFixed(1)) : null,
      workingHours: item.totalWorkingHours,
      standbyHours: item.totalStandbyHours,
      breakdownHours: item.totalBreakdownHours,
    }));
  }, [data]);

  const averagePA = useMemo(() => {
    const validPA = data.filter(item => item.physicalAvailability !== null);
    if (validPA.length === 0) return 0;
    return validPA.reduce((sum, item) => sum + (item.physicalAvailability || 0), 0) / validPA.length;
  }, [data]);

  const averageMA = useMemo(() => {
    const validMA = data.filter(item => item.mechanicalAvailability !== null);
    if (validMA.length === 0) return 0;
    return validMA.reduce((sum, item) => sum + (item.mechanicalAvailability || 0), 0) / validMA.length;
  }, [data]);

  const formatPeriodLabel = (period: string): string => {
    switch (timeFilter) {
      case "daily":
        return new Date(period).toLocaleDateString("id-ID", { 
          day: "2-digit", 
          month: "short" 
        });
      case "weekly":
        return `Week ${period}`;
      case "monthly":
        return new Date(period + "-01").toLocaleDateString("id-ID", { 
          month: "short", 
          year: "numeric" 
        });
      case "yearly":
        return period;
      default:
        return period;
    }
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number | null;
      color: string;
      payload?: {
        workingHours: number;
        standbyHours: number;
        breakdownHours: number;
      };
    }>;
    label?: string;
  }): React.JSX.Element | null => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-secondary-800 border border-primary/30 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-white mb-2">
            Period: {formatPeriodLabel(label || "")}
          </p>
          
          {payload.map((entry) => (
            <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-secondary-300">
                {entry.dataKey === "PA" ? "Physical Availability" : "Mechanical Availability"}:
              </span>
              <span className="text-sm font-bold text-white">
                {entry.value !== null ? `${entry.value}%` : "N/A"}
              </span>
            </div>
          ))}
          
          {showTooltipDetails && data && (
            <div className="mt-2 pt-2 border-t border-secondary-600">
              <p className="text-xs text-secondary-400">Working: {data.workingHours}h</p>
              <p className="text-xs text-secondary-400">Standby: {data.standbyHours}h</p>
              <p className="text-xs text-secondary-400">Breakdown: {data.breakdownHours}h</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-secondary-800/50 border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Availability Metrics (PA & MA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-800/50 border-primary/30 hover:bg-secondary-800/70 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Availability Metrics (PA & MA)
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-secondary-300">
                Avg PA: {averagePA.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-secondary-300">
                Avg MA: {averageMA.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-secondary-500 mx-auto mb-4" />
              <p className="text-secondary-400">No availability data available</p>
              <p className="text-sm text-secondary-500">
                Data will appear once operational reports are submitted
              </p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={formatPeriodLabel}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Line
                  type="monotone"
                  dataKey="PA"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                  name="Physical Availability"
                  connectNulls={true}
                />
                
                <Line
                  type="monotone"
                  dataKey="MA"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
                  name="Mechanical Availability"
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between text-xs text-secondary-500">
          <button
            onClick={() => setShowTooltipDetails(!showTooltipDetails)}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {showTooltipDetails ? "Hide" : "Show"} tooltip details
          </button>
          <div className="flex items-center gap-4">
            <span>PA: (Working + Breakdown) / Total Hours</span>
            <span>MA: (Working + Standby) / Total Hours</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}