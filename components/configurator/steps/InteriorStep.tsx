"use client";

import { interiorGroups, isOptionAvailable } from "@/lib/defaults";
import ColorSwatch from "@/components/configurator/ui/ColorSwatch";
import OptionTile from "@/components/configurator/ui/OptionTile";
import { displayedOptionDelta } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import type { OptionGroup } from "@/lib/defaults";

interface InteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** Render a single option group (or "fireplace") as a standalone screen. */
  only?: string;
}

const STATE_KEY_MAP: Record<string, keyof ConfiguratorState> = {
  flooring: "flooringId",
  countertops: "countertopsId",
  cabinetStyle: "cabinetStyleId",
  paintPackage: "paintPackageId",
  interiorTrim: "interiorTrimId",
  lightingPackage: "lightingPackageId",
  hardwareFinish: "hardwareFinishId",
  insulation: "insulationId",
};

interface OptionsGridProps {
  group: OptionGroup;
  selectedId: string;
  modelId: string | null;
  onSelect: (id: string) => void;
}

function OptionsGrid({ group, selectedId, modelId, onSelect }: OptionsGridProps) {
  const isSwatches = group.displayType === "swatches";
  return (
    <div className={isSwatches ? "flex flex-wrap gap-3" : "grid grid-cols-1 gap-2"}>
      {group.options.map((opt) =>
        isSwatches ? (
          <ColorSwatch
            key={opt.id}
            hex={opt.swatchHex ?? "#888"}
            label={opt.label}
            selected={selectedId === opt.id}
            onClick={() => onSelect(opt.id)}
          />
        ) : (
          <OptionTile
            key={opt.id}
            label={opt.label}
            description={opt.description}
            priceDelta={displayedOptionDelta(group.id, opt.id, modelId, opt.priceDelta)}
            selected={selectedId === opt.id}
            onClick={() => onSelect(opt.id)}
            paletteHexes={opt.paletteHexes}
            unavailable={!isOptionAvailable(opt, modelId)}
          />
        )
      )}
    </div>
  );
}

function FireplaceControl({ state, onChange }: { state: ConfiguratorState; onChange: InteriorStepProps["onChange"] }) {
  if (!state.modelId) {
    return <p className="text-text-muted/40 text-sm">Select a home model first to see fireplace options.</p>;
  }
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-medium">Electric Fireplace Insert</p>
        <p className="text-text-muted/60 text-xs mt-0.5">
          Wall-mounted electric insert, no venting required · +$4,500
        </p>
      </div>
      <button
        onClick={() => onChange({ hasFireplace: !state.hasFireplace })}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
          state.hasFireplace ? "bg-gold" : "bg-bg-elevated border border-border"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
            state.hasFireplace ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function InteriorStep({ state, onChange, only }: InteriorStepProps) {
  // Single-decision screen — the page supplies the heading.
  if (only === "fireplace") {
    return (
      <div className="border border-border bg-bg-secondary p-4">
        <FireplaceControl state={state} onChange={onChange} />
      </div>
    );
  }
  if (only) {
    const group = interiorGroups.find((g) => g.id === only);
    const stateKey = STATE_KEY_MAP[only];
    if (!group || !stateKey) return null;
    return (
      <div className="border border-border bg-bg-secondary p-4">
        <OptionsGrid
          group={group}
          selectedId={state[stateKey] as string}
          modelId={state.modelId}
          onSelect={(id) => onChange({ [stateKey]: id })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Interior</h2>
        <p className="text-text-muted text-sm">Customize your finishes, fixtures, and features.</p>
      </div>

      {interiorGroups.map((group) => {
        const stateKey = STATE_KEY_MAP[group.id];
        if (!stateKey) return null;
        return (
          <div key={group.id} className="border border-border">
            <div className="px-4 py-3 bg-bg-elevated border-b border-border">
              <h3 className="text-white font-medium text-sm">{group.label}</h3>
              {group.subtitle && <p className="text-text-muted/60 text-xs mt-0.5">{group.subtitle}</p>}
            </div>
            <div className="p-4 bg-bg-secondary">
              <OptionsGrid
                group={group}
                selectedId={state[stateKey] as string}
                modelId={state.modelId}
                onSelect={(id) => onChange({ [stateKey]: id })}
              />
            </div>
          </div>
        );
      })}

      <div className="border border-border">
        <div className="px-4 py-3 bg-bg-elevated border-b border-border">
          <h3 className="text-white font-medium text-sm">Fireplace</h3>
        </div>
        <div className="p-4 bg-bg-secondary">
          <FireplaceControl state={state} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
