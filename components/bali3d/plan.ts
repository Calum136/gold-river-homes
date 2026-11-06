// ============================================
// The Supreme Homes Bali (Casita Series), traced from Supreme's published floor
// plan (web sheet, 2025): 74'-0" x 16'-0" main module plus a 16' x 16' living
// room module at the back. 1,440 sq ft, 3 bedrooms, 2 bathrooms.
//
// Plan coordinates are in feet, read straight off the drawing:
//   x: 0 at the left end (Bedroom 1 end) to 74 at the right end (Bedroom 3 end)
//   y: depth from the front wall's outer face, 0 at the front to 16 at the back
//      of the main module and 32 at the back of the living room module
// Heights are in feet above the finished floor.
//
// Positions are traced at about 21.8 px per foot from the plan image, so they
// are within a few inches of the drawing. It is an illustrative model, not a
// construction document.
// ============================================

export type Pt = [number, number];

export type OpeningKind = "window" | "door" | "front-door" | "patio" | "opening" | "closet";

export interface Opening {
  /** Distance along the wall from its start point to the opening's centre. */
  at: number;
  /** Clear width. */
  w: number;
  kind: OpeningKind;
  /** Window sill height above the floor. */
  sill?: number;
  /** Head height above the floor. */
  head?: number;
  /** Which side of the wall a door swings into: -1 toward lower plan coordinates, +1 toward higher. */
  into?: 1 | -1;
}

export interface WallDef {
  id: string;
  /** Centreline start and end. */
  a: Pt;
  b: Pt;
  /** Thickness. */
  t: number;
  /** Exterior walls carry siding outside and run from below the floor up to the eave. */
  ext?: boolean;
  openings?: Opening[];
}

export interface RoomDef {
  id: string;
  name: string;
  dims: string;
  /** Label position on the plan. */
  label: Pt;
}

export interface FloorZone {
  /** x0, x1, y0, y1 */
  rect: [number, number, number, number];
  kind: "main" | "tile";
}

export const PLAN = {
  length: 74,
  width: 16,
  /** Living room module, x0..x1 and y0..y1 (outer faces). */
  living: { x0: 29.67, x1: 45.67, y0: 16, y1: 32 },
  /** Finished floor height above the ground. */
  floorHeight: 2.25,
  ceiling: 8,
  /** Exterior walls rise to the eave line. */
  eave: 9,
  /** Roof pitch, rise per foot of run. */
  pitch: 4 / 12,
  extT: 0.5,
  intT: 0.35,
  frontDoor: { x: 43.6, w: 3 },
} as const;

const EXT = PLAN.extT;
const INT = PLAN.intT;
const WIN = (at: number, w: number, sill = 3, head = 7): Opening => ({ at, w, kind: "window", sill, head });
const DOOR = (at: number, w = 2.5, into: 1 | -1 = -1): Opening => ({ at, w, kind: "door", head: 6.8, into });
const CLOSET = (at: number, w: number): Opening => ({ at, w, kind: "closet", head: 6.8 });

