"use client";

import { MortgageResult, formatCurrency, formatCurrencyDetailed } from "@/lib/calculator";

interface ResultsPanelProps {
  result: MortgageResult;
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="bg-bg-secondary border-2 border-gold/30 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xl">{"\u{1F4B0}"}</span>
        <h3 className="font-display text-gold text-xl">
          Your Mortgage Estimate
        </h3>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-elevated p-4 border border-border">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
            Monthly Payment
          </p>
          <p className="text-text-white text-2xl sm:text-3xl font-bold tabular-nums">
            {formatCurrencyDetailed(result.monthlyPayment)}
          </p>
        </div>
        <div className="bg-bg-elevated p-4 border border-border">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
            Bi-Weekly Payment
          </p>
          <p className="text-text-white text-2xl sm:text-3xl font-bold tabular-nums">
            {formatCurrencyDetailed(result.biweeklyPayment)}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-text-muted text-sm">Total Project Cost</span>
          <span className="text-text-secondary text-sm font-medium tabular-nums">
            {formatCurrency(result.totalProjectCost)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-text-muted text-sm">Down Payment</span>
          <span className="text-text-secondary text-sm font-medium tabular-nums">
            {formatCurrency(result.downPayment)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-text-muted text-sm">Mortgage Principal</span>
          <span className="text-text-secondary text-sm font-medium tabular-nums">
            {formatCurrency(result.principal)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-text-muted text-sm">Total Interest Paid</span>
          <span className="text-text-secondary text-sm font-medium tabular-nums">
            {formatCurrency(result.totalInterest)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gold text-sm font-semibold">
            Total Amount Paid
          </span>
          <span className="text-gold text-sm font-bold tabular-nums">
            {formatCurrency(result.totalPaid + result.downPayment)}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-text-muted/60 text-xs leading-relaxed border-t border-border pt-4">
        * This calculator provides estimates only. Actual costs may vary based
        on location, site conditions, market rates, and contractor quotes.
        Contact Gold River Homes for a personalized assessment.
      </p>
    </div>
  );
}
