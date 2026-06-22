"use client";

import { exteriorGroups, sidingColors, metalRoofColors, isOptionAvailable } from "@/lib/defaults";
import { getOptionThumb } from "@/lib/option-thumbs";
import ColorSwatch from "@/components/configurator/ui/ColorSwatch";
import OptionTile from "@/components/configurator/ui/OptionTile";
import { displayedOptionDelta, porchDelta } from "@/lib/pricing";
import { formatCurrency } from "@/lib/calculator";
import type { ConfiguratorState } from "@/lib/pricing";

export type ExteriorSection = "sidingStyle" | "sidingColor" | "roofType" | "porch" | "exteriorTrim";

interface ExteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  only?: ExteriorSection;
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

export default function ExteriorStep({ state, onChange, only }: ExteriorStepProps) {
  const sidingStyle = (
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
          thumbStyle={getOptionThumb("sidingStyle", opt.id)}
        />
      ))}
    </div>
  );

  const sidingColor = (
    <>
      {/* Photo preview: apply the siding color as a tint over the Bali render */}
      <div className="relative mb-4 rounded overflow-hidden" style={{ aspectRatio: "16/7" }}>
        <img
          src="/models/bali/exterior.webp"
          alt="Home exterior color preview"
          className="w-full h-full object-cover"
        />
        {/* Multiply overlay tints the white/cream siding to the chosen color */}
        {state.sidingColorId && state.sidingColorId !== "white" && (
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              backgroundColor: sidingColors.find((c) => c.id === state.sidingColorId)?.swatchHex ?? "transparent",
              mixBlendMode: "multiply",
              opacity: 0.55,
            }}
          />
        )}
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] bg-black/60 text-white/80 px-2 py-1 rounded backdrop-blur-sm">
            {sidingColors.find((c) => c.id === state.sidingColorId)?.label ?? "White"} siding — live preview
          </span>
        </div>
      </div>
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
    </>
  );

  const roofType = (
    <>
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
            thumbStyle={getOptionThumb("roofType", opt.id)}
          />
        ))}
      </div>

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
    </>
  );

  const porch = (
    <>
      {/* Side-by-side comparison thumbnails */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onChange({ hasFrontPorch: false })}
          className={`relative overflow-hidden rounded border-2 transition-colors ${
            !state.hasFrontPorch ? "border-gold" : "border-border hover:border-white/20"
          }`}
          style={{ aspectRatio: "4/3" }}
        >
          {/* No-porch: simple house silhouette */}
          <div className="w-full h-full bg-bg-elevated flex items-end justify-center pb-2">
            <svg viewBox="0 0 120 90" className="w-3/4 h-auto opacity-70">
              <polygon points="10,50 110,50 95,25 25,25" fill="#5A6670" />
              <rect x="20" y="50" width="80" height="35" fill="#7A8898" />
              <rect x="50" y="65" width="20" height="20" fill="#3C434A" />
            </svg>
          </div>
          <span className={`absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-medium ${!state.hasFrontPorch ? "text-gold" : "text-text-muted"}`}>
            No Porch
          </span>
        </button>
        <button
          onClick={() => onChange({ hasFrontPorch: true })}
          className={`relative overflow-hidden rounded border-2 transition-colors ${
            state.hasFrontPorch ? "border-gold" : "border-border hover:border-white/20"
          }`}
          style={{ aspectRatio: "4/3" }}
        >
          {/* With-porch: house + porch silhouette */}
          <div className="w-full h-full bg-bg-elevated flex items-end justify-center pb-2">
            <svg viewBox="0 0 120 90" className="w-3/4 h-auto opacity-70">
              <polygon points="10,50 110,50 95,25 25,25" fill="#5A6670" />
              <rect x="20" y="50" width="80" height="35" fill="#7A8898" />
              <rect x="50" y="65" width="20" height="20" fill="#3C434A" />
              {/* Porch */}
              <polygon points="35,62 85,62 78,54 42,54" fill="#6A7888" />
              <rect x="35" y="62" width="3" height="13" fill="#E8DCC8" />
              <rect x="82" y="62" width="3" height="13" fill="#E8DCC8" />
              <rect x="32" y="74" width="56" height="4" fill="#D8CEB8" />
            </svg>
          </div>
          <span className={`absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-medium ${state.hasFrontPorch ? "text-gold" : "text-text-muted"}`}>
            + Covered Porch
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between bg-bg-elevated border border-border p-4">
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
    </>
  );

  const exteriorTrim = (
    <div className="grid grid-cols-1 gap-2">
      {exteriorGroups.find((g) => g.id === "exteriorTrim")?.options.map((opt) => (
        <OptionTile
          key={opt.id}
          label={opt.label}
          description={opt.description}
          priceDelta={displayedOptionDelta("exteriorTrim", opt.id, state.modelId, opt.priceDelta)}
          selected={state.exteriorTrimId === opt.id}
          onClick={() => onChange({ exteriorTrimId: opt.id })}
          unavailable={!isOptionAvailable(opt, state.modelId)}
          thumbStyle={getOptionThumb("exteriorTrim", opt.id)}
        />
      ))}
    </div>
  );

  if (only) {
    const sections: Record<ExteriorSection, React.ReactNode> = { sidingStyle, sidingColor, roofType, porch, exteriorTrim };
    return <div className="border border-border bg-bg-secondary p-4">{sections[only]}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Exterior</h2>
        <p className="text-text-muted text-sm">Choose your siding, roof, and exterior finishes.</p>
      </div>
      <AccordionSection title="Siding Style">{sidingStyle}</AccordionSection>
      <AccordionSection title="Siding Color" subtitle="Choose the exterior siding color">{sidingColor}</AccordionSection>
      <AccordionSection title="Roof Type" subtitle="Metal roofs last longer; shingles are the budget choice">{roofType}</AccordionSection>
      <AccordionSection title="Front Porch" subtitle="Adds a covered porch to the front of your home">{porch}</AccordionSection>
      <AccordionSection title="Window & Door Trim" subtitle="Exterior casing style around windows and doors">{exteriorTrim}</AccordionSection>
    </div>
  );
}
