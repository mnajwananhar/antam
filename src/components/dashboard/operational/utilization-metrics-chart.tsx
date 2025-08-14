"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Zap } from "lucide-react";

interface UtilizationDataPoint {
  period: string;
  useOfAvailability: number | null;
  effectiveUtilization: number | null;
  totalWorkingHours: number;
  totalStandbyHours: number;
  totalBreakdownHours: number;
}

interface UtilizationMetricsChartProps {
  data: UtilizationDataPoint[];
  timeFilter: "daily" | "weekly" | "monthly" | "yearly";
  loading?: boolean;
}

export function UtilizationMetricsChart({ 
  data, 
  timeFilter, 
  loading = false 
}: UtilizationMetricsChartProps): React.JSX.Element {
  const [showTooltipDetails, setShowTooltipDetails] = useState<boolean>(false);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      period: item.period,
      UA: item.useOfAvailability ? Number(item.useOfAvailability.toFixed(1)) : null,
      EU: item.effectiveUtilization ? Number(item.effectiveUtilization.toFixed(1)) : null,
      workingHours: item.totalWorkingHours,
      standbyHours: item.totalStandbyHours,
      breakdownHours: item.totalBreakdownHours,
      availableHours: item.totalWorkingHours + item.totalStandbyHours,
      totalHours: item.totalWorkingHours + item.totalStandbyHours + item.totalBreakdownHours,
    }));
  }, [data]);

  const averageUA = useMemo(() => {
    const validUA = data.filter(item => item.useOfAvailability !== null);
    if (validUA.length === 0) return 0;
    return validUA.reduce((sum, item) => sum + (item.useOfAvailability || 0), 0) / validUA.length;
  }, [data]);

  const averageEU = useMemo(() => {
    const validEU = data.filter(item => item.effectiveUtilization !== null);
    if (validEU.length === 0) return 0;
    return validEU.reduce((sum, item) => sum + (item.effectiveUtilization || 0), 0) / validEU.length;
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
        availableHours: number;
        totalHours: number;
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
                {entry.dataKey === "UA" ? "Use of Availability" : "Effective Utilization"}:
              </span>
              <span className="text-sm font-bold text-white">
                {entry.value !== null ? `${entry.value}%` : "N/A"}
              </span>
            </div>
          ))}
          
          {showTooltipDetails && data && (
            <div className="mt-2 pt-2 border-t border-secondary-600">
              <p className="text-xs text-secondary-400">Working: {data.workingHours}h</p>
              <p className="text-xs text-secondary-400">Available: {data.availableHours}h</p>
              <p className="text-xs text-secondary-400">Total: {data.totalHours}h</p>
              <div className="mt-1 pt-1 border-t border-secondary-700">
                <p className="text-xs text-secondary-400">
                  Breakdown Loss: {data.breakdownHours}h ({((data.breakdownHours / data.totalHours) * 100).toFixed(1)}%)
                </p>
              </div>
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
            <Zap className="h-5 w-5" />
            Utilization Metrics (UA & EU)
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
            <Zap className="h-5 w-5" />
            Utilization Metrics (UA & EU)
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-secondary-300">
                Avg UA: {averageUA.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-secondary-300">
                Avg EU: {averageEU.toFixed(1)}%
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
              <p className="text-secondary-400">No utilization data available</p>
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
                  dataKey="UA"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ fill: "#F97316", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#F97316", strokeWidth: 2 }}
                  name="Use of Availability"
                  connectNulls={true}
                />
                
                <Line
                  type="monotone"
                  dataKey="EU"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#8B5CF6", strokeWidth: 2 }}
                  name="Effective Utilization"
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
            <span>UA: Working / Available Hours</span>
            <span>EU: Working / Total Hours</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}