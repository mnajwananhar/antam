"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KpiSummaryChartProps {
  data: {
    actual: number;
    target: number;
    percentage: number;
  };
}

export function KpiSummaryChart({ data }: KpiSummaryChartProps): React.JSX.Element {
  const chartData = [
    {
      name: "MTC ENG",
      rencana: data.target,
      actual: data.actual,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-yellow-400 rounded p-3 shadow-lg">
          <p className="text-yellow-400 font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === "rencana" ? "Sum of Rencana" : "Sum of Actual"}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-yellow-400/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-yellow-400">
          Pelaporan KPI Utama ANTAM
        </CardTitle>
        <Badge 
          variant={data.percentage >= 100 ? "default" : "secondary"} 
          className={data.percentage >= 100 ? "bg-green-600 text-white" : "bg-yellow-600 text-black"}
        >
          {data.percentage}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{
                top: 20,
                right: 30,
                left: 60,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number"
                stroke="#fbbf24"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="#fbbf24"
                fontSize={12}
                fontWeight="500"
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="rencana" 
                fill="#dc2626" 
                name="Sum of Rencana"
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="actual" 
                fill="#fbbf24" 
                name="Sum of Actual"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{data.target}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Rencana</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{data.actual}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Actual</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${data.percentage >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
              {data.percentage}%
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Achievement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
