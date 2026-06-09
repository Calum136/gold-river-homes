"use client";

import { formatCurrency } from "@/lib/calculator";
import { calculateConfiguratorPrice } from "@/lib/pricing";
import { lotOptions } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";

interface SummaryStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export default function SummaryStep({ state, onChange }: SummaryStepProps) {
  const result = calculateConfiguratorPrice(state);
  const { items, totalCost, isBundlePricing } = result;

  const lot = state.landSituation === "gold-river"
    ? lotOptions.find((l) => l.id === state.selectedLotId)
    : null;

  const downPaymentAmount = Math.round(totalCost * (state.mortgage.downPaymentPercent / 100));
  const loanAmount = totalCost - downPaymentAmount;
  const monthly = calculateMonthlyPayment(loanAmount, state.mortgage.interestRate, state.mortgage.amortizationYears);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Your Price Summary</h2>
        <p className="text-text-muted text-sm">All costs are estimates. A Gold River Homes rep will confirm final pricing.</p>
      </div>

      {/* Bundle banner */}
      {isBundlePricing && lot && (
        <div className="bg-gold-dark border border-gold/40 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-gold/20 rounded flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <p className="text-gold font-semibold text-sm">Land + Home Bundle</p>
            <p className="text-text-muted/70 text-xs">{lot.name} included · {lot.location}</p>
          </div>
          <p className="ml-auto font-bold text-gold text-lg tabular-nums">{formatCurrency(totalCost)}</p>
        </div>
      )}

      {/* Line items */}
      <div className="border border-border">
        <div className="px-4 py-3 bg-bg-elevated border-b border-border">
          <h3 className="text-white font-medium text-sm">Cost Breakdown</h3>
        </div>
        <div className="divide-y divide-border/50">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between px-4 py-3 gap-3">
              <div>
                <p className="text-text-secondary text-sm">{item.label}</p>
                {item.desc && <p className="text-text-muted/50 text-xs mt-0.5">{item.desc}</p>}
              </div>
              <span className="text-white font-medium tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-4 bg-bg-elevated border-t border-gold/20">
          <span className="text-white font-bold">Total Estimated Cost</span>
          <span className="text-gold font-bold text-xl tabular-nums">{formatCurrency(totalCost)}</span>
        </div>
      </div>

      {/* Mortgage estimator */}
      <div className="border border-border">
        <div className="px-4 py-3 bg-bg-elevated border-b border-border">
          <h3 className="text-white font-medium text-sm">Mortgage Estimate</h3>
        </div>
        <div className="p-4 space-y-4 bg-bg-secondary">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Down Payment %</label>
              <div className="flex items-center border border-border bg-input-bg">
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={state.mortgage.downPaymentPercent}
                  onChange={(e) =>
                    onChange({
                      mortgage: {
                        ...state.mortgage,
                        downPaymentPercent: parseFloat(e.target.value) || 5,
                      },
                    })
                  }
                  className="flex-1 min-w-0 bg-transparent text-white text-sm px-3 py-2 focus:outline-none"
                />
                <span className="text-text-muted pr-2 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Interest Rate</label>
              <div className="flex items-center border border-border bg-input-bg">
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={0.25}
                  value={state.mortgage.interestRate}
                  onChange={(e) =>
                    onChange({
                      mortgage: {
                        ...state.mortgage,
                        interestRate: parseFloat(e.target.value) || 5.5,
                      },
                    })
                  }
                  className="flex-1 min-w-0 bg-transparent text-white text-sm px-3 py-2 focus:outline-none"
                />
                <span className="text-text-muted pr-2 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">Amortization</label>
              <div className="flex items-center border border-border bg-input-bg">
                <input
                  type="number"
                  min={5}
                  max={30}
                  step={5}
                  value={state.mortgage.amortizationYears}
                  onChange={(e) =>
                    onChange({
                      mortgage: {
                        ...state.mortgage,
                        amortizationYears: parseInt(e.target.value) || 25,
                      },
                    })
                  }
                  className="flex-1 min-w-0 bg-transparent text-white text-sm px-3 py-2 focus:outline-none"
                />
                <span className="text-text-muted pr-2 text-sm">yr</span>
              </div>
            </div>
          </div>

          <div className="border border-border bg-bg-elevated divide-y divide-border">
            <div className="flex justify-between px-4 py-3">
              <span className="text-text-secondary text-sm">Down payment ({state.mortgage.downPaymentPercent}%)</span>
              <span className="text-white text-sm tabular-nums">{formatCurrency(downPaymentAmount)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-text-secondary text-sm">Loan amount</span>
              <span className="text-white text-sm tabular-nums">{formatCurrency(loanAmount)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-gold font-semibold text-sm">Estimated monthly payment</span>
              <span className="text-gold font-bold tabular-nums">{formatCurrency(Math.round(monthly))}/mo</span>
            </div>
          </div>

          <p className="text-text-muted/40 text-xs">
            Estimates only. Speak with a mortgage specialist for your actual rate and qualification.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="border border-border bg-bg-elevated p-6 text-center space-y-4">
        <div>
          <h3 className="font-display text-white text-xl mb-1">Ready to build?</h3>
          <p className="text-text-muted text-sm">Reach out to our team and we'll turn this estimate into a real quote.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:9022733033"
            className="flex items-center justify-center gap-2 bg-gold text-white font-semibold px-6 py-3 hover:bg-gold-bright transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14h0z" />
            </svg>
            Call 902-273-3033
          </a>
          <a
            href="mailto:info@goldriverhomes.ca?subject=Home%20Quote%20Request"
            className="flex items-center justify-center gap-2 border border-gold text-gold font-semibold px-6 py-3 hover:bg-gold/10 transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
