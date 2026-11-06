import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ConfiguratorState } from "@/lib/pricing";
import { Builder } from "./builder";
import { inkify } from "./materials";
import type { Materials } from "./materials";
import { PLAN, gradeFor } from "./plan";
import { FT, P, wx, wy, wz } from "./space";
import { scan } from "./textures";

// ============================================
// Front-yard landscaping, drawn in code rather than loaded: curved mulch beds
// with paver edging, a river-rock strip along the foundation, rounded
// evergreens, hydrangeas, lavender, ornamental grasses, two small maples,
// planters at the steps and path lights along the walk.
//
// Each plant type is built once and drawn as one instanced mesh, so a full
// front garden costs a handful of draw calls and very few triangles, needs no
// downloads and no licences, and lays itself out around whichever entry
// (landing, porch or vestibule) the buyer picks.
// ============================================

// ---------- Small deterministic noise ----------

function hash(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), s(xf));
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), s(xf));
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), s(xf));
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), s(xf));
  return lerp(lerp(x00, x10, s(yf)), lerp(x01, x11, s(yf)), s(zf));
}

const fbm = (x: number, y: number, z: number) => 0.55 * noise3(x, y, z) + 0.3 * noise3(x * 2.1, y * 2.1, z * 2.1) + 0.15 * noise3(x * 4.3, y * 4.3, z * 4.3);

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// ---------- Plant geometry (built in feet, base at y = 0) ----------

