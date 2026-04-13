"use client";

import { CostBreakdown, formatCurrency } from "@/lib/calculator";
import { costLabels } from "@/lib/defaults";

interface CostSummaryProps {
  costs: CostBreakdown;
  totalCost: number;
}

export default function CostSummary({ costs, totalCost }: CostSummaryProps) {
  const entries = Object.entries(costs) as [keyof CostBreakdown, number][];

  return (
    <div className="bg-bg-secondary border border-border p-6">
      <h3 className="font-display text-text-white text-lg mb-4">
        Cost Breakdown
      </h3>
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
            <span className="text-text-muted text-sm">
              {costLabels[key] || key}
            </span>
            <span className="text-text-secondary text-sm font-medium tabular-nums">
              {formatCurrency(value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-gold/30">
        <div className="flex justify-between items-center">
          <span className="text-gold uppercase text-sm font-semibold tracking-wider">
            Total Project Cost
          </span>
          <span className="text-gold text-xl font-bold tabular-nums">
            {formatCurrency(totalCost)}
          </span>
        </div>
      </div>
    </div>
  );
}
