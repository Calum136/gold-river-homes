"use client";

import { exteriorGroups, sidingColors, metalRoofColors, isOptionAvailable } from "@/lib/defaults";
import ColorSwatch from "@/components/configurator/ui/ColorSwatch";
import StyleToggle from "@/components/configurator/ui/StyleToggle";
import OptionTile from "@/components/configurator/ui/OptionTile";
import { displayedOptionDelta, porchDelta } from "@/lib/pricing";
import { formatCurrency } from "@/lib/calculator";
import type { ConfiguratorState } from "@/lib/pricing";

interface ExteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function AccordionSection({ title, subtitle, children }: AccordionSectionProps) {
  return (
    <div className="border border-border">
      <div className="px-4 py-3 bg-bg-elevated border-b border-border">
        <h3 className="text-white font-medium text-sm">{title}</h3>
        {subtitle && <p className="text-text-muted/60 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4 bg-bg-secondary">{children}</div>
    </div>
  );
}

export default function ExteriorStep({ state, onChange }: ExteriorStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Exterior</h2>
        <p className="text-text-muted text-sm">Choose your siding, roof, and exterior finishes.</p>
      </div>

      {/* Siding Style */}
      <AccordionSection title="Siding Style">
        <div className="grid grid-cols-1 gap-2">
          {exteriorGroups.find((g) => g.id === "sidingStyle")?.options.map((opt) => (
            <OptionTile
              key={opt.id}
              label={opt.label}
              description={opt.description}
              priceDelta={displayedOptionDelta("sidingStyle", opt.id, state.modelId, opt.priceDelta)}
              selected={state.sidingStyleId === opt.id}
              onClick={() => onChange({ sidingStyleId: opt.id })}
              unavailable={!isOptionAvailable(opt, state.modelId)}
            />
          ))}
        </div>
      </AccordionSection>

      {/* Siding Color */}
      <AccordionSection title="Siding Color" subtitle="Choose the exterior siding color">
        <div className="flex flex-wrap gap-3">
          {sidingColors.map((color) => (
            <ColorSwatch
              key={color.id}
              hex={color.swatchHex ?? "#888"}
              label={color.label}
              selected={state.sidingColorId === color.id}
              onClick={() => onChange({ sidingColorId: color.id })}
            />
          ))}
        </div>
      </AccordionSection>

      {/* Roof Type */}
      <AccordionSection title="Roof Type" subtitle="Metal roofs last longer; shingles are the budget choice">
        <div className="grid grid-cols-1 gap-2">
          {exteriorGroups.find((g) => g.id === "roofType")?.options.map((opt) => (
            <OptionTile
              key={opt.id}
              label={opt.label}
              description={opt.description}
              priceDelta={displayedOptionDelta("roofType", opt.id, state.modelId, opt.priceDelta)}
              selected={state.roofTypeId === opt.id}
              onClick={() => onChange({ roofTypeId: opt.id })}
              unavailable={!isOptionAvailable(opt, state.modelId)}
            />
          ))}
        </div>

        {/* Metal roof color picker — shown only when metal is selected */}
        {state.roofTypeId === "metal" && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-text-muted text-xs mb-3 uppercase tracking-widest font-medium">Metal Roof Color</p>
            <div className="flex flex-wrap gap-3">
              {metalRoofColors.map((color) => (
                <ColorSwatch
                  key={color.id}
                  hex={color.swatchHex ?? "#888"}
                  label={color.label}
                  selected={state.metalRoofColorId === color.id}
                  onClick={() => onChange({ metalRoofColorId: color.id })}
                />
              ))}
            </div>
          </div>
        )}
      </AccordionSection>

      {/* Front Porch */}
      <AccordionSection title="Front Porch" subtitle="Adds a covered porch to the front of your home">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">
              Covered Front Porch
              <span className="text-gold text-xs font-semibold ml-2 tabular-nums">+{formatCurrency(porchDelta(state))}</span>
            </p>
            <p className="text-text-muted/60 text-xs mt-0.5">Adds ~200 sq ft to your roof area · Increases curb appeal</p>
          </div>
          <button
            onClick={() => onChange({ hasFrontPorch: !state.hasFrontPorch })}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              state.hasFrontPorch ? "bg-gold" : "bg-bg-elevated border border-border"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                state.hasFrontPorch ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </AccordionSection>

      {/* Exterior Trim */}
      <AccordionSection title="Window & Door Trim" subtitle="Exterior casing style around windows and doors">
        <div className="grid grid-cols-1 gap-2">
          {exteriorGroups.find((g) => g.id === "exteriorTrim")?.options.map((opt) => (
            <OptionTile
              key={opt.id}
              label={opt.label}
              description={opt.description}
              priceDelta={opt.priceDelta}
              selected={state.exteriorTrimId === opt.id}
              onClick={() => onChange({ exteriorTrimId: opt.id })}
              unavailable={!isOptionAvailable(opt, state.modelId)}
            />
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}
