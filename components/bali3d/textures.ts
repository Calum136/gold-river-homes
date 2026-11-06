import * as THREE from "three";

// ============================================
// Textures. Scanned CC0 sets from Poly Haven and ambientCG live in
// public/3d/tex/<name>/{diff,nor,rough}.jpg (sources in public/3d/ASSETS.json).
// Siding profiles, standing-seam metal and asphalt shingles are drawn here in
// code instead: no CC0 scan matches them, and drawing them lets the siding
// direction and colour change live.
//
// Every surface in the scene carries world-space UVs in metres, so a texture's
// repeat is 1 / (the real-world size one tile covers, in metres).
// ============================================

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
let maxAnisotropy = 8;
let onAnyLoad: (() => void) | null = null;

export function configureTextures(anisotropy: number, onLoad: () => void) {
  maxAnisotropy = anisotropy;
  onAnyLoad = onLoad;
}

function prep(t: THREE.Texture, tileMeters: number, srgb: boolean) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tileMeters, 1 / tileMeters);
  t.anisotropy = maxAnisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type TexMap = "diff" | "nor" | "rough";

/** A scanned texture map, tiled every `tileMeters`. */
export function scan(name: string, map: TexMap, tileMeters: number): THREE.Texture {
  const key = `${name}/${map}@${tileMeters}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = loader.load(`/3d/tex/${name}/${map}.jpg`, () => onAnyLoad?.());
  prep(t, tileMeters, map === "diff");
  cache.set(key, t);
  return t;
}

export interface MapSet {
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
}

export function scanSet(name: string, tileMeters: number, maps: TexMap[] = ["diff", "nor", "rough"]): MapSet {
  return {
    map: maps.includes("diff") ? scan(name, "diff", tileMeters) : undefined,
    normalMap: maps.includes("nor") ? scan(name, "nor", tileMeters) : undefined,
    roughnessMap: maps.includes("rough") ? scan(name, "rough", tileMeters) : undefined,
  };
}

// ---------- Procedural maps ----------

const IN = 0.0254;

interface Drawn {
  /** Height field 0..1, row-major, row 0 at the top of the tile. */
  height: Float32Array;
  /** Albedo, 0..255 RGB. */
  albedo: Uint8ClampedArray;
  size: number;
}

function blank(size: number): Drawn {
  return { height: new Float32Array(size * size), albedo: new Uint8ClampedArray(size * size * 4), size };
}

// Small deterministic noise so the drawn tiles look the same on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function toCanvasTexture(pixels: Uint8ClampedArray, size: number, tileMeters: [number, number], srgb: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  img.data.set(pixels);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tileMeters[0], 1 / tileMeters[1]);
  t.anisotropy = maxAnisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function normalFromHeight(d: Drawn, strength: number): Uint8ClampedArray {
  const { size, height } = d;
  const out = new Uint8ClampedArray(size * size * 4);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const v = new THREE.Vector3();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const du = (at(x + 1, y) - at(x - 1, y)) * 0.5;
      const dv = (at(x, y - 1) - at(x, y + 1)) * 0.5; // canvas rows run down, texture v runs up
      v.set(-du * strength, -dv * strength, 1).normalize();
      const i = (y * size + x) * 4;
      out[i] = (v.x * 0.5 + 0.5) * 255;
      out[i + 1] = (v.y * 0.5 + 0.5) * 255;
      out[i + 2] = (v.z * 0.5 + 0.5) * 255;
      out[i + 3] = 255;
    }
  }
  return out;
}

function grey(d: Drawn, i: number, value: number) {
  const g = Math.max(0, Math.min(255, value * 255));
  d.albedo[i * 4] = d.albedo[i * 4 + 1] = d.albedo[i * 4 + 2] = g;
  d.albedo[i * 4 + 3] = 255;
}

export type SidingStyle = "horizontal" | "vertical" | "board-batten";

/**
 * Vinyl siding profiles, drawn in white so the material colour sets the hue:
 *   horizontal:   7" lap courses with a shadow line under each butt edge
 *   vertical:     8" boards with a 1.25" raised batten (vinyl board and batten)
 *   board-batten: 12" boards with wide 2.5" battens, the premium wide profile
 */
export function sidingMaps(style: SidingStyle): { map: THREE.Texture; normalMap: THREE.Texture; tile: [number, number] } {
  const key = `siding:${style}`;
  const hit = cache.get(key + ":map");
  if (hit) {
    return { map: hit, normalMap: cache.get(key + ":nor")!, tile: (hit.userData.tile as [number, number]) };
  }
  const size = 512;
  const d = blank(size);
  const r = rng(style.length * 977);
  let tile: [number, number];
  let strength: number;

  if (style === "horizontal") {
    const courses = 6;
    tile = [courses * 7 * IN, courses * 7 * IN];
    strength = 26;
    const per = size / courses;
    // Embossed wood-grain streaks along the courses.
    const grain = new Float32Array(size);
    for (let y = 0; y < size; y++) grain[y] = (r() - 0.5) * 0.04;
    for (let y = 0; y < size; y++) {
      const t = 1 - ((y % per) / per); // 0 at the butt edge (bottom of a course), 1 at its top
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const fine = (r() - 0.5) * 0.015 + grain[(y + Math.floor(x / 37)) % size] * 0.5;
        d.height[i] = 1 - 0.75 * t + fine;
        // Shadow cast by the course above onto the top of this one.
        const shadow = t > 0.86 ? (t - 0.86) / 0.14 : 0;
        grey(d, i, 0.97 - 0.42 * shadow * shadow + fine);
      }
    }
  } else {
    const vertical = style === "vertical";
    const bay = vertical ? 8 * IN : 14.5 * IN;
    const batten = vertical ? 1.25 * IN : 2.5 * IN;
    const bays = vertical ? 6 : 4;
    tile = [bays * bay, bays * bay];
    strength = vertical ? 30 : 34;
    const per = size / bays;
    const bw = (batten / bay) * per;
    for (let x = 0; x < size; x++) {
      const p = x % per; // batten sits at the start of each bay
      const edge = Math.min(p, bw - p);
      const onBatten = p < bw;
      const h = onBatten ? Math.min(1, 0.35 + edge * 0.35) : 0;
      // Soft shade on the boards either side of a batten.
      const nearBatten = onBatten ? 0 : Math.min(p - bw, per - p);
      const ao = onBatten ? 1 : 1 - 0.22 * Math.exp(-nearBatten / 3);
      for (let y = 0; y < size; y++) {
        const i = y * size + x;
        const fine = (r() - 0.5) * 0.012;
        d.height[i] = h + fine;
        grey(d, i, 0.96 * ao + fine);
      }
    }
  }

  const map = toCanvasTexture(d.albedo, size, tile, true);
  const normalMap = toCanvasTexture(normalFromHeight(d, strength), size, tile, false);
  map.userData.tile = tile;
  cache.set(key + ":map", map);
  cache.set(key + ":nor", normalMap);
  return { map, normalMap, tile };
}

/** Standing-seam metal roofing, 16" panels with a raised seam. Seams run along texture v. */
export function metalRoofMaps(): { map: THREE.Texture; normalMap: THREE.Texture } {
  const hit = cache.get("metal:map");
  if (hit) return { map: hit, normalMap: cache.get("metal:nor")! };
  const size = 512;
  const d = blank(size);
  const r = rng(4242);
  const panels = 4;
  const tile: [number, number] = [panels * 16 * IN, panels * 16 * IN];
  const per = size / panels;
  const seam = (1.1 / 16) * per;
  for (let x = 0; x < size; x++) {
    const p = x % per;
    const onSeam = p < seam;
    // Two shallow stiffening ribs in each pan.
    const rib = Math.exp(-(((p - per * 0.38) / 2.2) ** 2)) + Math.exp(-(((p - per * 0.68) / 2.2) ** 2));
    const h = onSeam ? 1 - Math.abs(p / seam - 0.5) * 0.6 : rib * 0.08;
    for (let y = 0; y < size; y++) {
      const i = y * size + x;
      const streak = (r() - 0.5) * 0.02;
      d.height[i] = h;
      grey(d, i, (onSeam ? 1 : 0.93) + streak);
    }
  }
  const map = toCanvasTexture(d.albedo, size, tile, true);
  const normalMap = toCanvasTexture(normalFromHeight(d, 22), size, tile, false);
  cache.set("metal:map", map);
  cache.set("metal:nor", normalMap);
  return { map, normalMap };
}

/** Architectural (laminated) asphalt shingles in a weathered charcoal blend. Rows run along texture u. */
export function shingleMaps(): { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture } {
  const hit = cache.get("shingle:map");
  if (hit) return { map: hit, normalMap: cache.get("shingle:nor")!, roughnessMap: cache.get("shingle:rough")! };
  const size = 512;
  const d = blank(size);
  const rough = new Uint8ClampedArray(size * size * 4);
  const r = rng(1789);
  const rows = 8;
  const exposure = 5.625 * IN;
  const tile: [number, number] = [rows * exposure, rows * exposure];
  const per = size / rows;
  // Per row, tabs of random width with random tones.
  const rowTabs: { start: number; tone: number }[][] = [];
  for (let row = 0; row < rows; row++) {
    const tabs: { start: number; tone: number }[] = [];
    let x = Math.floor(r() * 40);
    while (x < size + 60) {
      tabs.push({ start: x % size, tone: 0.19 + r() * 0.13 });
      x += 34 + Math.floor(r() * 46);
    }
    tabs.sort((a, b) => a.start - b.start);
    rowTabs.push(tabs);
  }
  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / per);
    const t = 1 - (y % per) / per; // 0 at the exposed bottom edge, 1 under the row above
    const tabs = rowTabs[row];
    for (let x = 0; x < size; x++) {
      let tab = tabs[tabs.length - 1];
      for (const candidate of tabs) if (candidate.start <= x) tab = candidate;
      const gap = tabs.some((tb) => Math.abs(x - tb.start) < 1.5);
      const i = y * size + x;
      const granule = (r() - 0.5) * 0.09;
      const shadow = t > 0.82 ? ((t - 0.82) / 0.18) ** 1.5 : 0;
      d.height[i] = 1 - 0.6 * t + granule * 0.4 - (gap ? 0.3 : 0);
      const tone = tab.tone * (1 - 0.55 * shadow) * (gap ? 0.6 : 1) + granule * 0.35;
      // Slightly warm grey granules.
      d.albedo[i * 4] = Math.max(0, Math.min(255, tone * 262));
      d.albedo[i * 4 + 1] = Math.max(0, Math.min(255, tone * 255));
      d.albedo[i * 4 + 2] = Math.max(0, Math.min(255, tone * 248));
      d.albedo[i * 4 + 3] = 255;
      const rv = 0.82 + (r() - 0.5) * 0.12;
      rough[i * 4] = rough[i * 4 + 1] = rough[i * 4 + 2] = rv * 255;
      rough[i * 4 + 3] = 255;
    }
  }
  const map = toCanvasTexture(d.albedo, size, tile, true);
  const normalMap = toCanvasTexture(normalFromHeight(d, 18), size, tile, false);
  const roughnessMap = toCanvasTexture(rough, size, tile, false);
  cache.set("shingle:map", map);
  cache.set("shingle:nor", normalMap);
  cache.set("shingle:rough", roughnessMap);
  return { map, normalMap, roughnessMap };
}

/** Text drawn onto a transparent canvas, for the plan sheet's room labels and title. */
export function labelTexture(lines: { text: string; size: number; weight?: number; spacing?: number }[], width = 1024, height = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1c1b19";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const total = lines.reduce((sum, l) => sum + l.size * 1.25, 0);
  let y = height / 2 - total / 2;
  for (const line of lines) {
    y += line.size * 0.625;
    ctx.font = `${line.weight ?? 400} ${line.size}px "Poppins", "Helvetica Neue", Arial, sans-serif`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${line.spacing ?? 0}px`;
    ctx.fillText(line.text, width / 2, y);
    y += line.size * 0.625;
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAnisotropy;
  return t;
}

export function disposeTextures() {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}
