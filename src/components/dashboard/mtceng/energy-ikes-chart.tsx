"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnergyIkesChartProps {
  data: Array<{
    month: string;
    ikesTarget: number | null;
    ikesRealization: number | null;
  }>;
  smoothLine?: boolean;
  comparisonMode?: "target_only" | "real_only" | "target_vs_real";
}

export function EnergyIkesChart({ 
  data, 
  smoothLine = false, 
  comparisonMode = "target_vs_real" 
}: EnergyIkesChartProps): React.JSX.Element {
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      value: number | null;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-yellow-400 rounded p-3 shadow-lg">
          <p className="text-yellow-400 font-semibold mb-2">{label}</p>
          {payload.map((entry, index: number) => {
            // Skip null or invalid values
            if (entry.value === null || entry.value === undefined || entry.value < 0 || entry.value > 10000) {
              return null;
            }
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.dataKey === "ikesTarget" && "Target IKES kWh/wmt: "}
                {entry.dataKey === "ikesRealization" && "Realisasi IKES Total kWh/wmt: "}
                {Number.isInteger(entry.value) ? entry.value.toString() : entry.value.toFixed(1)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    return (
      <div className="flex justify-center gap-6 mt-4">
        {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-xs text-gray-300">Target IKES kWh/wmt</span>
          </div>
        )}
        {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-yellow-500"></div>
            <span className="text-xs text-gray-300">Realisasi IKES Total kWh/wmt</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-yellow-400 text-center">
          Intensitas Energi Listrik (kWh/wmt) 2025 vs Baseline
          {comparisonMode === "target_only" && " - Target Only"}
          {comparisonMode === "real_only" && " - Realization Only"}
          {smoothLine && " (Smooth)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
                domain={[200, 400]}
                tickFormatter={(value) => Number.isInteger(value) ? value.toString() : value.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
                <Line 
                  type={smoothLine ? "monotone" : "linear"} 
                  dataKey="ikesRealization" 
                  stroke="#fbbf24" 
                  strokeWidth={3}
                  dot={{ fill: "#fbbf24", strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              )}
              {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
                <Line 
                  type={smoothLine ? "monotone" : "linear"} 
                  dataKey="ikesTarget" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <CustomLegend />
        
        {/* Data Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 py-2">Month</th>
                {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
                  <th className="text-center text-gray-400 py-2">Realisasi IKES</th>
                )}
                {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
                  <th className="text-center text-gray-400 py-2">Target IKES</th>
                )}
                {comparisonMode === "target_vs_real" && (
                  <th className="text-center text-gray-400 py-2">Variance</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const variance = (item.ikesRealization !== null && item.ikesTarget !== null && 
                                 item.ikesRealization > 0 && item.ikesTarget > 0 && 
                                 item.ikesRealization < 10000 && item.ikesTarget < 10000) 
                  ? item.ikesRealization - item.ikesTarget 
                  : null;
                return (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="text-yellow-400 py-1 font-medium">{item.month}-25</td>
                    {(comparisonMode === "real_only" || comparisonMode === "target_vs_real") && (
                      <td className="text-center text-yellow-400 py-1">
                        {(item.ikesRealization !== null && item.ikesRealization > 0 && item.ikesRealization < 10000) 
                          ? (Number.isInteger(item.ikesRealization) ? item.ikesRealization.toString() : item.ikesRealization.toFixed(1))
                          : "-"}
                      </td>
                    )}
                    {(comparisonMode === "target_only" || comparisonMode === "target_vs_real") && (
                      <td className="text-center text-red-400 py-1">
                        {(item.ikesTarget !== null && item.ikesTarget > 0 && item.ikesTarget < 10000) 
                          ? (Number.isInteger(item.ikesTarget) ? item.ikesTarget.toString() : item.ikesTarget.toFixed(1))
                          : "-"}
                      </td>
                    )}
                    {comparisonMode === "target_vs_real" && (
                      <td className={`text-center py-1 ${variance && variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {variance !== null ? (variance > 0 ? '+' : '') + (Number.isInteger(variance) ? variance.toString() : variance.toFixed(1)) : "-"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
