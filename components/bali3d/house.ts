import * as THREE from "three";
import type { ConfiguratorState } from "@/lib/pricing";
import { Builder } from "./builder";
import type { Face, FaceSlots } from "./builder";
import type { Materials, Slot } from "./materials";
import { FLOOR_ZONES, PLAN, ROOMS, WALLS, gradeFor, insideFootprint } from "./plan";
import type { Opening, WallDef } from "./plan";
import { FT, P, wx, wy, wz } from "./space";
import { labelTexture } from "./textures";

// ============================================
// The Bali, built from the plan. Each group is rebuilt only when a selection
// that shapes it changes (trim style, entry, cabinets, lighting, fireplace);
// colour and material choices never rebuild anything.
// ============================================


// ---------- Trim profiles (feet) ----------

interface TrimStyle {
  casing: number;
  proud: number;
  head: number;
  cap: boolean;
  blocks: boolean;
  stepped: boolean;
}

const EXT_TRIM: Record<string, TrimStyle> = {
  standard: { casing: 0.29, proud: 0.06, head: 0.29, cap: false, blocks: false, stepped: false },
  craftsman: { casing: 0.46, proud: 0.07, head: 0.62, cap: true, blocks: true, stepped: false },
  colonial: { casing: 0.36, proud: 0.06, head: 0.46, cap: true, blocks: false, stepped: true },
};

interface IntTrim extends TrimStyle {
  base: number;
  baseCap: boolean;
  plinth: boolean;
}

const INT_TRIM: Record<string, IntTrim> = {
  // Casings stand prouder than the baseboards they meet, so no faces coincide.
  standard: { casing: 0.31, proud: 0.075, head: 0.46, cap: false, blocks: false, stepped: false, base: 0.44, baseCap: false, plinth: false },
  colonial: { casing: 0.3, proud: 0.075, head: 0.3, cap: true, blocks: false, stepped: true, base: 0.5, baseCap: true, plinth: false },
  craftsman: { casing: 0.4, proud: 0.085, head: 0.55, cap: true, blocks: true, stepped: false, base: 0.62, baseCap: true, plinth: true },
};

// ---------- Wall helpers ----------

interface WallCtx {
  w: WallDef;
  alongX: boolean;
  /** Centreline cross coordinate. */
  c: number;
  t: number;
  s0: number;
  s1: number;
  /** Outward side for exterior walls: +1 toward higher cross coordinates. */
  out: 1 | -1;
  /** Whether each end of the wall stands free (and so needs an end face). */
  freeStart: boolean;
  freeEnd: boolean;
  /** Whether each end faces into the house. */
  startIndoors: boolean;
  endIndoors: boolean;
}

// ---------- Wall junctions ----------
//
// Walls in the plan data meet by overlapping, the way they're drawn. Two
// boxes overlapping at a junction share coplanar faces, and coplanar faces
// flicker as the camera moves. So before building, every wall that ends
// inside a crossing wall is cut back to that wall's face, and wall ends that
// butt into another wall get no end face at all.

type Rect = [number, number, number, number];
const isAlongX = (w: WallDef) => w.a[1] === w.b[1];

function resolveWalls(): Map<string, { s0: number; s1: number }> {
  const spans = new Map(WALLS.map((w) => [w.id, isAlongX(w) ? { s0: w.a[0], s1: w.b[0] } : { s0: w.a[1], s1: w.b[1] }]));
  for (const w of WALLS) {
    const alongX = isAlongX(w);
    const c = alongX ? w.a[1] : w.a[0];
    const half = w.t / 2;
    for (const end of ["start", "end"] as const) {
      const span = spans.get(w.id)!;
      const s = end === "start" ? span.s0 : span.s1;
      const ex = alongX ? s : c;
      const ey = alongX ? c : s;
      for (const o of WALLS) {
        if (o === w || isAlongX(o) === alongX) continue;
        const [ox0, ox1, oy0, oy1] = wallRect(o, spans);
        const eps = 1e-6;
        if (ex < ox0 - eps || ex > ox1 + eps || ey < oy0 - eps || ey > oy1 + eps) continue;
        // Only cut back when the crossing wall covers this wall's whole thickness there.
        const covers = alongX ? oy0 <= c - half + eps && oy1 >= c + half - eps : ox0 <= c - half + eps && ox1 >= c + half - eps;
        if (!covers) continue;
        const near = alongX ? (end === "start" ? ox1 : ox0) : end === "start" ? oy1 : oy0;
        if (end === "start") span.s0 = Math.max(span.s0, near);
        else span.s1 = Math.min(span.s1, near);
        break;
      }
    }
  }
  return spans;
}

function wallRect(w: WallDef, spans: Map<string, { s0: number; s1: number }>): Rect {
  const span = spans.get(w.id)!;
  const half = w.t / 2;
  return isAlongX(w) ? [span.s0, span.s1, w.a[1] - half, w.a[1] + half] : [w.a[0] - half, w.a[0] + half, span.s0, span.s1];
}

/** Is a plan point inside any wall other than `self`? */
function inAnyWall(x: number, y: number, self: WallDef, spans: Map<string, { s0: number; s1: number }>): boolean {
  return WALLS.some((o) => {
    if (o === self) return false;
    const [x0, x1, y0, y1] = wallRect(o, spans);
    return x > x0 && x < x1 && y > y0 && y < y1;
  });
}

function ctxFor(w: WallDef, spans: Map<string, { s0: number; s1: number }>): WallCtx {
  const alongX = isAlongX(w);
  const c = alongX ? w.a[1] : w.a[0];
  const { s0, s1 } = spans.get(w.id)!;
  let out: 1 | -1 = 1;
  if (w.ext) {
    const mid = (s0 + s1) / 2;
    const probe = (sign: number) => (alongX ? insideFootprint(mid, c + sign) : insideFootprint(c + sign, mid));
    out = probe(1) ? -1 : 1;
  }
  // A wall end shows a face only where it stands free, not where it meets
  // another wall; and an exterior wall's end that opens into the house (where
  // the living room joins the main module) is painted, not sided.
  const probeEnd = (s: number) => (alongX ? inAnyWall(s, c, w, spans) : inAnyWall(c, s, w, spans));
  const probeIn = (s: number) => (alongX ? insideFootprint(s, c) : insideFootprint(c, s));
  return {
    w,
    alongX,
    c,
    t: w.t,
    s0,
    s1,
    out,
    freeStart: !probeEnd(s0 - 0.05),
    freeEnd: !probeEnd(s1 + 0.05),
    startIndoors: probeIn(s0 - 0.3),
    endIndoors: probeIn(s1 + 0.3),
  };
}

/** World face on one side of a wall. */
const sideFace = (ctx: WallCtx, sign: number): Face => (ctx.alongX ? (sign > 0 ? "nz" : "pz") : sign > 0 ? "px" : "nx");
const endFace = (ctx: WallCtx, end: "start" | "end"): Face =>
  ctx.alongX ? (end === "start" ? "nx" : "px") : end === "start" ? "pz" : "nz";

function wbox(b: Builder, ctx: WallCtx, s: number, e: number, c0: number, c1: number, h0: number, h1: number, slots: Slot | FaceSlots, edges = false) {
  if (ctx.alongX) b.box(s, e, c0, c1, h0, h1, slots, { edges });
  else b.box(c0, c1, s, e, h0, h1, slots, { edges });
}

/** A box standing proud of one face of a wall, from depth d0 to d1 off the face. */
function faceBox(b: Builder, ctx: WallCtx, sign: number, s: number, e: number, d0: number, d1: number, h0: number, h1: number, slot: Slot, edges = false) {
  const face = ctx.c + (sign * ctx.t) / 2;
  const a = face + sign * d0;
  const z = face + sign * d1;
  wbox(b, ctx, s, e, Math.min(a, z), Math.max(a, z), h0, h1, slot, edges);
}

function wallPiece(b: Builder, ctx: WallCtx, s: number, e: number, h0: number, h1: number, thin: boolean) {
  const ext = !!ctx.w.ext;
  const outSlot: Slot = thin ? "sidingThin" : "siding";
  const inSlot: Slot = thin ? "wallThin" : "wall";
  const slots: FaceSlots = { ny: null };
  if (ext) {
    slots[sideFace(ctx, ctx.out)] = outSlot;
    slots[sideFace(ctx, -ctx.out)] = inSlot;
  } else {
    slots[sideFace(ctx, 1)] = inSlot;
    slots[sideFace(ctx, -1)] = inSlot;
  }
  slots.py = ext ? outSlot : inSlot;
  const jamb: Slot = ext ? "trimExt" : "trimInt";
  const atStart = s <= ctx.s0 + 1e-6;
  const atEnd = e >= ctx.s1 - 1e-6;
  const startSlot: Slot = ext && !ctx.startIndoors ? outSlot : inSlot;
  const endSlot: Slot = ext && !ctx.endIndoors ? outSlot : inSlot;
  slots[endFace(ctx, "start")] = thin ? null : atStart ? (ctx.freeStart ? startSlot : null) : jamb;
  slots[endFace(ctx, "end")] = thin ? null : atEnd ? (ctx.freeEnd ? endSlot : null) : jamb;
  wbox(b, ctx, s, e, ctx.c - ctx.t / 2, ctx.c + ctx.t / 2, h0, h1, slots, !thin || h1 - h0 < 6);
}

// ---------- Openings ----------

