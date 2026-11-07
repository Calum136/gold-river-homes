import * as THREE from "three";
import { PLAN, insideFootprint } from "./plan";
import { P, toPlan } from "./space";

// ============================================
// Camera stops and routes. Every configurator screen has a stop that frames
// what its decision changes. Moving between stops follows a route that walks
// through doorways (out the front door, along the hall) instead of through
// walls, like a person touring the house.
// ============================================

export interface Pose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

/** A pose from plan feet: camera at (x, y, h), looking at (tx, ty, th). */
export const pose = (x: number, y: number, h: number, tx: number, ty: number, th: number, fov: number): Pose => ({
  pos: P(x, y, h),
  target: P(tx, ty, th),
  fov,
});

export const clonePose = (p: Pose): Pose => ({ pos: p.pos.clone(), target: p.target.clone(), fov: p.fov });

// Ground is 2.25 ft below the floor, so an outdoor eye height is h of about 3.
// The lawn runs 20 ft out from the house and ends at a plain backdrop, so
// eye-level cameras stand on or just off the lawn (grass fills the bottom of
// the frame), and the far views are high enough to show the whole yard.
export const STOPS: Record<string, Pose> = {
  // The whole yard in view, from high over the front-left corner.
  land: pose(-55, -105, 72, 37, 14, 0, 40),
  // "model" is the plan sheet, framed to the viewport by planPose().
  // On the lawn by the front-left corner, looking along the front wall.
  sidingStyle: pose(4, -18.5, 4.2, 40, 4, 4.2, 54),
  sidingColor: pose(37, -31, 4.5, 37, 6, 4.0, 54),
  // The whole roof, from high over the front-right corner.
  roofType: pose(106, -60, 52, 37, 14, 2, 38),
  // Far enough back to see the porch roof as well as the deck.
  porch: pose(36, -30, 4.6, 42.5, -2, 5.6, 48),
  // Bedroom 3's front window: no porch or vestibule post stands in front of it.
  exteriorTrim: pose(64.5, -10.5, 4.4, 66.2, 0.25, 5.0, 42),
  flooring: pose(44.8, 6.8, 5.0, 35.5, 24.5, 0.6, 62),
  countertops: pose(37.0, 12.4, 5.7, 32.4, 7.3, 2.9, 52),
  cabinetStyle: pose(37.8, 13.6, 5.3, 31.5, 1.0, 4.2, 60),
  paintPackage: pose(42.2, 13.0, 5.3, 33.5, 28.5, 4.4, 62),
  interiorTrim: pose(46.6, 13.7, 4.4, 60.0, 13.6, 2.4, 58),
  lightingPackage: pose(39.8, 14.4, 5.0, 31.5, 4.0, 5.0, 62),
  hardwareFinish: pose(30.9, 5.3, 3.9, 27.4, 1.0, 2.5, 46),
  insulation: pose(68.8, -10.5, 4.8, 71.0, 0.2, 4.0, 46),
  fireplace: pose(41.4, 22.2, 4.8, 30.2, 23.8, 3.6, 58),
  // Low by the front-left corner, looking under the house (the garden beds step aside on this step).
  foundation: pose(-4, -17, 0.6, 18, 6, -3.2, 48),
  water: pose(-34, -38, 26, 0, 4, -6, 48),
  // Septic: the tank off the right end and the leach field behind the house.
  sewer: pose(110, -18, 34, 68, 18, -6, 48),
  // Municipal sewer: the lateral out to the street line along the front of the yard.
  sewerMunicipal: pose(112, -30, 44, 60, 6, -6, 50),
  // The finished home and its yard, from a little above the front-left.
  summary: pose(-24, -82, 30, 40, 18, 4, 38),
};

export interface ViewPreset {
  id: string;
  label: string;
  pose: Pose;
  /** Outside and overview views sit in the button row; rooms go in the Rooms menu. */
  group: "view" | "room";
  /** Roof and ceilings lifted off so you can look down into the rooms. */
  cutaway?: boolean;
}

