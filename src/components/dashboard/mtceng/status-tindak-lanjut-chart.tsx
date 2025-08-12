"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatusTindakLanjutChartProps {
  data: {
    open: number;
    close: number;
  };
}

export function StatusTindakLanjutChart({ data }: StatusTindakLanjutChartProps): React.JSX.Element {
  const chartData = [
    {
      name: "MTC ENG",
      open: data.open,
      close: data.close,
    },
  ];

  const total = data.open + data.close;
  const percentage = total > 0 ? Math.round((data.close / total) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      value: number;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-yellow-400 rounded p-3 shadow-lg">
          <p className="text-yellow-400 font-semibold">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === "open" ? "Sum of Open" : "Sum of Close"}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-yellow-400">
          Status Tindak Lanjut ANTAM
        </CardTitle>
        <Badge 
          variant={percentage >= 70 ? "default" : "secondary"} 
          className={percentage >= 70 ? "bg-green-600 text-white" : "bg-yellow-600 text-black"}
        >
          {percentage}%
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
                dataKey="open" 
                fill="#84cc16" 
                name="Sum of Open"
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="close" 
                fill="#6b7280" 
                name="Sum of Close"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{data.open}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Open</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{data.close}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Close</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{total}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${percentage >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
              {percentage}%
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Closed Rate</p>
          </div>
        </div>
        
        {/* Footer note */}
        <div className="mt-2 text-right">
          <p className="text-xs text-gray-500">
            Series &quot;Sum of Close&quot; Point &quot;MTC ENG&quot; Value: {data.close}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
