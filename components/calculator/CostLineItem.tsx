"use client";

import { formatCurrency } from "@/lib/calculator";

interface CostLineItemProps {
  label: string;
  amount: number;
  description?: string;
  highlight?: boolean;
}

export default function CostLineItem({
  label,
  amount,
  description,
  highlight = false,
}: CostLineItemProps) {
  if (amount === 0) return null;

  return (
    <div className={`flex justify-between items-start py-2.5 border-b border-border/40 last:border-0 ${
      highlight ? "" : ""
    }`}>
      <div className="flex-1">
        <span className={`text-sm ${highlight ? "text-gold font-semibold" : "text-text-secondary"}`}>
          {label}
        </span>
        {description && (
          <p className="text-text-muted/60 text-xs mt-0.5">{description}</p>
        )}
      </div>
      <span className={`text-sm font-medium tabular-nums shrink-0 ml-4 ${
        highlight ? "text-gold font-bold text-base" : "text-text-white"
      }`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}
