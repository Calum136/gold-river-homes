"use client";

import { sidingColors, metalRoofColors } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";

// ─── Polygon clip paths (% of 16:8 container) calibrated to the Bali render ──
// Left wing siding (board area, not entry gable)
const LEFT_WING  = "polygon(4% 34%, 39% 34%, 39% 65%, 4% 65%)";
// Right wing siding
const RIGHT_WING = "polygon(59% 34%, 96% 34%, 96% 65%, 59% 65%)";
// Roof surface visible from front
const ROOF_POLY  = "polygon(3% 10%, 97% 10%, 97% 36%, 3% 36%)";

// ─── Siding direction patterns ─────────────────────────────────────────────
const SIDING_PATTERNS: Record<string, string | null> = {
  horizontal: null,  // photo already shows horizontal lap — no extra overlay needed
  vertical:
    // Dark lines every 16px create vertical board seams
    "repeating-linear-gradient(90deg," +
    " transparent 0px, transparent 13px," +
    " rgba(0,0,0,0.28) 13px, rgba(0,0,0,0.28) 15px," +
    " rgba(255,255,255,0.06) 15px, rgba(255,255,255,0.06) 17px)",
  "board-batten":
    // Wide panels with narrow batten strips
    "repeating-linear-gradient(90deg," +
    " transparent 0px, transparent 22px," +
    " rgba(0,0,0,0.35) 22px, rgba(0,0,0,0.35) 26px," +
    " rgba(255,255,255,0.10) 26px, rgba(255,255,255,0.10) 29px)",
};

// ─── Per-colour opacity fine-tuning ──────────────────────────────────────
function wallOpacity(colorId: string): number {
  switch (colorId) {
    case "white":
    case "cream":      return 0;           // photo is already this colour
    case "warm-gray":
    case "slate":      return 0.62;
    case "charcoal":
    case "navy":
    case "forest":
    case "black":      return 0.80;        // dark colours need more
    default:           return 0.70;
  }
}

interface Props { state: ConfiguratorState }

