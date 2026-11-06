import * as THREE from "three";
import type { ConfiguratorState } from "@/lib/pricing";
import { lotOptions } from "@/lib/defaults";
import type { LotTerrain } from "@/lib/defaults";
import { Builder } from "./builder";
import type { Materials } from "./materials";
import { PLAN } from "./plan";
import { FT, P, wx, wz } from "./space";

// ============================================
// The lot around the house and everything below ground or inside the walls:
// the foundation, the well or water line, the septic system or sewer line,
// and the insulation cutaway. The buyer sees the ground turn see-through on
// those screens, so these choices change the picture too.
// ============================================

const GRADE = -PLAN.floorHeight;
const ROAD_Y = -78;

export function terrainFor(state: ConfiguratorState): LotTerrain {
  if (state.landSituation === "gold-river") {
    return lotOptions.find((l) => l.id === state.selectedLotId)?.terrain ?? "meadow";
  }
  return "meadow";
}

/** Ground, driveway, walkway, garden beds and the road. */
export function buildLot(state: ConfiguratorState, m: Materials): THREE.Group {
  const b = new Builder();
  const terrain = terrainFor(state);
  // Lawn: a big disc of real grass texture around the house.
  const lawn = new THREE.CircleGeometry(95 / FT, 72);
  b.shape("grass", lawn, { x: 37, y: 0, h: GRADE }, { rotX: -Math.PI / 2, worldUV: true });

  const drive = terrain === "town" ? "asphalt" : "gravel";
  const lift = 0.03;
  // Driveway to a parking pad at the left front, then out to the road.
  b.box(4, 22, -26, -5, GRADE, GRADE + lift, drive);
  b.box(8, 18, ROAD_Y + 6, -26, GRADE, GRADE + lift, drive);
  // Paver walk from the pad to the front steps
  b.box(22, 46, -16, -12.5, GRADE, GRADE + lift + 0.01, "paving");
  b.box(41.6, 45.6, -12.5, -8, GRADE, GRADE + lift + 0.01, "paving");
  // Road
  b.box(-150, 230, ROAD_Y - 22, ROAD_Y, GRADE, GRADE + lift, "asphalt");
  // Garden beds along the front, either side of the entry
  b.box(1, 38.5, -3.2, 0, GRADE, GRADE + lift + 0.02, "mulch");
  b.box(48.8, 73, -3.2, 0, GRADE, GRADE + lift + 0.02, "mulch");
  // Coastal and wooded lots get boulders.
  if (terrain === "coastal" || terrain === "wooded") {
    for (const [x, y, s] of [
      [-42, -48, 2.4],
      [112, -10, 3.0],
      [104, 38, 2.2],
      [-34, 46, 2.8],
    ] as const) {
      b.shape("rockFace", new THREE.DodecahedronGeometry(s, 1), { x, y, h: GRADE + s * 0.35 }, { scale: [1.4, 0.7, 1], edges: false });
    }
  }
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

/** Trees, shrubs and rocks around the lot, by terrain. Positions in plan feet. */
export function lotProps(state: ConfiguratorState): PropPlacement[] {
  const terrain = terrainFor(state);
  const out: PropPlacement[] = [];
  const rnd = (() => {
    let s = 7;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  })();
  const trees = terrain === "wooded" ? 34 : terrain === "meadow" ? 9 : terrain === "coastal" ? 5 : 6;
  for (let i = 0; i < trees; i++) {
    const a = rnd() * Math.PI * 2;
    // Trees stand behind and beside the house: the front yard, where the
    // driveway, well and septic field are (and where the camera stands), stays open.
    const r = (terrain === "wooded" ? 55 : 75) + rnd() * (terrain === "wooded" ? 70 : 90);
    const x = 37 + Math.cos(a) * r * 1.2;
    const y = 12 + Math.sin(a) * r;
    if (y < 8 && x > -75 && x < 150) continue;
    out.push({ model: "pine", x, y, h: GRADE, rotY: rnd() * 6.28, scale: 4.5 + rnd() * 2.5 });
  }
  // Foundation shrubs in the beds
  for (const x of [4, 10, 16, 22, 28, 34, 52, 58, 64, 70]) {
    out.push({ model: "shrub_a", x, y: -1.6, h: GRADE + 0.05, rotY: x, scale: 3.2 });
  }
  if (terrain !== "town") {
    out.push({ model: "shrub_b", x: -18, y: 6, h: GRADE, rotY: 1.2, scale: 0.6 });
    out.push({ model: "shrub_b", x: 92, y: 20, h: GRADE, rotY: 2.4, scale: 0.6 });
  }
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
  { model: "vase", x: 37.7, y: 14.6, h: 2.48, scale: 1 },
  { model: "dining_table", x: 37.7, y: 14.6, h: 0, scale: [0.8, 0.86, 0.72], replaces: "dining-table" },
  { model: "dining_chair", x: 35.9, y: 12.4, h: 0, rotY: Math.PI, scale: 1.05, replaces: "dining-chairs" },
  { model: "dining_chair", x: 37.7, y: 12.4, h: 0, rotY: Math.PI, scale: 1.05, replaces: "dining-chairs" },
  { model: "dining_chair", x: 39.5, y: 12.4, h: 0, rotY: Math.PI, scale: 1.05, replaces: "dining-chairs" },
  { model: "dining_chair", x: 35.9, y: 16.8, h: 0, rotY: 0, scale: 1.05, replaces: "dining-chairs" },
  { model: "dining_chair", x: 37.7, y: 16.8, h: 0, rotY: 0, scale: 1.05, replaces: "dining-chairs" },
  { model: "dining_chair", x: 39.5, y: 16.8, h: 0, rotY: 0, scale: 1.05, replaces: "dining-chairs" },
  { model: "stool", x: 30.4, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "stool", x: 32.3, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "stool", x: 34.2, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "stool", x: 36.1, y: 10.3, h: 0, scale: 1, replaces: "stools" },
  { model: "plant", x: 37.6, y: 8.6, h: 3.0, scale: 1.3 },
];

// ---------- Foundation (below the floor) ----------

export function buildFoundation(state: ConfiguratorState, m: Materials, ink: THREE.Material): THREE.Group {
  const b = new Builder();
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
    // Stairs down inside, under the hall
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
    // Crawlspace: perimeter footing walls below frost depth, piers down the
    // middle, a vapour barrier on the ground, vented skirting above grade.
    for (const [x0, x1, y0, y1] of rects) {
      ring(x0, x1, y0, y1, 0.67, GRADE - 4.0, -1, "concrete");
      ring(x0 - 0.4, x1 + 0.4, y0 - 0.4, y1 + 0.4, 0.67, GRADE - 4.7, GRADE - 4.0, "concrete");
      b.box(x0 + 0.67, x1 - 0.67, y0 + 0.67, y1 - 0.67, GRADE - 0.02, GRADE + 0.01, "vapour");
    }
    for (let x = 8; x < 70; x += 8) {
      b.box(x - 0.5, x + 0.5, 7.5, 8.5, GRADE - 3.5, -1.2, "concrete", { edges: true });
      b.box(x - 1, x + 1, 7, 9, GRADE - 4.0, GRADE - 3.5, "concrete");
    }
    // Skirting panels with crawlspace vents
    for (const [x0, x1, y0, y1] of rects) ring(x0 - 0.06, x1 + 0.06, y0 - 0.06, y1 + 0.06, 0.06, GRADE, -1, "skirting");
    for (const x of [6, 20, 52, 68]) b.box(x - 0.8, x + 0.8, -0.1, -0.06, GRADE + 0.35, GRADE + 0.85, "blackGlass");
  }
  return b.build(m, ink, "foundation");
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
  const b = new Builder();
  const frost = GRADE - 5.5;

  // Water supply
  if (state.waterType === "municipal") {
    // Main under the road, a curb stop at the property line, a line to the house.
    pipe(b, "pipeWater", [[-150, ROAD_Y - 11, frost - 1], [230, ROAD_Y - 11, frost - 1]], 0.45);
    pipe(b, "pipeWater", [[8, ROAD_Y - 11, frost - 1], [8, ROAD_Y + 2, frost], [8, 1.5, frost], [8, 1.5, -1.2]]);
    b.shape("lid", new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), { x: 8, y: ROAD_Y + 2, h: GRADE + 0.1 });
  } else if (state.waterType === "drilled" || state.waterType === "dug") {
    const wx0 = -16;
    const wy0 = -30;
    if (state.waterType === "drilled") {
      // A 6" steel casing standing 18" above grade, driven deep into bedrock.
      pipe(b, "steelPipe", [[wx0, wy0, GRADE - 60], [wx0, wy0, GRADE + 1.5]], 0.3);
      b.shape("steelPipe", new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16), { x: wx0, y: wy0, h: GRADE + 1.6 });
      b.box(wx0 - 2.5, wx0 + 2.5, wy0 - 0.2, wy0 + 0.2, GRADE - 62, GRADE - 20, "drainRock");
    } else {
      // A dug well: 3' concrete crock rings with a lid, about 20' deep.
      for (let i = 0; i < 8; i++) {
        b.shape("concrete", new THREE.CylinderGeometry(1.75, 1.75, 2.4, 28, 1, true), { x: wx0, y: wy0, h: GRADE + 1.4 - i * 2.5 }, { edges: i === 0 });
      }
      b.shape("concrete", new THREE.CylinderGeometry(1.95, 1.95, 0.35, 28), { x: wx0, y: wy0, h: GRADE + 2.75 }, { edges: true });
    }
    pipe(b, "pipeWater", [[wx0, wy0, frost], [6, wy0, frost], [6, 1.5, frost], [6, 1.5, -1.2]]);
  }

  // Wastewater
  if (state.sewerType === "municipal") {
    pipe(b, "pipeSewer", [[-150, ROAD_Y - 7, frost - 3], [230, ROAD_Y - 7, frost - 3]], 0.6);
    pipe(b, "pipeSewer", [[60, 1.5, -1.2], [60, 1.5, frost + 1], [60, ROAD_Y - 7, frost - 3]], 0.25);
    b.shape("pipeSewer", new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12), { x: 60, y: -3, h: GRADE + 0.15 });
  } else if (state.sewerType === "septic") {
    // Septic tank with two access lids, a distribution box, and a leach field of
    // perforated pipe in drain-rock trenches.
    const tx = 60;
    const ty = -26;
    pipe(b, "pipeSewer", [[tx, 1.5, -1.2], [tx, 1.5, GRADE - 4.0], [tx, ty + 3, GRADE - 4.4]], 0.25);
    b.box(tx - 3, tx + 3, ty - 5, ty + 3, GRADE - 9, GRADE - 3.5, "concrete", { edges: true });
    for (const ly of [ty + 1.5, ty - 3.5]) b.shape("lid", new THREE.CylinderGeometry(0.9, 0.9, 3.7, 20), { x: tx, y: ly, h: GRADE - 1.8 });
    pipe(b, "pipeSewer", [[tx, ty - 5, GRADE - 4.6], [tx, ty - 14, GRADE - 4.8]], 0.25);
    b.box(tx - 1.2, tx + 1.2, ty - 16, ty - 14, GRADE - 5.6, GRADE - 4.2, "concrete", { edges: true });
    for (let i = 0; i < 5; i++) {
      const lx = tx - 14 + i * 7;
      pipe(b, "pipeSewer", [[tx, ty - 16, GRADE - 4.9], [lx, ty - 18, GRADE - 3.2]], 0.2);
      b.box(lx - 1.2, lx + 1.2, ty - 48, ty - 18, GRADE - 4.2, GRADE - 2.3, "drainRock", { edges: true });
      pipe(b, "pipeSewer", [[lx, ty - 18, GRADE - 3.2], [lx, ty - 48, GRADE - 3.3]], 0.2);
    }
    // The field reads on the surface as a gentle mound.
    b.shape("grass", new THREE.SphereGeometry(1, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2), { x: tx, y: ty - 33, h: GRADE - 0.05 }, { scale: [24, 0.8, 20], worldUV: true });
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
