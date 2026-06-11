"use client";

import { lotOptions } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import LotBackdrop from "@/components/configurator/LotBackdrop";
import type { ConfiguratorState } from "@/lib/pricing";

interface LotStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

export default function LotStep({ state, onChange }: LotStepProps) {
  const tab = state.landSituation === "own" ? "own" : "gold-river";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Your Land</h2>
        <p className="text-text-muted text-sm">Browse our available lots or use your own property.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex border border-border rounded overflow-hidden">
        <button
          onClick={() => onChange({ landSituation: "gold-river", uploadedLot: null })}
          className={`flex-1 text-sm font-medium py-3 transition-colors duration-150 ${
            tab === "gold-river"
              ? "bg-gold/20 text-gold"
              : "text-text-muted hover:text-text-secondary hover:bg-white/5"
          }`}
        >
          Browse our lots
        </button>
        <button
          onClick={() => onChange({ landSituation: "own", selectedLotId: null })}
          className={`flex-1 text-sm font-medium py-3 border-l border-border transition-colors duration-150 ${
            tab === "own"
              ? "bg-gold/20 text-gold"
              : "text-text-muted hover:text-text-secondary hover:bg-white/5"
          }`}
        >
          Use my own land
        </button>
      </div>

      {/* Gold River lots */}
      {tab === "gold-river" && (
        <div className="flex flex-col gap-2">
          {lotOptions.map((lot) => {
            const selected = state.selectedLotId === lot.id;
            return (
              <button
                key={lot.id}
                onClick={() =>
                  onChange({
                    landSituation: "gold-river",
                    selectedLotId: lot.id,
                    waterType: lot.preselectedWater ?? "drilled",
                    sewerType: lot.preselectedSewer ?? "septic",
                  })
                }
                className={`flex w-full text-left border transition-all duration-150 overflow-hidden ${
                  selected ? "border-gold ring-1 ring-gold/30 bg-gold/5" : "border-border hover:border-white/20 bg-bg-elevated"
                }`}
              >
                {/* Photo (real photo when we have one, illustrated NS scene until then) */}
                <div className="relative w-28 sm:w-36 shrink-0 self-stretch overflow-hidden bg-bg-tertiary min-h-[5.5rem]">
                  {lot.photoUrl ? (
                    <img
                      src={lot.photoUrl}
                      alt={lot.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <LotBackdrop terrain={lot.terrain} />
                  )}
                  <span className="absolute bottom-1 left-1 text-[8px] px-1 py-0.5 bg-black/60 text-white/80 rounded backdrop-blur-sm">
                    {lot.location}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-medium text-sm truncate ${selected ? "text-gold" : "text-white"}`}>
                      {lot.name}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${selected ? "text-gold" : "text-text-secondary"}`}>
                        {formatCurrency(lot.price)}
                      </span>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-text-muted/60 text-[11px] mt-0.5">
                    {lot.acreage} acres · {lot.widthFt}′ × {lot.depthFt}′ ·{" "}
                    <span className="text-text-muted/50">{lot.availableServices.map((s) => s.replace(/-/g, " ")).join(" · ")}</span>
                  </p>
                  <p className="text-text-muted/50 text-xs leading-snug mt-1 line-clamp-2">{lot.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Own land — fit/pricing details only */}
      {tab === "own" && (
        <div className="space-y-4">
          <div className="bg-bg-elevated border border-border p-4 space-y-4">
            <p className="text-text-secondary text-xs uppercase tracking-widest font-medium">Lot Dimensions</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-text-muted text-xs mb-1.5 block">Width (feet)</label>
                <input
                  type="number"
                  value={state.uploadedLot?.widthFt ?? 150}
                  onChange={(e) =>
                    onChange({
                      uploadedLot: {
                        widthFt: parseInt(e.target.value) || 0,
                        depthFt: state.uploadedLot?.depthFt ?? 300,
                      },
                    })
                  }
                  className="w-full bg-input-bg border border-border text-white text-sm px-3 py-2 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-text-muted text-xs mb-1.5 block">Depth (feet)</label>
                <input
                  type="number"
                  value={state.uploadedLot?.depthFt ?? 300}
                  onChange={(e) =>
                    onChange({
                      uploadedLot: {
                        widthFt: state.uploadedLot?.widthFt ?? 150,
                        depthFt: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-input-bg border border-border text-white text-sm px-3 py-2 focus:border-gold focus:outline-none"
                />
              </div>
            </div>
            <p className="text-text-muted/50 text-xs">
              Rural lots in our service area typically range 1–3 acres. Most of our models require at least 100′ × 200′.
              We'll confirm fit, setbacks, and access during your site assessment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
