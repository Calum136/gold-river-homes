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
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="font-display text-white text-lg">{cat.label}</h3>
              <span className="text-gold text-sm font-semibold">{cat.priceRange}</span>
            </div>
            <p className="text-text-muted/70 text-xs mb-3 leading-snug">{cat.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className={`text-left border transition-all duration-150 overflow-hidden ${
                      selected
                        ? "border-gold ring-1 ring-gold/30"
                        : "border-border hover:border-white/20"
                    }`}
                  >
                    {/* House image */}
                    <div className="relative h-32 bg-bg-tertiary overflow-hidden">
                      {model.photoUrl ? (
                        <img
                          src={model.photoUrl}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-slate-900/60" />
                          <svg
                            viewBox="0 0 200 120"
                            className="absolute bottom-0 w-[70%] left-1/2 -translate-x-1/2 opacity-30"
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
                        </>
                      )}
                      {model.photoUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      )}
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center z-10">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        </div>
                      )}
                      {model.hasFireplace && (
                        <div className="absolute bottom-2 left-2 z-10">
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-700/80 text-amber-100 rounded backdrop-blur-sm">Fireplace option</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className={`p-3 ${selected ? "bg-gold/5" : "bg-bg-elevated"}`}>
                      <div className="flex items-start justify-between mb-0.5">
                        <h4 className={`font-medium text-sm ${selected ? "text-gold" : "text-white"}`}>
                          {model.name}
                        </h4>
                        <span className={`text-sm font-bold tabular-nums ${selected ? "text-gold" : "text-text-secondary"}`}>
                          {formatCurrency(model.price)}
                        </span>
                      </div>
                      <p className="text-text-muted/60 text-[11px] mb-1.5">
                        {model.beds} bed · {model.baths} bath · {model.sqft.toLocaleString()} ft²
                      </p>
                      {model.description && (
                        <p className="text-text-muted/50 text-xs leading-snug">{model.description}</p>
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
