"use client";

import { waterCosts, sewerCosts, foundationCosts, siteEstimates } from "@/lib/defaults";
import type { CostEstimate } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
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

interface SiteChoice<K extends string> {
  id: K;
  label: string;
  description: string;
}

const FOUNDATION_CHOICES: SiteChoice<ConfiguratorState["foundationType"]>[] = [
  { id: "slab", label: "Concrete Slab", description: "Poured directly on grade. Most affordable, no crawl space access. Common in mild climates." },
  { id: "crawlspace", label: "Crawlspace", description: "Raised foundation with enclosed space underneath. Good for service access in NS frost conditions." },
  { id: "basement", label: "Full Basement", description: "Dig-out below grade. Significant added space and insulation value, higher upfront cost." },
];

const WATER_CHOICES: SiteChoice<ConfiguratorState["waterType"]>[] = [
  { id: "drilled", label: "Drilled Well", description: "Most common in rural Nova Scotia. 100–250 ft depth, high yield, reliable year-round. Pump + pressure tank included." },
  { id: "dug", label: "Dug Well", description: "Shallower (15–30 ft), lower yield. Lower cost but more vulnerable to drought and contamination." },
  { id: "municipal", label: "Municipal Water", description: "Connection to town water main. Available in select areas — includes hookup fees and trenching." },
];

const SEWER_CHOICES: SiteChoice<ConfiguratorState["sewerType"]>[] = [
  { id: "septic", label: "Septic System", description: "Standard for rural NS. Includes tank, distribution box, and leaching bed. Design depends on soil perc test." },
  { id: "municipal", label: "Municipal Sewer", description: "Connection to town sewer main. Lower maintenance, available in some areas near Chester and Bridgewater." },
];

// Same data source the price calculation uses: the ranges shown must always
// agree with the totals charged.
const AUTO_SITE_KEYS = ["clearing", "driveway", "electrical", "delivery", "permits"] as const;
const AUTO_SITE_ITEMS = AUTO_SITE_KEYS.map((key) => siteEstimates[key]);

const range = (cost: { low: number; high: number }) => `${formatCurrency(cost.low)} – ${formatCurrency(cost.high)}`;

function SiteRows<K extends string>({
  groupId,
  legend,
  choices,
  costs,
  selected,
  onSelect,
}: {
  groupId: string;
  legend: string;
  choices: SiteChoice<K>[];
  costs: Record<K, CostEstimate>;
  selected: K;
  onSelect: (id: K) => void;
}) {
  const thumbs = choices.map((choice) => getOptionAsset(`${groupId}:${choice.id}`));
  const reserveThumb = thumbs.some(Boolean);
  return (
    <ChoiceGroup legend={legend}>
      {choices.map((choice, i) => (
        <ChoiceRow
          key={choice.id}
          name={groupId}
          value={choice.id}
          label={choice.label}
          description={choice.description}
          price={<span className="font-accent text-figure-sm text-text-primary">{range(costs[choice.id])}</span>}
          checked={selected === choice.id}
          onSelect={() => onSelect(choice.id)}
          thumb={thumbs[i]}
          reserveThumb={reserveThumb}
        />
      ))}
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
          choices={FOUNDATION_CHOICES}
          costs={foundationCosts}
          selected={state.foundationType}
          onSelect={(id) => onChange({ foundationType: id })}
        />
      )}

      {only === "water" && (
        <SiteRows
          groupId="water"
          legend="Water supply"
          choices={WATER_CHOICES}
          costs={waterCosts}
          selected={state.waterType}
          onSelect={(id) => onChange({ waterType: id })}
        />
      )}

      {only === "sewer" && (
        <>
          <SiteRows
            groupId="sewer"
            legend="Waste and sewer"
            choices={SEWER_CHOICES}
            costs={sewerCosts}
            selected={state.sewerType}
            onSelect={(id) => onChange({ sewerType: id })}
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