function casing(b: Builder, ctx: WallCtx, sign: number, s: number, e: number, bottom: number, head: number, style: TrimStyle, slot: Slot) {
  const cw = style.casing;
  const p = style.proud;
  faceBox(b, ctx, sign, s - cw, s, 0, p, bottom, head, slot, true);
  faceBox(b, ctx, sign, e, e + cw, 0, p, bottom, head, slot, true);
  const over = style.blocks ? 0 : 0.04;
  if (style.blocks) {
    faceBox(b, ctx, sign, s - cw - 0.03, s + 0.03, 0, p + 0.05, head, head + cw + 0.03, slot);
    faceBox(b, ctx, sign, e - 0.03, e + cw + 0.03, 0, p + 0.05, head, head + cw + 0.03, slot);
    faceBox(b, ctx, sign, s + 0.03, e - 0.03, 0, p, head, head + style.head, slot);
  } else {
    faceBox(b, ctx, sign, s - cw - over, e + cw + over, 0, p, head, head + style.head, slot, true);
  }
  const top = head + Math.max(style.head, style.blocks ? cw + 0.03 : 0);
  if (style.cap) {
    faceBox(b, ctx, sign, s - cw - 0.1, e + cw + 0.1, 0, p + 0.1, top, top + 0.09, slot);
  }
  if (style.stepped) {
    // A second, narrower band standing proud of the first: a stepped profile.
    // The pieces meet without overlapping, so no faces are shared.
    faceBox(b, ctx, sign, s - 0.12, s, p, p + 0.035, bottom, head, slot);
    faceBox(b, ctx, sign, e, e + 0.12, p, p + 0.035, bottom, head, slot);
    faceBox(b, ctx, sign, s - 0.12, e + 0.12, p, p + 0.035, head, head + 0.12, slot);
  }
}

function windowUnit(b: Builder, ctx: WallCtx, o: Opening, s: number, e: number, sill: number, head: number) {
  const out = ctx.w.ext ? ctx.out : 1;
  const fc = ctx.c + out * 0.06;
  const c0 = fc - 0.11;
  const c1 = fc + 0.11;
  const bar = 0.16;
  wbox(b, ctx, s, s + bar, c0, c1, sill, head, "windowFrame", true);
  wbox(b, ctx, e - bar, e, c0, c1, sill, head, "windowFrame", true);
  wbox(b, ctx, s, e, c0, c1, sill, sill + bar, "windowFrame");
  wbox(b, ctx, s, e, c0, c1, head - bar, head, "windowFrame");
  const width = e - s;
  if (o.kind === "patio") {
    const mid = (s + e) / 2;
    wbox(b, ctx, mid - 0.08, mid + 0.08, c0, c1, sill, head, "windowFrame");
    // Door pull on the operating panel
    faceBox(b, ctx, -out, mid + 0.25, mid + 0.32, 0.12, 0.2, 3.0, 4.3, "hardware");
  } else if (width > 3.4) {
    const mid = (s + e) / 2;
    wbox(b, ctx, mid - 0.07, mid + 0.07, c0, c1, sill, head, "windowFrame");
  } else if (head - sill > 2.4) {
    // Single-hung: a meeting rail across the middle.
    const mid = (sill + head) / 2;
    wbox(b, ctx, s, e, c0 - out * 0.03, c1 - out * 0.03, mid - 0.06, mid + 0.06, "windowFrame");
  }
  wbox(b, ctx, s + bar, e - bar, fc - 0.012, fc + 0.012, sill + bar, head - bar, "glass");
}

function doorSwingArc(b: Builder, ctx: WallCtx, hinge: number, w: number, into: number, dirAlong: number) {
  // Quarter circle on the floor, from the open leaf to the closed position, for the drawing.
  const pts: number[] = [];
  const face = ctx.c + (into * ctx.t) / 2;
  const seg = 14;
  const toWorld = (along: number, cross: number) =>
    ctx.alongX ? P(along, cross, 0.02) : P(cross, along, 0.02);
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * (Math.PI / 2);
    const a1 = ((i + 1) / seg) * (Math.PI / 2);
    const p0 = toWorld(hinge + dirAlong * w * Math.cos(a0), face + into * w * Math.sin(a0));
    const p1 = toWorld(hinge + dirAlong * w * Math.cos(a1), face + into * w * Math.sin(a1));
    pts.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  b.addEdges(g);
}

function interiorDoor(b: Builder, ctx: WallCtx, o: Opening, s: number, e: number, head: number) {
  const into = o.into ?? -1;
  const w = e - s;
  const face = ctx.c + (into * ctx.t) / 2;
  // Leaf standing open at 90 degrees on the hinge side, its thickness running along the wall.
  const atEnd = o.hinge === "end";
  const hinge = atEnd ? e : s;
  const along = atEnd ? -1 : 1;
  const l0 = hinge + along * 0.04;
  const l1 = hinge + along * 0.19;
  const leaf0 = face + into * 0.02;
  const leaf1 = face + into * (w - 0.04);
  wbox(b, ctx, Math.min(l0, l1), Math.max(l0, l1), Math.min(leaf0, leaf1), Math.max(leaf0, leaf1), 0.03, head - 0.05, "doorInt", true);
  // Lever handles on both faces near the latch edge.
  const latch = face + into * (w - 0.3);
  const lat0 = Math.min(latch, latch + into * 0.35);
  const lat1 = Math.max(latch, latch + into * 0.35);
  const h0 = hinge + along * 0.19;
  const h1 = hinge + along * 0.27;
  const k0 = hinge - along * 0.04;
  const k1 = hinge + along * 0.04;
  wbox(b, ctx, Math.min(h0, h1), Math.max(h0, h1), lat0, lat1, 3.0, 3.06, "hardware");
  wbox(b, ctx, Math.min(k0, k1), Math.max(k0, k1), lat0, lat1, 3.0, 3.06, "hardware");
  doorSwingArc(b, ctx, hinge + along * 0.1, w - 0.1, into, along);
}

function closetDoors(b: Builder, ctx: WallCtx, s: number, e: number, head: number) {
  const panels = e - s > 4 ? 4 : 2;
  const pw = (e - s) / panels;
  for (let i = 0; i < panels; i++) {
    const a = s + i * pw + 0.01;
    const z = s + (i + 1) * pw - 0.01;
    wbox(b, ctx, a, z, ctx.c - 0.06, ctx.c + 0.06, 0.04, head - 0.03, "doorInt", true);
    // Recessed panel look: a raised frame on each face.
    for (const sign of [1, -1]) {
      const f = ctx.c + sign * 0.06;
      wbox(b, ctx, a + 0.12, z - 0.12, Math.min(f, f + sign * 0.02), Math.max(f, f + sign * 0.02), 0.5, head - 0.5, "doorInt");
    }
  }
  const mid = (s + e) / 2;
  for (const sign of [1, -1]) {
    const f = ctx.c + sign * 0.06;
    wbox(b, ctx, mid - 0.25, mid - 0.2, Math.min(f, f + sign * 0.12), Math.max(f, f + sign * 0.12), 3.2, 3.3, "hardware");
    wbox(b, ctx, mid + 0.2, mid + 0.25, Math.min(f, f + sign * 0.12), Math.max(f, f + sign * 0.12), 3.2, 3.3, "hardware");
  }
}

// ---------- Shell ----------

export interface ShellResult {
  shell: THREE.Group;
  frontDoor: THREE.Group;
}

