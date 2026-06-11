"use client";

import { homeModels, homeCategories } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import type { ConfiguratorState } from "@/lib/pricing";

interface ModelStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

export default function ModelStep({ state, onChange }: ModelStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Choose Your Home</h2>
        <p className="text-text-muted text-sm">Select the model that fits your lifestyle. All prices are base — you'll customize finishes next.</p>
      </div>

      {homeCategories.map((cat) => {
        const modelsInCat = homeModels.filter((m) => m.category === cat.id);
        return (
          <div key={cat.id}>
            <div className="flex items-baseline gap-3 mb-1.5">
              <h3 className="font-display text-white text-lg">{cat.label}</h3>
              <span className="text-gold text-sm font-semibold">{cat.priceRange}</span>
            </div>
            <p className="text-text-muted/70 text-xs mb-3 leading-snug">{cat.description}</p>
            <div className="flex flex-col gap-2">
              {modelsInCat.map((model) => {
                const selected = state.modelId === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() =>
                      onChange({
                        modelId: model.id,
                        hasFireplace: model.hasFireplace ? state.hasFireplace : false,
                      })
                    }
                    className={`flex w-full text-left border transition-all duration-150 overflow-hidden ${
                      selected
                        ? "border-gold ring-1 ring-gold/30 bg-gold/5"
                        : "border-border hover:border-white/20 bg-bg-elevated"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 sm:w-36 shrink-0 self-stretch bg-bg-tertiary overflow-hidden min-h-[5.5rem]">
                      {model.photoUrl ? (
                        <img
                          src={model.photoUrl}
                          alt={model.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          viewBox="0 0 200 120"
                          className="absolute bottom-2 w-[70%] left-1/2 -translate-x-1/2 opacity-30"
                          fill="currentColor"
                        >
                          {model.category === "multistory" ? (
                            <>
                              <polygon points="40,60 100,10 160,60" className="text-white" />
                              <rect x="50" y="60" width="100" height="60" className="text-white/80" />
                              <rect x="50" y="30" width="100" height="30" className="text-white/60" />
                            </>
                          ) : (
                            <>
                              <polygon points="20,80 100,20 180,80" className="text-white" />
                              <rect x="30" y="80" width="140" height="40" className="text-white/80" />
                            </>
                          )}
                        </svg>
                      )}
                      {model.photoUrl && model.photoKind === "interior" && (
                        <span className="absolute bottom-1 left-1 text-[8px] px-1 py-0.5 bg-black/60 text-white/70 rounded backdrop-blur-sm">
                          Interior
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-medium text-sm truncate ${selected ? "text-gold" : "text-white"}`}>
                          {model.name}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-sm font-bold tabular-nums ${selected ? "text-gold" : "text-text-secondary"}`}>
                            {formatCurrency(model.price)}
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
                        {model.beds} bed · {model.baths} bath · {model.sqft.toLocaleString()} ft²
                        {model.hasFireplace && <span className="text-amber-500/80"> · Fireplace option</span>}
                      </p>
                      {model.description && (
                        <p className="text-text-muted/50 text-xs leading-snug mt-1 line-clamp-2">{model.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
