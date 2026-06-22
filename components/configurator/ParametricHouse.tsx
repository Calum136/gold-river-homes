import { useId } from "react";
import { homeModels, sidingColors, metalRoofColors } from "@/lib/defaults";
import type { HomeCategory } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";

// Neutrals — themed colors come from defaults.ts swatches.
const PALETTE = {
  trim: "#F4EFE5",
  trimShadow: "rgba(0,0,0,0.20)",
  glass: "#C4D8EC",
  glassDark: "#9AB8D0",
  glassFrame: "#5A6670",
  door: "#5C4630",
  foundation: "#7A766F",
  foundationLight: "#9A968F",
  chimney: "#8A6A55",
  chimneyDark: "#6A5040",
  shadow: "rgba(0,0,0,0.22)",
};

interface Geometry {
  wallX: number; wallW: number; wallH: number;
  roofRise: number; ridgeInset: number;
  windowW: number; windowH: number;
}

const GEO: Record<HomeCategory, Geometry> = {
  mini:       { wallX: 110, wallW: 220, wallH: 78,  roofRise: 38, ridgeInset: 72,  windowW: 36, windowH: 38 },
  modular:    { wallX: 72,  wallW: 296, wallH: 86,  roofRise: 28, ridgeInset: 100, windowW: 52, windowH: 44 },
  traditional:{ wallX: 84,  wallW: 272, wallH: 88,  roofRise: 50, ridgeInset: 82,  windowW: 40, windowH: 42 },
  multistory: { wallX: 92,  wallW: 256, wallH: 150, roofRise: 40, ridgeInset: 86,  windowW: 36, windowH: 36 },
};

const GROUND_Y = 244;

interface WindowProps {
  x: number; y: number; w: number; h: number; trimStyle: string;
}

function Window({ x, y, w, h, trimStyle }: WindowProps) {
  const casing = trimStyle === "craftsman" ? 6 : 4;
  return (
    <g>
      {trimStyle === "colonial" && (
        <rect x={x - casing - 3} y={y - casing - 3} width={w + (casing + 3) * 2} height={h + (casing + 3) * 2}
          fill="none" stroke={PALETTE.trim} strokeWidth={2} />
      )}
      <rect x={x - casing} y={y - casing} width={w + casing * 2} height={h + casing * 2}
        fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
      {trimStyle === "craftsman" && (
        <>
          <rect x={x - casing - 2} y={y - casing - 7} width={w + (casing + 2) * 2} height={7}
            fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
          <rect x={x - casing - 2} y={y - casing - 7} width={6} height={7}
            fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
          <rect x={x + w + casing - 4} y={y - casing - 7} width={6} height={7}
            fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
        </>
      )}
      {/* Glass with gradient */}
      <defs>
        <linearGradient id={`win${x}${y}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PALETTE.glass} />
          <stop offset="100%" stopColor={PALETTE.glassDark} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#win${x}${y})`} stroke={PALETTE.glassFrame} strokeWidth={1.5} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={PALETTE.glassFrame} strokeWidth={1} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={PALETTE.glassFrame} strokeWidth={1} />
      {/* Reflection highlight */}
      <polygon
        points={`${x + 2},${y + h - 5} ${x + w * 0.42},${y + 2} ${x + w * 0.60},${y + 2} ${x + 2},${y + h * 0.68}`}
        fill="rgba(255,255,255,0.30)"
      />
    </g>
  );
}

function SidingTexture({ styleId, x, w, top, bottom }: { styleId: string; x: number; w: number; top: number; bottom: number }) {
  const lines: React.ReactNode[] = [];
  if (styleId === "vertical") {
    for (let lx = x + 9; lx < x + w; lx += 9)
      lines.push(<line key={lx} x1={lx} y1={top} x2={lx} y2={bottom} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />);
  } else if (styleId === "board-batten") {
    for (let lx = x + 11; lx < x + w; lx += 22)
      lines.push(<rect key={lx} x={lx} y={top} width={3.5} height={bottom - top} fill="rgba(0,0,0,0.16)" />);
  } else {
    for (let ly = top + 7; ly < bottom; ly += 7)
      lines.push(<line key={ly} x1={x} y1={ly} x2={x + w} y2={ly} stroke="rgba(0,0,0,0.11)" strokeWidth={1} />);
  }
  return <>{lines}</>;
}