export function buildShell(state: ConfiguratorState, m: Materials, ink: THREE.Material): ShellResult {
  const b = new Builder();
  const ext = EXT_TRIM[state.exteriorTrimId] ?? EXT_TRIM.standard;
  const int = INT_TRIM[state.interiorTrimId] ?? INT_TRIM.standard;

  const spans = resolveWalls();
  for (const w of WALLS) {
    const ctx = ctxFor(w, spans);
    const h0 = w.ext ? -1 : 0;
    const h1 = w.ext ? PLAN.eave : PLAN.ceiling;
    const ops = (w.openings ?? [])
      .map((o) => ({ o, s: ctx.s0 + o.at - o.w / 2, e: ctx.s0 + o.at + o.w / 2 }))
      .sort((p, q) => p.s - q.s);
    const inner: number[] = w.ext ? [-ctx.out] : [1, -1];

    let cursor = ctx.s0;
    const solid = (s: number, e: number) => {
      if (e - s < 0.01) return;
      wallPiece(b, ctx, s, e, h0, h1, false);
      for (const sign of inner) baseboard(b, ctx, sign, s, e, int);
    };

    for (const { o, s, e } of ops) {
      solid(cursor, s);
      cursor = e;
      const head = o.head ?? 7;
      const isWindow = o.kind === "window";
      const sill = isWindow ? o.sill ?? 3 : 0;
      if (isWindow) {
        wallPiece(b, ctx, s, e, h0, sill, true);
        for (const sign of inner) baseboard(b, ctx, sign, s, e, int);
      }
      wallPiece(b, ctx, s, e, head, h1, true);

      if (isWindow || o.kind === "patio") {
        windowUnit(b, ctx, o, s, e, sill, head);
      }
      if (o.kind === "door") interiorDoor(b, ctx, o, s, e, head);
      if (o.kind === "closet") closetDoors(b, ctx, s, e, head);
      if (o.kind === "front-door") {
        // Jamb, head and threshold; the leaf itself is animated separately.
        const out = ctx.out;
        wbox(b, ctx, s, s + 0.12, ctx.c - 0.2, ctx.c + 0.2, 0, head, "windowFrame");
        wbox(b, ctx, e - 0.12, e, ctx.c - 0.2, ctx.c + 0.2, 0, head, "windowFrame");
        wbox(b, ctx, s, e, ctx.c - 0.2, ctx.c + 0.2, head - 0.1, head, "windowFrame");
        faceBox(b, ctx, out, s, e, 0, 0.12, -0.04, 0.02, "steel");
      }

      // Trim: exterior casing outside, interior casing inside.
      if (w.ext) {
        casing(b, ctx, ctx.out, s, e, isWindow ? sill : 0, head, ext, "trimExt");
        if (isWindow) {
          faceBox(b, ctx, ctx.out, s - ext.casing - 0.1, e + ext.casing + 0.1, 0, ext.proud + 0.14, sill - 0.13, sill, "trimExt", true);
          if (ext.stepped) faceBox(b, ctx, ctx.out, s - 0.05, e + 0.05, 0, ext.proud, sill - 0.55, sill - 0.13, "trimExt");
        }
        casing(b, ctx, -ctx.out, s, e, isWindow ? sill : 0, head, int, "trimInt");
        if (isWindow) {
          faceBox(b, ctx, -ctx.out, s - int.casing - 0.06, e + int.casing + 0.06, 0, 0.2, sill - 0.06, sill + 0.03, "trimInt");
          faceBox(b, ctx, -ctx.out, s - int.casing, e + int.casing, 0, int.proud, sill - 0.42, sill - 0.06, "trimInt");
        }
      } else if (o.kind !== "opening") {
        for (const sign of [1, -1]) casing(b, ctx, sign, s, e, 0, head, int, "trimInt");
      }
      if (int.plinth && !isWindow) {
        for (const sign of w.ext ? [-ctx.out] : [1, -1]) {
          faceBox(b, ctx, sign, s - int.casing - 0.02, s, 0, int.proud + 0.04, 0, int.base + 0.12, "trimInt");
          faceBox(b, ctx, sign, e, e + int.casing + 0.02, 0, int.proud + 0.04, 0, int.base + 0.12, "trimInt");
        }
      }
    }
    solid(cursor, ctx.s1);
  }

  // Corner boards at the outside corners.
  const corners: [number, number, number, number][] = [
    [0, 0, -1, -1],
    [74, 0, 1, -1],
    [0, 16, -1, 1],
    [74, 16, 1, 1],
    [PLAN.living.x0, PLAN.living.y1, -1, 1],
    [PLAN.living.x1, PLAN.living.y1, 1, 1],
  ];
  for (const [x, y, sx, sy] of corners) {
    const cw = ext.casing + 0.05;
    b.box(x, x - sx * cw, y, y + sy * 0.07, -1, PLAN.eave, "trimExt", { edges: true });
    b.box(x, x + sx * 0.07, y, y - sy * cw, -1, PLAN.eave, "trimExt", { edges: true });
  }

  // Exterior wall lights beside the front door.
  b.box(41.75, 42.0, -0.15, 0, 6.0, 6.7, "lamp");
  b.box(46.25, 46.5, -0.15, 0, 6.0, 6.7, "lamp");

  const shell = b.build(m, ink, "shell");

  // The front door leaf, hinged on its left edge, swinging into the foyer.
  const d = new Builder();
  const fd = PLAN.frontDoor;
  const s = fd.x - fd.w / 2 + 0.12;
  const e = fd.x + fd.w / 2 - 0.12;
  d.box(s, e, 0.18, 0.32, 0.02, 6.68, "doorFront", { edges: true });
  // Three small lites near the top
  for (let i = 0; i < 3; i++) {
    const a = s + 0.35 + i * ((e - s - 0.7) / 3);
    d.box(a + 0.04, a + (e - s - 0.7) / 3 - 0.04, 0.17, 0.33, 5.1, 6.2, "glass");
  }
  // Recessed panels below
  d.box(s + 0.3, e - 0.3, 0.15, 0.18, 0.6, 4.6, "doorFront");
  d.box(s + 0.3, e - 0.3, 0.32, 0.35, 0.6, 4.6, "doorFront");
  // Handle set
  d.box(e - 0.35, e - 0.25, 0.05, 0.15, 3.1, 3.9, "hardware");
  d.box(e - 0.35, e - 0.25, 0.35, 0.45, 3.1, 3.9, "hardware");
  const leaf = d.build(m, ink, "front-door-leaf");
  const pivot = new THREE.Group();
  pivot.name = "front-door";
  const hinge = P(s, 0.25, 0);
  pivot.position.copy(hinge);
  leaf.position.copy(hinge).negate();
  pivot.add(leaf);
  return { shell, frontDoor: pivot };
}

function baseboard(b: Builder, ctx: WallCtx, sign: number, s: number, e: number, style: IntTrim) {
  faceBox(b, ctx, sign, s, e, 0, 0.05, 0, style.base, "trimInt");
  if (style.baseCap) faceBox(b, ctx, sign, s, e, 0, 0.065, style.base, style.base + 0.07, "trimInt");
}

// ---------- Floors and ceiling ----------

export function buildFloors(m: Materials, ink: THREE.Material): THREE.Group {
  const b = new Builder();
  // Tile sits a little above the main floor; its material also carries a
  // depth offset, so the two never fight where they overlap.
  for (const z of FLOOR_ZONES) {
    const [x0, x1, y0, y1] = z.rect;
    const lift = z.kind === "tile" ? 0.02 : 0;
    b.box(x0, x1, y0, y1, -0.08 + lift, lift, { py: z.kind === "tile" ? "floorTile" : "floorMain" });
  }
  return b.build(m, ink, "floors");
}

export function buildCeiling(m: Materials): THREE.Group {
  const b = new Builder();
  b.box(0.25, 73.75, 0.25, 15.75, PLAN.ceiling, PLAN.ceiling + 0.08, { ny: "ceiling" });
  const L = PLAN.living;
  b.box(L.x0 + 0.25, L.x1 - 0.25, 15.75, L.y1 - 0.25, PLAN.ceiling, PLAN.ceiling + 0.08, { ny: "ceiling" });
  return b.build(m, null, "ceiling");
}

// ---------- Roof ----------

/** A sloped roof slab from its top surface's four corners (eave start, eave end, ridge end, ridge start). */
function roofSlab(b: Builder, eave0: THREE.Vector3, eave1: THREE.Vector3, ridge1: THREE.Vector3, ridge0: THREE.Vector3, thickness: number) {
  const along = eave1.clone().sub(eave0).normalize();
  const up = ridge0.clone().sub(eave0);
  const slopeLen = up.length();
  const n = new THREE.Vector3().crossVectors(along, up.clone().normalize()).normalize();
  if (n.y < 0) n.negate();
  const off = n.clone().multiplyScalar(-thickness);
  const top = [eave0, eave1, ridge1, ridge0];
  const bot = top.map((p) => p.clone().add(off));
  const tri = (slot: Slot, a: THREE.Vector3, bb: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, uvs: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([a, bb, c, a, c, d].flatMap((p) => [p.x, p.y, p.z]), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 1, 2, 0, 2, 3].flatMap((i) => [uvs[i * 2], uvs[i * 2 + 1]]), 2));
    g.computeVertexNormals();
    b.add(slot, g);
  };
  const len = eave0.distanceTo(eave1);
  // Top: u runs along the eave, v up the slope (both in metres), so shingle
  // courses run level and metal seams run down the slope.
  const u0 = eave0.x * along.x + eave0.z * along.z;
  const topUv = [u0, 0, u0 + len, 0, u0 + len, slopeLen, u0, slopeLen];
  const winding = new THREE.Vector3().crossVectors(eave1.clone().sub(eave0), ridge0.clone().sub(eave0)).y > 0;
  if (winding) tri("roof", top[0], top[1], top[2], top[3], topUv);
  else tri("roof", top[0], top[3], top[2], top[1], [topUv[0], topUv[1], topUv[6], topUv[7], topUv[4], topUv[5], topUv[2], topUv[3]]);
  // Underside (soffit where it overhangs)
  if (winding) tri("soffit", bot[0], bot[3], bot[2], bot[1], [0, 0, 0, 1, 1, 1, 1, 0]);
  else tri("soffit", bot[0], bot[1], bot[2], bot[3], [0, 0, 1, 0, 1, 1, 0, 1]);
  // Fascia along the eave and the two rakes, both windings so it shows from outside.
  const edge = (p0: THREE.Vector3, p1: THREE.Vector3, q1: THREE.Vector3, q0: THREE.Vector3) => {
    tri("trimExt", p0, p1, q1, q0, [0, 0, 1, 0, 1, 1, 0, 1]);
    tri("trimExt", p0, q0, q1, p1, [0, 0, 1, 0, 1, 1, 0, 1]);
  };
  edge(top[0], top[1], bot[1], bot[0]);
  edge(top[0], top[3], bot[3], bot[0]);
  edge(top[1], top[2], bot[2], bot[1]);
  const lines = new THREE.BufferGeometry().setFromPoints([top[0], top[1], top[1], top[2], top[2], top[3], top[3], top[0]]);
  b.addEdges(lines);
}

