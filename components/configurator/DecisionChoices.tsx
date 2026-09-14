"use client";

import type { ConfiguratorState } from "@/lib/pricing";
import type { ChapterId } from "@/lib/screens";
import LotStep from "@/components/configurator/steps/LotStep";
import ModelStep from "@/components/configurator/steps/ModelStep";
import ExteriorStep from "@/components/configurator/steps/ExteriorStep";
import type { ExteriorSection } from "@/components/configurator/steps/ExteriorStep";
import InteriorStep from "@/components/configurator/steps/InteriorStep";
import SiteStep from "@/components/configurator/steps/SiteStep";
import type { SiteSection } from "@/components/configurator/steps/SiteStep";

interface DecisionChoicesProps {
  screenId: string;
  chapter: ChapterId;
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** On the review page the cost breakdown sits below, so site estimates aren't repeated here. */
  inReview?: boolean;
}

// The choice rows for one decision, exactly as its walkthrough screen shows
// them: price, monthly payment change and reason on every choice. Used by the
// walkthrough and by the review page, so both always offer the same choices.
export default function DecisionChoices({ screenId, chapter, state, onChange, inReview = false }: DecisionChoicesProps) {
  switch (chapter) {
    case "land":
      return <LotStep state={state} onChange={onChange} />;
    case "home":
      return <ModelStep state={state} onChange={onChange} />;
    case "outside":
      return <ExteriorStep state={state} onChange={onChange} only={screenId as ExteriorSection} />;
    case "inside":
      return <InteriorStep state={state} onChange={onChange} only={screenId} />;
    case "ready":
      return (
        <SiteStep state={state} onChange={onChange} only={screenId as SiteSection} showSiteEstimates={!inReview} />
      );
    default:
      return null;
  }
}
