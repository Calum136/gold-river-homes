import * as THREE from "three";
import { PLAN } from "./plan";

// Plan feet to three.js world metres. The world origin sits at the centre of
// the main module at ground level; +X runs to the right end of the plan, +Z
// toward the front of the house, +Y up.

export const FT = 0.3048;
export const FLOOR_Y = PLAN.floorHeight * FT;

export const wx = (x: number) => (x - PLAN.length / 2) * FT;
export const wz = (y: number) => (PLAN.width / 2 - y) * FT;
/** Height in feet above the finished floor to world Y. */
export const wy = (h: number) => FLOOR_Y + h * FT;

/** A plan point (x, depth y, height above floor h) as a world vector. */
export const P = (x: number, y: number, h: number) => new THREE.Vector3(wx(x), wy(h), wz(y));

/** World vector back to plan coordinates. */
export function toPlan(v: THREE.Vector3): { x: number; y: number; h: number } {
  return { x: v.x / FT + PLAN.length / 2, y: PLAN.width / 2 - v.z / FT, h: (v.y - FLOOR_Y) / FT };
}