/** A triangular gable wall (siding outside), in a vertical plane. */
function gable(b: Builder, base0: THREE.Vector3, base1: THREE.Vector3, apex: THREE.Vector3, outward: THREE.Vector3, slot: Slot = "siding") {
  const thick = outward.clone().multiplyScalar(-0.5 * FT);
  const pts = [base0, base1, apex];
  const back = pts.map((p) => p.clone().add(thick));
  const g = new THREE.BufferGeometry();
  const along = base1.clone().sub(base0).normalize();
  const uv = (p: THREE.Vector3) => [p.clone().sub(base0).dot(along), p.y];
  const front = new THREE.Vector3().crossVectors(base1.clone().sub(base0), apex.clone().sub(base0)).dot(outward) > 0;
  const order = front ? [0, 1, 2] : [0, 2, 1];
  g.setAttribute("position", new THREE.Float32BufferAttribute(order.flatMap((i) => [pts[i].x, pts[i].y, pts[i].z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(order.flatMap((i) => uv(pts[i])), 2));
  g.computeVertexNormals();
  b.add(slot, g);
  const g2 = new THREE.BufferGeometry();
  const order2 = front ? [0, 2, 1] : [0, 1, 2];
  g2.setAttribute("position", new THREE.Float32BufferAttribute(order2.flatMap((i) => [back[i].x, back[i].y, back[i].z]), 3));
  g2.setAttribute("uv", new THREE.Float32BufferAttribute(order2.flatMap((i) => uv(back[i])), 2));
  g2.computeVertexNormals();
  b.add("wall", g2);
}

export function buildRoof(m: Materials, ink: THREE.Material): THREE.Group {
  const b = new Builder();
  const p = PLAN.pitch;
  const th = 0.55;
  const eaveOver = 1.0;
  const rakeOver = 0.8;
  const top = (run: number) => PLAN.eave + th + run * p; // top surface height at a horizontal run from the wall face
  const L = PLAN.living;

  // Main module: ridge along the length.
  const x0 = -rakeOver;
  const x1 = 74 + rakeOver;
  roofSlab(b, P(x0, -eaveOver, top(-eaveOver)), P(x1, -eaveOver, top(-eaveOver)), P(x1, 8, top(8)), P(x0, 8, top(8)), th * FT);
  roofSlab(b, P(x1, 16 + eaveOver, top(-eaveOver)), P(x0, 16 + eaveOver, top(-eaveOver)), P(x0, 8, top(8)), P(x1, 8, top(8)), th * FT);
  // Ridge caps (the living room's starts where the main one ends, so they don't overlap)
  b.box(x0, x1, 7.75, 8.25, top(8) - 0.05, top(8) + 0.12, "roof");

  // Living room module: ridge running back from the main ridge.
  const lx = (L.x0 + L.x1) / 2;
  const ly1 = L.y1 + rakeOver;
  roofSlab(b, P(L.x0 - eaveOver, ly1, top(-eaveOver)), P(L.x0 - eaveOver, 9, top(-eaveOver)), P(lx, 9, top(8)), P(lx, ly1, top(8)), th * FT);
  roofSlab(b, P(L.x1 + eaveOver, 9, top(-eaveOver)), P(L.x1 + eaveOver, ly1, top(-eaveOver)), P(lx, ly1, top(8)), P(lx, 9, top(8)), th * FT);
  b.box(lx - 0.25, lx + 0.25, 8.25, ly1, top(8) - 0.05, top(8) + 0.12, "roof");

  // Gable ends
  const gableH = PLAN.eave + 8 * p;
  gable(b, P(0, 0, PLAN.eave), P(0, 16, PLAN.eave), P(0, 8, gableH), new THREE.Vector3(-1, 0, 0));
  gable(b, P(74, 16, PLAN.eave), P(74, 0, PLAN.eave), P(74, 8, gableH), new THREE.Vector3(1, 0, 0));
  gable(b, P(L.x0, L.y1, PLAN.eave), P(L.x1, L.y1, PLAN.eave), P(lx, L.y1, gableH), new THREE.Vector3(0, 0, -1));
  // Gable vents
  b.box(-0.08, 0, 7.2, 8.8, gableH - 1.6, gableH - 0.6, "trimExt");
  b.box(74, 74.08, 7.2, 8.8, gableH - 1.6, gableH - 0.6, "trimExt");
  b.box(lx - 0.8, lx + 0.8, L.y1, L.y1 + 0.08, gableH - 1.6, gableH - 0.6, "trimExt");
  return b.build(m, ink, "roof");
}

// ---------- Entry: landing, covered porch, vestibule ----------

function stairs(b: Builder, x0: number, x1: number, yTop: number, dir: -1 | 1, topH: number, GRADE: number) {
  // Stairs from a landing at topH down to the ground, running in the -y direction.
  const drop = topH - GRADE;
  const n = Math.max(2, Math.round(drop / 0.62));
  const rise = drop / n;
  const run = 0.92;
  for (let i = 1; i <= n; i++) {
    const h = topH - i * rise;
    const y0 = yTop + dir * (i - 1) * run;
    const y1 = y0 + dir * run;
    b.box(x0, x1, Math.min(y0, y1), Math.max(y0, y1), h - 0.12, h, "deck", { edges: true });
    b.box(x0 + 0.15, x1 - 0.15, Math.min(y0, y1), Math.max(y0, y1), GRADE, h - 0.12, "deck");
  }
  return { bottomY: yTop + dir * n * run, n, run, rise };
}

function railing(b: Builder, xa: number, ya: number, xb: number, yb: number, hBase: number, hBaseEnd = hBase) {
  const len = Math.hypot(xb - xa, yb - ya);
  const count = Math.max(2, Math.floor(len / 0.4));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = xa + (xb - xa) * t;
    const y = ya + (yb - ya) * t;
    const h = hBase + (hBaseEnd - hBase) * t;
    b.box(x - 0.06, x + 0.06, y - 0.06, y + 0.06, h, h + 2.9, "deck");
  }
  // One continuous handrail, following the slope on stairs.
  beam(b, "deck", P(xa, ya, hBase + 2.97), P(xb, yb, hBaseEnd + 2.97), 0.2, 0.15);
}

/** A rectangular beam from one world point to another (width and height in feet). */
function beam(b: Builder, slot: Slot, from: THREE.Vector3, to: THREE.Vector3, width: number, height: number) {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const g = new THREE.BoxGeometry(len + 0.06, height * FT, width * FT);
  const flat = new THREE.Vector3(dir.x, 0, dir.z).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), flat);
  const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
  g.rotateZ(pitch);
  g.applyQuaternion(q);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  b.add(slot, g);
  b.addEdges(new THREE.EdgesGeometry(g));
}

function postAt(b: Builder, x: number, y: number, h0: number, h1: number) {
  b.box(x - 0.25, x + 0.25, y - 0.25, y + 0.25, h0, h1, "trimExt", { edges: true });
  b.box(x - 0.32, x + 0.32, y - 0.32, y + 0.32, h0, h0 + 0.5, "trimExt");
  b.box(x - 0.32, x + 0.32, y - 0.32, y + 0.32, h1 - 0.25, h1, "trimExt");
}

/** A small steep front-facing gable roof (10/12, like Supreme's Bali rendering), ridge running toward the front. */
function frontGable(b: Builder, x0: number, x1: number, yFront: number, yBack: number, eaveH: number, shakeInGable: boolean) {
  const p = 10 / 12;
  const th = 0.45;
  const over = 0.6;
  const cx = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  const ridgeH = eaveH + th + (half + over) * p - over * p;
  const eTop = eaveH + th - over * p;
  roofSlab(b, P(x0 - over, yBack, eTop), P(x0 - over, yFront - over, eTop), P(cx, yFront - over, ridgeH), P(cx, yBack, ridgeH), th * FT);
  roofSlab(b, P(x1 + over, yFront - over, eTop), P(x1 + over, yBack, eTop), P(cx, yBack, ridgeH), P(cx, yFront - over, ridgeH), th * FT);
  gable(b, P(x0, yFront, eaveH), P(x1, yFront, eaveH), P(cx, yFront, eaveH + half * p), new THREE.Vector3(0, 0, 1), shakeInGable ? "shake" : "siding");
  // Frieze board under the gable
  b.box(x0 - 0.1, x1 + 0.1, yFront - 0.08, yFront + 0.02, eaveH - 0.6, eaveH, "trimExt", { edges: true });
}

