import { useId } from "react";
import type { ConfiguratorState } from "@/lib/pricing";

// ─── Color maps ──────────────────────────────────────────────────────────────

const WALL_COLOR: Record<string, string> = {
  "builder-white": "#F3EFE9",
  "warm-neutral": "#D8C9A8",
  "premium-custom": "#93A88E",
};

const FLOOR_COLOR: Record<string, string> = {
  lvp: "#C4A07C",
  laminate: "#8A6840",
  hardwood: "#4E2C14",
};

// Subtle lighter plank highlight color for floor grain
const FLOOR_LIGHT: Record<string, string> = {
  lvp: "#D4B08C",
  laminate: "#9A7850",
  hardwood: "#5E3C24",
};

const CABINET_BASE: Record<string, string> = {
  standard: "#EFECE6",
  shaker: "#EFECE6",
  "premium-shaker": "#D4BF8A",
};

const CABINET_FRAME: Record<string, string> = {
  standard: "#D8D4CE",
  shaker: "#BEBAB4",
  "premium-shaker": "#A8904A",
};

const COUNTER_COLOR: Record<string, [string, string]> = {
  laminate: ["#DDD8D0", "#CCCAC0"],
  quartz: ["#F0EDE8", "#E4DDD8"],
};

const HARDWARE_COLOR: Record<string, string> = {
  "brushed-nickel": "#BEBEBA",
  "matte-black": "#2A2A2A",
  "aged-bronze": "#7A5A2C",
};

const LIGHT_INTENSITY: Record<string, number> = {
  standard: 0.65,
  "mid-range": 0.80,
  premium: 0.95,
};

// ─── Cabinet door geometry helpers ───────────────────────────────────────────

interface CabDoorProps {
  x: number; y: number; w: number; h: number;
  style: string;
  base: string; frame: string; hardware: string;
  small?: boolean;
}

function CabDoor({ x, y, w, h, style, base, frame, hardware, small }: CabDoorProps) {
  const handleW = small ? 8 : 12;
  const handleH = small ? 3 : 4;
  const handleX = x + w / 2 - handleW / 2;
  const handleY = y + h - (small ? 8 : 10);

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={base} stroke={frame} strokeWidth={1} rx={0.5} />
      {style === "shaker" && (
        // Inset panel
        <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} fill="none" stroke={frame} strokeWidth={1} rx={0.5} />
      )}
      {style === "premium-shaker" && (
        <>
          <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} fill="none" stroke={frame} strokeWidth={1.5} rx={1} />
          <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} fill="rgba(255,255,255,0.12)" rx={0.5} />
        </>
      )}
      {/* Handle */}
      <rect x={handleX} y={handleY} width={handleW} height={handleH} fill={hardware} rx={1} opacity={0.9} />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RoomVisualizerProps {
  state: ConfiguratorState;
}

