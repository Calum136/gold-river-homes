"use client";

import type { ConfiguratorState } from "@/lib/pricing";
import type { StageExample } from "@/lib/stage";
import ReviewDecisions from "@/components/configurator/review/ReviewDecisions";
import CostBreakdown from "@/components/configurator/review/CostBreakdown";
import MortgageEstimate from "@/components/configurator/review/MortgageEstimate";

interface SummaryStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** Screen id of the decision open for editing; the page's stage photo follows it. */
  openDecision: string | null;
  onOpenDecision: (screenId: string | null) => void;
  /** Example photo of the open decision's selected choice. */
  example: StageExample | null;
}

// The final page: every decision editable in place, the full cost breakdown
// with ranges, and the monthly payment on the buyer's own terms.
export default function SummaryStep({ state, onChange, openDecision, onOpenDecision, example }: SummaryStepProps) {
  return (
    <div className="space-y-14">
      <ReviewDecisions
        state={state}
        onChange={onChange}
        openDecision={openDecision}
        onOpenDecision={onOpenDecision}
        example={example}
      />

      <CostBreakdown state={state} />

      <MortgageEstimate state={state} onChange={onChange} />

      {/* CTA */}
      <div className="border border-border bg-bg-elevated p-6 text-center space-y-4">
        <div>
          <h2 className="font-display text-white text-xl mb-1">Ready to build?</h2>
          <p className="text-text-muted text-sm">Reach out to our team and we&apos;ll help you plan the next step.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:9022733033"
            className="focus-ring flex items-center justify-center gap-2 bg-gold text-white font-semibold px-6 py-3 hover:bg-gold-bright transition-colors text-sm"
          >
            Call 902-273-3033
          </a>
          <a
            href="mailto:info@goldriverhomes.ca?subject=Home%20Quote%20Request"
            className="focus-ring flex items-center justify-center gap-2 border border-gold text-gold font-semibold px-6 py-3 hover:bg-gold/10 transition-colors text-sm"
          >
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