export function buildEntry(state: ConfiguratorState, m: Materials, ink: THREE.Material): THREE.Group {
  const b = new Builder();
  const fd = PLAN.frontDoor;
  // The ground sits lower under a crawlspace house, so its stairs have more steps.
  const GRADE = gradeFor(state.foundationType);
  const landingTop = -0.22;
  const vestibule = !!state.hasVestibule;
  const porch = state.hasFrontPorch;
  const extras: THREE.Object3D[] = [];

  if (vestibule) {
    // Enclosed entry: 8' wide by 6' deep, walls clad to match, its own door and
    // side windows, under a steep front gable.
    const x0 = fd.x - 4;
    const x1 = fd.x + 4;
    const y0 = -6;
    const t = 0.5;
    const h1 = 8.6;
    // Floor and ceiling
    // Floor inside the walls (not under them, where its sides would coincide with the siding)
    b.box(x0 + t, x1 - t, y0 + t, 0, -1.0, 0.01, { py: "floorTile", all: "skirting" }, { edges: true });
    b.box(x0 + t, x1 - t, y0 + t, 0, 7.8, 7.9, { ny: "ceiling" });
    // Side walls with a window each
    for (const [wx0, wx1, side] of [
      [x0, x0 + t, -1],
      [x1 - t, x1, 1],
    ] as const) {
      const outFace: Face = side < 0 ? "nx" : "px";
      const inFace: Face = side < 0 ? "px" : "nx";
      const slots: FaceSlots = { [outFace]: "siding", [inFace]: "wall", py: "siding", pz: "siding", nz: "siding", ny: null };
      // Side walls start behind the front wall, which runs the full width.
      b.box(wx0, wx1, y0 + t, -4.3, -1, h1, slots, { edges: true });
      b.box(wx0, wx1, -1.7, 0, -1, h1, slots, { edges: true });
      b.box(wx0, wx1, -4.3, -1.7, -1, 3.0, { ...slots, py: "sidingThin" });
      b.box(wx0, wx1, -4.3, -1.7, 6.8, h1, { ...slots, py: "sidingThin" });
      b.box(wx0, wx1, -4.15, -1.85, 3.0, 3.16, "windowFrame");
      b.box(wx0, wx1, -4.15, -1.85, 6.64, 6.8, "windowFrame");
      b.box(wx0, wx1, -4.3, -4.15, 3.0, 6.8, "windowFrame");
      b.box(wx0, wx1, -1.85, -1.7, 3.0, 6.8, "windowFrame");
      b.box((wx0 + wx1) / 2 - 0.012, (wx0 + wx1) / 2 + 0.012, -4.15, -1.85, 3.16, 6.64, "glass");
      // Casing outside
      const ox = side < 0 ? wx0 : wx1;
      b.box(ox, ox + side * 0.06, -4.6, -1.4, 2.85, 3.0, "trimExt");
      b.box(ox, ox + side * 0.06, -4.6, -1.4, 6.8, 7.1, "trimExt");
    }
    // Front wall with the door and two sidelights
    const fy0 = y0;
    const fy1 = y0 + t;
    const frontSlots: FaceSlots = { pz: "siding", nz: "wall", py: "siding", ny: null };
    b.box(x0, fd.x - 2.6, fy0, fy1, -1, h1, frontSlots, { edges: true });
    b.box(fd.x + 2.6, x1, fy0, fy1, -1, h1, frontSlots, { edges: true });
    b.box(fd.x - 2.6, fd.x + 2.6, fy0, fy1, 6.8, h1, { ...frontSlots, py: "sidingThin" });
    // Door leaf (glazed upper half), hinged so it can swing open as the camera walks in.
    const leafB = new Builder();
    leafB.box(fd.x - 1.5, fd.x + 1.5, fy0 + 0.15, fy1 - 0.15, 0.02, 6.7, "doorFront", { edges: true });
    leafB.box(fd.x - 1.1, fd.x + 1.1, fy0 + 0.13, fy1 - 0.13, 3.9, 6.2, "glass");
    leafB.box(fd.x + 1.0, fd.x + 1.12, fy0 + 0.02, fy0 + 0.14, 3.1, 3.9, "hardware");
    leafB.box(fd.x + 1.0, fd.x + 1.12, fy1 - 0.14, fy1 - 0.02, 3.1, 3.9, "hardware");
    const leaf = leafB.build(m, ink, "vestibule-door-leaf");
    const pivot = new THREE.Group();
    pivot.name = "vestibule-door";
    const hinge = P(fd.x - 1.5, (fy0 + fy1) / 2, 0);
    pivot.position.copy(hinge);
    leaf.position.copy(hinge).negate();
    pivot.add(leaf);
    extras.push(pivot);
    for (const sx of [-1, 1]) {
      const a = fd.x + sx * 1.6;
      const z = fd.x + sx * 2.6;
      b.box(Math.min(a, z), Math.max(a, z), fy0 + 0.1, fy1 - 0.1, 0.4, 6.8, "windowFrame");
      b.box(Math.min(a, z) + 0.12, Math.max(a, z) - 0.12, fy0 + 0.2, fy0 + 0.24, 0.55, 6.65, "glass");
    }
    // Shake gable over the vestibule, as in Supreme's rendering of the Bali.
    frontGable(b, x0, x1, y0, -0.2, h1, true);
    b.box(fd.x - 0.15, fd.x + 0.15, y0 - 0.2, y0, 7.15, 7.55, "lamp");
    // Landing and stairs from the vestibule door
    const st = stairs(b, fd.x - 2.5, fd.x + 2.5, y0, -1, landingTop - 0.1, GRADE);
    railing(b, fd.x - 2.6, y0, fd.x - 2.6, st.bottomY, landingTop - 0.1, GRADE);
    railing(b, fd.x + 2.6, y0, fd.x + 2.6, st.bottomY, landingTop - 0.1, GRADE);
    // Skirting under the vestibule
    b.box(x0, x1, y0 - 0.05, 0, GRADE, -1, "skirting");
  }

  if (porch) {
    // Covered porch along the front: 24' x 6' deck, square posts, rail, shed roof.
    const px0 = fd.x - 12;
    const px1 = fd.x + 12;
    const py0 = -6.5;
    b.box(px0, px1, py0, 0, landingTop - 0.18, landingTop, "deck", { edges: true });
    b.box(px0, px1, py0, py0 + 0.15, GRADE, landingTop - 0.18, "skirting");
    b.box(px0, px0 + 0.15, py0 + 0.15, 0, GRADE, landingTop - 0.18, "skirting");
    b.box(px1 - 0.15, px1, py0 + 0.15, 0, GRADE, landingTop - 0.18, "skirting");
    const postY = py0 + 0.45;
    const roofLow = 7.9;
    const roofHigh = 8.65;
    const skipX0 = vestibule ? fd.x - 4.6 : fd.x - 2.6;
    const skipX1 = vestibule ? fd.x + 4.6 : fd.x + 2.6;
    const posts = [px0 + 0.45, skipX0 - 0.6, skipX1 + 0.6, px1 - 0.45];
    for (const x of posts) postAt(b, x, postY, landingTop, roofLow);
    // Beam and shed roof, split around a vestibule if there is one.
    const roofSegs: [number, number][] = vestibule ? [[px0 - 0.6, fd.x - 4], [fd.x + 4, px1 + 0.6]] : [[px0 - 0.6, px1 + 0.6]];
    for (const [r0, r1] of roofSegs) {
      b.box(r0 + 0.4, r1 - 0.4, postY - 0.3, postY + 0.3, roofLow, roofLow + 0.7, "trimExt", { edges: true });
      const pt = 0.42;
      roofSlab(b, P(r0, py0 - 0.7, roofLow + 0.75), P(r1, py0 - 0.7, roofLow + 0.75), P(r1, 0, roofHigh + pt), P(r0, 0, roofHigh + pt), pt * FT);
      b.box(r0 + 0.1, r1 - 0.1, py0 - 0.55, 0, roofLow + 0.7, roofLow + 0.74, { ny: "soffit" });
      // Pot lights in the porch ceiling
      for (let x = r0 + 3; x < r1 - 2; x += 6) b.box(x - 0.2, x + 0.2, -3.6, -3.2, roofLow + 0.66, roofLow + 0.7, "lamp");
    }
    // Railings between posts, leaving the stair opening clear.
    railing(b, px0 + 0.45, postY, skipX0 - 0.6, postY, landingTop);
    railing(b, skipX1 + 0.6, postY, px1 - 0.45, postY, landingTop);
    railing(b, px0 + 0.45, postY, px0 + 0.45, -0.3, landingTop);
    railing(b, px1 - 0.45, postY, px1 - 0.45, -0.3, landingTop);
    if (!vestibule) stairs(b, fd.x - 2.4, fd.x + 2.4, py0, -1, landingTop, GRADE);
  }

  if (!vestibule && !porch) {
    // Standard entry: a stained wood landing with steps and rails, open to the sky.
    const lx0 = fd.x - 3;
    const lx1 = fd.x + 3;
    const ly0 = -5;
    b.box(lx0, lx1, ly0, 0, landingTop - 0.18, landingTop, "deck", { edges: true });
    b.box(lx0, lx1, ly0, ly0 + 0.15, GRADE, landingTop - 0.18, "deck");
    const st = stairs(b, fd.x - 2.0, fd.x + 2.0, ly0, -1, landingTop, GRADE);
    railing(b, lx0 + 0.1, -0.2, lx0 + 0.1, ly0, landingTop);
    railing(b, lx1 - 0.1, -0.2, lx1 - 0.1, ly0, landingTop);
    railing(b, fd.x - 2.1, ly0, fd.x - 2.1, st.bottomY, landingTop, GRADE);
    railing(b, fd.x + 2.1, ly0, fd.x + 2.1, st.bottomY, landingTop, GRADE);
  }
  const group = b.build(m, ink, "entry");
  for (const e of extras) group.add(e);
  return group;
}

// ---------- Kitchen ----------

interface Run {
  x0: number;
  x1: number;
}

/** Shaker doors and drawers on a cabinet front facing +z (the front of a run). */
function shakerFront(b: Builder, x0: number, x1: number, yFace: number, dir: 1 | -1, h0: number, h1: number, kind: "base" | "upper" | "tall", pulls: boolean) {
  const doors = Math.max(1, Math.round((x1 - x0) / 1.5));
  const dw = (x1 - x0) / doors;
  const proud = 0.06;
  const f0 = yFace;
  const f1 = yFace + dir * proud;
  const rows: [number, number][] = kind === "base" ? [[h0, h1 - 0.62], [h1 - 0.58, h1 - 0.04]] : [[h0 + 0.03, h1 - 0.03]];
  for (let i = 0; i < doors; i++) {
    const a = x0 + i * dw + 0.02;
    const z = x0 + (i + 1) * dw - 0.02;
    for (const [r0, r1] of rows) {
      b.box(a, z, Math.min(f0, f1), Math.max(f0, f1), r0, r1, "cabinet", { edges: true });
      // Shaker frame: rails and stiles stand proud of the recessed centre panel.
      const g0 = f1;
      const g1 = f1 + dir * 0.035;
      const rail = r1 - r0 > 1 ? 0.22 : 0.12;
      const lo = Math.min(g0, g1);
      const hi = Math.max(g0, g1);
      b.box(a, a + rail, lo, hi, r0, r1, "cabinet");
      b.box(z - rail, z, lo, hi, r0, r1, "cabinet");
      b.box(a + rail, z - rail, lo, hi, r0, r0 + rail, "cabinet");
      b.box(a + rail, z - rail, lo, hi, r1 - rail, r1, "cabinet");
      if (!pulls) continue;
      const p0 = g1;
      const p1 = g1 + dir * 0.09;
      const plo = Math.min(p0, p1);
      const phi = Math.max(p0, p1);
      if (r1 - r0 < 0.7) {
        const mid = (a + z) / 2;
        b.box(mid - 0.3, mid + 0.3, plo, phi, (r0 + r1) / 2 - 0.02, (r0 + r1) / 2 + 0.02, "hardware");
      } else {
        const px = i % 2 === 0 ? z - 0.18 : a + 0.18;
        const ph = kind === "upper" ? r0 + 0.35 : kind === "tall" ? 3.2 : r1 - 0.35;
        b.box(px - 0.02, px + 0.02, plo, phi, ph - 0.3, ph + 0.3, "hardware");
      }
    }
  }
}

