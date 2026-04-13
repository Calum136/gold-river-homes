"use client";

import { formatCurrency } from "@/lib/calculator";

interface CostSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  description?: string;
}

export default function CostSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
}: CostSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-text-secondary text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <span className="text-gold text-xs">$</span>
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseInt(e.target.value) || 0;
              onChange(Math.min(Math.max(v, min), max));
            }}
            className="w-28 bg-input-bg border border-border text-text-white text-sm text-right px-2 py-1 rounded focus:border-gold focus:outline-none transition-colors"
          />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-text-muted text-xs">
        <span>{formatCurrency(min)}</span>
        {description && (
          <span className="text-text-muted/80 italic">{description}</span>
        )}
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}