/** A lumpy, leafy mound: an icosphere pushed in and out by noise, flattened underneath. */
function bush(seed: number, flatten = 1, detail = 3): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("normal");
  g = mergeVertices(g);
  const pos = g.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 2.4 + seed, v.y * 2.4, v.z * 2.4);
    v.multiplyScalar(0.82 + n * 0.42);
    v.y *= flatten;
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.15;
    pos.setXYZ(i, v.x, v.y + 0.3, v.z);
    // Shade: darker underneath and in the hollows, lighter on top.
    const shade = THREE.MathUtils.clamp(0.45 + 0.35 * ((v.y + 0.3) / 1.2) + 0.35 * (n - 0.5), 0.25, 1);
    colors.set([shade, shade, shade], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/** Ornamental grass: a fountain of thin, arching blades. */
function grassClump(seed: number): THREE.BufferGeometry {
  const r = rng(seed);
  const positions: number[] = [];
  const colors: number[] = [];
  const base = new THREE.Color("#4f5f33");
  const tip = new THREE.Color("#d2c48e");
  const blades = 34;
  for (let i = 0; i < blades; i++) {
    const a = r() * Math.PI * 2;
    const lean = 0.25 + r() * 0.55;
    const h = 1.5 + r() * 0.9;
    const w = 0.05 + r() * 0.03;
    const segs = 4;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      const out = lean * t * t * h * 0.9;
      pts.push(new THREE.Vector3(Math.cos(a) * (out + 0.08), t * h * (1 - 0.25 * lean * t), Math.sin(a) * (out + 0.08)));
    }
    const side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    for (let k = 0; k < segs; k++) {
      const w0 = w * (1 - k / segs);
      const w1 = w * (1 - (k + 1) / segs);
      const a0 = pts[k].clone().addScaledVector(side, -w0);
      const b0 = pts[k].clone().addScaledVector(side, w0);
      const a1 = pts[k + 1].clone().addScaledVector(side, -w1);
      const b1 = pts[k + 1].clone().addScaledVector(side, w1);
      for (const p of [a0, b0, a1, b0, b1, a1]) positions.push(p.x, p.y, p.z);
      const c0 = base.clone().lerp(tip, k / segs);
      const c1 = base.clone().lerp(tip, (k + 1) / segs);
      for (const c of [c0, c0, c1, c0, c1, c1]) colors.push(c.r, c.g, c.b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/** Flower heads sitting on a mound: round clusters (hydrangea) or upright spikes (lavender). */
function flowers(kind: "clusters" | "spikes", seed: number): THREE.BufferGeometry {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const count = kind === "clusters" ? 8 : 22;
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 0.75;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    if (kind === "clusters") {
      const head = new THREE.IcosahedronGeometry(0.28 + r() * 0.1, 1);
      head.translate(x, 0.95 + (0.75 - rad) * 0.35, z);
      parts.push(head);
    } else {
      const spike = new THREE.ConeGeometry(0.045, 0.55, 5);
      spike.rotateZ(-x * 0.5);
      spike.rotateX(z * 0.5);
      spike.translate(x * 0.9, 0.85 + (0.75 - rad) * 0.25, z * 0.9);
      parts.push(spike);
    }
  }
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A small Japanese maple: a short trunk with a layered, lumpy crown. */
function mapleCrown(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const blobs: [number, number, number, number][] = [
    [0, 4.6, 0, 1.5],
    [1.2, 4.0, 0.4, 1.15],
    [-1.1, 4.1, -0.3, 1.2],
    [0.3, 3.7, -1.1, 1.05],
    [-0.3, 3.8, 1.1, 1.05],
    [0.2, 5.4, 0.1, 0.95],
  ];
  blobs.forEach(([x, y, z, s], i) => {
    const g = bush(i * 3.1 + 2, 0.75, 2);
    g.scale(s, s, s);
    g.translate(x, y - 0.3 * s, z);
    parts.push(g);
  });
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

function mapleTrunk(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.1, 0.17, 3.8, 8).translate(0, 1.9, 0);
  const b1 = new THREE.CylinderGeometry(0.05, 0.09, 1.8, 6).translate(0, 0.9, 0).rotateZ(0.7).translate(0.15, 3.0, 0);
  const b2 = new THREE.CylinderGeometry(0.05, 0.09, 1.7, 6).translate(0, 0.85, 0).rotateZ(-0.65).translate(-0.15, 2.9, 0.1);
  const merged = mergeGeometries([trunk, b1, b2].map((g) => g.toNonIndexed()), false)!;
  return merged;
}

/** A clipped evergreen cone for the planters. */
function topiary(): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.ConeGeometry(0.75, 2.6, 18, 10);
  g.deleteAttribute("normal");
  g = mergeVertices(g);
  const pos = g.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 3 + 7, v.y * 3, v.z * 3);
    const k = 0.85 + n * 0.3;
    pos.setXYZ(i, v.x * k, v.y + 1.3, v.z * k);
    const shade = 0.55 + 0.4 * n;
    colors.set([shade, shade, shade], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

// ---------- Kit: geometries and materials made once per scene ----------

export interface LandscapeKit {
  geo: Record<"boxwood" | "hydrangea" | "hydrangeaFlowers" | "lavender" | "lavenderFlowers" | "grass" | "mapleCrown" | "mapleTrunk" | "topiary" | "stone" | "planter" | "bollard", THREE.BufferGeometry>;
  foliage: THREE.MeshStandardMaterial;
  bloom: THREE.MeshStandardMaterial;
  blades: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  planter: THREE.MeshStandardMaterial;
}

export function createLandscapeKit(): LandscapeKit {
  const leaf = scan("lawn", "diff", 0.5);
  const leafNor = scan("lawn", "nor", 0.5);
  const geo: LandscapeKit["geo"] = {
    boxwood: bush(1.3),
    hydrangea: bush(4.7, 0.8),
    hydrangeaFlowers: flowers("clusters", 11),
    lavender: bush(8.2, 0.55, 2),
    lavenderFlowers: flowers("spikes", 23),
    grass: grassClump(5),
    mapleCrown: mapleCrown(),
    mapleTrunk: mapleTrunk(),
    topiary: topiary(),
    stone: new THREE.BoxGeometry(0.7, 0.28, 0.32, 2, 1, 1).translate(0, 0.1, 0),
    planter: new THREE.BoxGeometry(1.7, 1.7, 1.7).translate(0, 0.85, 0),
    bollard: new THREE.CylinderGeometry(0.12, 0.14, 1.9, 12).translate(0, 0.95, 0),
  };
  for (const g of Object.values(geo)) g.userData.shared = true;
  const foliage = new THREE.MeshStandardMaterial({ map: leaf, normalMap: leafNor, vertexColors: true, roughness: 0.92 });
  const bloom = new THREE.MeshStandardMaterial({ roughness: 0.75 });
  const blades = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 });
  const bark = new THREE.MeshStandardMaterial({ color: "#4e3b2c", roughness: 0.95 });
  const planter = new THREE.MeshStandardMaterial({ color: "#2d3033", roughness: 0.55 });
  for (const mat of [foliage, bloom, blades, bark, planter]) inkify(mat, true);
  return { geo, foliage, bloom, blades, bark, planter };
}

export function disposeLandscapeKit(kit: LandscapeKit) {
  for (const g of Object.values(kit.geo)) g.dispose();
  for (const m of [kit.foliage, kit.bloom, kit.blades, kit.bark, kit.planter]) m.dispose();
}

// ---------- Layout ----------

/** Plan x range kept free of tall planting in front of the insulation cutaway (site.ts CUTAWAY, plus a margin). */
const CUTAWAY_CLEAR: [number, number] = [67.6, 74.4];

interface Placement {
  x: number;
  y: number;
  scale: number;
  rot: number;
  color?: string;
}

interface Bed {
  x0: number;
  x1: number;
  /** Deepest point of the curved front edge, in feet in front of the wall. */
  depth: number;
  /** Beds in front of a porch start at its deck edge, not the wall. */
  back: number;
}

/** The curved front edge of a bed at x. */
function edgeY(bed: Bed, x: number): number {
  const t = THREE.MathUtils.clamp((x - bed.x0) / (bed.x1 - bed.x0), 0, 1);
  return bed.back - (1.6 + (bed.depth - 1.6) * Math.pow(Math.sin(Math.PI * t), 0.7));
}

export function buildLandscape(state: ConfiguratorState, kit: LandscapeKit, m: Materials): THREE.Group {
  const group = new THREE.Group();
  group.name = "landscape";
  const GRADE = gradeFor(state.foundationType);
  const fd = PLAN.frontDoor;
  const porch = state.hasFrontPorch;
  const vestibule = !!state.hasVestibule;
  const entryX0 = porch ? fd.x - 12 : vestibule ? fd.x - 4 : fd.x - 3;
  const entryX1 = porch ? fd.x + 12 : vestibule ? fd.x + 4 : fd.x + 3;

  const beds: Bed[] = [
    { x0: 2, x1: entryX0 - 1.0, depth: 4.6, back: -1.0 },
    { x0: entryX1 + 1.0, x1: 72.5, depth: 5.2, back: -1.0 },
  ];
  if (porch) {
    // Two low beds along the front of the porch, either side of its steps.
    beds.push({ x0: fd.x - 11.5, x1: fd.x - 3.2, depth: 3.0, back: -6.6 });
    beds.push({ x0: fd.x + 3.2, x1: fd.x + 11.5, depth: 3.0, back: -6.6 });
  }

  const b = new Builder();
  const placements: Record<string, Placement[]> = {
    boxwood: [],
    hydrangea: [],
    lavender: [],
    grass: [],
    maple: [],
    stone: [],
  };
  const r = rng(97);

  for (const bed of beds) {
    if (bed.x1 - bed.x0 < 3) continue;
    // Mulch: a slightly raised, softly edged bed following the curve
    const shape = new THREE.Shape();
    const steps = 40;
    shape.moveTo(wx(bed.x0), -wz(bed.back));
    for (let i = 0; i <= steps; i++) {
      const x = bed.x0 + ((bed.x1 - bed.x0) * i) / steps;
      shape.lineTo(wx(x), -wz(edgeY(bed, x)));
    }
    shape.lineTo(wx(bed.x1), -wz(bed.back));
    shape.closePath();
    const mulch = new THREE.ExtrudeGeometry(shape, { depth: 0.16 * FT, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 2 });
    mulch.rotateX(-Math.PI / 2);
    mulch.translate(0, wy(GRADE) - 0.02, 0);
    const pos = mulch.getAttribute("position");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = pos.getX(i);
      uv[i * 2 + 1] = -pos.getZ(i);
    }
    mulch.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    b.add("mulch", mulch);

    // Paver edging along the curve
    let prev = new THREE.Vector2(bed.x0, edgeY(bed, bed.x0));
    let carry = 0;
    for (let i = 1; i <= 200; i++) {
      const x = bed.x0 + ((bed.x1 - bed.x0) * i) / 200;
      const p = new THREE.Vector2(x, edgeY(bed, x));
      carry += p.distanceTo(prev);
      if (carry >= 0.74) {
        carry = 0;
        const ang = Math.atan2(p.y - prev.y, p.x - prev.x);
        placements.stone.push({ x: p.x, y: p.y - 0.12, scale: 1, rot: ang });
      }
      prev = p;
    }

    // Planting: evergreens at the back, hydrangeas between, lavender and grasses
    // at the front. Taller plants stay clear of the insulation cutaway.
    const backRow = bed.back - 0.9;
    const keepClear = (x: number) => bed.back === -1.0 && x > CUTAWAY_CLEAR[0] && x < CUTAWAY_CLEAR[1];
    for (let x = bed.x0 + 1.6; x < bed.x1 - 1.2; x += 4.2) {
      if (keepClear(x)) continue;
      placements.boxwood.push({ x: x + (r() - 0.5) * 0.4, y: backRow - r() * 0.3, scale: 0.95 + r() * 0.3, rot: r() * 6.28 });
    }
    if (bed.depth >= 4) {
      for (let x = bed.x0 + 4.4; x < bed.x1 - 3; x += 8.4) {
        if (keepClear(x)) continue;
        placements.hydrangea.push({ x, y: backRow - 1.5, scale: 1.05 + r() * 0.2, rot: r() * 6.28, color: r() > 0.5 ? "#e9edf4" : "#9fb3dc" });
      }
    }
    let alt = 0;
    for (let x = bed.x0 + 1.3; x < bed.x1 - 1.0; x += 2.6) {
      const y = edgeY(bed, x) + 0.85;
      if (alt++ % 2 === 0) placements.lavender.push({ x, y, scale: 0.85 + r() * 0.2, rot: r() * 6.28 });
      else placements.grass.push({ x, y: y - 0.1, scale: 0.85 + r() * 0.25, rot: r() * 6.28 });
    }
  }

  // A small red maple just off each front corner of the house, framing it.
  placements.maple.push({ x: -4.5, y: -4.5, scale: 1, rot: 0.6 });
  placements.maple.push({ x: 78.5, y: -4.5, scale: 1.08, rot: 2.1 });

  // River-rock strip along the foundation (the drip line under the eaves)
  b.box(1, entryX0 - 0.3, -1.0, -0.05, GRADE, GRADE + 0.12, "drainRock");
  b.box(entryX1 + 0.3, 73, -1.0, -0.05, GRADE, GRADE + 0.12, "drainRock");

  // Planters either side of the steps, and path lights along the walk
  const stepsFront = porch && !vestibule ? -6.5 : vestibule ? -6 : -5;
  const stepDrop = Math.max(2, Math.round((-0.22 - GRADE) / 0.62)) * 0.92;
  const planterY = stepsFront - Math.min(stepDrop, 4) * 0.5;
  const planters: Placement[] = [
    { x: fd.x - 3.4, y: planterY, scale: 1, rot: 0 },
    { x: fd.x + 3.4, y: planterY, scale: 1, rot: 0 },
  ];
  // Path lights in pairs along the walk from the steps to the edge of the yard.
  const lights: Placement[] = [];
  for (const y of [-11.5, -16.0]) lights.push({ x: 40.8, y, scale: 1, rot: 0 }, { x: 46.4, y, scale: 1, rot: 0 });
  for (const l of lights) b.shape("lamp", new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12), { x: l.x, y: l.y, h: GRADE + 1.95 });

  const built = b.build(m, null, "landscape-beds");
  built.traverse((o) => (o.castShadow = false));
  group.add(built);

  // Instanced plants
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, list: Placement[], size: number, tint: string | null, lift = 0, cast = true) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const color = new THREE.Color();
    list.forEach((p, i) => {
      const s = size * p.scale * FT;
      m4.compose(P(p.x, p.y, GRADE + lift), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot), new THREE.Vector3(s, s, s));
      mesh.setMatrixAt(i, m4);
      if (tint || p.color) mesh.setColorAt(i, color.set(p.color ?? tint!).offsetHSL(0, 0, (hash(p.x, p.y, 3) - 0.5) * 0.06));
    });
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  add(kit.geo.boxwood, kit.foliage, placements.boxwood, 1.15, "#4a6b35", 0.1);
  add(kit.geo.hydrangea, kit.foliage, placements.hydrangea, 1.3, "#5d7f3e", 0.1);
  add(kit.geo.hydrangeaFlowers, kit.bloom, placements.hydrangea, 1.3, null, 0.1);
  add(kit.geo.lavender, kit.foliage, placements.lavender, 0.85, "#7f9273", 0.1);
  add(kit.geo.lavenderFlowers, kit.bloom, placements.lavender, 0.85, "#8a74c4", 0.1);
  add(kit.geo.grass, kit.blades, placements.grass, 1, null, 0.1, false);
  add(kit.geo.mapleCrown, kit.foliage, placements.maple, 1, "#8e3324", 0);
  add(kit.geo.mapleTrunk, kit.bark, placements.maple, 1, null, 0);
  add(kit.geo.stone, m.paving, placements.stone, 1, null, 0.02, false);
  add(kit.geo.planter, kit.planter, planters, 1, null, 0);
  add(kit.geo.topiary, kit.foliage, planters, 1, "#3d5a2e", 1.7);
  add(kit.geo.bollard, kit.planter, lights, 1, null, 0, false);
  return group;
}
