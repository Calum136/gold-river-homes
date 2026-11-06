import * as THREE from "three";
import type { ConfiguratorState } from "@/lib/pricing";
import { lotOptions } from "@/lib/defaults";
import type { LotTerrain } from "@/lib/defaults";
import { Builder } from "./builder";
import type { Materials } from "./materials";
import { PLAN, gradeFor } from "./plan";
import { FT, P, wx, wz } from "./space";

// ============================================
// The lot around the house and everything below ground or inside the walls:
// the foundation, the well or water line, the septic system or sewer line,
// and the insulation cutaway. The buyer sees the ground turn see-through on
// those screens, so these choices change the picture too.
// ============================================

/**
 * The modelled yard: an oval about 10 ft clear of the house all round, with
 * room at the front for the steps, garden and walk. Plan feet. A scenery ring
 * stands at its edge (engine.ts), so there's no field or road beyond it.
 */
export const LOT = { cx: 37, cy: 12, a: 52, b: 31 } as const;

/** Where the yard's edge is along x, on the front (-1) or back (+1) side. */
export function lotEdgeY(x: number, side: -1 | 1): number {
  const k = 1 - ((x - LOT.cx) / LOT.a) ** 2;
  return LOT.cy + side * LOT.b * Math.sqrt(Math.max(0, k));
}

export function terrainFor(state: ConfiguratorState): LotTerrain {
  if (state.landSituation === "gold-river") {
    return lotOptions.find((l) => l.id === state.selectedLotId)?.terrain ?? "meadow";
  }
  return "meadow";
}

/** The yard: lawn out to the scenery ring and a paver walk from the steps to its edge. */
export function buildLot(state: ConfiguratorState, m: Materials): THREE.Group {
  const GRADE = gradeFor(state.foundationType);
  const b = new Builder();
  // Lawn: an oval disc (a unit circle stretched to the yard's shape).
  const lawn = new THREE.CircleGeometry(1, 96);
  b.shape("grass", lawn, { x: LOT.cx, y: LOT.cy, h: GRADE }, { rotX: -Math.PI / 2, scale: [LOT.a, LOT.b, 1], worldUV: true });
  // Paver walk from the front steps straight out to the edge of the yard
  const walkEnd = lotEdgeY(43.6, -1) + 0.6;
  b.box(41.6, 45.6, walkEnd, -7.5, GRADE, GRADE + 0.07, "paving");
  // Garden beds and planting along the front are drawn in landscape.ts.
  const group = b.build(m, null, "lot");
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && (o as THREE.Mesh).material === m.grass) {
      (o as THREE.Mesh).castShadow = false;
      o.renderOrder = -1;
    }
  });
  return group;
}

export interface PropPlacement {
  model: string;
  x: number;
  y: number;
  h: number;
  rotY?: number;
  scale: number | [number, number, number];
  /** Shown only for these terrains (lot props). */
  terrains?: LotTerrain[];
  /** Hides the drawn stand-in of this name once the model has loaded. */
  replaces?: string;
}

/**
 * Places a tree can't stand: on or beside the house, over the well or the
 * septic tank and leach field (roots and pipes don't mix), or in the Back
 * view's line of sight behind the living room.
 */
function treeBlocked(x: number, y: number): boolean {
  const m = 4; // clearance for the crown
  const L = PLAN.living;
  if (x > -m && x < PLAN.length + m && y > -m && y < PLAN.width + m) return true;
  if (x > L.x0 - m && x < L.x1 + m && y < L.y1 + m) return true;
  if (Math.hypot(x + 6, y - 4) < 6) return true; // well
  if (Math.hypot(x - 82, y - 6) < 7) return true; // septic tank
  if (x > 52 && x < 76 && y > 17 && y < 35) return true; // leach field
  return x > 20 && x < 55 && y > 30; // behind the living room
}