export function buildKitchen(state: ConfiguratorState, m: Materials, ink: THREE.Material): THREE.Group {
  const b = new Builder();
  const premium = state.cabinetStyleId === "premium-shaker";
  const counterTop = 3.0;
  const baseTop = 2.875;
  const range: Run = { x0: 32.35, x1: 34.85 };
  const runs: Run[] = [
    { x0: 25.5, x1: range.x0 },
    { x0: range.x1, x1: 41.42 },
  ];
  // Front wall base cabinets (fronts face the room, toward +y, which is world -Z).
  for (const r of runs) {
    b.box(r.x0, r.x1, 0.5, 2.35, 0.35, baseTop, { nz: null, all: "cabinet" }, { edges: true });
    b.box(r.x0, r.x1, 0.5, 2.15, 0, 0.35, "blackGlass");
    shakerFront(b, r.x0, r.x1, 2.35, 1, 0.38, baseTop, "base", true);
    b.box(r.x0, r.x1, 0.5, 2.6, baseTop, counterTop, "counter", { edges: true });
  }
  // Range: stainless body, black glass cooktop, oven window
  b.box(range.x0, range.x1, 0.5, 2.45, 0, 3.0, "steel", { edges: true });
  b.box(range.x0 + 0.05, range.x1 - 0.05, 0.6, 2.4, 3.0, 3.03, "blackGlass");
  b.box(range.x0 + 0.25, range.x1 - 0.25, 2.45, 2.47, 0.9, 2.2, "blackGlass");
  b.box(range.x0 + 0.3, range.x1 - 0.3, 2.47, 2.55, 2.45, 2.52, "steel");
  b.box(range.x0, range.x1, 0.5, 0.75, 3.0, 3.45, "steel");
  // Backsplash: subway tile up to the uppers, stopping under the windows
  const windows: Run[] = [
    { x0: 28.5, x1: 31.5 },
    { x0: 36.0, x1: 39.0 },
  ];
  let bx = 25.5;
  for (const w of [...windows, { x0: 41.42, x1: 41.42 }]) {
    if (w.x0 > bx) b.box(bx, w.x0, 0.5, 0.53, counterTop, 4.5, "backsplash");
    if (w.x1 > w.x0) b.box(w.x0, w.x1, 0.5, 0.53, counterTop, 3.55, "backsplash");
    bx = w.x1;
  }
  // Upper cabinets between the windows, a hood over the range
  const uppers: Run[] = [
    { x0: 25.5, x1: 28.25 },
    { x0: 39.25, x1: 41.42 },
  ];
  const upperTop = premium ? 7.4 : 7.25;
  for (const u of uppers) {
    b.box(u.x0, u.x1, 0.5, 1.6, 4.5, upperTop, { nz: null, all: "cabinet" }, { edges: true });
    shakerFront(b, u.x0, u.x1, 1.6, 1, 4.52, upperTop - 0.02, "upper", true);
    // Under-cabinet LED strip (lit only with the premium lighting package)
    b.box(u.x0 + 0.1, u.x1 - 0.1, 1.2, 1.45, 4.47, 4.5, "led");
    if (premium) b.box(u.x0 - 0.06, u.x1 + 0.06, 0.5, 1.78, upperTop, upperTop + 0.3, "cabinet", { edges: true });
  }
  // Chimney hood
  b.box(range.x0 + 0.1, range.x1 - 0.1, 0.5, 1.9, 5.6, 5.9, "steel", { edges: true });
  b.box(range.x0 + 0.75, range.x1 - 0.75, 0.5, 1.1, 5.9, PLAN.ceiling, "steel");

  // Fridge with a cabinet above, and a tall pantry cabinet beside it (back wall)
  b.box(25.55, 28.45, 12.7, 15.5, 0, 5.9, "steel", { edges: true });
  b.box(26.98, 27.02, 12.6, 12.7, 1.0, 5.6, "blackGlass");
  b.box(26.6, 26.68, 12.5, 12.6, 3.2, 5.0, "steel");
  b.box(27.32, 27.4, 12.5, 12.6, 3.2, 5.0, "steel");
  b.box(25.5, 28.5, 13.2, 15.5, 6.0, upperTop, { pz: null, all: "cabinet" }, { edges: true });
  shakerFront(b, 25.5, 28.5, 13.2, -1, 6.02, upperTop - 0.02, "upper", true);
  b.box(28.5, 30.0, 13.2, 15.5, 0, upperTop, { pz: null, all: "cabinet" }, { edges: true });
  shakerFront(b, 28.5, 30.0, 13.2, -1, 0.05, upperTop - 0.02, "tall", true);
  if (premium) b.box(25.44, 30.06, 13.0, 15.5, upperTop, upperTop + 0.3, "cabinet");

  // Island with the sink, seating on the dining side
  const ix0 = 28.9;
  const ix1 = 38.3;
  b.box(ix0, ix1, 5.95, 8.45, 0.35, baseTop, "cabinet", { edges: true });
  b.box(ix0 + 0.1, ix1 - 0.1, 6.1, 8.3, 0, 0.35, "blackGlass");
  shakerFront(b, ix0, ix1, 5.95, -1, 0.38, baseTop, "base", true);
  // End panels and the seating-side panel
  b.box(ix0 - 0.06, ix0, 5.9, 9.4, 0, baseTop, "cabinet", { edges: true });
  b.box(ix1, ix1 + 0.06, 5.9, 9.4, 0, baseTop, "cabinet", { edges: true });
  // Counter in pieces around the undermount double sink
  const sx0 = 31.3;
  const sx1 = 34.3;
  const sy0 = 6.35;
  const sy1 = 7.75;
  const cy0 = 5.78;
  const cy1 = 9.55;
  b.box(ix0 - 0.12, sx0, cy0, cy1, baseTop, counterTop, "counter", { edges: true });
  b.box(sx1, ix1 + 0.12, cy0, cy1, baseTop, counterTop, "counter", { edges: true });
  b.box(sx0, sx1, cy0, sy0, baseTop, counterTop, "counter");
  b.box(sx0, sx1, sy1, cy1, baseTop, counterTop, "counter");
  // Sink bowls
  b.box(sx0 + 0.03, sx1 - 0.03, sy0 + 0.03, sy1 - 0.03, 2.2, 2.23, "steel");
  b.box(sx0, sx0 + 0.03, sy0, sy1, 2.2, baseTop, "steel");
  b.box(sx1 - 0.03, sx1, sy0, sy1, 2.2, baseTop, "steel");
  b.box(sx0, sx1, sy0, sy0 + 0.03, 2.2, baseTop, "steel");
  b.box(sx0, sx1, sy1 - 0.03, sy1, 2.2, baseTop, "steel");
  b.box(32.78, 32.82, sy0, sy1, 2.2, baseTop - 0.05, "steel");
  // Gooseneck faucet in the hardware finish
  const fx = 32.8;
  const fy = 8.05;
  b.shape("hardware", new THREE.CylinderGeometry(0.06, 0.08, 1.1, 16), { x: fx, y: fy, h: counterTop + 0.55 });
  b.shape("hardware", new THREE.TorusGeometry(0.42, 0.045, 10, 24, Math.PI), { x: fx, y: fy - 0.42, h: counterTop + 1.1 }, { rotY: Math.PI / 2 });
  b.shape("hardware", new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), { x: fx, y: fy - 0.84, h: counterTop + 0.95 });
  b.shape("hardware", new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), { x: fx + 0.2, y: fy, h: counterTop + 0.4 }, { rotZ: Math.PI / 2.4 });

  const group = b.build(m, ink, "kitchen");
  // Counter stools on the dining side (a drawn set, replaced by a loaded model when it arrives)
  const s = new Builder();
  for (const x of [30.4, 32.3, 34.2, 36.1]) stool(s, x, 10.35);
  group.add(s.build(m, ink, "stools"));
  return group;
}

function stool(b: Builder, x: number, y: number) {
  b.shape("wood", new THREE.CylinderGeometry(0.62, 0.6, 0.14, 24), { x, y, h: 2.38 }, { edges: true });
  b.shape("wood", new THREE.CylinderGeometry(0.62, 0.62, 0.9, 24, 1, true, Math.PI * 0.25, Math.PI * 0.5), { x, y, h: 2.9 }, { rotY: Math.PI });
  for (const [dx, dy] of [
    [0.4, 0.4],
    [-0.4, 0.4],
    [0.4, -0.4],
    [-0.4, -0.4],
  ]) {
    b.shape("blackGlass", new THREE.CylinderGeometry(0.035, 0.04, 2.35, 8), { x: x + dx * 0.9, y: y + dy * 0.9, h: 1.17 }, { rotX: -dy * 0.12, rotZ: dx * 0.12 });
  }
  b.shape("blackGlass", new THREE.TorusGeometry(0.47, 0.025, 6, 24), { x, y, h: 0.9 }, { rotX: Math.PI / 2 });
}

// ---------- Light fixtures ----------

export interface LightSpot {
  x: number;
  y: number;
  h: number;
  /** Relative strength: pendants and chandeliers are brighter than flush mounts. */
  power: number;
  room: string;
}

