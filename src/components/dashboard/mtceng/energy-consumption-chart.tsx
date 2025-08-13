"use client";

import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnergyConsumptionChartProps {
  data: Array<{
    month: string;
    tambang: number;
    pabrik: number;
    supporting: number;
    total: number;
  }>;
  chartType?: "combined" | "stacked" | "grouped";
  showTable?: boolean;
  showAverage?: boolean;
}

export function EnergyConsumptionChart({ 
  data, 
  chartType = "combined", 
  showTable = true, 
  showAverage = true 
}: EnergyConsumptionChartProps): React.JSX.Element {
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
        <div className="bg-gray-900 border border-yellow-400 rounded p-3 shadow-lg min-w-[200px]">
          <p className="text-yellow-400 font-semibold mb-2">{label} 2024</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === "tambang" && "Tambang: "}
              {entry.dataKey === "pabrik" && "Pabrik: "}
              {entry.dataKey === "supporting" && "Supporting: "}
              {entry.dataKey === "total" && "Total MWh: "}
              {entry.value?.toFixed(1) || "0.0"}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    const legendItems = [
      { value: "tambang", color: "#84cc16", label: "Tambang" },
      { value: "pabrik", color: "#f59e0b", label: "Pabrik" },
      { value: "supporting", color: "#8b5cf6", label: "Supporting" },
      { value: "total", color: "#dc2626", label: "Total x 1000" },
    ];

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {legendItems.map((item) => {
          // Hide total legend if not in combined mode
          if (item.value === "total" && chartType !== "combined") {
            return null;
          }
          
          return (
            <div key={item.value} className="flex items-center gap-2">
              {item.value === "total" ? (
                <div className="w-4 h-0.5 bg-red-600"></div>
              ) : (
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-xs text-gray-300">{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-primary-400/30">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">A</span>
          </div>
          <CardTitle className="text-lg font-semibold text-yellow-400">
            KONSUMSI ENERGI LISTRIK
            {chartType === "stacked" && " (Stacked)"}
            {chartType === "grouped" && " (Grouped)"}
            {chartType === "combined" && " (Combined)"}
          </CardTitle>
          <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">Grafik Pemakaian Listrik 2024</p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
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
                yAxisId="left"
                stroke="#fbbf24"
                fontSize={12}
                domain={[0, 6000]}
              />
              {chartType === "combined" && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#dc2626"
                  fontSize={12}
                  domain={[0, 7000]}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              
              {/* Bar charts for individual consumption */}
              <Bar 
                yAxisId="left" 
                dataKey="tambang" 
                stackId={chartType === "stacked" ? "consumption" : "tambang"} 
                fill="#84cc16" 
              />
              <Bar 
                yAxisId="left" 
                dataKey="pabrik" 
                stackId={chartType === "stacked" ? "consumption" : "pabrik"} 
                fill="#f59e0b" 
              />
              <Bar 
                yAxisId="left" 
                dataKey="supporting" 
                stackId={chartType === "stacked" ? "consumption" : "supporting"} 
                fill="#8b5cf6" 
              />
              
              {/* Line chart for total - only show in combined mode */}
              {chartType === "combined" && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="total" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ fill: "#dc2626", strokeWidth: 2, r: 5 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <CustomLegend />
        
        {/* Detailed consumption table */}
        {showTable && (
          <div className="mt-6">
            <h4 className="text-yellow-400 font-semibold mb-3 text-center">
              KONSUMSI ENERGI LISTRIK per Area
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="border border-gray-700 p-2 text-gray-300">Kategori</th>
                    {data.slice(0, 12).map((item) => (
                      <th key={item.month} className="border border-gray-700 p-1 text-gray-300 min-w-[60px]">
                        {item.month}
                      </th>
                    ))}
                    {showAverage && (
                      <th className="border border-gray-700 p-2 text-yellow-400">Average</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-700 p-2 font-semibold text-green-400">Tambang</td>
                    {data.slice(0, 12).map((item, index) => (
                      <td key={index} className="border border-gray-700 p-1 text-center text-green-300">
                        {item.tambang.toFixed(0)}
                      </td>
                    ))}
                    {showAverage && (
                      <td className="border border-gray-700 p-2 text-center text-green-400 font-semibold">
                        {(data.reduce((sum, item) => sum + item.tambang, 0) / 12).toFixed(0)}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="border border-gray-700 p-2 font-semibold text-orange-400">Pabrik</td>
                    {data.slice(0, 12).map((item, index) => (
                      <td key={index} className="border border-gray-700 p-1 text-center text-orange-300">
                        {item.pabrik.toFixed(0)}
                      </td>
                    ))}
                    {showAverage && (
                      <td className="border border-gray-700 p-2 text-center text-orange-400 font-semibold">
                        {(data.reduce((sum, item) => sum + item.pabrik, 0) / 12).toFixed(0)}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="border border-gray-700 p-2 font-semibold text-purple-400">Supporting</td>
                    {data.slice(0, 12).map((item, index) => (
                      <td key={index} className="border border-gray-700 p-1 text-center text-purple-300">
                        {item.supporting.toFixed(0)}
                      </td>
                    ))}
                    {showAverage && (
                      <td className="border border-gray-700 p-2 text-center text-purple-400 font-semibold">
                        {(data.reduce((sum, item) => sum + item.supporting, 0) / 12).toFixed(0)}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
