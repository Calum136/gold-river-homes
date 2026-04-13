"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CostBreakdown, formatCurrency } from "@/lib/calculator";
import { costLabels } from "@/lib/defaults";

const COLORS = [
  "#97764E", // gold
  "#C4882A", // gold-bright
  "#6B8E6B", // sage
  "#7B9DBF", // steel blue
  "#B87A5E", // terra cotta
  "#8B7BAE", // lavender
  "#6BAEB8", // teal
  "#C4A35A", // amber
  "#9B8B7A", // taupe
];

interface CostBreakdownChartProps {
  costs: CostBreakdown;
}

export default function CostBreakdownChart({ costs }: CostBreakdownChartProps) {
  const data = Object.entries(costs)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: costLabels[key] || key,
      value,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border p-6">
      <h3 className="font-display text-text-white text-lg mb-4">
        Where Your Money Goes
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "#171D23",
                border: "1px solid rgba(232,220,204,0.12)",
                borderRadius: "4px",
                color: "#E8DCCC",
                fontSize: "13px",
              }}
              itemStyle={{ color: "#E8DCCC" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-text-muted text-xs truncate">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
