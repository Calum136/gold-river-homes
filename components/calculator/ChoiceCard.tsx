"use client";

import { formatCurrency } from "@/lib/calculator";
import { CostEstimate } from "@/lib/defaults";

interface ChoiceCardProps {
  estimate: CostEstimate;
  selected: boolean;
  onClick: () => void;
}

export default function ChoiceCard({
  estimate,
  selected,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 border transition-all duration-200 ${
        selected
          ? "bg-gold/10 border-gold shadow-[0_0_20px_rgba(151,118,78,0.1)]"
          : "bg-bg-elevated border-border hover:border-border-gold/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className={`font-medium text-base mb-1 ${selected ? "text-gold" : "text-text-white"}`}>
            {estimate.label}
          </h4>
          <p className="text-text-muted text-sm leading-relaxed mb-3">
            {estimate.description}
          </p>
          {estimate.whyItMatters && (
            <p className="text-text-muted/70 text-xs leading-relaxed italic border-t border-border/50 pt-2 mt-2">
              {estimate.whyItMatters}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-lg font-bold tabular-nums ${selected ? "text-gold" : "text-text-white"}`}>
            {formatCurrency(estimate.mid)}
          </div>
          <div className="text-text-muted text-xs tabular-nums">
            {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
          </div>
          <div className="text-text-muted/60 text-[10px] uppercase tracking-wider mt-0.5">
            typical range
          </div>
        </div>
      </div>

      {/* Selection indicator */}
      <div className={`mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${
        selected ? "text-gold" : "text-text-muted/40"
      }`}>
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-gold" : "border-border"
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-gold" />}
        </div>
        {selected ? "Selected" : "Click to select"}
      </div>
    </button>
  );
}