export const WALLS: WallDef[] = [
  // ---- Exterior, main module ----
  {
    id: "front",
    a: [0, 0.25],
    b: [74, 0.25],
    t: EXT,
    ext: true,
    openings: [
      WIN(9.6, 2.6),
      WIN(17.9, 2.6),
      WIN(30.0, 3.0, 3.7, 6.9),
      WIN(37.5, 3.0, 3.7, 6.9),
      { at: 43.6, w: 3.0, kind: "front-door", head: 6.8 },
      { at: 45.7, w: 1.0, kind: "window", sill: 0.7, head: 6.8 },
      WIN(54.3, 5.0),
      WIN(66.2, 4.0),
    ],
  },
  { id: "back-left", a: [0, 15.75], b: [30.17, 15.75], t: EXT, ext: true, openings: [WIN(9.5, 2.6), WIN(17.9, 2.6)] },
  { id: "back-right", a: [45.17, 15.75], b: [74, 15.75], t: EXT, ext: true, openings: [WIN(6.0, 3.0), WIN(14.7, 3.0)] },
  { id: "end-left", a: [0.25, 0.5], b: [0.25, 15.5], t: EXT, ext: true, openings: [WIN(10.1, 2.0, 4.2, 6.6)] },
  { id: "end-right", a: [73.75, 0.5], b: [73.75, 15.5], t: EXT, ext: true },

  // ---- Exterior, living room module ----
  { id: "living-left", a: [29.92, 16], b: [29.92, 31.5], t: EXT, ext: true, openings: [WIN(2.3, 2.6, 2.4), WIN(13.3, 2.6, 2.4)] },
  { id: "living-right", a: [45.42, 16], b: [45.42, 31.5], t: EXT, ext: true, openings: [WIN(2.3, 2.6, 2.4), WIN(13.3, 2.6, 2.4)] },
  {
    id: "living-back",
    a: [29.67, 31.75],
    b: [45.67, 31.75],
    t: EXT,
    ext: true,
    openings: [WIN(2.75, 3.0, 2.0), { at: 8.0, w: 3.0, kind: "patio", head: 6.8 }, WIN(13.25, 3.0, 2.0)],
  },

  // ---- Interior ----
  // Bathroom 2 and the walk-in closet against Bedroom 1
  { id: "bath2-br1", a: [7.7, 0.5], b: [7.7, 15.5], t: INT, openings: [DOOR(3.4, 2.4), DOOR(8.7, 2.4)] },
  { id: "bath2-wic", a: [0.5, 6.6], b: [7.525, 6.6], t: INT },
  // Bedroom 1 to the laundry
  { id: "br1-laundry", a: [19.7, 0.5], b: [19.7, 15.5], t: INT, openings: [DOOR(5.9, 2.6)] },
  // Laundry and pantry to the kitchen
  { id: "laundry-kitchen", a: [25.3, 0.5], b: [25.3, 15.5], t: INT, openings: [DOOR(5.5, 2.6), DOOR(10.8, 2.4)] },
  { id: "pantry-laundry", a: [19.875, 9.3], b: [25.125, 9.3], t: INT },
  // Short wall closing the end of the kitchen counters beside the foyer
  { id: "kitchen-stub", a: [41.6, 0.5], b: [41.6, 3.6], t: INT },
  // Foyer coat closet
  { id: "coat-front", a: [46.55, 0.5], b: [46.55, 8.7], t: INT, openings: [CLOSET(4.6, 5.0)] },
  { id: "coat-top", a: [46.375, 8.7], b: [48.125, 8.7], t: INT },
  // HRV and water heater closet
  { id: "mech-left", a: [45.3, 8.875], b: [45.3, 11.9], t: INT },
  { id: "mech-top", a: [45.125, 11.9], b: [48.125, 11.9], t: INT, openings: [DOOR(1.6, 2.2)] },
  // Bedroom 2
  { id: "br2-left", a: [48.3, 0.5], b: [48.3, 12.075], t: INT },
  { id: "br2-top", a: [48.125, 11.9], b: [62.175, 11.9], t: INT, openings: [DOOR(8.8, 2.4)] },
  { id: "br2-closet", a: [59.3, 0.5], b: [59.3, 11.725], t: INT, openings: [CLOSET(2.8, 3.2)] },
  // Bedroom 3
  { id: "br3-closet", a: [62.0, 0.5], b: [62.0, 11.725], t: INT, openings: [CLOSET(6.5, 3.6)] },
  { id: "br3-top", a: [62.175, 9.9], b: [73.5, 9.9], t: INT, openings: [DOOR(1.6, 2.4)] },
  // Bathroom 1
  { id: "bath1-left", a: [65.0, 10.075], b: [65.0, 15.5], t: INT, openings: [DOOR(2.4, 2.4, 1)] },
];

export const ROOMS: RoomDef[] = [
  { id: "br1", name: "BEDROOM 1", dims: `11'-8" x 15'-0"`, label: [13.7, 5.3] },
  { id: "bath2", name: "BATHROOM 2", dims: `7'-0" x 8'-8"`, label: [4.1, 11.2] },
  { id: "wic", name: "WALK IN CLOSET", dims: `7'-0" x 6'-0"`, label: [4.1, 3.6] },
  { id: "pantry", name: "WALK IN PANTRY", dims: `5'-0" x 6'-3"`, label: [22.5, 12.4] },
  { id: "laundry", name: "LAUNDRY", dims: `5'-0" x 7'-10"`, label: [22.5, 5.8] },
  { id: "kitchen", name: "KITCHEN", dims: `15'-10" x 15'-0"`, label: [33.6, 4.3] },
  { id: "dining", name: "DINING", dims: `15'-0" x 8'-0"`, label: [37.7, 11.4] },
  { id: "living", name: "LIVING ROOM", dims: `15'-0" x 15'-6"`, label: [37.7, 27.0] },
  { id: "foyer", name: "FOYER", dims: `6'-9" x 8'-3"`, label: [44.0, 5.6] },
  { id: "br2", name: "BEDROOM 2", dims: `10'-4" x 11'-5"`, label: [53.6, 6.2] },
  { id: "br3", name: "BEDROOM 3", dims: `11'-7" x 9'-2"`, label: [67.8, 5.0] },
  { id: "bath1", name: "BATHROOM 1", dims: `8'-0" x 5'-6"`, label: [69.2, 13.7] },
];

// Supreme's standard: vinyl tile in the kitchen, dining room, entry and
// bathrooms; laminate (or the engineered hardwood upgrade) in living areas,
// bedrooms and halls.
export const FLOOR_ZONES: FloorZone[] = [
  { rect: [0.5, 73.5, 0.5, 15.5], kind: "main" },
  { rect: [PLAN.living.x0 + EXT, PLAN.living.x1 - EXT, 15.5, PLAN.living.y1 - EXT], kind: "main" },
  { rect: [0.5, 7.525, 6.775, 15.5], kind: "tile" },
  { rect: [19.875, 25.125, 0.5, 15.5], kind: "tile" },
  { rect: [25.475, 45.17, 0.5, 15.5], kind: "tile" },
  { rect: [45.17, 46.375, 0.5, 8.7], kind: "tile" },
  { rect: [65.175, 73.5, 10.075, 15.5], kind: "tile" },
];

/** Does a plan point sit inside the home's footprint? */
export function insideFootprint(x: number, y: number): boolean {
  const L = PLAN.living;
  return (x > 0 && x < PLAN.length && y > 0 && y < PLAN.width) || (x > L.x0 && x < L.x1 && y >= PLAN.width && y < L.y1);
}