export const PRESETS: ViewPreset[] = [
  { id: "aerial", label: "Aerial", group: "view", pose: STOPS.land },
  { id: "front", label: "Front", group: "view", pose: STOPS.sidingColor },
  // From the back-right, where the sun lights the living room's side wall (from the back-left you look into the sun).
  { id: "back", label: "Back", group: "view", pose: pose(60, 92, 28, 38, 12, 1, 44) },
  { id: "dollhouse", label: "Dollhouse", group: "view", pose: pose(66, -34, 58, 37, 12, 0, 40), cutaway: true },
  { id: "top", label: "Top down", group: "view", pose: pose(37, 15.9, 150, 37, 16, 0, 26), cutaway: true },
  // Rooms, named as on Supreme's plan. Each camera stands where open doors sit beside it, not in front.
  { id: "kitchen", label: "Kitchen", group: "room", pose: STOPS.cabinetStyle },
  { id: "living", label: "Living room", group: "room", pose: STOPS.paintPackage },
  { id: "bedroom", label: "Main bedroom", group: "room", pose: pose(8.8, 2.4, 5.2, 15.6, 13.2, 2.6, 66) },
  { id: "ensuite", label: "Main bath", group: "room", pose: pose(6.6, 12.6, 5.3, 1.2, 9.4, 2.4, 84) },
  { id: "bedroom2", label: "Bedroom 2", group: "room", pose: pose(56.6, 10.6, 5.2, 50.4, 4.4, 2.4, 72) },
  { id: "bedroom3", label: "Bedroom 3", group: "room", pose: pose(64.2, 8.6, 5.2, 71.6, 3.2, 2.4, 72) },
  { id: "bath", label: "Bathroom", group: "room", pose: pose(66.0, 12.4, 5.3, 73.2, 11.3, 2.2, 78) },
  { id: "laundry", label: "Laundry", group: "room", pose: pose(24.5, 8.6, 5.2, 21.6, 1.4, 2.4, 78) },
  { id: "pantry", label: "Pantry", group: "room", pose: pose(24.5, 10.2, 5.2, 20.6, 14.6, 3.4, 80) },
];

/** The plan sheet, straight down through a long lens, fitted to the viewport. */
export function planPose(aspect: number): Pose {
  const fov = 10;
  const half = THREE.MathUtils.degToRad(fov / 2);
  // Sheet extents in feet: the plan plus its title block above it.
  const width = 84 * 0.3048;
  const depth = 54 * 0.3048;
  const distV = depth / 2 / Math.tan(half);
  const distH = width / 2 / (Math.tan(half) * aspect);
  const dist = Math.max(distV, distH) * 1.04;
  const centre = P(37, 20, 0);
  return {
    pos: new THREE.Vector3(centre.x, centre.y + dist, centre.z + 0.02),
    target: centre,
    fov,
  };
}

// ---------- Getting around inside ----------

type Zone = "out" | "great" | "hall" | "laundry" | "pantry" | "br1" | "bath2" | "wic" | "br2" | "br3" | "bath1";

const EYE = 5.2;

function zoneOf(v: THREE.Vector3): Zone {
  const q = toPlan(v);
  if (!insideFootprint(q.x, q.y) || q.h > PLAN.ceiling + 0.5 || q.h < -0.8) return "out";
  if (q.x < 7.7) return q.y > 6.6 ? "bath2" : "wic";
  if (q.x < 19.7) return "br1";
  if (q.x < 25.3) return q.y > 9.3 ? "pantry" : "laundry";
  if (q.x >= 65 && q.y > 9.9) return "bath1";
  if (q.x >= 62 && q.y <= 9.9) return "br3";
  if (q.x >= 48.3 && q.x < 59.3 && q.y < 11.9) return "br2";
  if (q.y > 11.9 && q.x > 45.3 && q.x < 65) return "hall";
  return "great";
}

// Waypoints through each doorway, in plan feet, listed from the first zone to the second.
const LINKS: [Zone, Zone, [number, number][]][] = [
  ["out", "great", [[43.6, -10.5], [43.6, -3.0], [43.6, 3.6]]],
  ["great", "hall", [[45.4, 13.6], [48.0, 13.7]]],
  ["hall", "bath1", [[63.6, 12.9], [66.4, 12.9]]],
  ["hall", "br2", [[57.1, 13.1], [57.1, 10.0]]],
  ["hall", "br3", [[63.7, 11.2], [63.7, 8.2]]],
  ["great", "laundry", [[26.8, 5.5], [23.9, 5.5]]],
  ["great", "pantry", [[26.8, 10.8], [23.9, 10.8]]],
  ["laundry", "br1", [[21.0, 5.9], [18.4, 6.0]]],
  ["br1", "bath2", [[8.9, 8.7], [6.2, 8.9]]],
  ["br1", "wic", [[8.9, 3.4], [6.2, 3.4]]],
];

