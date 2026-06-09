"use client";

import { interiorGroups } from "@/lib/defaults";
import ColorSwatch from "@/components/configurator/ui/ColorSwatch";
import OptionTile from "@/components/configurator/ui/OptionTile";
import type { ConfiguratorState } from "@/lib/pricing";
import type { OptionGroup } from "@/lib/defaults";

interface InteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
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

interface SectionProps {
  group: OptionGroup;
  selectedId: string;
  onSelect: (id: string) => void;
}

function OptionGroupSection({ group, selectedId, onSelect }: SectionProps) {
  const isSwatches = group.displayType === "swatches";

  return (
    <div className="border border-border">
      <div className="px-4 py-3 bg-bg-elevated border-b border-border">
        <h3 className="text-white font-medium text-sm">{group.label}</h3>
        {group.subtitle && <p className="text-text-muted/60 text-xs mt-0.5">{group.subtitle}</p>}
      </div>
      <div className={`p-4 bg-bg-secondary ${isSwatches ? "flex flex-wrap gap-3" : "grid grid-cols-1 gap-2"}`}>
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
              priceDelta={opt.priceDelta}
              selected={selectedId === opt.id}
              onClick={() => onSelect(opt.id)}
              paletteHexes={opt.paletteHexes}
            />
          )
        )}
      </div>
    </div>
  );
}

export default function InteriorStep({ state, onChange }: InteriorStepProps) {
  const model = state.modelId;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Interior</h2>
        <p className="text-text-muted text-sm">Customize your finishes, fixtures, and features.</p>
      </div>

      {interiorGroups.map((group) => {
        const stateKey = STATE_KEY_MAP[group.id];
        if (!stateKey) return null;

        const selectedId = state[stateKey] as string;

        return (
          <OptionGroupSection
            key={group.id}
            group={group}
            selectedId={selectedId}
            onSelect={(id) => onChange({ [stateKey]: id })}
          />
        );
      })}

      {/* Fireplace — conditional on model support */}
      <div className="border border-border">
        <div className="px-4 py-3 bg-bg-elevated border-b border-border">
          <h3 className="text-white font-medium text-sm">Fireplace</h3>
        </div>
        <div className="p-4 bg-bg-secondary">
          {model ? (
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
          ) : (
            <p className="text-text-muted/40 text-sm">Select a home model first to see fireplace options.</p>
          )}
        </div>
      </div>
    </div>
  );
}
