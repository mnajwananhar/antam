"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Info } from "lucide-react";

interface UtilizationDataPoint {
  period: string;
  ua: number | null;
  eu: number | null;
}

interface UtilizationChartProps {
  data: UtilizationDataPoint[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function UtilizationChart({
  data,
  isLoading = false,
  title = "Use of Availability & Effective Utilization",
  description = "UA: Efisiensi saat alat available | EU: Efisiensi keseluruhan dari total waktu",
}: UtilizationChartProps): React.JSX.Element {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      ua: item.ua ? Math.round(item.ua * 100) / 100 : null,
      eu: item.eu ? Math.round(item.eu * 100) / 100 : null,
    }));
  }, [data]);

  const formatTooltipValue = (value: number | null): string => {
    if (value === null) return "No data";
    return `${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number | null;
      color: string;
    }>;
    label?: string;
  }): React.JSX.Element | null => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-secondary-800 border border-primary/30 rounded-lg p-3 shadow-lg">
        <p className="text-secondary-200 font-medium mb-2">{`Period: ${label}`}</p>
        {payload.map((entry, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {`${entry.name}: ${formatTooltipValue(entry.value)}`}
          </p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-secondary-800/50 border-primary/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div className="animate-pulse bg-secondary-700 h-5 w-48 rounded"></div>
          </div>
          <div className="animate-pulse bg-secondary-700 h-4 w-96 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse bg-secondary-700 h-64 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some(item => item.ua !== null || item.eu !== null);

  return (
    <Card className="bg-secondary-800/50 border-primary/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
            </CardTitle>
            <p className="text-sm text-secondary-400">{description}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-secondary-500">
            <Info className="h-3 w-3" />
            <span>Utilization Metrics</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="relative">
                <Activity className="h-16 w-16 text-secondary-600 mx-auto" />
                <div className="absolute -bottom-1 -right-1 bg-secondary-700 rounded-full p-1">
                  <Info className="h-4 w-4 text-secondary-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-secondary-400 font-medium">Data Tidak Tersedia</p>
                <p className="text-xs text-secondary-600 max-w-xs mx-auto">
                  Data UA dan EU akan muncul setelah laporan operasional diinput untuk alat yang dipilih
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-secondary-600 pt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>UA (Use of Availability)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>EU (Effective Utilization)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="period"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    color: "#9CA3AF",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ua"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#F59E0B", strokeWidth: 2 }}
                  name="Use of Availability (UA)"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="eu"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#EF4444", strokeWidth: 2 }}
                  name="Effective Utilization (EU)"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