function RoofTexture({ isMetal, eaveY, ridgeY, x1, x2 }: { isMetal: boolean; eaveY: number; ridgeY: number; x1: number; x2: number }) {
  const lines: React.ReactNode[] = [];
  if (isMetal) {
    for (let lx = x1 + 16; lx < x2; lx += 18)
      lines.push(<line key={lx} x1={lx} y1={ridgeY} x2={lx} y2={eaveY} stroke="rgba(0,0,0,0.20)" strokeWidth={1.5} />);
  } else {
    for (let ly = ridgeY + 7; ly < eaveY; ly += 7)
      lines.push(<line key={ly} x1={x1} y1={ly} x2={x2} y2={ly} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />);
  }
  return <>{lines}</>;
}

export default function ParametricHouse({ state }: { state: ConfiguratorState }) {
  const uid = useId().replace(/:/g, "");

  const model = homeModels.find((m) => m.id === state.modelId);
  if (!model) return null;

  const geo = GEO[model.category];
  const sidingHex = sidingColors.find((c) => c.id === state.sidingColorId)?.swatchHex ?? "#F2EDE3";
  const isMetal = state.roofTypeId === "metal";
  const roofHex = isMetal
    ? metalRoofColors.find((c) => c.id === state.metalRoofColorId)?.swatchHex ?? "#3C434A"
    : "#4A4540";

  // Derive lighter/darker shades from the siding hex for gradient depth
  const shadeSiding = `rgba(0,0,0,0.18)`;

  const { wallX, wallW, wallH, roofRise, ridgeInset, windowW, windowH } = geo;
  const wallTop = GROUND_Y - wallH;
  const eaveX1 = wallX - 16;
  const eaveX2 = wallX + wallW + 16;
  const ridgeY = wallTop - roofRise;
  const ridgeX1 = wallX + ridgeInset;
  const ridgeX2 = wallX + wallW - ridgeInset;
  const roofPoints = `${eaveX1},${wallTop} ${eaveX2},${wallTop} ${ridgeX2},${ridgeY} ${ridgeX1},${ridgeY}`;

  const isTwoStorey = model.category === "multistory";
  const doorW = 30;
  const doorH = 54;
  const doorX = wallX + wallW / 2 - doorW / 2;
  const doorY = GROUND_Y - doorH;

  const lowWinY = isTwoStorey ? wallTop + 92 : wallTop + Math.max(14, (wallH - doorH) / 2);
  const lowWinXs = [wallX + wallW * 0.16, wallX + wallW * 0.84 - windowW];
  const upWinY = wallTop + 18;
  const upWinXs = [wallX + wallW * 0.14, wallX + wallW * 0.5 - windowW / 2, wallX + wallW * 0.86 - windowW];

  const porchW = Math.min(wallW * 0.52, 150);
  const porchX = wallX + wallW / 2 - porchW / 2;
  const porchRoofTop = isTwoStorey ? wallTop + 78 : wallTop + 8;
  const porchRoofBottom = porchRoofTop + 18;

  return (
    <svg
      viewBox="0 0 440 270"
      className="w-full h-auto drop-shadow-xl"
      role="img"
      aria-label={`Illustration of ${model.name} with your selected exterior options`}
    >
      <defs>
        {/* Wall gradient: light from top-left */}
        <linearGradient id={`${uid}wallGrad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
          <stop offset="100%" stopColor={shadeSiding} />
        </linearGradient>

        {/* Roof gradient */}
        <linearGradient id={`${uid}roofGrad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </linearGradient>

        {/* Soft ground shadow */}
        <radialGradient id={`${uid}gndShadow`} cx="50%" cy="0%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.30)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Door gradient */}
        <linearGradient id={`${uid}doorGrad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
        </linearGradient>

        <clipPath id={`${uid}wallClip`}>
          <rect x={wallX} y={wallTop} width={wallW} height={wallH} />
        </clipPath>
        <clipPath id={`${uid}roofClip`}>
          <polygon points={roofPoints} />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx={wallX + wallW / 2} cy={GROUND_Y + 10} rx={wallW * 0.65} ry={11} fill={`url(#${uid}gndShadow)`} />

      {/* Foundation */}
      <rect x={wallX - 5} y={GROUND_Y - 5} width={wallW + 10} height={14} fill={PALETTE.foundation} stroke="rgba(0,0,0,0.25)" strokeWidth={0.75} />
      <rect x={wallX - 5} y={GROUND_Y - 5} width={wallW + 10} height={5} fill={PALETTE.foundationLight} />

      {/* ── Walls ── */}
      <rect x={wallX} y={wallTop} width={wallW} height={wallH} fill={sidingHex} stroke="rgba(0,0,0,0.20)" strokeWidth={1} />
      {/* Siding texture */}
      <g clipPath={`url(#${uid}wallClip)`}>
        <SidingTexture styleId={state.sidingStyleId} x={wallX} w={wallW} top={wallTop} bottom={GROUND_Y} />
      </g>
      {/* Light/shadow gradient overlay */}
      <rect x={wallX} y={wallTop} width={wallW} height={wallH} fill={`url(#${uid}wallGrad)`} clipPath={`url(#${uid}wallClip)`} />

      {/* Two-storey dividing band */}
      {isTwoStorey && (
        <rect x={wallX} y={wallTop + 72} width={wallW} height={5} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.5} />
      )}

      {/* ── Chimney (fireplace) ── */}
      {state.hasFireplace && (
        <g>
          <rect x={ridgeX2 - 30} y={ridgeY - 22} width={18} height={roofRise * 0.65 + 22}
            fill={PALETTE.chimney} stroke="rgba(0,0,0,0.25)" strokeWidth={0.75} />
          <rect x={ridgeX2 - 30} y={ridgeY - 22} width={9} height={roofRise * 0.65 + 22}
            fill="rgba(255,255,255,0.08)" />
          {/* Chimney cap */}
          <rect x={ridgeX2 - 33} y={ridgeY - 24} width={24} height={4} fill={PALETTE.chimneyDark} />
        </g>
      )}

      {/* ── Roof ── */}
      <polygon points={roofPoints} fill={roofHex} stroke="rgba(0,0,0,0.30)" strokeWidth={1.5} />
      {/* Texture */}
      <g clipPath={`url(#${uid}roofClip)`}>
        <RoofTexture isMetal={isMetal} eaveY={wallTop} ridgeY={ridgeY} x1={eaveX1} x2={eaveX2} />
      </g>
      {/* Gradient overlay on roof */}
      <polygon points={roofPoints} fill={`url(#${uid}roofGrad)`} clipPath={`url(#${uid}roofClip)`} />
      {/* Ridge cap */}
      <line x1={ridgeX1} y1={ridgeY} x2={ridgeX2} y2={ridgeY} stroke="rgba(0,0,0,0.30)" strokeWidth={3} />
      {/* Fascia board */}
      <rect x={eaveX1} y={wallTop - 1.5} width={eaveX2 - eaveX1} height={5} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.5} />
      {/* Roof eave shadow on wall */}
      <rect x={wallX} y={wallTop} width={wallW} height={6} fill="rgba(0,0,0,0.10)" />

      {/* ── Windows ── */}
      {isTwoStorey && upWinXs.map((wx) => (
        <Window key={`up-${wx}`} x={wx} y={upWinY} w={windowW} h={windowH} trimStyle={state.exteriorTrimId} />
      ))}
      {lowWinXs.map((wx) => (
        <Window key={`low-${wx}`} x={wx} y={lowWinY} w={windowW} h={windowH} trimStyle={state.exteriorTrimId} />
      ))}

      {/* ── Door ── */}
      <g>
        <rect x={doorX - 5} y={doorY - 4} width={doorW + 10} height={doorH + 4}
          fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
        <rect x={doorX} y={doorY} width={doorW} height={doorH}
          fill={PALETTE.door} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
        {/* Light overlay on door */}
        <rect x={doorX} y={doorY} width={doorW} height={doorH} fill={`url(#${uid}doorGrad)`} />
        {/* Glass sidelights */}
        <rect x={doorX + 4} y={doorY + 6} width={doorW - 8} height={16}
          fill="rgba(180,210,230,0.35)" stroke="rgba(0,0,0,0.15)" strokeWidth={0.75} />
        <circle cx={doorX + doorW - 6} cy={doorY + doorH / 2 + 2} r={2} fill="#C4B090" />
      </g>

      {/* ── Front porch ── */}
      {state.hasFrontPorch && (
        <g>
          {/* Porch roof matches selected roofing */}
          <polygon
            points={`${porchX - 10},${porchRoofBottom} ${porchX + porchW + 10},${porchRoofBottom} ${porchX + porchW - 5},${porchRoofTop} ${porchX + 5},${porchRoofTop}`}
            fill={roofHex} stroke="rgba(0,0,0,0.30)" strokeWidth={1}
          />
          <rect x={porchX - 10} y={porchRoofBottom - 1} width={porchW + 20} height={4} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.5} />
          {/* Posts */}
          {[porchX - 3, porchX + porchW - 3].map((px) => (
            <g key={px}>
              <rect x={px} y={porchRoofBottom + 2} width={7} height={GROUND_Y - porchRoofBottom - 2}
                fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
              {/* Post base */}
              <rect x={px - 2} y={GROUND_Y - 6} width={11} height={6} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.5} />
            </g>
          ))}
          {/* Porch railing */}
          <line x1={porchX + 5} y1={GROUND_Y - 22} x2={doorX - 6} y2={GROUND_Y - 22} stroke={PALETTE.trim} strokeWidth={2.5} />
          <line x1={doorX + doorW + 6} y1={GROUND_Y - 22} x2={porchX + porchW - 3} y2={GROUND_Y - 22} stroke={PALETTE.trim} strokeWidth={2.5} />
          {/* Baluster verticals */}
          {Array.from({ length: 5 }).map((_, i) => {
            const bx = porchX + 5 + i * ((doorX - 6 - porchX - 5) / 5);
            return <line key={i} x1={bx} y1={GROUND_Y - 22} x2={bx} y2={GROUND_Y - 2} stroke={PALETTE.trim} strokeWidth={1.5} opacity={0.7} />;
          })}
          {/* Porch deck */}
          <rect x={porchX - 12} y={GROUND_Y - 2} width={porchW + 24} height={8} fill={PALETTE.trim} stroke={PALETTE.trimShadow} strokeWidth={0.75} />
          {/* Deck boards */}
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1={porchX - 12} y1={GROUND_Y + i * 2} x2={porchX + porchW + 12} y2={GROUND_Y + i * 2} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
          ))}
        </g>
      )}

      {/* Front step (no porch) */}
      {!state.hasFrontPorch && (
        <g>
          <rect x={doorX - 8} y={GROUND_Y - 3} width={doorW + 16} height={7} fill={PALETTE.foundation} stroke="rgba(0,0,0,0.25)" strokeWidth={0.5} />
          <rect x={doorX - 6} y={GROUND_Y - 1} width={doorW + 12} height={3} fill={PALETTE.foundationLight} opacity={0.6} />
        </g>
      )}
    </svg>
  );
}