export default function RoomVisualizer({ state }: RoomVisualizerProps) {
  const uid = useId().replace(/:/g, "");

  const wallColor = WALL_COLOR[state.paintPackageId] ?? WALL_COLOR["builder-white"];
  const floorColor = FLOOR_COLOR[state.flooringId] ?? FLOOR_COLOR.lvp;
  const floorLight = FLOOR_LIGHT[state.flooringId] ?? FLOOR_LIGHT.lvp;
  const cabBase = CABINET_BASE[state.cabinetStyleId] ?? CABINET_BASE.standard;
  const cabFrame = CABINET_FRAME[state.cabinetStyleId] ?? CABINET_FRAME.standard;
  const [counterA, counterB] = COUNTER_COLOR[state.countertopsId] ?? COUNTER_COLOR.laminate;
  const hardware = HARDWARE_COLOR[state.hardwareFinishId] ?? HARDWARE_COLOR["brushed-nickel"];
  const lightIntensity = LIGHT_INTENSITY[state.lightingPackageId] ?? LIGHT_INTENSITY.standard;
  const cabStyle = state.cabinetStyleId ?? "standard";
  const isPremium = cabStyle === "premium-shaker";

  // Layout constants
  const W = 560; const H = 340;
  const FLOOR_Y = 248;
  const CEILING_Y = 8;
  const UPPER_Y = 22;
  const UPPER_H = 108;
  const COUNTER_Y = 170;
  const COUNTER_H = 13;
  const LOWER_Y = COUNTER_Y + COUNTER_H;
  const LOWER_H = FLOOR_Y - LOWER_Y;

  // Left cabinet bank: x=0..165
  const L_CAB_X = 2;  const L_CAB_W = 163;
  // Right cabinet bank: x=395..558
  const R_CAB_X = 395; const R_CAB_W = 163;
  // Center gap: x=165..395
  const CENTER_X = 165; const CENTER_W = 230;

  // Door widths
  const L_DOOR_W = 75; const R_DOOR_W = 75;
  const CENTER_DOOR_W = CENTER_W - 20;

  // Backsplash height (between counter and upper cabs)
  const BACKSPLASH_Y = UPPER_Y + UPPER_H;
  const BACKSPLASH_H = COUNTER_Y - BACKSPLASH_Y;

  // Lighting glow color based on warmth
  const glowColor = isPremium ? "rgba(255,248,220,1)" : "rgba(255,240,180,0.9)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Interior room preview with your selected finishes"
    >
      <defs>
        {/* Floor plank gradient */}
        <linearGradient id={`${uid}floorGrad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={floorLight} />
          <stop offset="100%" stopColor={floorColor} />
        </linearGradient>

        {/* Ceiling ambient gradient */}
        <linearGradient id={`${uid}ceilingGrad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D0C8BC" />
          <stop offset="100%" stopColor={wallColor} />
        </linearGradient>

        {/* Wall shading — left wall slightly darker */}
        <linearGradient id={`${uid}wallGrad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={wallColor} stopOpacity={0.82} />
          <stop offset="30%" stopColor={wallColor} />
          <stop offset="100%" stopColor={wallColor} />
        </linearGradient>

        {/* Quartz veining pattern */}
        <pattern id={`${uid}quartz`} x="0" y="0" width="80" height="20" patternUnits="userSpaceOnUse">
          <rect width="80" height="20" fill={counterA} />
          <path d="M0,12 Q20,8 40,13 Q60,18 80,12" stroke="rgba(180,170,160,0.4)" strokeWidth="0.8" fill="none" />
          <path d="M0,5 Q30,2 60,7 Q75,9 80,5" stroke="rgba(180,170,160,0.3)" strokeWidth="0.5" fill="none" />
        </pattern>

        {/* Lighting overlay gradient */}
        <radialGradient id={`${uid}lightGlow`} cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor={glowColor} stopOpacity={lightIntensity * 0.28} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>

        {/* Pendant light glow */}
        <radialGradient id={`${uid}pendantGlow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8E0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>

        {/* Floor gloss reflection */}
        <linearGradient id={`${uid}floorGloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.08" />
          <stop offset="40%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Back wall ──────────────────────────────────────────────────────── */}
      <rect x={0} y={CEILING_Y} width={W} height={FLOOR_Y - CEILING_Y} fill={`url(#${uid}wallGrad)`} />

      {/* Ceiling */}
      <rect x={0} y={0} width={W} height={CEILING_Y + 4} fill={`url(#${uid}ceilingGrad)`} />

      {/* Crown moulding shadow */}
      <rect x={0} y={CEILING_Y - 1} width={W} height={4} fill="rgba(0,0,0,0.06)" />

      {/* ── Window ────────────────────────────────────────────────────────── */}
      <g>
        {/* Window frame */}
        <rect x={CENTER_X + 15} y={UPPER_Y + 4} width={CENTER_W - 30} height={UPPER_H + BACKSPLASH_H - 8} fill="#E8F4FC" stroke="#B0B8C0" strokeWidth={2} rx={1} />
        {/* Sky outside */}
        <rect x={CENTER_X + 17} y={UPPER_Y + 6} width={CENTER_W - 34} height={UPPER_H + BACKSPLASH_H - 12} fill="url(#windowSky)" />
        <defs>
          <linearGradient id={`${uid}windowSky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8D8F0" />
            <stop offset="60%" stopColor="#D8EEF8" />
            <stop offset="100%" stopColor="#E8F4E0" />
          </linearGradient>
        </defs>
        <rect x={CENTER_X + 17} y={UPPER_Y + 6} width={CENTER_W - 34} height={UPPER_H + BACKSPLASH_H - 12} fill={`url(#${uid}windowSky)`} />
        {/* Window sash crossbars */}
        <line x1={CENTER_X + 15} y1={UPPER_Y + UPPER_H / 2 + 4} x2={CENTER_X + CENTER_W - 15} y2={UPPER_Y + UPPER_H / 2 + 4} stroke="#B0B8C0" strokeWidth={1.5} />
        <line x1={CENTER_X + W / 2 - CENTER_X / 2 - 5} y1={UPPER_Y + 4} x2={CENTER_X + W / 2 - CENTER_X / 2 - 5} y2={UPPER_Y + UPPER_H + BACKSPLASH_H - 8} stroke="#B0B8C0" strokeWidth={1.5} />
        {/* Glass highlight */}
        <rect x={CENTER_X + 19} y={UPPER_Y + 8} width={30} height={UPPER_H - 16} fill="rgba(255,255,255,0.18)" rx={1} />
      </g>

      {/* ── Left upper cabinets ────────────────────────────────────────────── */}
      {/* Cabinet box */}
      <rect x={L_CAB_X} y={UPPER_Y} width={L_CAB_W} height={UPPER_H} fill={cabBase} stroke={cabFrame} strokeWidth={1} />
      {/* Two doors */}
      <CabDoor x={L_CAB_X + 3} y={UPPER_Y + 3} w={L_DOOR_W - 3} h={UPPER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} small />
      <CabDoor x={L_CAB_X + L_DOOR_W + 4} y={UPPER_Y + 3} w={L_CAB_W - L_DOOR_W - 8} h={UPPER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} small />
      {/* Cabinet soffit shadow */}
      <rect x={L_CAB_X} y={UPPER_Y} width={L_CAB_W} height={3} fill="rgba(0,0,0,0.08)" />

      {/* ── Right upper cabinets ───────────────────────────────────────────── */}
      <rect x={R_CAB_X} y={UPPER_Y} width={R_CAB_W} height={UPPER_H} fill={cabBase} stroke={cabFrame} strokeWidth={1} />
      <CabDoor x={R_CAB_X + 3} y={UPPER_Y + 3} w={R_DOOR_W - 3} h={UPPER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} small />
      <CabDoor x={R_CAB_X + R_DOOR_W + 4} y={UPPER_Y + 3} w={R_CAB_W - R_DOOR_W - 8} h={UPPER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} small />
      <rect x={R_CAB_X} y={UPPER_Y} width={R_CAB_W} height={3} fill="rgba(0,0,0,0.08)" />

      {/* ── Backsplash tiles (between upper cabs and counter) ─────────────── */}
      {/* Left */}
      <rect x={L_CAB_X} y={BACKSPLASH_Y} width={L_CAB_W} height={BACKSPLASH_H} fill={isPremium ? "#E0D8C8" : "#E8E4DE"} />
      <g stroke="rgba(0,0,0,0.08)" strokeWidth={0.5}>
        {Array.from({ length: Math.ceil(BACKSPLASH_H / 14) }).map((_, i) => (
          <line key={i} x1={L_CAB_X} y1={BACKSPLASH_Y + i * 14} x2={L_CAB_X + L_CAB_W} y2={BACKSPLASH_Y + i * 14} />
        ))}
        {Array.from({ length: Math.ceil(L_CAB_W / 28) }).map((_, i) => (
          <line key={i} x1={L_CAB_X + i * 28} y1={BACKSPLASH_Y} x2={L_CAB_X + i * 28} y2={BACKSPLASH_Y + BACKSPLASH_H} />
        ))}
      </g>
      {/* Right */}
      <rect x={R_CAB_X} y={BACKSPLASH_Y} width={R_CAB_W} height={BACKSPLASH_H} fill={isPremium ? "#E0D8C8" : "#E8E4DE"} />
      <g stroke="rgba(0,0,0,0.08)" strokeWidth={0.5}>
        {Array.from({ length: Math.ceil(BACKSPLASH_H / 14) }).map((_, i) => (
          <line key={i} x1={R_CAB_X} y1={BACKSPLASH_Y + i * 14} x2={R_CAB_X + R_CAB_W} y2={BACKSPLASH_Y + i * 14} />
        ))}
        {Array.from({ length: Math.ceil(R_CAB_W / 28) }).map((_, i) => (
          <line key={i} x1={R_CAB_X + i * 28} y1={BACKSPLASH_Y} x2={R_CAB_X + i * 28} y2={BACKSPLASH_Y + BACKSPLASH_H} />
        ))}
      </g>

      {/* ── Countertop left ────────────────────────────────────────────────── */}
      <rect
        x={L_CAB_X} y={COUNTER_Y} width={L_CAB_W + 4} height={COUNTER_H}
        fill={state.countertopsId === "quartz" ? `url(#${uid}quartz)` : counterA}
        stroke={counterB} strokeWidth={0.5}
      />
      {/* Counter edge shadow */}
      <rect x={L_CAB_X} y={COUNTER_Y + COUNTER_H - 2} width={L_CAB_W + 4} height={3} fill="rgba(0,0,0,0.10)" />

      {/* ── Countertop right ───────────────────────────────────────────────── */}
      <rect
        x={R_CAB_X - 4} y={COUNTER_Y} width={R_CAB_W + 4} height={COUNTER_H}
        fill={state.countertopsId === "quartz" ? `url(#${uid}quartz)` : counterA}
        stroke={counterB} strokeWidth={0.5}
      />
      <rect x={R_CAB_X - 4} y={COUNTER_Y + COUNTER_H - 2} width={R_CAB_W + 4} height={3} fill="rgba(0,0,0,0.10)" />

      {/* ── Left lower cabinets ────────────────────────────────────────────── */}
      <rect x={L_CAB_X} y={LOWER_Y} width={L_CAB_W} height={LOWER_H} fill={cabBase} stroke={cabFrame} strokeWidth={1} />
      <CabDoor x={L_CAB_X + 3} y={LOWER_Y + 3} w={L_DOOR_W - 3} h={LOWER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} />
      <CabDoor x={L_CAB_X + L_DOOR_W + 4} y={LOWER_Y + 3} w={L_CAB_W - L_DOOR_W - 8} h={LOWER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} />

      {/* ── Right lower cabinets ───────────────────────────────────────────── */}
      <rect x={R_CAB_X} y={LOWER_Y} width={R_CAB_W} height={LOWER_H} fill={cabBase} stroke={cabFrame} strokeWidth={1} />
      <CabDoor x={R_CAB_X + 3} y={LOWER_Y + 3} w={R_DOOR_W - 3} h={LOWER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} />
      <CabDoor x={R_CAB_X + R_DOOR_W + 4} y={LOWER_Y + 3} w={R_CAB_W - R_DOOR_W - 8} h={LOWER_H - 6} style={cabStyle} base={cabBase} frame={cabFrame} hardware={hardware} />

      {/* ── Centre stove / range ───────────────────────────────────────────── */}
      {/* Stove body */}
      <rect x={CENTER_X + 40} y={LOWER_Y} width={CENTER_W - 80} height={LOWER_H} fill="#4A4A4A" stroke="#383838" strokeWidth={1} />
      {/* Burners */}
      {[[205, 210], [255, 210], [205, 232], [255, 232]].map(([bx, by], i) => (
        <ellipse key={i} cx={bx} cy={by} rx={14} ry={5} fill="#2A2A2A" stroke="#555" strokeWidth={0.5} />
      ))}
      {/* Stove knobs */}
      {[CENTER_X + 56, CENTER_X + 76, CENTER_X + 96, CENTER_X + 116].map((kx, i) => (
        <circle key={i} cx={kx} cy={LOWER_Y + 14} r={5} fill="#666" stroke="#888" strokeWidth={0.5} />
      ))}
      {/* Oven window */}
      <rect x={CENTER_X + 50} y={LOWER_Y + 28} width={CENTER_W - 100} height={30} fill="#1A1A1A" stroke="#444" strokeWidth={1} rx={1} />
      <rect x={CENTER_X + 53} y={LOWER_Y + 31} width={40} height={6} fill="rgba(255,255,255,0.05)" rx={0.5} />

      {/* ── Range hood above stove ─────────────────────────────────────────── */}
      <rect x={CENTER_X + 50} y={UPPER_Y + UPPER_H - 8} width={CENTER_W - 100} height={BACKSPLASH_H + 8} fill="#5A5A5A" stroke="#484848" strokeWidth={0.5} />
      <rect x={CENTER_X + 53} y={UPPER_Y + UPPER_H - 4} width={CENTER_W - 106} height={4} fill="#666" rx={0.5} />

      {/* ── Fireplace on right if selected ────────────────────────────────── */}
      {state.hasFireplace && (
        <g>
          {/* Fireplace surround */}
          <rect x={R_CAB_X + R_CAB_W + 2} y={LOWER_Y - 4} width={W - (R_CAB_X + R_CAB_W + 2)} height={LOWER_H + 4} fill={isPremium ? "#2A201A" : "#1E1A18"} stroke="#3A3028" strokeWidth={1} />
          {/* Glass front */}
          <rect x={R_CAB_X + R_CAB_W + 8} y={LOWER_Y + 4} width={W - (R_CAB_X + R_CAB_W + 16)} height={LOWER_H - 12} fill="#0A0808" rx={1} />
          {/* Flames */}
          <ellipse cx={W - 24} cy={FLOOR_Y - 10} rx={14} ry={6} fill="#FF5010" opacity={0.85} />
          <ellipse cx={W - 32} cy={FLOOR_Y - 18} rx={8} ry={12} fill="#FF7020" opacity={0.75} />
          <ellipse cx={W - 18} cy={FLOOR_Y - 22} rx={6} ry={14} fill="#FFA040" opacity={0.7} />
          <ellipse cx={W - 24} cy={FLOOR_Y - 28} rx={7} ry={10} fill="#FFD060" opacity={0.6} />
          {/* Glow */}
          <radialGradient id={`${uid}fireGlow`} cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#FF8030" stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <rect x={R_CAB_X + R_CAB_W + 2} y={LOWER_Y - 30} width={W - (R_CAB_X + R_CAB_W + 2)} height={LOWER_H + 34} fill={`url(#${uid}fireGlow)`} />
        </g>
      )}

      {/* ── Floor ─────────────────────────────────────────────────────────── */}
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={`url(#${uid}floorGrad)`} />
      {/* Floor plank lines */}
      <g stroke={`rgba(0,0,0,0.12)`} strokeWidth={0.8}>
        {Array.from({ length: Math.ceil((H - FLOOR_Y) / 18) }).map((_, i) => (
          <line key={i} x1={0} y1={FLOOR_Y + i * 18} x2={W} y2={FLOOR_Y + i * 18} />
        ))}
        {Array.from({ length: Math.ceil(W / 90) + 1 }).map((_, i) => (
          <line key={i} x1={i * 90} y1={FLOOR_Y} x2={i * 90 + (i % 2 === 0 ? 0 : 45)} y2={H} />
        ))}
      </g>
      {/* Floor gloss */}
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={`url(#${uid}floorGloss)`} />
      {/* Baseboard */}
      <rect x={0} y={FLOOR_Y - 8} width={W} height={8} fill={isPremium ? "#E8DCBC" : "#F0EAE0"} stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />

      {/* ── Lighting overlay ───────────────────────────────────────────────── */}
      <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}lightGlow)`} />

      {/* Ceiling fixture */}
      {state.lightingPackageId === "standard" ? (
        // Flush mount
        <g>
          <ellipse cx={W / 2} cy={CEILING_Y + 2} rx={30} ry={5} fill="#D8D0C8" stroke="#C0B8B0" strokeWidth={0.5} />
          <ellipse cx={W / 2} cy={CEILING_Y + 2} rx={20} ry={3} fill="#E8E0D8" />
        </g>
      ) : state.lightingPackageId === "mid-range" ? (
        // Pendant light
        <g>
          <line x1={W / 2} y1={CEILING_Y} x2={W / 2} y2={CEILING_Y + 22} stroke="#888" strokeWidth={1} />
          <ellipse cx={W / 2} cy={CEILING_Y + 28} rx={18} ry={10} fill="#D0C8B8" stroke="#B0A898" strokeWidth={1} />
          <ellipse cx={W / 2} cy={CEILING_Y + 30} rx={14} ry={6} fill={`url(#${uid}pendantGlow)`} />
          {/* Side pendants */}
          {[-120, 120].map((dx) => (
            <g key={dx}>
              <line x1={W / 2 + dx} y1={CEILING_Y} x2={W / 2 + dx} y2={CEILING_Y + 18} stroke="#888" strokeWidth={1} />
              <ellipse cx={W / 2 + dx} cy={CEILING_Y + 23} rx={12} ry={7} fill="#D0C8B8" stroke="#B0A898" strokeWidth={1} />
            </g>
          ))}
        </g>
      ) : (
        // Premium: recessed pot lights + pendants
        <g>
          {[-180, -90, 0, 90, 180].map((dx) => (
            <g key={dx}>
              <circle cx={W / 2 + dx} cy={CEILING_Y + 2} r={6} fill="#E8E0D0" stroke="#C8C0B0" strokeWidth={0.5} />
              <circle cx={W / 2 + dx} cy={CEILING_Y + 2} r={4} fill="#FFF8E8" />
              <radialGradient id={`${uid}pot${dx}`} cx="50%" cy="100%" r="80%">
                <stop offset="0%" stopColor="#FFF8E0" stopOpacity={`${lightIntensity * 0.4}`} />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <ellipse cx={W / 2 + dx} cy={CEILING_Y + 2} rx={40} ry={60} fill={`url(#${uid}pot${dx})`} />
            </g>
          ))}
          {/* Statement pendant over center */}
          <line x1={W / 2} y1={CEILING_Y} x2={W / 2} y2={CEILING_Y + 30} stroke="#707060" strokeWidth={1.5} />
          <ellipse cx={W / 2} cy={CEILING_Y + 36} rx={22} ry={12} fill={isPremium ? "#C8B070" : "#C0C0B8"} stroke="#A0A090" strokeWidth={1} />
          <ellipse cx={W / 2} cy={CEILING_Y + 38} rx={16} ry={7} fill={`url(#${uid}pendantGlow)`} />
        </g>
      )}

      {/* Interior trim at wall-floor junction */}
      {state.interiorTrimId === "craftsman" && (
        <>
          <rect x={0} y={FLOOR_Y - 14} width={W} height={6} fill="#EEEAE2" stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />
        </>
      )}
      {state.interiorTrimId === "colonial" && (
        <>
          <rect x={0} y={FLOOR_Y - 10} width={W} height={2} fill="rgba(0,0,0,0.06)" />
          <rect x={0} y={FLOOR_Y - 12} width={W} height={4} fill="#F0ECE4" stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />
        </>
      )}

      {/* ── Room label ─────────────────────────────────────────────────────── */}
      <text
        x={W / 2} y={H - 6}
        textAnchor="middle" fontSize={9} fill="rgba(0,0,0,0.25)"
        fontFamily="system-ui, sans-serif"
      >
        Interior preview · selections update live
      </text>
    </svg>
  );
}