/** Trees, shrubs and rocks around the lot, by terrain. Positions in plan feet. */
export function lotProps(state: ConfiguratorState): PropPlacement[] {
  const GRADE = gradeFor(state.foundationType);
  const terrain = terrainFor(state);
  const out: PropPlacement[] = [];
  const rnd = (() => {
    let s = 7;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  })();
  // A few trees just inside the scenery ring, off the two ends of the house
  // and round toward its back corners. They frame the house: the front, and
  // the Back view behind the living room, stay open to the camera.
  const trees = terrain === "wooded" ? 11 : terrain === "meadow" ? 5 : terrain === "coastal" ? 3 : 4;
  const onRight = Math.ceil(trees / 2);
  for (let i = 0; i < trees; i++) {
    const right = i < onRight;
    const u = ((right ? i : i - onRight) + 0.5) / (right ? onRight : trees - onRight);
    // Right arc from behind the septic tank toward the back corner (the leach
    // field takes the rest); left arc from the well round to the back corner.
    const a = (right ? 0.12 + 0.4 * u : Math.PI + 0.15 - 0.95 * u) + (rnd() - 0.5) * 0.12;
    const k = 0.84 + rnd() * 0.08;
    const x = LOT.cx + Math.cos(a) * LOT.a * k;
    const y = LOT.cy + Math.sin(a) * LOT.b * k;
    const rotY = rnd() * 6.28;
    const scale = 4.2 + rnd() * 2.2;
    if (treeBlocked(x, y)) continue;
    out.push({ model: "pine", x, y, h: GRADE, rotY, scale });
  }
  // Foundation shrubs in the beds
  // Shrubs and flowers by the house are drawn in code (landscape.ts).
  return out;
}

/** Loaded furniture, replacing the drawn stand-ins of the same name. */
export const FURNITURE_PROPS: PropPlacement[] = [
  { model: "sofa", x: 43.55, y: 23.8, h: 0, rotY: -Math.PI / 2, scale: 1.18, replaces: "sofa" },
  { model: "armchair", x: 33.5, y: 20.2, h: 0, rotY: 2.32, scale: 0.92, replaces: "armchairs" },
  { model: "armchair", x: 33.5, y: 27.4, h: 0, rotY: 0.82, scale: 0.92, replaces: "armchairs" },
  { model: "coffee_table", x: 37.7, y: 23.8, h: 0, scale: 0.85, replaces: "coffee" },
  { model: "side_table", x: 43.6, y: 19.2, h: 0, scale: 1 },
  { model: "plant", x: 37.4, y: 23.6, h: 1.62, scale: 1.6 },
  { model: "plant", x: 43.6, y: 19.2, h: 1.48, scale: 1.4 },
  { model: "stool", x: 30.4, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "stool", x: 32.3, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "stool", x: 34.2, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "stool", x: 36.1, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "plant", x: 37.6, y: 8.6, h: 3.0, scale: 1.3 },
];

// ---------- Foundation (below the floor) ----------

