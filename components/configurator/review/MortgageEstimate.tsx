"use client";

import { useId, useState } from "react";
import { calculateMortgage, formatCurrency } from "@/lib/calculator";
import type { MortgageInputs } from "@/lib/calculator";
import { calculateConfiguratorPrice } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";

interface NumberFieldProps {
  label: string;
  /** Unit shown after the input, e.g. "%". */
  unit: string;
  /** The unit as words, for screen readers. */
  unitName: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (value: number) => void;
}

// A number input that lets the buyer clear it and type freely: every valid
// number commits (clamped to the same limits sanitizeState applies), and
// leaving the field shows the committed value again.
function NumberField({ label, unit, unitName, value, min, max, step, onCommit }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [committed, setCommitted] = useState(value);
  // A new value from outside (a loaded configuration) replaces the draft.
  if (value !== committed) {
    setCommitted(value);
    setDraft(String(value));
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-caption text-text-muted">
        {label}
        <span className="sr-only"> ({unitName})</span>
      </label>
      <div className="focus-ring-within flex items-center border border-border bg-input-bg">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const parsed = parseFloat(e.target.value);
            if (Number.isFinite(parsed)) {
              const next = Math.min(Math.max(parsed, min), max);
              setCommitted(next);
              onCommit(next);
            }
          }}
          onBlur={() => setDraft(String(value))}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-body text-text-primary focus:outline-none"
        />
        <span aria-hidden className="pr-3 text-body-sm text-text-muted">
          {unit}
        </span>
      </div>
    </div>
  );
}

interface MortgageEstimateProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

// The monthly payment on the mid estimate, with the buyer's own terms. Canadian
// rules apply: the down payment is raised to the legal minimum when needed, and
// an insured mortgage adds the CMHC premium to the loan.
export default function MortgageEstimate({ state, onChange }: MortgageEstimateProps) {
  const { totalCost } = calculateConfiguratorPrice(state);
  const mortgage = calculateMortgage(totalCost, state.mortgage);
  const setTerm = (key: keyof MortgageInputs) => (value: number) =>
    onChange({ mortgage: { ...state.mortgage, [key]: value } });

  return (
    <section aria-labelledby="mortgage-heading" className="@container">
      <h2 id="mortgage-heading" className="font-display text-title text-text-primary">
        Monthly payment
      </h2>
      <p className="mt-1 text-body-sm text-text-muted">
        Worked out on the mid estimate of {formatCurrency(totalCost)}. Change the terms to match your situation.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 @xs:grid-cols-3">
        <NumberField
          label="Down payment"
          unit="%"
          unitName="percent"
          value={state.mortgage.downPaymentPercent}
          min={0}
          max={100}
          step={1}
          onCommit={setTerm("downPaymentPercent")}
        />
        <NumberField
          label="Interest rate"
          unit="%"
          unitName="percent"
          value={state.mortgage.interestRate}
          min={0}
          max={25}
          step={0.25}
          onCommit={setTerm("interestRate")}
        />
        <NumberField
          label="Amortization"
          unit="yr"
          unitName="years"
          value={state.mortgage.amortizationYears}
          min={5}
          max={30}
          step={5}
          onCommit={setTerm("amortizationYears")}
        />
      </div>

      <dl className="mt-4 divide-y divide-border border border-border">
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-body-sm text-text-secondary">
            Down payment ({mortgage.effectiveDownPaymentPercent.toFixed(1)}%)
          </dt>
          <dd className="font-accent text-figure-sm tabular-nums text-text-primary">{formatCurrency(mortgage.downPayment)}</dd>
        </div>
        {mortgage.cmhcPremium > 0 && (
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-body-sm text-text-secondary">
              CMHC insurance premium ({(mortgage.cmhcPremiumRate * 100).toFixed(2)}%)
            </dt>
            <dd className="font-accent text-figure-sm tabular-nums text-text-primary">{formatCurrency(mortgage.cmhcPremium)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-body-sm text-text-secondary">
            Loan amount{mortgage.cmhcPremium > 0 ? " (incl. CMHC premium)" : ""}
          </dt>
          <dd className="font-accent text-figure-sm tabular-nums text-text-primary">{formatCurrency(mortgage.principal)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-body-sm font-semibold text-text-primary">Estimated monthly payment</dt>
          <dd className="whitespace-nowrap font-accent text-figure tabular-nums text-gold-bright">
            {formatCurrency(Math.round(mortgage.monthlyPayment))}
            <span aria-hidden className="font-body text-caption text-text-muted">/mo</span>
            <span className="sr-only"> a month</span>
          </dd>
        </div>
      </dl>

      {mortgage.downPaymentRaisedToMinimum && (
        <p className="mt-3 text-caption text-text-muted">
          Minimum down payment on this total is {formatCurrency(mortgage.minimumDownPayment)} — your down payment has been
          raised to meet it.
        </p>
      )}
    </section>
  );
}
