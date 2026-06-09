"use client";

import { waterCosts, sewerCosts, foundationCosts } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import type { ConfiguratorState } from "@/lib/pricing";

interface SiteStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

interface SiteCard {
  id: string;
  label: string;
  description: string;
  rangeLabel: string;
  selected: boolean;
  onClick: () => void;
}

function SiteOptionCard({ id, label, description, rangeLabel, selected, onClick }: SiteCard) {
  return (
    <button
      onClick={onClick}
      className={`text-left border transition-all duration-150 p-4 ${
        selected
          ? "bg-gold/10 border-gold"
          : "bg-bg-elevated border-border hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`font-medium text-sm ${selected ? "text-gold" : "text-white"}`}>
          {label}
        </span>
        <span className={`text-xs font-semibold tabular-nums shrink-0 ${selected ? "text-gold" : "text-text-muted"}`}>
          {rangeLabel}
        </span>
      </div>
      <p className="text-text-muted/60 text-xs leading-snug">{description}</p>
    </button>
  );
}

const AUTO_SITE_ITEMS = [
  { label: "Land clearing & grading", low: 3000, high: 10000 },
  { label: "Driveway installation", low: 2000, high: 8000 },
  { label: "Electrical hookup", low: 5000, high: 12000 },
  { label: "Home delivery & set", low: 4000, high: 7000 },
  { label: "Permits & inspections", low: 2500, high: 5000 },
];

export default function SiteStep({ state, onChange }: SiteStepProps) {
  const preSelectedFromLot = state.landSituation === "gold-river" && state.selectedLotId !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Site Setup</h2>
        <p className="text-text-muted text-sm">
          These costs depend on your land. We'll estimate based on your selections.
          {preSelectedFromLot && " Your lot's available services have been pre-selected below."}
        </p>
      </div>

      {/* Foundation */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-widest font-medium mb-3">Foundation Type</h3>
        <div className="grid grid-cols-1 gap-2">
          <SiteOptionCard
            id="slab"
            label="Concrete Slab"
            description="Poured directly on grade. Most affordable, no crawl space access. Common in mild climates."
            rangeLabel={`${formatCurrency(foundationCosts.slab.low)} – ${formatCurrency(foundationCosts.slab.high)}`}
            selected={state.foundationType === "slab"}
            onClick={() => onChange({ foundationType: "slab" })}
          />
          <SiteOptionCard
            id="crawlspace"
            label="Crawlspace"
            description="Raised foundation with enclosed space underneath. Good for service access in NS frost conditions."
            rangeLabel={`${formatCurrency(foundationCosts.crawlspace.low)} – ${formatCurrency(foundationCosts.crawlspace.high)}`}
            selected={state.foundationType === "crawlspace"}
            onClick={() => onChange({ foundationType: "crawlspace" })}
          />
          <SiteOptionCard
            id="basement"
            label="Full Basement"
            description="Dig-out below grade. Significant added space and insulation value, higher upfront cost."
            rangeLabel={`${formatCurrency(foundationCosts.basement.low)} – ${formatCurrency(foundationCosts.basement.high)}`}
            selected={state.foundationType === "basement"}
            onClick={() => onChange({ foundationType: "basement" })}
          />
        </div>
      </div>

      {/* Water */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-widest font-medium mb-3">Water Supply</h3>
        <div className="grid grid-cols-1 gap-2">
          <SiteOptionCard
            id="drilled"
            label="Drilled Well"
            description="Most common in rural Nova Scotia. 100–250 ft depth, high yield, reliable year-round. Pump + pressure tank included."
            rangeLabel={`${formatCurrency(waterCosts.drilled.low)} – ${formatCurrency(waterCosts.drilled.high)}`}
            selected={state.waterType === "drilled"}
            onClick={() => onChange({ waterType: "drilled" })}
          />
          <SiteOptionCard
            id="dug"
            label="Dug Well"
            description="Shallower (15–30 ft), lower yield. Lower cost but more vulnerable to drought and contamination."
            rangeLabel={`${formatCurrency(waterCosts.dug.low)} – ${formatCurrency(waterCosts.dug.high)}`}
            selected={state.waterType === "dug"}
            onClick={() => onChange({ waterType: "dug" })}
          />
          <SiteOptionCard
            id="municipal"
            label="Municipal Water"
            description="Connection to town water main. Available in select areas — includes hookup fees and trenching."
            rangeLabel={`${formatCurrency(waterCosts.municipal.low)} – ${formatCurrency(waterCosts.municipal.high)}`}
            selected={state.waterType === "municipal"}
            onClick={() => onChange({ waterType: "municipal" })}
          />
        </div>
      </div>

      {/* Sewer */}
      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-widest font-medium mb-3">Waste / Sewer</h3>
        <div className="grid grid-cols-1 gap-2">
          <SiteOptionCard
            id="septic"
            label="Septic System"
            description="Standard for rural NS. Includes tank, distribution box, and leaching bed. Design depends on soil perc test."
            rangeLabel={`${formatCurrency(sewerCosts.septic.low)} – ${formatCurrency(sewerCosts.septic.high)}`}
            selected={state.sewerType === "septic"}
            onClick={() => onChange({ sewerType: "septic" })}
          />
          <SiteOptionCard
            id="municipal"
            label="Municipal Sewer"
            description="Connection to town sewer main. Lower maintenance, available in some areas near Chester and Bridgewater."
            rangeLabel={`${formatCurrency(sewerCosts.municipal.low)} – ${formatCurrency(sewerCosts.municipal.high)}`}
            selected={state.sewerType === "municipal"}
            onClick={() => onChange({ sewerType: "municipal" })}
          />
        </div>
      </div>

      {/* Auto-estimated costs */}
      <div className="border border-border bg-bg-elevated">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-white font-medium text-sm">Additional Site Costs</h3>
          <p className="text-text-muted/60 text-xs mt-0.5">These are estimated automatically — included in your total</p>
        </div>
        <div className="divide-y divide-border">
          {AUTO_SITE_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-text-secondary text-sm">{item.label}</span>
              <span className="text-text-muted text-sm tabular-nums">
                {formatCurrency(item.low)} – {formatCurrency(item.high)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-text-muted/40 text-xs leading-snug">
        All site estimates reflect typical costs in Lunenburg, Queens, Shelburne, Annapolis, Digby, and Yarmouth counties.
        Final costs vary by soil conditions, slope, access road, and distance to utilities.
      </p>
    </div>
  );
}