export function buildFixtures(state: ConfiguratorState, m: Materials, ink: THREE.Material): { group: THREE.Group; spots: LightSpot[] } {
  const b = new Builder();
  const premium = state.lightingPackageId === "premium";
  const spots: LightSpot[] = [];

  // Island pendants (both packages: Supreme's standard includes pendants over the island and sink)
  for (const x of [30.8, 33.6, 36.4]) {
    b.shape("hardware", new THREE.CylinderGeometry(0.015, 0.015, 2.2, 6), { x, y: 7.65, h: PLAN.ceiling - 1.1 });
    b.shape("hardware", new THREE.CylinderGeometry(0.28, 0.55, 0.62, 24, 1, true), { x, y: 7.65, h: 5.55 }, { edges: true });
    b.shape("hardware", new THREE.CylinderGeometry(0.06, 0.28, 0.12, 24), { x, y: 7.65, h: 5.9 });
    b.shape("lamp", new THREE.CircleGeometry(0.52, 24), { x, y: 7.65, h: 5.26 }, { rotX: Math.PI / 2 });
    spots.push({ x, y: 7.65, h: 5.1, power: 0.7, room: "kitchen" });
  }

  // Dining: a drum pendant (standard) or a ring chandelier (premium)
  if (premium) {
    b.shape("hardware", new THREE.TorusGeometry(1.25, 0.05, 10, 48), { x: 37.7, y: 14.6, h: 6.0 }, { rotX: Math.PI / 2, edges: true });
    b.shape("lamp", new THREE.TorusGeometry(1.2, 0.035, 8, 48), { x: 37.7, y: 14.6, h: 5.94 }, { rotX: Math.PI / 2 });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      b.shape("hardware", new THREE.CylinderGeometry(0.012, 0.012, 2.0, 4), { x: 37.7 + Math.cos(a) * 1.0, y: 14.6 + Math.sin(a) * 1.0, h: 7.0 }, { rotZ: Math.cos(a) * 0.12, rotX: -Math.sin(a) * 0.12 });
    }
  } else {
    b.shape("hardware", new THREE.CylinderGeometry(0.015, 0.015, 1.6, 6), { x: 37.7, y: 14.6, h: PLAN.ceiling - 0.8 });
    b.shape("linen", new THREE.CylinderGeometry(0.85, 0.85, 0.7, 32, 1, true), { x: 37.7, y: 14.6, h: 6.05 }, { edges: true });
    b.shape("lamp", new THREE.CircleGeometry(0.8, 24), { x: 37.7, y: 14.6, h: 5.75 }, { rotX: Math.PI / 2 });
  }
  spots.push({ x: 37.7, y: 14.6, h: 5.6, power: premium ? 1 : 0.8, room: "dining" });

  // Entry: flush mount, or a statement fixture with the premium package
  if (premium) {
    // A frosted glass globe on a short rod, its cap and ring in the hardware finish.
    b.shape("hardware", new THREE.CylinderGeometry(0.015, 0.015, 1.0, 6), { x: 44.0, y: 4.5, h: PLAN.ceiling - 0.5 });
    b.shape("hardware", new THREE.CylinderGeometry(0.22, 0.3, 0.14, 20), { x: 44.0, y: 4.5, h: 6.95 });
    b.shape("lamp", new THREE.SphereGeometry(0.62, 28, 18), { x: 44.0, y: 4.5, h: 6.3 }, { edges: true });
    b.shape("hardware", new THREE.TorusGeometry(0.64, 0.025, 8, 40), { x: 44.0, y: 4.5, h: 6.3 }, { rotX: Math.PI / 2 });
  } else {
    b.shape("lamp", new THREE.CylinderGeometry(0.55, 0.45, 0.25, 24), { x: 44.0, y: 4.5, h: PLAN.ceiling - 0.13 }, { edges: true });
  }
  spots.push({ x: 44.0, y: 4.5, h: 6.4, power: premium ? 0.9 : 0.6, room: "foyer" });

  // Flush mounts in the other rooms
  const flush: [number, number, string][] = [
    [13.7, 8.0, "br1"],
    [53.6, 6.2, "br2"],
    [67.8, 5.0, "br3"],
    [37.7, 23.8, "living"],
    [56.0, 13.7, "hall"],
    [69.0, 12.8, "bath1"],
    [3.8, 11.0, "bath2"],
    [22.5, 5.0, "laundry"],
  ];
  for (const [x, y, room] of flush) {
    b.shape("lamp", new THREE.CylinderGeometry(0.55, 0.45, 0.25, 24), { x, y, h: PLAN.ceiling - 0.13 }, { edges: true });
    spots.push({ x, y, h: 7.2, power: room === "living" ? 0.9 : 0.55, room });
  }
  if (premium) {
    // Recessed pot lights in the kitchen and living room
    for (const [x, y] of [
      [27.5, 4],
      [31.5, 4],
      [35.5, 4],
      [39.5, 4],
      [33.0, 19.5],
      [42.0, 19.5],
      [33.0, 28.0],
      [42.0, 28.0],
    ]) {
      b.shape("lamp", new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), { x, y, h: PLAN.ceiling - 0.03 });
    }
  }
  return { group: b.build(m, ink, "fixtures"), spots };
}

// ---------- Furniture and fixtures in the rooms ----------

function bed(b: Builder, x0: number, x1: number, y0: number, y1: number, headAt: "x0" | "x1" | "y1") {
  b.box(x0, x1, y0, y1, 0.3, 1.05, "wood", { edges: true });
  const inset = 0.15;
  b.box(x0 + inset, x1 - inset, y0 + inset, y1 - inset, 1.05, 1.9, "linen", { edges: true });
  // Duvet folded back from the head, pillows at the head, headboard against the wall
  if (headAt === "y1") {
    b.box(x0 + 0.05, x1 - 0.05, y0 - 0.05, y1 - 2.2, 1.6, 2.05, "fabric");
    for (const f of [0.28, 0.72]) {
      const px = x0 + (x1 - x0) * f;
      b.box(px - 0.95, px + 0.95, y1 - 1.6, y1 - 0.4, 1.9, 2.35, "linen", { edges: true });
    }
    b.box(x0 - 0.1, x1 + 0.1, y1 - 0.3, y1, 0, 4.0, "fabric", { edges: true });
  } else {
    const dir = headAt === "x0" ? 1 : -1;
    const head = headAt === "x0" ? x0 : x1;
    const foot = headAt === "x0" ? x1 : x0;
    b.box(Math.min(head + dir * 2.2, foot + dir * -0.05), Math.max(head + dir * 2.2, foot - dir * 0.05), y0 - 0.05, y1 + 0.05, 1.6, 2.05, "fabric");
    for (const f of [0.28, 0.72]) {
      const py = y0 + (y1 - y0) * f;
      const a = head + dir * 0.4;
      const z = head + dir * 1.6;
      b.box(Math.min(a, z), Math.max(a, z), py - 0.95, py + 0.95, 1.9, 2.35, "linen", { edges: true });
    }
    b.box(Math.min(head, head + dir * 0.3), Math.max(head, head + dir * 0.3), y0 - 0.1, y1 + 0.1, 0, 4.0, "fabric", { edges: true });
  }
}

function nightstand(b: Builder, x0: number, x1: number, y0: number, y1: number) {
  b.box(x0, x1, y0, y1, 0, 2.0, "wood", { edges: true });
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  b.shape("ceramic", new THREE.CylinderGeometry(0.18, 0.25, 0.8, 16), { x: cx, y: cy, h: 2.4 });
  b.shape("linen", new THREE.CylinderGeometry(0.42, 0.5, 0.6, 20, 1, true), { x: cx, y: cy, h: 3.05 });
  b.shape("lamp", new THREE.CircleGeometry(0.45, 16), { x: cx, y: cy, h: 2.78 }, { rotX: Math.PI / 2 });
}

function vanity(b: Builder, x0: number, x1: number, y0: number, y1: number, wallSide: "y0" | "y1" | "x0") {
  b.box(x0, x1, y0, y1, 0.3, 2.75, "cabinet", { edges: true });
  b.box(x0 - 0.04, x1 + 0.04, y0 - 0.04, y1 + 0.04, 2.75, 2.87, "counter", { edges: true });
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  b.box(cx - 0.6, cx + 0.6, cy - 0.45, cy + 0.45, 2.87, 2.9, "ceramic");
  if (wallSide === "y0") {
    b.shape("hardware", new THREE.CylinderGeometry(0.04, 0.05, 0.6, 12), { x: cx, y: y0 + 0.25, h: 3.15 });
    b.box(x0 + 0.1, x1 - 0.1, y0, y0 + 0.04, 3.6, 6.3, "mirror");
  } else if (wallSide === "x0") {
    b.shape("hardware", new THREE.CylinderGeometry(0.04, 0.05, 0.6, 12), { x: x0 + 0.25, y: cy, h: 3.15 });
    b.box(x0, x0 + 0.04, y0 + 0.1, y1 - 0.1, 3.6, 6.3, "mirror");
  }
}

function toilet(b: Builder, x: number, y: number, facing: "+y" | "+x") {
  if (facing === "+y") {
    b.box(x - 0.6, x + 0.6, y, y + 0.6, 1.4, 2.6, "ceramic", { edges: true });
    b.shape("ceramic", new THREE.CylinderGeometry(0.62, 0.42, 1.35, 24), { x, y: y + 1.4, h: 0.68 }, { scale: [1, 1, 1.3], edges: true });
  } else {
    b.box(x, x + 0.6, y - 0.6, y + 0.6, 1.4, 2.6, "ceramic", { edges: true });
    b.shape("ceramic", new THREE.CylinderGeometry(0.62, 0.42, 1.35, 24), { x: x + 1.4, y, h: 0.68 }, { scale: [1.3, 1, 1], edges: true });
  }
}

