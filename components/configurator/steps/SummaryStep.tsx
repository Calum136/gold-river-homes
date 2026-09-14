"use client";

import type { ConfiguratorState } from "@/lib/pricing";
import type { SavedConfiguration } from "@/lib/saved-configs";
import type { StageExample } from "@/lib/stage";
import ReviewDecisions from "@/components/configurator/review/ReviewDecisions";
import CostBreakdown from "@/components/configurator/review/CostBreakdown";
import MortgageEstimate from "@/components/configurator/review/MortgageEstimate";
import SavedConfigurations from "@/components/configurator/review/SavedConfigurations";
import ShareActions from "@/components/configurator/review/ShareActions";

interface SummaryStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** Screen id of the decision open for editing; the page's stage photo follows it. */
  openDecision: string | null;
  onOpenDecision: (screenId: string | null) => void;
  /** Example photo of the open decision's selected choice. */
  example: StageExample | null;
  /** Named saves in this browser, newest first. */
  saves: SavedConfiguration[];
  activeSaveId: string | null;
  /** The configuration's saved name, if it has one. */
  activeName: string | null;
  onSaved: (saved: SavedConfiguration) => void;
  onLoadSave: (saved: SavedConfiguration) => void;
  onDeletedSave: (id: string) => void;
  shareLink: string;
  enquiryHref: string;
}

// The final page: every decision editable in place, the full cost breakdown
// with ranges, the monthly payment on the buyer's own terms, and the ending:
// a named save, a share link, the printable spec sheet and the enquiry email.
export default function SummaryStep({
  state,
  onChange,
  openDecision,
  onOpenDecision,
  example,
  saves,
  activeSaveId,
  activeName,
  onSaved,
  onLoadSave,
  onDeletedSave,
  shareLink,
  enquiryHref,
}: SummaryStepProps) {
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

      <section aria-labelledby="keep-it-heading" className="border-t border-border pt-10">
        <h2 id="keep-it-heading" className="font-display text-title text-text-primary">
          Keep it, share it
        </h2>
        <div className="mt-6 space-y-10">
          <SavedConfigurations
            state={state}
            saves={saves}
            activeSaveId={activeSaveId}
            activeName={activeName}
            onSaved={onSaved}
            onLoad={onLoadSave}
            onDeleted={onDeletedSave}
          />
          <ShareActions shareLink={shareLink} enquiryHref={enquiryHref} />
        </div>
      </section>
    </div>
  );
}
