"use client";

import { amortizationOptions } from "@/lib/defaults";

interface MortgageInputsProps {
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
  onDownPaymentChange: (value: number) => void;
  onInterestRateChange: (value: number) => void;
  onAmortizationChange: (value: number) => void;
}

export default function MortgageInputs({
  downPaymentPercent,
  interestRate,
  amortizationYears,
  onDownPaymentChange,
  onInterestRateChange,
  onAmortizationChange,
}: MortgageInputsProps) {
  return (
    <div className="space-y-5">
      {/* Down Payment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-text-secondary text-sm font-medium">
            Down Payment
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={downPaymentPercent}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                onDownPaymentChange(Math.min(Math.max(v, 0), 100));
              }}
              className="w-20 bg-input-bg border border-border text-text-white text-sm text-right px-2 py-1 rounded focus:border-gold focus:outline-none transition-colors"
              step="0.5"
            />
            <span className="text-gold text-sm">%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={0.5}
          value={downPaymentPercent}
          onChange={(e) => onDownPaymentChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-text-muted text-xs">
          <span>0%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-text-secondary text-sm font-medium">
            Interest Rate
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={interestRate}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                onInterestRateChange(Math.min(Math.max(v, 0), 15));
              }}
              className="w-20 bg-input-bg border border-border text-text-white text-sm text-right px-2 py-1 rounded focus:border-gold focus:outline-none transition-colors"
              step="0.1"
            />
            <span className="text-gold text-sm">%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={15}
          step={0.1}
          value={interestRate}
          onChange={(e) => onInterestRateChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-text-muted text-xs">
          <span>0%</span>
          <span>15%</span>
        </div>
      </div>

      {/* Amortization Period */}
      <div className="space-y-2">
        <label className="text-text-secondary text-sm font-medium block">
          Amortization Period
        </label>
        <div className="flex gap-2">
          {amortizationOptions.map((years) => (
            <button
              key={years}
              onClick={() => onAmortizationChange(years)}
              className={`flex-1 py-2 text-sm font-medium transition-all duration-200 border ${
                amortizationYears === years
                  ? "bg-gold/15 border-gold text-gold"
                  : "bg-input-bg border-border text-text-muted hover:border-border-gold hover:text-text-secondary"
              }`}
            >
              {years} yr
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

