import type { LotTerrain } from "@/lib/defaults";

// Illustrated Nova Scotia lot scenes — used wherever a lot has no real photo yet.
// Same flat-illustration style as ParametricHouse so the composed scene reads as one image.

const SKY = { top: "#9FB4C4", bottom: "#D8DCD4" };
const GROUND = { back: "#7D8A66", front: "#6B7A55" };
const SPRUCE_FAR = "#4A5E4C";
const SPRUCE_NEAR = "#3A4E3E";
const WATER = "#7C97A8";

function Spruce({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  const w = h * 0.42;
  return (
    <g fill={fill}>
      <polygon points={`${x},${y - h} ${x - w / 2},${y - h * 0.45} ${x + w / 2},${y - h * 0.45}`} />
      <polygon points={`${x},${y - h * 0.78} ${x - w * 0.68},${y - h * 0.18} ${x + w * 0.68},${y - h * 0.18}`} />
      <polygon points={`${x},${y - h * 0.55} ${x - w * 0.85},${y} ${x + w * 0.85},${y}`} />
    </g>
  );
}

function Deciduous({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  return (
    <g>
      <rect x={x - h * 0.04} y={y - h * 0.35} width={h * 0.08} height={h * 0.35} fill="#5A4A38" />
      <circle cx={x} cy={y - h * 0.6} r={h * 0.34} fill={fill} />
      <circle cx={x - h * 0.22} cy={y - h * 0.45} r={h * 0.24} fill={fill} />
      <circle cx={x + h * 0.22} cy={y - h * 0.45} r={h * 0.24} fill={fill} />
    </g>
  );
}

function TreelineFar({ y }: { y: number }) {
  return (
    <g opacity={0.55}>
      {[30, 85, 140, 200, 265, 330, 400, 470, 540, 610, 680, 750].map((x, i) => (
        <Spruce key={x} x={x} y={y} h={26 + ((i * 7) % 12)} fill={SPRUCE_FAR} />
      ))}
    </g>
  );
}

export default function LotBackdrop({ terrain }: { terrain: LotTerrain }) {
  return (
    <svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
      {/* Maritime sky */}
      <defs>
        <linearGradient id={`sky-${terrain}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY.top} />
          <stop offset="100%" stopColor={SKY.bottom} />
        </linearGradient>
        <linearGradient id={`ground-${terrain}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GROUND.back} />
          <stop offset="100%" stopColor={GROUND.front} />
        </linearGradient>
      </defs>
      <rect width="800" height="350" fill={`url(#sky-${terrain})`} />
      {/* Soft cloud bands */}
      <ellipse cx="180" cy="60" rx="120" ry="14" fill="rgba(255,255,255,0.35)" />
      <ellipse cx="560" cy="95" rx="160" ry="16" fill="rgba(255,255,255,0.28)" />

      {terrain === "coastal" ? (
        <>
          {/* Water horizon on the right */}
          <rect x="0" y="195" width="800" height="155" fill={`url(#ground-${terrain})`} />
          <polygon points="430,195 800,195 800,265 470,240" fill={WATER} />
          <line x1="430" y1="195" x2="800" y2="195" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <ellipse cx="640" cy="215" rx="60" ry="2.5" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="720" cy="232" rx="45" ry="2" fill="rgba(255,255,255,0.25)" />
          <TreelineFar y={196} />
          {/* Coastal grasses */}
          {[60, 130, 350, 410].map((x) => (
            <Spruce key={x} x={x} y={206} h={34} fill={SPRUCE_NEAR} />
          ))}
        </>
      ) : terrain === "town" ? (
        <>
          <rect x="0" y="195" width="800" height="155" fill={`url(#ground-${terrain})`} />
          <TreelineFar y={196} />
          {/* Distant neighbourhood rooflines */}
          <g opacity={0.7}>
            {[
              [80, 0], [210, 6], [560, 3], [690, 8],
            ].map(([x, dy]) => (
              <g key={x}>
                <rect x={x} y={172 + dy} width={56} height={24} fill="#8A8478" />
                <polygon points={`${x - 5},${172 + dy} ${x + 61},${172 + dy} ${x + 28},${156 + dy}`} fill="#5C564E" />
              </g>
            ))}
          </g>
          {/* Street-edge trees */}
          <Deciduous x={400} y={210} h={52} fill="#5E7050" />
          <Deciduous x={745} y={216} h={44} fill="#54684A" />
        </>
      ) : terrain === "wooded" ? (
        <>
          <rect x="0" y="195" width="800" height="155" fill={`url(#ground-${terrain})`} />
          <TreelineFar y={196} />
          {/* Dense near spruce framing both sides */}
          {[18, 62, 745, 785].map((x, i) => (
            <Spruce key={x} x={x} y={236 + (i % 2) * 8} h={86 - (i % 2) * 14} fill={SPRUCE_NEAR} />
          ))}
          <Spruce x={120} y={222} h={58} fill={SPRUCE_NEAR} />
          <Spruce x={700} y={226} h={62} fill={SPRUCE_NEAR} />
          <Deciduous x={660} y={214} h={40} fill="#5E7050" />
        </>
      ) : (
        // meadow — open with a few scattered trees
        <>
          <rect x="0" y="195" width="800" height="155" fill={`url(#ground-${terrain})`} />
          <TreelineFar y={196} />
          <Deciduous x={90} y={216} h={50} fill="#5E7050" />
          <Spruce x={730} y={224} h={56} fill={SPRUCE_NEAR} />
          {/* Meadow texture */}
          {[140, 260, 480, 620].map((x, i) => (
            <ellipse key={x} cx={x} cy={250 + i * 18} rx={48} ry={3} fill="rgba(255,255,255,0.07)" />
          ))}
        </>
      )}

      {/* Foreground ground wash for house seating */}
      <rect x="0" y="300" width="800" height="50" fill="rgba(0,0,0,0.08)" />
    </svg>
  );
}
