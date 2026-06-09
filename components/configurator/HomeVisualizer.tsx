import { lotOptions, sidingColors, homeModels } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";

interface HomeVisualizerProps {
  state: ConfiguratorState;
}

function HousePlaceholder({ modelId }: { modelId: string | null }) {
  const model = homeModels.find((m) => m.id === modelId);
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[58%] max-w-sm">
      <div className="relative">
        {/* Roof */}
        <div
          className="w-full"
          style={{ paddingBottom: "40%", position: "relative", overflow: "hidden" }}
        >
          <svg
            viewBox="0 0 200 80"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <polygon points="0,80 100,5 200,80" fill="rgba(40,35,30,0.92)" />
          </svg>
        </div>
        {/* Body */}
        <div className="bg-white/85 backdrop-blur-sm mx-4 relative" style={{ height: "110px" }}>
          {/* Windows */}
          <div className="absolute inset-0 flex items-center justify-around px-4 pt-3">
            {[0, 1].map((i) => (
              <div key={i} className="w-10 h-10 bg-sky-200/70 border border-white/40 rounded-sm" />
            ))}
          </div>
          {/* Door */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-14 bg-amber-900/70 border border-white/20 rounded-t-sm" />
        </div>
        {/* Ground shadow */}
        <div className="h-3 bg-gradient-to-b from-black/20 to-transparent mx-6" />
      </div>
      {model && (
        <div className="text-center mt-1">
          <span className="text-white/80 text-xs font-medium bg-black/40 px-2 py-0.5 rounded">
            {model.name}
          </span>
        </div>
      )}
    </div>
  );
}

export default function HomeVisualizer({ state }: HomeVisualizerProps) {
  const lot = state.landSituation === "gold-river"
    ? lotOptions.find((l) => l.id === state.selectedLotId)
    : null;

  const lotPhotoUrl = lot?.photoUrl ?? state.uploadedLot?.imageDataUrl;
  const sidingColor = sidingColors.find((c) => c.id === state.sidingColorId);
  const model = homeModels.find((m) => m.id === state.modelId);
  const backgroundUrl = lotPhotoUrl ?? model?.photoUrl ?? null;

  return (
    <div className="relative w-full overflow-hidden bg-bg-tertiary" style={{ aspectRatio: "16/7" }}>
      {/* Background: lot photo > model photo > empty state */}
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt={lot ? "Your lot" : (model?.name ?? "Home")}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-600 flex items-end justify-center pb-8">
          <div className="text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/20 mx-auto mb-2">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
            <p className="text-white/30 text-xs">Select a lot to see your home here</p>
          </div>
        </div>
      )}

      {/* Overlay: stronger when showing model photo (no lot context yet) */}
      {backgroundUrl && (
        <div className={`absolute inset-0 bg-gradient-to-t ${lotPhotoUrl ? "from-black/30 via-transparent to-black/10" : "from-black/50 via-black/20 to-black/10"}`} />
      )}

      {/* House silhouette overlay — only when showing a lot background (model photo IS the visual) */}
      {state.modelId && lotPhotoUrl && <HousePlaceholder modelId={state.modelId} />}

      {/* Badges — current selections */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[60%]">
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

      {/* Siding + roof color indicators */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
        {sidingColor && (
          <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
            <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: sidingColor.swatchHex }} />
            <span className="text-[10px] text-white/80">{sidingColor.label}</span>
          </div>
        )}
        {state.roofTypeId === "metal" && (
          <div className="bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
            <span className="text-[10px] text-white/80">Metal Roof</span>
          </div>
        )}
        {state.hasFrontPorch && (
          <div className="bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
            <span className="text-[10px] text-white/80">+ Front Porch</span>
          </div>
        )}
      </div>

    </div>
  );
}
