import { useId } from "react";
import { homeModels, sidingColors, metalRoofColors } from "@/lib/defaults";
import type { HomeCategory } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";

// Neutrals only — every themed color (siding, roof) comes from defaults.ts swatches.
const PALETTE = {
  trim: "#F2EDE3",
  trimShadow: "rgba(0,0,0,0.25)",
  glass: "#B8CEDD",
  glassFrame: "#5A6670",
  door: "#5C4630",
  shingle: "#46413C",
  foundation: "#7A766F",
  chimney: "#8A6A55",
  shadow: "rgba(0,0,0,0.28)",
};

interface Geometry {
  wallX: number;
  wallW: number;
  wallH: number;
  roofRise: number;
  ridgeInset: number;
  windowW: number;
  windowH: number;
}

const GEO: Record<HomeCategory, Geometry> = {
  mini: { wallX: 110, wallW: 220, wallH: 78, roofRise: 38, ridgeInset: 72, windowW: 36, windowH: 38 },
  modular: { wallX: 72, wallW: 296, wallH: 86, roofRise: 28, ridgeInset: 100, windowW: 52, windowH: 44 },
  traditional: { wallX: 84, wallW: 272, wallH: 88, roofRise: 50, ridgeInset: 82, windowW: 40, windowH: 42 },
  multistory: { wallX: 92, wallW: 256, wallH: 150, roofRise: 40, ridgeInset: 86, windowW: 36, windowH: 36 },
};

const GROUND_Y = 244;

interface WindowProps {
  x: number;
  y: number;
  w: number;
  h: number;
  trimStyle: string;
}

function Window({ x, y, w, h, trimStyle }: WindowProps) {
  const casing = trimStyle === "craftsman" ? 6 : 4;
  return (
    <g>
      {/* Colonial: stepped double casing */}
      {trimStyle === "colonial" && (
        <rect x={x - casing - 3} y={y - casing - 3} width={w + (casing + 3) * 2} height={h + (casing + 3) * 2} fill="none" stroke={PALETTE.trim} strokeWidth={2} />
      )}
      {/* Casing */}
      <rect x={x - casing} y={y - casing} width={w + casing * 2} height={h + casing * 2} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
      {/* Craftsman: header board + corner blocks */}
      {trimStyle === "craftsman" && (
        <>
          <rect x={x - casing - 2} y={y - casing - 7} width={w + (casing + 2) * 2} height={7} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
          <rect x={x - casing - 2} y={y - casing - 7} width={6} height={7} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
          <rect x={x + w + casing - 4} y={y - casing - 7} width={6} height={7} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
        </>
      )}
      {/* Glass + sash */}
      <rect x={x} y={y} width={w} height={h} fill={PALETTE.glass} stroke={PALETTE.glassFrame} strokeWidth={1.5} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={PALETTE.glassFrame} strokeWidth={1} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={PALETTE.glassFrame} strokeWidth={1} />
      {/* Glass highlight */}
      <polygon points={`${x + 2},${y + h - 4} ${x + w * 0.45},${y + 2} ${x + w * 0.62},${y + 2} ${x + 2},${y + h * 0.7 + 2}`} fill="rgba(255,255,255,0.25)" />
    </g>
  );
}

function SidingTexture({ styleId, x, w, top, bottom }: { styleId: string; x: number; w: number; top: number; bottom: number }) {
  const lines: React.ReactNode[] = [];
  if (styleId === "vertical") {
    for (let lx = x + 9; lx < x + w; lx += 9) {
      lines.push(<line key={lx} x1={lx} y1={top} x2={lx} y2={bottom} stroke="rgba(0,0,0,0.14)" strokeWidth={1} />);
    }
  } else if (styleId === "board-batten") {
    for (let lx = x + 11; lx < x + w; lx += 22) {
      lines.push(<rect key={lx} x={lx} y={top} width={3.5} height={bottom - top} fill="rgba(0,0,0,0.18)" />);
    }
  } else {
    // horizontal lap (default)
    for (let ly = top + 7; ly < bottom; ly += 7) {
      lines.push(<line key={ly} x1={x} y1={ly} x2={x + w} y2={ly} stroke="rgba(0,0,0,0.13)" strokeWidth={1} />);
    }
  }
  return <>{lines}</>;
}

