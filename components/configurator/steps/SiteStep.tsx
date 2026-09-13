"use client";

import { waterCosts, sewerCosts, foundationCosts, siteEstimates } from "@/lib/defaults";
import type { CostEstimate } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import { monthlyDeltaFor } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { getOptionAsset } from "@/lib/visual-assets";
import ChoiceRow, { ChoiceGroup } from "@/components/configurator/ui/ChoiceRow";

export type SiteSection = "foundation" | "water" | "sewer";

interface SiteStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** The one site decision this screen shows. */
  only: SiteSection;
}

// The choices in the order they're offered. Each row's label, price range and
// reason come from the same cost record the total charges.
const FOUNDATION_IDS: ConfiguratorState["foundationType"][] = ["slab", "crawlspace", "basement"];
const WATER_IDS: ConfiguratorState["waterType"][] = ["drilled", "dug", "municipal"];
const SEWER_IDS: ConfiguratorState["sewerType"][] = ["septic", "municipal"];

// Same data source the price calculation uses: the ranges shown must always
// agree with the totals charged.
const AUTO_SITE_KEYS = ["clearing", "driveway", "electrical", "delivery", "permits"] as const;
const AUTO_SITE_ITEMS = AUTO_SITE_KEYS.map((key) => siteEstimates[key]);

const range = (cost: { low: number; high: number }) => `${formatCurrency(cost.low)} – ${formatCurrency(cost.high)}`;

function SiteRows<K extends string>({
  groupId,
  legend,
  ids,
  costs,
  selected,
  patchFor,
  state,
  onChange,
}: {
  groupId: string;
  legend: string;
  ids: K[];
  costs: Record<K, CostEstimate>;
  selected: K;
  /** What choosing an id applies to the state. */
  patchFor: (id: K) => Partial<ConfiguratorState>;
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}) {
  const thumbs = ids.map((id) => getOptionAsset(`${groupId}:${id}`));
  const reserveThumb = thumbs.some(Boolean);
  const monthlyDelta = monthlyDeltaFor(state);
  return (
    <ChoiceGroup legend={legend}>
      {ids.map((id, i) => {
        const patch = patchFor(id);
        return (
          <ChoiceRow
            key={id}
            name={groupId}
            value={id}
            label={costs[id].label}
            reason={costs[id].whyItMatters}
            price={<span className="font-accent text-figure-sm text-text-primary">{range(costs[id])}</span>}
            monthlyDelta={monthlyDelta(patch)}
            checked={selected === id}
            onSelect={() => onChange(patch)}
            thumb={thumbs[i]}
            reserveThumb={reserveThumb}
          />
        );
      })}
    </ChoiceGroup>
  );
}

export default function SiteStep({ state, onChange, only }: SiteStepProps) {
  const preSelectedFromLot = state.landSituation === "gold-river" && state.selectedLotId !== null;

  return (
    <div className="space-y-6">
      {preSelectedFromLot && only !== "foundation" && (
        <p className="text-body-sm text-text-muted">Your lot&apos;s available services have been pre-selected.</p>
      )}

      {only === "foundation" && (
        <SiteRows
          groupId="foundation"
          legend="Foundation type"
          ids={FOUNDATION_IDS}
          costs={foundationCosts}
          selected={state.foundationType}
          patchFor={(id) => ({ foundationType: id })}
          state={state}
          onChange={onChange}
        />
      )}

      {only === "water" && (
        <SiteRows
          groupId="water"
          legend="Water supply"
          ids={WATER_IDS}
          costs={waterCosts}
          selected={state.waterType}
          patchFor={(id) => ({ waterType: id })}
          state={state}
          onChange={onChange}
        />
      )}

      {only === "sewer" && (
        <>
          <SiteRows
            groupId="sewer"
            legend="Waste and sewer"
            ids={SEWER_IDS}
            costs={sewerCosts}
            selected={state.sewerType}
            patchFor={(id) => ({ sewerType: id })}
            state={state}
            onChange={onChange}
          />

          {/* Auto-estimated costs, included with the final site decision */}
          <div className="border border-border">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-body font-medium text-text-primary">Additional Site Costs</h2>
              <p className="mt-0.5 text-body-sm text-text-muted">These are estimated automatically — included in your total</p>
            </div>
            <dl className="divide-y divide-border">
              {AUTO_SITE_ITEMS.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-3 px-4 py-3">
                  <dt className="text-body-sm text-text-secondary">{item.label}</dt>
                  <dd className="shrink-0 font-accent text-figure-sm text-text-primary">{range(item)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="text-caption text-text-muted">
            All site estimates reflect typical costs in Lunenburg, Queens, Shelburne, Annapolis, Digby, and Yarmouth counties.
            Final costs vary by soil conditions, slope, access road, and distance to utilities.
          </p>
        </>
      )}
    </div>
  );
}
