"use client";

import { useRef } from "react";
import { lotOptions } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import type { ConfiguratorState } from "@/lib/pricing";

interface LotStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

export default function LotStep({ state, onChange }: LotStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange({
        landSituation: "own",
        selectedLotId: null,
        uploadedLot: {
          imageDataUrl: ev.target?.result as string,
          widthFt: state.uploadedLot?.widthFt ?? 150,
          depthFt: state.uploadedLot?.depthFt ?? 300,
        },
      });
    };
    reader.readAsDataURL(file);
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className={`text-left border transition-all duration-150 overflow-hidden ${
                  selected ? "border-gold ring-1 ring-gold/30" : "border-border hover:border-white/20"
                }`}
              >
                {/* Photo */}
                <div className="relative h-36 overflow-hidden bg-bg-tertiary">
                  <img
                    src={lot.photoUrl}
                    alt={lot.name}
                    className="w-full h-full object-cover"
                  />
                  {selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-white text-xs font-medium">{lot.location}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 bg-bg-elevated">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`font-medium text-sm ${selected ? "text-gold" : "text-white"}`}>
                      {lot.name}
                    </h4>
                    <span className={`text-sm font-bold tabular-nums ${selected ? "text-gold" : "text-text-secondary"}`}>
                      {formatCurrency(lot.price)}
                    </span>
                  </div>
                  <p className="text-text-muted/70 text-xs leading-snug mb-2">{lot.description}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-text-muted/60">
                    <span>{lot.acreage} acres</span>
                    <span>·</span>
                    <span>{lot.widthFt}′ × {lot.depthFt}′</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lot.availableServices.map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-text-muted/60 rounded">
                        {s.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Own land */}
      {tab === "own" && (
        <div className="space-y-4">
          {/* Photo upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed transition-colors duration-150 cursor-pointer overflow-hidden ${
              state.uploadedLot?.imageDataUrl
                ? "border-gold/40"
                : "border-border hover:border-border-gold"
            }`}
            style={{ minHeight: "200px" }}
          >
            {state.uploadedLot?.imageDataUrl ? (
              <>
                <img
                  src={state.uploadedLot.imageDataUrl}
                  alt="Your land"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white/80 px-2 py-1 rounded">
                  Click to change photo
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted/40">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div className="text-center">
                  <p className="text-text-secondary text-sm font-medium">Upload a photo of your land</p>
                  <p className="text-text-muted/50 text-xs mt-0.5">Optional — helps visualize the home on your property</p>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Dimensions */}
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
                        imageDataUrl: state.uploadedLot?.imageDataUrl ?? "",
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
                        imageDataUrl: state.uploadedLot?.imageDataUrl ?? "",
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
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
