import { lotOptions, sidingColors, homeModels } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";
import ParametricHouse from "./ParametricHouse";
import LotBackdrop from "./LotBackdrop";

interface HomeVisualizerProps {
  state: ConfiguratorState;
}

export default function HomeVisualizer({ state }: HomeVisualizerProps) {
  const lot = state.landSituation === "gold-river"
    ? lotOptions.find((l) => l.id === state.selectedLotId)
    : null;

  // Real photos win over illustration: buyer's own land photo, then a real lot photo.
  const photoUrl = state.uploadedLot?.imageDataUrl || lot?.photoUrl || null;
  const sidingColor = sidingColors.find((c) => c.id === state.sidingColorId);
  const model = homeModels.find((m) => m.id === state.modelId);

  return (
    <div className="relative w-full overflow-hidden bg-bg-tertiary" style={{ aspectRatio: "16/7" }}>
      {/* Background: photo > illustrated lot scene */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={lot ? lot.name : "Your lot"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <LotBackdrop terrain={lot?.terrain ?? "meadow"} />
      )}

      {/* Soften photo backgrounds so the illustrated house reads clearly */}
      {photoUrl && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
      )}

      {/* The home — live parametric render of every exterior selection */}
      {model ? (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[62%] max-w-md">
          <ParametricHouse state={state} />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-6 text-center">
          <p className="text-white/40 text-xs bg-black/30 inline-block px-3 py-1 rounded backdrop-blur-sm">
            Choose a model to see your home take shape
          </p>
        </div>
      )}

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

    </div>
  );
}