export function buildFoundation(state: ConfiguratorState, m: Materials, ink: THREE.Material): THREE.Group {
  const GRADE = gradeFor(state.foundationType);
  const b = new Builder();
  const front = new Builder();
  const L = PLAN.living;
  const rects: [number, number, number, number][] = [
    [0, 74, 0, 16],
    [L.x0, L.x1, 16, L.y1],
  ];
  const ring = (x0: number, x1: number, y0: number, y1: number, t: number, h0: number, h1: number, slot: "concrete" | "skirting") => {
    b.box(x0, x1, y0, y0 + t, h0, h1, slot, { edges: true });
    b.box(x0, x1, y1 - t, y1, h0, h1, slot, { edges: true });
    b.box(x0, x0 + t, y0 + t, y1 - t, h0, h1, slot, { edges: true });
    b.box(x1 - t, x1, y0 + t, y1 - t, h0, h1, slot, { edges: true });
  };

  if (state.foundationType === "basement") {
    // Full basement: 8" poured walls on a footing, a slab floor 8' below grade.
    // Above grade the concrete shows, with small basement windows in wells.
    const floor = GRADE - 7.5;
    for (const [x0, x1, y0, y1] of rects) {
      ring(x0, x1, y0, y1, 0.67, floor, -1, "concrete");
      ring(x0 - 0.5, x1 + 0.5, y0 - 0.5, y1 + 0.5, 0.67, floor - 0.8, floor, "concrete");
      b.box(x0 + 0.67, x1 - 0.67, y0 + 0.67, y1 - 0.67, floor - 0.33, floor, "concrete");
    }
    // Basement windows on the front, in corrugated wells
    for (const x of [12, 30, 56, 66]) {
      b.box(x - 1.3, x + 1.3, -0.02, 0.02, GRADE - 1.4, -1.15, "windowFrame");
      b.box(x - 1.15, x + 1.15, -0.03, 0.0, GRADE - 1.25, -1.3, "glass");
      b.box(x - 1.8, x + 1.8, -2.4, -2.3, GRADE - 2.0, GRADE + 0.4, "steelPipe");
      b.box(x - 1.8, x - 1.7, -2.4, 0, GRADE - 2.0, GRADE + 0.4, "steelPipe");
      b.box(x + 1.7, x + 1.8, -2.4, 0, GRADE - 2.0, GRADE + 0.4, "steelPipe");
      b.box(x - 1.7, x + 1.7, -2.3, 0, GRADE - 2.0, GRADE - 1.9, "drainRock");
    }
    // Stairs down inside, under the hall. To check with Matt: whether the Bali
    // offers a basement at all, and where Supreme puts its stairs (Calum, Nov 2026).
    for (let i = 0; i < 12; i++) b.box(47.0, 50.0, 13.0 - i * 0.85, 13.85 - i * 0.85, -1 - (i + 1) * 0.68, -1 - i * 0.68, "wood");
  } else if (state.foundationType === "slab") {
    // Slab on grade with thickened edges; skirting closes in the floor system.
    for (const [x0, x1, y0, y1] of rects) {
      b.box(x0, x1, y0, y1, GRADE - 0.5, GRADE + 0.15, "concrete", { edges: true });
      ring(x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, 1.2, GRADE - 2.0, GRADE - 0.5, "concrete");
      // Frost-protected insulation wings
      b.box(x0 - 3, x1 + 3, y0 - 3, y0 - 0.1, GRADE - 1.2, GRADE - 1.0, "insBoard");
      b.box(x0 - 3, x1 + 3, y1 + 0.1, y1 + 3, GRADE - 1.2, GRADE - 1.0, "insBoard");
      ring(x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, 0.08, GRADE + 0.15, -1, "skirting");
    }
  } else {
    // Crawlspace: the house stands on a short concrete wall that lifts its
    // floor about three feet off the ground, with vents along it. Inside,
    // piers carry the middle of the floor over a vapour barrier. Shallow
    // footings with frost-protection insulation keep it a crawlspace, not a
    // basement. The road-facing wall is built on its own so the see-through
    // view can open it and show the space under the house.
    const t = 0.67;
    for (const [x0, x1, y0, y1] of rects) {
      if (y0 === 0) front.box(x0, x1, y0, y0 + t, GRADE - 1.5, -1, "concrete", { edges: true });
      else b.box(x0, x1, y0, y0 + t, GRADE - 1.5, -1, "concrete", { edges: true });
      b.box(x0, x1, y1 - t, y1, GRADE - 1.5, -1, "concrete", { edges: true });
      b.box(x0, x0 + t, y0 + t, y1 - t, GRADE - 1.5, -1, "concrete", { edges: true });
      b.box(x1 - t, x1, y0 + t, y1 - t, GRADE - 1.5, -1, "concrete", { edges: true });
      ring(x0 - 0.4, x1 + 0.4, y0 - 0.4, y1 + 0.4, 1.4, GRADE - 2.2, GRADE - 1.5, "concrete");
      b.box(x0 - 3, x1 + 3, y0 - 3, y0 - 0.4, GRADE - 1.3, GRADE - 1.1, "insBoard");
      b.box(x0 - 3, x1 + 3, y1 + 0.4, y1 + 3, GRADE - 1.3, GRADE - 1.1, "insBoard");
      b.box(x0 + t, x1 - t, y0 + t, y1 - t, GRADE + 0.02, GRADE + 0.05, "vapour");
      // Underside of the insulated floor, seen from the crawlspace
      b.box(x0 + t, x1 - t, y0 + t, y1 - t, -1.0, -0.96, { ny: "osb" });
    }
    for (let x = 8; x < 70; x += 8) {
      b.box(x - 0.5, x + 0.5, 7.5, 8.5, GRADE, -1.0, "concrete", { edges: true });
      b.box(x - 1, x + 1, 7, 9, GRADE - 1.2, GRADE, "concrete");
    }
    // Foundation vents along the front
    for (const x of [6, 18, 30, 52, 62, 70]) front.box(x - 0.7, x + 0.7, -0.04, 0, GRADE + 0.7, GRADE + 1.3, "blackGlass");
  }
  const group = b.build(m, ink, "foundation");
  const frontWall = front.build(m, ink, "foundation-front");
  if (frontWall.children.length) group.add(frontWall);
  return group;
}

// ---------- Water and wastewater ----------

function pipe(b: Builder, slot: "pipeWater" | "pipeSewer" | "steelPipe", pts: [number, number, number][], r = 0.18) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = P(...pts[i]);
    const c = P(...pts[i + 1]);
    const len = a.distanceTo(c);
    const g = new THREE.CylinderGeometry(r * FT, r * FT, len, 10);
    g.translate(0, len / 2, 0);
    const dir = c.clone().sub(a).normalize();
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
    g.translate(a.x, a.y, a.z);
    b.add(slot, g);
  }
}

