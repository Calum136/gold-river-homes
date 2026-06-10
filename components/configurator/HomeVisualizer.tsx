"use client";

import { useEffect, useState } from "react";
import { lotOptions, sidingColors, homeModels, interiorGroups } from "@/lib/defaults";
import { getRenderStack } from "@/lib/renders";
import type { ConfiguratorState } from "@/lib/pricing";
import ParametricHouse from "./ParametricHouse";
import LotBackdrop from "./LotBackdrop";
import PhotoStack from "./PhotoStack";

interface HomeVisualizerProps {
  state: ConfiguratorState;
  /** Which view the current screen is about — interior screens default to the selections board. */
  view?: "exterior" | "interior";
}

type ViewMode = "exterior" | "interior";

const INTERIOR_BOARD: Array<{ groupId: string; stateKey: keyof ConfiguratorState }> = [
  { groupId: "flooring", stateKey: "flooringId" },
  { groupId: "countertops", stateKey: "countertopsId" },
  { groupId: "cabinetStyle", stateKey: "cabinetStyleId" },
  { groupId: "paintPackage", stateKey: "paintPackageId" },
  { groupId: "interiorTrim", stateKey: "interiorTrimId" },
  { groupId: "lightingPackage", stateKey: "lightingPackageId" },
  { groupId: "hardwareFinish", stateKey: "hardwareFinishId" },
  { groupId: "insulation", stateKey: "insulationId" },
];

function InteriorBoard({ state }: { state: ConfiguratorState }) {
  return (
    <div className="absolute inset-0 bg-bg-secondary p-3 sm:p-4 pb-10 overflow-y-auto">
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium mb-2">
        Your Interior Selections
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {INTERIOR_BOARD.map(({ groupId, stateKey }) => {
          const group = interiorGroups.find((g) => g.id === groupId);
          const option = group?.options.find((o) => o.id === (state[stateKey] as string));
          if (!group || !option) return null;
          return (
            <div key={groupId} className="bg-bg-elevated border border-border px-2.5 py-2">
              <p className="text-text-muted/60 text-[9px] uppercase tracking-wider">{group.label}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {option.swatchHex && (
                  <span className="w-3 h-3 rounded-full border border-white/15 shrink-0" style={{ backgroundColor: option.swatchHex }} />
                )}
                <p className="text-white text-xs font-medium leading-tight">{option.label}</p>
              </div>
              {option.paletteHexes && (
                <div className="flex gap-1 mt-1.5">
                  {option.paletteHexes.map((hex) => (
                    <span key={hex} className="w-4 h-3 rounded-[2px] border border-white/10" style={{ backgroundColor: hex }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="bg-bg-elevated border border-border px-2.5 py-2">
          <p className="text-text-muted/60 text-[9px] uppercase tracking-wider">Fireplace</p>
          <p className={`text-xs font-medium mt-0.5 ${state.hasFireplace ? "text-gold" : "text-text-muted/60"}`}>
            {state.hasFireplace ? "Electric insert added" : "Not included"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomeVisualizer({ state, view }: HomeVisualizerProps) {
  const lot = state.landSituation === "gold-river"
    ? lotOptions.find((l) => l.id === state.selectedLotId)
    : null;

  const sidingColor = sidingColors.find((c) => c.id === state.sidingColorId);
  const model = homeModels.find((m) => m.id === state.modelId);
  const renderStack = getRenderStack(state);

  // Interior screens show the interior board by default; a manual tab choice
  // sticks until the buyer moves to another screen.
  const defaultMode: ViewMode = view ?? "exterior";
  const [modeOverride, setModeOverride] = useState<ViewMode | null>(null);
  useEffect(() => {
    setModeOverride(null);
  }, [state.step]);
  const mode: ViewMode = model ? modeOverride ?? defaultMode : "exterior";

  return (
    <div className="relative w-full overflow-hidden bg-bg-tertiary" style={{ aspectRatio: "16/7" }}>
      {mode === "interior" && model ? (
        <InteriorBoard state={state} />
      ) : (
        <>
          {/* Background: real lot photo when we have one, illustrated NS scene until then */}
          {lot?.photoUrl ? (
            <>
              <img src={lot.photoUrl} alt={lot.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
            </>
          ) : (
            <LotBackdrop terrain={lot?.terrain ?? "meadow"} />
          )}

          {/* The home: photoreal render stack when available (Phase 7), live parametric otherwise */}
          {model ? (
            renderStack ? (
              <PhotoStack stack={renderStack} alt={`${model.name} with your selected options`} />
            ) : (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[62%] max-w-md">
                <ParametricHouse state={state} />
              </div>
            )
          ) : (
            <div className="absolute inset-x-0 bottom-6 text-center">
              <p className="text-white/40 text-xs bg-black/30 inline-block px-3 py-1 rounded backdrop-blur-sm">
                Choose a model to see your home take shape
              </p>
            </div>
          )}

          {/* Badges — current selections */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[55%]">
            {lot && (
              <span className="text-[10px] font-medium bg-black/60 text-white/90 px-2 py-1 rounded backdrop-blur-sm">
                {lot.name}
              </span>
            )}
            {model && (
              <span className="text-[10px] font-medium bg-black/60 text-white/90 px-2 py-1 rounded backdrop-blur-sm">
                {model.name} · {model.sqft.toLocaleString()} ft²
              </span>
            )}
          </div>

          {/* Siding + roof indicators */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {model && sidingColor && (
              <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: sidingColor.swatchHex }} />
                <span className="text-[10px] text-white/80">{sidingColor.label}</span>
              </div>
            )}
            {model && state.roofTypeId === "metal" && (
              <div className="bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                <span className="text-[10px] text-white/80">Metal Roof</span>
              </div>
            )}
            {model && state.hasFrontPorch && (
              <div className="bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                <span className="text-[10px] text-white/80">+ Front Porch</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Exterior / Interior tabs — top-right in interior mode (badges only exist in exterior mode) */}
      {model && (
        <div className={`absolute right-2 flex border border-white/15 rounded overflow-hidden backdrop-blur-sm ${mode === "interior" ? "top-2" : "bottom-2"}`}>
          {(["exterior", "interior"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setModeOverride(m)}
              className={`px-2.5 py-1 text-[10px] font-medium capitalize transition-colors duration-150 ${
                mode === m ? "bg-gold text-white" : "bg-black/50 text-white/70 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