export default function BaliPhotoConfigurator({ state }: Props) {
  const sidingColor  = sidingColors.find(c => c.id === state.sidingColorId);
  const metalRoofCol = metalRoofColors.find(c => c.id === state.metalRoofColorId);
  const isMetal      = state.roofTypeId === "metal";
  const wallHex      = sidingColor?.swatchHex ?? "#F2EDE3";
  const roofHex      = metalRoofCol?.swatchHex ?? "#3C434A";
  const colorId      = state.sidingColorId ?? "white";
  const opacity      = wallOpacity(colorId);
  const sidingTex    = SIDING_PATTERNS[state.sidingStyleId] ?? null;

  // Caption for the badge
  const styleLabel =
    state.sidingStyleId === "board-batten" ? "Board & Batten" :
    state.sidingStyleId === "vertical"     ? "Vertical Board" : "Horizontal Lap";
  const roofLabel = isMetal ? `Metal — ${metalRoofCol?.label ?? ""}` : "Shingles";
  const badge = [
    sidingColor?.label ?? "White",
    styleLabel,
    "·",
    roofLabel,
    state.hasFrontPorch ? "· Covered Porch" : "",
  ].filter(Boolean).join(" ");

  return (
    // isolation:isolate — blend modes only composite within this element
    <div className="absolute inset-0 overflow-hidden" style={{ isolation: "isolate" }}>

      {/* ── Base photo ───────────────────────────────────────────────── */}
      <img
        src="/models/bali/exterior.webp"
        alt="Bali exterior"
        className="w-full h-full object-cover"
        draggable={false}
        style={{ display: "block" }}
      />

      {/* ── SIDING: colour overlay (left wing) ───────────────────────── */}
      {opacity > 0 && (
        <div
          className="absolute inset-0 transition-all duration-350"
          style={{
            clipPath: LEFT_WING,
            backgroundColor: wallHex,
            mixBlendMode: "multiply",
            opacity,
          }}
        />
      )}
      {/* ── SIDING: direction texture (left wing) ────────────────────── */}
      {sidingTex && (
        <div
          className="absolute inset-0"
          style={{ clipPath: LEFT_WING, background: sidingTex }}
        />
      )}

      {/* ── SIDING: colour overlay (right wing) ──────────────────────── */}
      {opacity > 0 && (
        <div
          className="absolute inset-0 transition-all duration-350"
          style={{
            clipPath: RIGHT_WING,
            backgroundColor: wallHex,
            mixBlendMode: "multiply",
            opacity,
          }}
        />
      )}
      {/* ── SIDING: direction texture (right wing) ───────────────────── */}
      {sidingTex && (
        <div
          className="absolute inset-0"
          style={{ clipPath: RIGHT_WING, background: sidingTex }}
        />
      )}

      {/* ── ROOF: metal overlay ──────────────────────────────────────── */}
      {isMetal && (
        <>
          {/* Colour shift: multiply turns dark shingles into metal tone */}
          <div
            className="absolute inset-0 transition-all duration-350"
            style={{
              clipPath: ROOF_POLY,
              backgroundColor: roofHex,
              mixBlendMode: "multiply",
              opacity: 0.72,
            }}
          />
          {/* Standing-seam lines */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: ROOF_POLY,
              background:
                "repeating-linear-gradient(90deg," +
                " transparent 0px, transparent 18px," +
                " rgba(0,0,0,0.22) 18px, rgba(0,0,0,0.22) 20px)",
            }}
          />
          {/* Metallic highlight across top of roof */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: ROOF_POLY,
              background:
                "linear-gradient(180deg," +
                " rgba(255,255,255,0.20) 0%," +
                " rgba(255,255,255,0.06) 40%," +
                " rgba(0,0,0,0.08) 100%)",
              mixBlendMode: "overlay",
            }}
          />
        </>
      )}

      {/* ── PORCH overlay ────────────────────────────────────────────── */}
      {state.hasFrontPorch && <PorchOverlay />}

      {/* ── Badges ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-2 left-2 right-24 flex flex-col gap-1 items-start">
        <span className="text-[10px] font-semibold bg-gold/90 text-white px-2 py-0.5 rounded">
          Photorealistic render
        </span>
        <span className="text-[10px] bg-black/60 text-white/80 px-2 py-1 rounded backdrop-blur-sm leading-snug">
          {badge}
        </span>
      </div>
    </div>
  );
}

// ─── Porch overlay drawn over the entry in SVG coordinates (1600×800) ───────
function PorchOverlay() {
  return (
    <svg
      viewBox="0 0 1600 800"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.40))" }}
    >
      {/* Porch roof top surface */}
      <polygon
        points="455,278 1145,278 1118,308 482,308"
        fill="#C8B888"
        opacity="0.94"
      />
      {/* Fascia board */}
      <rect x="450" y="272" width="700" height="9" fill="#D8CC98" opacity="0.96" />
      {/* Soffit underside */}
      <polygon
        points="482,308 1118,308 1096,326 504,326"
        fill="#A89858"
        opacity="0.90"
      />
      {/* Shadow on wall cast by roof */}
      <rect x="452" y="306" width="696" height="22" fill="rgba(0,0,0,0.22)" />

      {/* Left post */}
      <rect x="470" y="324" width="24" height="200" fill="#E4D8B0" opacity="0.93" rx="2" />
      {/* Right post */}
      <rect x="1106" y="324" width="24" height="200" fill="#E4D8B0" opacity="0.93" rx="2" />
      {/* Post cap trim */}
      <rect x="464" y="320" width="36" height="6"  fill="#D0C490" opacity="0.95" />
      <rect x="1100" y="320" width="36" height="6" fill="#D0C490" opacity="0.95" />
      {/* Post base trim */}
      <rect x="464" y="520" width="36" height="8"  fill="#D0C490" opacity="0.90" />
      <rect x="1100" y="520" width="36" height="8" fill="#D0C490" opacity="0.90" />

      {/* Porch deck */}
      <rect x="448" y="526" width="704" height="20" fill="#BEB07A" opacity="0.93" />
      {/* Deck plank lines */}
      {[530, 600, 670, 740, 810, 880, 950, 1020, 1090].map(x => (
        <line key={x} x1={x} y1="526" x2={x} y2="546" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
      ))}

      {/* Handrail — left section (beside door) */}
      <rect x="470" y="440" width="90" height="5"  fill="#D4C898" opacity="0.90" />
      {/* Handrail — right section */}
      <rect x="1040" y="440" width="90" height="5" fill="#D4C898" opacity="0.90" />
      {/* Bottom rail left */}
      <rect x="470" y="519" width="90" height="5"  fill="#D4C898" opacity="0.85" />
      {/* Bottom rail right */}
      <rect x="1040" y="519" width="90" height="5" fill="#D4C898" opacity="0.85" />
      {/* Balusters — left */}
      {[484, 498, 512, 526, 540].map(x => (
        <rect key={x} x={x} y="444" width="5" height="76" fill="#D4C898" opacity="0.82" />
      ))}
      {/* Balusters — right */}
      {[1048, 1062, 1076, 1090, 1104].map(x => (
        <rect key={x} x={x} y="444" width="5" height="76" fill="#D4C898" opacity="0.82" />
      ))}
    </svg>
  );
}