export function buildUtilities(state: ConfiguratorState, m: Materials, ink: THREE.Material): THREE.Group {
  const GRADE = gradeFor(state.foundationType);
  const b = new Builder();
  const frost = GRADE - 5.5;

  // Everything sits inside the modelled yard. Distances are shortened from a
  // real lot to fit; the parts and how they connect are what this shows.

  // Water supply
  if (state.waterType === "municipal") {
    // A line out to the street main beyond the front of the yard, with a curb stop.
    const edge = lotEdgeY(8, -1);
    pipe(b, "pipeWater", [[-6, edge + 0.4, frost - 1], [22, edge + 0.4, frost - 1]], 0.45);
    pipe(b, "pipeWater", [[8, edge + 0.4, frost - 1], [8, edge + 3, frost], [8, 1.5, frost], [8, 1.5, -1.2]]);
    b.shape("lid", new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), { x: 8, y: edge + 3, h: GRADE + 0.1 });
  } else if (state.waterType === "drilled" || state.waterType === "dug") {
    // The well stands off the left end of the house.
    const wx0 = -6;
    const wy0 = 4;
    if (state.waterType === "drilled") {
      // A 6" steel casing standing 18" above grade, running down into bedrock
      // (real wells go 100 to 250 ft; shown to the depth of the yard's soil base).
      pipe(b, "steelPipe", [[wx0, wy0, GRADE - 19.5], [wx0, wy0, GRADE + 1.5]], 0.3);
      b.shape("steelPipe", new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16), { x: wx0, y: wy0, h: GRADE + 1.6 });
      b.box(wx0 - 1.6, wx0 + 1.6, wy0 - 0.2, wy0 + 0.2, GRADE - 19.5, GRADE - 11, "drainRock");
    } else {
      // A dug well: 3' concrete crock rings with a lid, about 20' deep.
      for (let i = 0; i < 8; i++) {
        b.shape("concrete", new THREE.CylinderGeometry(1.75, 1.75, 2.4, 28, 1, true), { x: wx0, y: wy0, h: GRADE + 1.4 - i * 2.5 }, { edges: i === 0 });
      }
      b.shape("concrete", new THREE.CylinderGeometry(1.95, 1.95, 0.35, 28), { x: wx0, y: wy0, h: GRADE + 2.75 }, { edges: true });
    }
    pipe(b, "pipeWater", [[wx0, wy0, frost], [0.6, wy0, frost], [0.6, wy0, -1.2]]);
  }

  // Wastewater
  if (state.sewerType === "municipal") {
    // A lateral out to the street sewer beyond the front of the yard, with a cleanout.
    const edge = lotEdgeY(60, -1);
    pipe(b, "pipeSewer", [[46, edge + 0.4, frost - 3], [74, edge + 0.4, frost - 3]], 0.6);
    pipe(b, "pipeSewer", [[60, 1.5, -1.2], [60, 1.5, frost + 1], [60, edge + 0.4, frost - 3]], 0.25);
    b.shape("pipeSewer", new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12), { x: 60, y: -6, h: GRADE + 0.15 });
  } else if (state.sewerType === "septic") {
    // Septic tank off the right end of the house with two access lids, a
    // distribution box behind the house, and a leach field of perforated pipe
    // in drain-rock trenches.
    const tx = 82;
    const ty = 6;
    pipe(b, "pipeSewer", [[73.6, ty, -1.2], [73.6, ty, GRADE - 4.0], [tx - 3.2, ty, GRADE - 4.4]], 0.25);
    b.box(tx - 3, tx + 3, ty - 4, ty + 4, GRADE - 9, GRADE - 3.5, "concrete", { edges: true });
    for (const ly of [ty - 2.4, ty + 2.4]) b.shape("lid", new THREE.CylinderGeometry(0.9, 0.9, 3.7, 20), { x: tx, y: ly, h: GRADE - 1.8 });
    const dx = 66;
    const dy = 19.5;
    pipe(b, "pipeSewer", [[tx, ty + 4, GRADE - 4.6], [tx, dy, GRADE - 4.7], [dx + 1.2, dy, GRADE - 4.8]], 0.25);
    b.box(dx - 1.2, dx + 1.2, dy - 1, dy + 1, GRADE - 5.6, GRADE - 4.2, "concrete", { edges: true });
    for (let i = 0; i < 4; i++) {
      const lx = 56.5 + i * 5;
      pipe(b, "pipeSewer", [[dx, dy + 1, GRADE - 4.9], [lx, 21.5, GRADE - 3.2]], 0.2);
      b.box(lx - 1.0, lx + 1.0, 21.5, 31, GRADE - 4.2, GRADE - 2.3, "drainRock", { edges: true });
      pipe(b, "pipeSewer", [[lx, 21.5, GRADE - 3.2], [lx, 31, GRADE - 3.3]], 0.2);
    }
    // The field reads on the surface as a low rise in the lawn behind the house.
    b.shape("grass", new THREE.SphereGeometry(1, 48, 10, 0, Math.PI * 2, 0, Math.PI / 2), { x: 64, y: 26.5, h: GRADE - 0.25 }, { scale: [11, 0.6, 6.5], worldUV: true });
  }
  return b.build(m, ink, "utilities");
}