export function buildFurniture(m: Materials, ink: THREE.Material): THREE.Group {
  const b = new Builder();
  // Drawn stand-ins that loaded models replace, each in its own named group.
  // (The dining area is left open: Calum asked for no dining set in the render.)
  const sets: Record<string, Builder> = {
    sofa: new Builder(),
    armchairs: new Builder(),
    coffee: new Builder(),
  };

  // Living room: rug, sofa against the right wall, two armchairs, round coffee table
  b.box(33.4, 42.0, 19.2, 28.4, 0, 0.03, "rug");
  const so = sets.sofa;
  so.box(42.3, 45.1, 20.3, 27.3, 0.3, 1.5, "fabric", { edges: true });
  so.box(44.2, 45.1, 20.3, 27.3, 1.5, 2.9, "fabric", { edges: true });
  so.box(42.3, 45.1, 20.3, 20.9, 1.5, 2.1, "fabric");
  so.box(42.3, 45.1, 26.7, 27.3, 1.5, 2.1, "fabric");
  for (const y of [21.0, 23.8, 26.6]) so.box(42.5, 44.2, y - 1.35, y + 1.35, 1.5, 1.85, "fabric");
  sets.coffee.shape("wood", new THREE.CylinderGeometry(1.55, 1.55, 0.12, 40), { x: 37.7, y: 23.8, h: 1.4 }, { edges: true });
  sets.coffee.shape("wood", new THREE.CylinderGeometry(1.2, 1.3, 1.35, 40, 1, true), { x: 37.7, y: 23.8, h: 0.67 });
  for (const [x, y, rot] of [
    [33.6, 20.0, -0.6],
    [33.6, 27.6, 0.6],
  ] as const) {
    sets.armchairs.shape("fabric", new THREE.BoxGeometry(2.6, 1.3, 2.6), { x, y, h: 0.95 }, { rotY: rot, edges: true });
    sets.armchairs.shape("fabric", new THREE.BoxGeometry(0.5, 1.4, 2.6), { x: x - Math.cos(rot) * 1.05, y: y + Math.sin(rot) * 1.05, h: 2.1 }, { rotY: rot });
  }
  // Mini-split heat pump head over the sofa
  b.box(44.55, 45.17, 22.4, 25.2, 6.95, 7.8, "trimInt", { edges: true });

  // Bedroom 1: king bed against the back wall
  bed(b, 10.3, 17.0, 8.6, 15.5, "y1");
  nightstand(b, 8.5, 10.1, 13.9, 15.5);
  nightstand(b, 17.2, 18.8, 13.9, 15.5);
  b.box(11.2, 16.2, 0.5, 2.1, 0, 2.8, "wood", { edges: true });
  b.box(11.5, 15.9, 6.9, 8.2, 0, 1.5, "fabric", { edges: true });
  b.box(9.0, 18.3, 4.0, 13.5, 0, 0.03, "rug");

  // Bedroom 2: queen bed against the left wall
  bed(b, 48.5, 55.2, 3.6, 8.7, "x0");
  nightstand(b, 48.5, 50.0, 1.8, 3.3);
  nightstand(b, 48.5, 50.0, 9.0, 10.5);

  // Bedroom 3: double bed against the right end wall
  bed(b, 67.2, 73.5, 2.6, 7.4, "x1");
  nightstand(b, 72.0, 73.5, 0.7, 2.3);

  // Bathroom 1: alcove tub with tiled walls, toilet, vanity
  // Tub: an apron and rim around a sunken basin
  b.box(70.9, 73.5, 10.1, 15.5, 0, 0.9, "ceramic", { edges: true });
  b.box(70.9, 71.15, 10.1, 15.5, 0.9, 1.75, "ceramic", { edges: true });
  b.box(73.25, 73.5, 10.1, 15.5, 0.9, 1.75, "ceramic");
  b.box(71.15, 73.25, 10.1, 10.35, 0.9, 1.75, "ceramic");
  b.box(71.15, 73.25, 15.25, 15.5, 0.9, 1.75, "ceramic");
  b.box(73.45, 73.5, 10.1, 15.5, 1.75, 7.0, "backsplash");
  b.box(70.9, 73.5, 15.45, 15.5, 1.75, 7.0, "backsplash");
  b.box(70.9, 73.5, 10.075, 10.12, 1.75, 7.0, "backsplash");
  b.shape("hardware", new THREE.CylinderGeometry(0.02, 0.02, 5.4, 6), { x: 70.95, y: 12.8, h: 6.6 }, { rotX: Math.PI / 2 });
  b.box(70.9, 70.95, 10.2, 12.0, 1.8, 6.5, "linen");
  toilet(b, 69.3, 10.075, "+y");
  vanity(b, 65.4, 68.0, 10.075, 11.9, "y0");

  // Bathroom 2: shower in the back corner, toilet, vanity
  b.box(0.5, 4.9, 12.7, 15.5, 0, 0.3, "ceramic", { edges: true });
  b.box(0.5, 0.55, 12.7, 15.5, 0.3, 7.0, "backsplash");
  b.box(0.5, 4.9, 15.45, 15.5, 0.3, 7.0, "backsplash");
  b.box(4.85, 4.9, 12.7, 15.5, 0.3, 6.6, "glass");
  b.box(0.5, 4.9, 12.68, 12.72, 0.3, 6.6, "glass");
  b.box(2.5, 2.9, 15.3, 15.45, 6.0, 6.4, "hardware");
  toilet(b, 0.5, 8.6, "+x");
  vanity(b, 3.4, 7.0, 6.775, 8.5, "y0");

  // Laundry: front-load washer and dryer, shelf above
  for (const x0 of [20.1, 22.6]) {
    b.box(x0, x0 + 2.35, 0.5, 2.9, 0, 3.2, "ceramic", { edges: true });
    b.shape("blackGlass", new THREE.CylinderGeometry(0.75, 0.75, 0.06, 32), { x: x0 + 1.17, y: 2.92, h: 1.6 }, { rotX: Math.PI / 2 });
  }
  b.box(19.9, 25.1, 0.5, 1.6, 5.0, 5.1, "wood");

  // Walk-in pantry shelving
  for (const h of [1.5, 3.0, 4.5, 6.0]) {
    b.box(19.9, 21.2, 9.5, 15.5, h, h + 0.08, "wood", { edges: true });
    b.box(19.9, 25.1, 14.2, 15.5, h, h + 0.08, "wood");
  }
  // Walk-in closet: rods and shelves
  b.box(0.5, 1.9, 0.5, 6.4, 5.5, 5.58, "wood", { edges: true });
  b.box(0.5, 7.5, 0.5, 1.9, 5.5, 5.58, "wood");
  const group = b.build(m, ink, "furniture");
  for (const [name, sb] of Object.entries(sets)) group.add(sb.build(m, ink, name));
  return group;
}

// ---------- Living room feature wall: fireplace or media wall ----------

export function buildFeatureWall(state: ConfiguratorState, m: Materials, ink: THREE.Material): THREE.Group {
  const b = new Builder();
  const x0 = 30.17;
  if (state.hasFireplace) {
    // Stone-clad bump-out with a linear electric fireplace, a wood mantel, TV above.
    b.box(x0, 31.6, 20.2, 27.4, 0, PLAN.ceiling, { px: "stone", pz: "stone", nz: "stone", py: "stone", ny: null }, { edges: true });
    b.box(31.6, 31.64, 21.3, 26.3, 1.25, 2.75, "blackGlass");
    // A row of flames glowing just in front of the glass, uneven in height.
    for (let i = 0; i < 18; i++) {
      const y = 21.75 + i * 0.235;
      const top = 1.62 + 0.38 * Math.abs(Math.sin(i * 1.7)) + 0.12 * Math.sin(i * 0.9);
      b.box(31.645, 31.66, y, y + 0.17, 1.42, top, "fire");
    }
    b.box(31.645, 31.66, 21.6, 26.0, 1.4, 1.5, "fire");
    b.box(31.6, 32.2, 20.0, 27.6, 0, 0.5, "stone", { edges: true });
    b.box(31.6, 32.1, 20.6, 27.0, 3.35, 3.6, "wood", { edges: true });
    b.box(31.6, 31.72, 21.6, 26.0, 4.3, 6.9, "blackGlass", { edges: true });
  } else {
    // Media wall: TV on the wall over a low console.
    b.box(x0, 31.6, 20.6, 27.0, 0.4, 2.0, "wood", { edges: true });
    b.box(30.25, 30.37, 21.6, 26.0, 3.6, 6.2, "blackGlass", { edges: true });
    b.shape("ceramic", new THREE.CylinderGeometry(0.25, 0.32, 0.9, 16), { x: 30.9, y: 21.3, h: 2.45 });
    b.shape("plant", new THREE.SphereGeometry(0.55, 14, 10), { x: 30.9, y: 21.3, h: 3.2 });
  }
  return b.build(m, ink, "feature-wall");
}

// ---------- Plan sheet labels ----------

export function buildLabels(): THREE.Group {
  const group = new THREE.Group();
  group.name = "labels";
  const mk = (tex: THREE.Texture, w: number, h: number, x: number, y: number, hh: number) => {
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * FT, h * FT), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(wx(x), wy(hh), wz(y));
    mesh.renderOrder = 5;
    group.add(mesh);
  };
  for (const r of ROOMS) {
    const tex = labelTexture([
      { text: r.name, size: 64, weight: 500, spacing: 3 },
      { text: r.dims, size: 54, weight: 400 },
    ], 1024, 256);
    mk(tex, 8, 2, r.label[0], r.label[1], 0.6);
  }
  // Title block on the sheet, above the plan
  const title = labelTexture(
    [
      { text: "BALI", size: 150, weight: 300, spacing: 30 },
      { text: "CASITA SERIES", size: 44, weight: 500, spacing: 10 },
      { text: `3 BEDROOMS  |  2 BATHROOMS  |  1,440 SQ. FT.  |  74'-0" x 16'-0"`, size: 40, weight: 500, spacing: 4 },
    ],
    2048,
    512
  );
  mk(title, 44, 11, 14, 40, 0.6);
  return group;
}

/** Plan point where the world origin sits, for camera maths elsewhere. */
export const HOUSE_CENTER = new THREE.Vector3(wx(37), wy(4), wz(12));
