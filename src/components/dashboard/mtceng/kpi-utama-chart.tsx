"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiUtamaChartProps {
  data: Array<{
    month: string;
    rencana: number;
    aktual: number;
  }>;
  chartOrientation?: "vertical" | "horizontal";
}

export function KpiUtamaChart({ data, chartOrientation = "vertical" }: KpiUtamaChartProps): React.JSX.Element {
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
          <p className="text-yellow-400 font-semibold mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === "rencana" && "Rencana: "}
              {entry.dataKey === "aktual" && "Aktual: "}
              {entry.value}
            </p>
          ))}
          {payload.length === 2 && (
            <div className="border-t border-gray-600 mt-2 pt-2">
              <p className="text-yellow-400 text-sm font-semibold">
                Pencapaian: {((payload[1].value / payload[0].value) * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    const legendItems = [
      { value: "rencana", color: "#3b82f6", label: "Rencana" },
      { value: "aktual", color: "#10b981", label: "Aktual" },
    ];

    return (
      <div className="flex justify-center gap-6 mt-4">
        {legendItems.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-300">{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate stats - show actual values for single month, average for multiple months
  const isAllMonths = data.length > 1;
  const totalRencana = data.reduce((sum, month) => sum + month.rencana, 0);
  const totalAktual = data.reduce((sum, month) => sum + month.aktual, 0);
  
  const displayRencana = isAllMonths ? totalRencana / data.length : totalRencana;
  const displayAktual = isAllMonths ? totalAktual / data.length : totalAktual;
  const overallPerformance = displayRencana > 0 ? (displayAktual / displayRencana) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-yellow-400 text-center">
          KPI Utama - Rencana vs Aktual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={chartOrientation === "horizontal" ? "h-96" : "h-80"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={chartOrientation === "horizontal" ? "horizontal" : undefined}
              margin={{ 
                top: 20, 
                right: 50, 
                left: chartOrientation === "horizontal" ? 60 : 20, 
                bottom: chartOrientation === "horizontal" ? 20 : 60 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              {chartOrientation === "horizontal" ? (
                <>
                  <XAxis 
                    type="number"
                    stroke="#fbbf24"
                    fontSize={12}
                    domain={[0, 'dataMax + 50']}
                  />
                  <YAxis 
                    type="category"
                    dataKey="month" 
                    stroke="#fbbf24"
                    fontSize={12}
                    width={50}
                  />
                </>
              ) : (
                <>
                  <XAxis 
                    dataKey="month" 
                    stroke="#fbbf24"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#fbbf24"
                    fontSize={12}
                    domain={[0, 'dataMax + 50']}
                    label={{ 
                      value: 'JUMLAH', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#fbbf24' }
                    }}
                  />
                </>
              )}
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="rencana" 
                fill="#3b82f6"
                name="Rencana"
              />
              <Bar 
                dataKey="aktual" 
                fill="#10b981"
                name="Aktual"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <CustomLegend />
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-400">
              {displayRencana.toFixed(0)}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {isAllMonths ? "Rata-rata Rencana" : "Rencana"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-400">
              {displayAktual.toFixed(0)}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {isAllMonths ? "Rata-rata Aktual" : "Aktual"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-yellow-400">
              {overallPerformance.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Pencapaian</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}