// ---------- Insulation cutaway, in the front wall of Bedroom 3 ----------

/**
 * The wall region opened up to show the insulation, in plan feet: the front
 * wall right of the Bedroom 3 window, clear of every entry option.
 */
export const CUTAWAY = { x0: 68.9, x1: 73.1, h0: 0.5, h1: 7.5 } as const;

/**
 * Clipping planes that remove the wall inside the cutaway box. Used with
 * clipIntersection = true: a fragment is cut only when it is on the negative
 * side of every plane, that is, inside the box.
 */
export function cutawayPlanes(): THREE.Plane[] {
  const c = CUTAWAY;
  const y0 = P(0, 0, c.h0).y;
  const y1 = P(0, 0, c.h1).y;
  const zIn = wz(0.62);
  const zOut = wz(-1.2);
  return [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), wx(c.x0)),
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -wx(c.x1)),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), y0),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -y1),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), zIn),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), -zOut),
  ];
}

export function buildCutaway(state: ConfiguratorState, m: Materials): THREE.Group {
  const b = new Builder();
  const { x0, x1, h0, h1 } = CUTAWAY;
  const cavity0 = 0.0; // outside face of the studs (behind the sheathing)
  const cavity1 = 0.458; // 2x6 studs
  // Drywall on the inside, the whole opening
  b.box(x0, x1, cavity1, 0.5, h0, h1, "wall", { edges: true });
  b.box(x0, x1, cavity1 - 0.01, cavity1, h0, h1, "vapour");
  // Studs at 16" centres, with plates
  const studs: number[] = [];
  for (let x = x0 + 0.3; x < x1 - 0.1; x += 16 / 12) studs.push(x);
  for (const x of studs) b.box(x, x + 0.125, cavity0, cavity1, h0, h1, "stud", { edges: true });
  b.box(x0, x1, cavity0, cavity1, h0, h0 + 0.125, "stud");
  b.box(x0, x1, cavity0, cavity1, h1 - 0.25, h1, "stud");
  // Insulation fills each bay between the studs
  const ins = state.insulationId;
  const edges = [x0, ...studs.flatMap((x) => [x, x + 0.125]), x1];
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i] + 0.005;
    const z = edges[i + 1] - 0.005;
    if (z - a < 0.05) continue;
    if (ins === "premium") {
      // Closed-cell spray foam against the sheathing, batts behind it
      b.box(a, z, cavity0, 0.2, h0 + 0.125, h1 - 0.25, "insFoam", { edges: true });
      b.box(a, z, 0.2, cavity1 - 0.02, h0 + 0.125, h1 - 0.25, "insBatt");
    } else {
      b.box(a, z, cavity0 + 0.03, cavity1 - 0.02, h0 + 0.125, h1 - 0.25, "insBatt", { edges: true });
    }
  }
  // Layers outside, each cut back further so all of them show: the open
  // cavity takes most of the width, then sheathing, rigid foam (enhanced),
  // house wrap and the siding step in from the right.
  const w = x1 - x0;
  b.box(x0 + w * 0.52, x1, -0.04, cavity0, h0, h1, "osb", { edges: true });
  let outer = -0.04;
  if (ins === "enhanced") {
    b.box(x0 + w * 0.64, x1, -0.17, -0.04, h0, h1, "insBoard", { edges: true });
    outer = -0.17;
  }
  b.box(x0 + w * 0.76, x1, outer - 0.01, outer, h0, h1, "wrap");
  b.box(x0 + w * 0.88, x1, outer - 0.08, outer - 0.01, h0, h1, "siding", { edges: true });
  // A thin frame around the cut so it reads as a deliberate section.
  b.box(x0 - 0.03, x0, -0.3, 0.5, h0, h1, "trimExt");
  b.box(x1, x1 + 0.03, -0.3, 0.5, h0, h1, "trimExt");
  b.box(x0, x1, -0.3, 0.5, h0 - 0.03, h0, "trimExt");
  b.box(x0, x1, -0.3, 0.5, h1, h1 + 0.03, "trimExt");
  return b.build(m, null, "cutaway");
}
