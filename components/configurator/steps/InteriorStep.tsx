"use client";

import { interiorGroups, isOptionAvailable } from "@/lib/defaults";
import { getOptionThumb } from "@/lib/option-thumbs";
import ColorSwatch from "@/components/configurator/ui/ColorSwatch";
import OptionTile from "@/components/configurator/ui/OptionTile";
import { displayedOptionDelta } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import type { OptionGroup } from "@/lib/defaults";

interface InteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
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
            thumbStyle={getOptionThumb(group.id, opt.id)}
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
    <>
      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onChange({ hasFireplace: false })}
          className={`relative overflow-hidden rounded border-2 transition-colors p-3 ${
            !state.hasFireplace ? "border-gold bg-gold/10" : "border-border bg-bg-elevated hover:border-white/20"
          }`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <svg viewBox="0 0 48 40" className="w-10 h-auto opacity-40">
              <rect x="4" y="8" width="40" height="28" rx="1" fill="#5A5050" stroke="#444" strokeWidth="1" />
              <rect x="8" y="12" width="32" height="20" fill="#2A2020" />
            </svg>
            <span className={`text-[10px] font-medium ${!state.hasFireplace ? "text-gold" : "text-text-muted"}`}>No Fireplace</span>
          </div>
        </button>
        <button
          onClick={() => onChange({ hasFireplace: true })}
          className={`relative overflow-hidden rounded border-2 transition-colors p-3 ${
            state.hasFireplace ? "border-gold bg-gold/10" : "border-border bg-bg-elevated hover:border-white/20"
          }`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <svg viewBox="0 0 48 40" className="w-10 h-auto">
              <rect x="4" y="8" width="40" height="28" rx="1" fill="#6A5A50" stroke="#8A6A58" strokeWidth="1" />
              <rect x="8" y="12" width="32" height="20" fill="#1A1010" />
              {/* Flame */}
              <ellipse cx="24" cy="28" rx="8" ry="4" fill="#FF6030" opacity="0.9" />
              <ellipse cx="20" cy="24" rx="4" ry="6" fill="#FF8020" opacity="0.8" />
              <ellipse cx="28" cy="22" rx="3" ry="7" fill="#FFA030" opacity="0.8" />
              <ellipse cx="24" cy="18" rx="4" ry="8" fill="#FFD050" opacity="0.7" />
            </svg>
            <span className={`text-[10px] font-medium ${state.hasFireplace ? "text-gold" : "text-text-muted"}`}>Electric Insert</span>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">Electric Fireplace Insert</p>
          <p className="text-text-muted/60 text-xs mt-0.5">Wall-mounted electric insert, no venting required · +$4,500</p>
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
    </>
  );
}

export default function InteriorStep({ state, onChange, only }: InteriorStepProps) {
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