function zonePath(a: Zone, b: Zone): Zone[] {
  if (a === b) return [a];
  const prev = new Map<Zone, Zone>();
  const queue: Zone[] = [a];
  const seen = new Set<Zone>([a]);
  while (queue.length) {
    const z = queue.shift()!;
    for (const [p, q] of LINKS) {
      const next = p === z ? q : q === z ? p : null;
      if (!next || seen.has(next)) continue;
      seen.add(next);
      prev.set(next, z);
      if (next === b) {
        const path: Zone[] = [b];
        let cur = b;
        while (prev.has(cur)) {
          cur = prev.get(cur)!;
          path.unshift(cur);
        }
        return path;
      }
      queue.push(next);
    }
  }
  return [a, b];
}

function doorwayPoints(a: Zone, b: Zone): [number, number][] {
  const zones = zonePath(a, b);
  const pts: [number, number][] = [];
  for (let i = 0; i < zones.length - 1; i++) {
    const link = LINKS.find(([p, q]) => (p === zones[i] && q === zones[i + 1]) || (q === zones[i] && p === zones[i + 1]));
    if (!link) continue;
    pts.push(...(link[0] === zones[i] ? link[2] : [...link[2]].reverse()));
  }
  return pts;
}

// ---------- Routes ----------

export class Route {
  private posCurve: THREE.CatmullRomCurve3;
  private tgtCurve: THREE.CatmullRomCurve3;
  private fov0: number;
  private fov1: number;
  readonly length: number;

  constructor(points: THREE.Vector3[], targets: THREE.Vector3[], fov0: number, fov1: number) {
    this.posCurve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    this.tgtCurve = new THREE.CatmullRomCurve3(targets, false, "centripetal");
    this.fov0 = fov0;
    this.fov1 = fov1;
    this.length = this.posCurve.getLength();
  }

  /** Which way the camera sets off. */
  startDirection(): THREE.Vector3 {
    return this.posCurve.getTangentAt(0).normalize();
  }

  at(t: number, out: Pose): Pose {
    const u = THREE.MathUtils.clamp(t, 0, 1);
    this.posCurve.getPointAt(u, out.pos);
    this.tgtCurve.getPointAt(u, out.target);
    out.fov = Math.exp(THREE.MathUtils.lerp(Math.log(this.fov0), Math.log(this.fov1), u));
    return out;
  }
}

/** A walkable route between two poses: through doorways when needed, swooping when one end is high above. */
export function makeRoute(a: Pose, b: Pose): Route {
  const za = zoneOf(a.pos);
  const zb = zoneOf(b.pos);
  const doors = doorwayPoints(za, zb).map(([x, y]) => P(x, y, EYE));
  const points = [a.pos.clone()];
  const targets = [a.target.clone()];

  // From the plan sheet (or anywhere high) down to eye level: swoop in an arc.
  const high = Math.max(a.pos.y, b.pos.y);
  if (high > 30 && Math.abs(a.pos.y - b.pos.y) > 15) {
    const mid = a.pos.clone().lerp(b.pos, 0.5);
    mid.y = high * 0.55;
    points.push(mid);
    targets.push(a.target.clone().lerp(b.target, 0.5));
  }
  doors.forEach((d, i) => {
    points.push(d);
    const next = doors[i + 1] ?? b.target;
    targets.push(next.clone().setY(d.y - 0.15));
  });
  points.push(b.pos.clone());
  targets.push(b.target.clone());

  // Very short hops still need two distinct points.
  if (points.length === 2 && points[0].distanceTo(points[1]) < 1e-3) points[1].x += 1e-3;
  return new Route(points, targets, a.fov, b.fov);
}

export function isInside(v: THREE.Vector3): boolean {
  return zoneOf(v) !== "out";
}

/** Which part of the house a point is in: "out", "great", "hall", "br1", "br2", "br3" or "bath1". */
export const zoneAt = (v: THREE.Vector3): string => zoneOf(v);
