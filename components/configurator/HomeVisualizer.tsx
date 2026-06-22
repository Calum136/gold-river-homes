"use client";

import { useEffect, useState } from "react";
import { lotOptions, sidingColors, homeModels } from "@/lib/defaults";
import { getRenderStack } from "@/lib/renders";
import type { ConfiguratorState } from "@/lib/pricing";
import ParametricHouse from "./ParametricHouse";
import LotBackdrop from "./LotBackdrop";
import PhotoStack from "./PhotoStack";
import RoomVisualizer from "./RoomVisualizer";
import BaliPhotoConfigurator from "./BaliPhotoConfigurator";

interface HomeVisualizerProps {
  state: ConfiguratorState;
  view?: "exterior" | "interior";
}

type ViewMode = "exterior" | "interior";

export default function HomeVisualizer({ state, view }: HomeVisualizerProps) {
  const lot = state.landSituation === "gold-river"
    ? lotOptions.find((l) => l.id === state.selectedLotId)
    : null;

  const sidingColor = sidingColors.find((c) => c.id === state.sidingColorId);
  const model = homeModels.find((m) => m.id === state.modelId);
  const renderStack = getRenderStack(state);

  const defaultMode: ViewMode = view ?? "exterior";
  const [modeOverride, setModeOverride] = useState<ViewMode | null>(null);
  useEffect(() => { setModeOverride(null); }, [state.step]);
  const mode: ViewMode = model ? modeOverride ?? defaultMode : "exterior";

  return (
    <div className="relative w-full overflow-hidden bg-bg-tertiary" style={{ aspectRatio: "16/8" }}>

      {mode === "interior" && model ? (
        /* ── Interior room visualizer ──────────────────────────────────── */
        <div className="absolute inset-0">
          <RoomVisualizer state={state} />
        </div>
      ) : (
        /* ── Exterior view ─────────────────────────────────────────────── */
        <>
          {/* Lot background */}
          {lot?.photoUrl ? (
            <>
              <img src={lot.photoUrl} alt={lot.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
            </>
          ) : (
            <LotBackdrop terrain={lot?.terrain ?? "meadow"} />
          )}

          {/* Home visual: render stack → demo render (+ color tint) → parametric SVG */}
          {model ? (
            renderStack ? (
              <PhotoStack stack={renderStack} alt={`${model.name} with your selected options`} />
            ) : model.demoRender ? (
              /* Bali photoreal demo render with targeted siding/roof/porch overlays */
              <BaliPhotoConfigurator state={state} />
            ) : (
              /* Parametric SVG for all other models */
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[64%] max-w-lg">
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

          {/* Top-left badges */}
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

          {/* Top-right selection indicators (hidden when fixed demo render showing) */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {model && !(!renderStack && model.demoRender) && sidingColor && (
              <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: sidingColor.swatchHex }} />
                <span className="text-[10px] text-white/80">{sidingColor.label}</span>
              </div>
            )}
            {model && !(!renderStack && model.demoRender) && state.roofTypeId === "metal" && (
              <div className="bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                <span className="text-[10px] text-white/80">Metal Roof</span>
              </div>
            )}
            {model && !(!renderStack && model.demoRender) && state.hasFrontPorch && (
              <div className="bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                <span className="text-[10px] text-white/80">+ Front Porch</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Exterior / Interior tab toggle */}
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