function RoofTexture({ isMetal, points, eaveY, ridgeY, x1, x2 }: { isMetal: boolean; points: string; eaveY: number; ridgeY: number; x1: number; x2: number }) {
  const lines: React.ReactNode[] = [];
  if (isMetal) {
    // standing seams — verticals across the roof plane
    for (let lx = x1 + 16; lx < x2; lx += 18) {
      lines.push(<line key={lx} x1={lx} y1={ridgeY} x2={lx} y2={eaveY} stroke="rgba(0,0,0,0.22)" strokeWidth={1.5} />);
    }
  } else {
    // shingle courses — horizontals
    for (let ly = ridgeY + 7; ly < eaveY; ly += 7) {
      lines.push(<line key={ly} x1={x1} y1={ly} x2={x2} y2={ly} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />);
    }
  }
  return <>{lines}</>;
}

export default function ParametricHouse({ state }: { state: ConfiguratorState }) {
  const clipId = useId();
  const roofClipId = useId();

  const model = homeModels.find((m) => m.id === state.modelId);
  if (!model) return null;

  const geo = GEO[model.category];
  const sidingHex = sidingColors.find((c) => c.id === state.sidingColorId)?.swatchHex ?? "#F2EDE3";
  const isMetal = state.roofTypeId === "metal";
  const roofHex = isMetal
    ? metalRoofColors.find((c) => c.id === state.metalRoofColorId)?.swatchHex ?? "#3C434A"
    : PALETTE.shingle;

  const { wallX, wallW, wallH, roofRise, ridgeInset, windowW, windowH } = geo;
  const wallTop = GROUND_Y - wallH;
  const eaveX1 = wallX - 14;
  const eaveX2 = wallX + wallW + 14;
  const ridgeY = wallTop - roofRise;
  const ridgeX1 = wallX + ridgeInset;
  const ridgeX2 = wallX + wallW - ridgeInset;
  const roofPoints = `${eaveX1},${wallTop} ${eaveX2},${wallTop} ${ridgeX2},${ridgeY} ${ridgeX1},${ridgeY}`;

  const isTwoStorey = model.category === "multistory";
  const doorW = 30;
  const doorH = 54;
  const doorX = wallX + wallW / 2 - doorW / 2;
  const doorY = GROUND_Y - doorH;

  // Lower windows flank the door; upper row (multistory) is evenly spread.
  const lowWinY = isTwoStorey ? wallTop + 92 : wallTop + Math.max(14, (wallH - doorH) / 2);
  const lowWinXs = [wallX + wallW * 0.16, wallX + wallW * 0.84 - windowW];
  const upWinY = wallTop + 18;
  const upWinXs = [wallX + wallW * 0.14, wallX + wallW * 0.5 - windowW / 2, wallX + wallW * 0.86 - windowW];

  // Porch spans the door area
  const porchW = Math.min(wallW * 0.52, 150);
  const porchX = wallX + wallW / 2 - porchW / 2;
  const porchRoofTop = isTwoStorey ? wallTop + 78 : wallTop + 8;
  const porchRoofBottom = porchRoofTop + 16;

  return (
    <svg viewBox="0 0 440 270" className="w-full h-auto" role="img" aria-label={`Illustration of ${model.name} with your selected exterior options`}>
      <defs>
        <clipPath id={clipId}>
          <rect x={wallX} y={wallTop} width={wallW} height={wallH} />
        </clipPath>
        <clipPath id={roofClipId}>
          <polygon points={roofPoints} />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx={wallX + wallW / 2} cy={GROUND_Y + 9} rx={wallW * 0.62} ry={9} fill={PALETTE.shadow} />

      {/* Foundation */}
      <rect x={wallX - 4} y={GROUND_Y - 4} width={wallW + 8} height={12} fill={PALETTE.foundation} stroke="rgba(0,0,0,0.3)" strokeWidth={0.75} />

      {/* Walls — fill from selected siding color */}
      <rect x={wallX} y={wallTop} width={wallW} height={wallH} fill={sidingHex} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
      <g clipPath={`url(#${clipId})`}>
        <SidingTexture styleId={state.sidingStyleId} x={wallX} w={wallW} top={wallTop} bottom={GROUND_Y} />
      </g>

      {/* Storey band on two-storey homes */}
      {isTwoStorey && (
        <rect x={wallX} y={wallTop + 72} width={wallW} height={5} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.5} />
      )}

      {/* Chimney (fireplace selected) */}
      {state.hasFireplace && (
        <rect x={ridgeX2 - 30} y={ridgeY - 18} width={16} height={roofRise * 0.6 + 18} fill={PALETTE.chimney} stroke="rgba(0,0,0,0.3)" strokeWidth={0.75} />
      )}

      {/* Roof — front plane, fill from roof selection */}
      <polygon points={roofPoints} fill={roofHex} stroke="rgba(0,0,0,0.35)" strokeWidth={1.25} />
      <g clipPath={`url(#${roofClipId})`}>
        <RoofTexture isMetal={isMetal} points={roofPoints} eaveY={wallTop} ridgeY={ridgeY} x1={eaveX1} x2={eaveX2} />
      </g>
      {/* Ridge cap + fascia */}
      <line x1={ridgeX1} y1={ridgeY} x2={ridgeX2} y2={ridgeY} stroke="rgba(0,0,0,0.35)" strokeWidth={2.5} />
      <rect x={eaveX1} y={wallTop - 1} width={eaveX2 - eaveX1} height={4.5} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.5} />

      {/* Windows */}
      {isTwoStorey && upWinXs.map((wx) => (
        <Window key={`up-${wx}`} x={wx} y={upWinY} w={windowW} h={windowH} trimStyle={state.exteriorTrimId} />
      ))}
      {lowWinXs.map((wx) => (
        <Window key={`low-${wx}`} x={wx} y={lowWinY} w={windowW} h={windowH} trimStyle={state.exteriorTrimId} />
      ))}

      {/* Door */}
      <g>
        <rect x={doorX - 4} y={doorY - 4} width={doorW + 8} height={doorH + 4} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
        <rect x={doorX} y={doorY} width={doorW} height={doorH} fill={PALETTE.door} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
        <rect x={doorX + 5} y={doorY + 7} width={doorW - 10} height={16} fill="rgba(255,255,255,0.12)" stroke="rgba(0,0,0,0.2)" strokeWidth={0.75} />
        <circle cx={doorX + doorW - 6} cy={doorY + doorH / 2 + 2} r={1.75} fill="#C4B090" />
      </g>

      {/* Front porch */}
      {state.hasFrontPorch && (
        <g>
          {/* Porch roof — uses the selected roof material */}
          <polygon
            points={`${porchX - 8},${porchRoofBottom} ${porchX + porchW + 8},${porchRoofBottom} ${porchX + porchW - 6},${porchRoofTop} ${porchX + 6},${porchRoofTop}`}
            fill={roofHex}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={1}
          />
          <rect x={porchX - 8} y={porchRoofBottom - 1} width={porchW + 16} height={3.5} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.5} />
          {/* Posts */}
          {[porchX - 2, porchX + porchW - 4].map((px) => (
            <rect key={px} x={px} y={porchRoofBottom + 2} width={6} height={GROUND_Y - porchRoofBottom - 2} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
          ))}
          {/* Railing */}
          <line x1={porchX + 4} y1={GROUND_Y - 22} x2={doorX - 6} y2={GROUND_Y - 22} stroke={PALETTE.trim} strokeWidth={2.5} />
          <line x1={doorX + doorW + 6} y1={GROUND_Y - 22} x2={porchX + porchW - 4} y2={GROUND_Y - 22} stroke={PALETTE.trim} strokeWidth={2.5} />
          {/* Deck */}
          <rect x={porchX - 10} y={GROUND_Y - 2} width={porchW + 20} height={7} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
        </g>
      )}

      {/* Front step */}
      {!state.hasFrontPorch && (
        <rect x={doorX - 6} y={GROUND_Y - 2} width={doorW + 12} height={6} fill={PALETTE.foundation} stroke="rgba(0,0,0,0.3)" strokeWidth={0.5} />
      )}
    </svg>
  );
}
