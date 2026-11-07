import * as THREE from "three";
import { CABINET_STAINS, cabinetColors, sidingColors, metalRoofColors, interiorGroups } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";
import { metalRoofMaps, scan, scanSet, shingleMaps, sidingMaps } from "./textures";
import type { SidingStyle } from "./textures";

// ============================================
// Materials, one per surface "slot". Meshes keep their slot material for
// life; choosing an option changes the material in place (colour, maps,
// roughness), so a selection shows on the very next frame.
//
// Every material is also "ink aware": a shared reveal radius decides whether
// a fragment is drawn as the printed plan (paper and black ink) or as the real
// material. The plan sheet is the same model as the walkable house.
// ============================================

/** Shared by every ink-aware material. Set by the engine each frame. */
export const INK = {
  /** World radius (metres, measured on the ground plane) inside which real materials show. */
  uInkR: { value: -50 },
  uInkSoft: { value: 3 },
  uInkCenter: { value: new THREE.Vector2(0, 0) },
};

// Display-space colours for the drawing (written after tone mapping and sRGB
// conversion, so they land exactly).
type Rgb = [number, number, number];
export const PAPER: Rgb = [0.953, 0.941, 0.914];
const INK_BLACK: Rgb = [0.09, 0.09, 0.085];

interface InkStyle {
  /** Colour of upward-facing surfaces in the drawing. Cut walls are black. */
  top: Rgb;
  side: Rgb;
  /** Alpha in the drawing; glass vanishes. */
  alpha?: number;
  /** Not drawn on the plan at all (loaded furniture, trees). */
  vanish?: boolean;
}

/** Make a material (for example one loaded with a model) part of the drawing. */
export function inkify(mat: THREE.Material, vanish = true) {
  patchInk(mat, { top: PAPER, side: PAPER, vanish });
}

function patchInk(mat: THREE.Material, style: InkStyle) {
  const top = new THREE.Vector3(...style.top);
  const side = new THREE.Vector3(...style.side);
  const alpha = style.alpha ?? 1;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uInkR = INK.uInkR;
    shader.uniforms.uInkSoft = INK.uInkSoft;
    shader.uniforms.uInkCenter = INK.uInkCenter;
    shader.uniforms.uInkTop = { value: top };
    shader.uniforms.uInkSide = { value: side };
    shader.uniforms.uInkAlpha = { value: alpha };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vInkWorld;\nvarying vec3 vInkNormal;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvInkWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvInkNormal = normalize(mat3(modelMatrix) * objectNormal);"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vInkWorld;\nvarying vec3 vInkNormal;\nuniform float uInkR;\nuniform float uInkSoft;\nuniform vec2 uInkCenter;\nuniform vec3 uInkTop;\nuniform vec3 uInkSide;\nuniform float uInkAlpha;"
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        {
          float inkD = distance(vInkWorld.xz, uInkCenter);
          float ink = smoothstep(uInkR - uInkSoft, uInkR, inkD);
          ${style.vanish ? "if (ink > 0.5) discard;" : ""}
          if (ink > 0.0) {
            vec3 n = normalize(vInkNormal);
            float up = step(0.6, n.y);
            float shade = 0.84 + 0.16 * clamp(dot(n, normalize(vec3(0.45, 0.75, 0.5))), 0.0, 1.0);
            vec3 inkCol = mix(uInkSide * shade, uInkTop, up);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, inkCol, ink);
            gl_FragColor.a = mix(gl_FragColor.a, uInkAlpha, ink);
          }
        }`
      );
  };
  mat.customProgramCacheKey = () => `ink:${style.top.join(",")}:${alpha}:${style.vanish ? 1 : 0}`;
}

/** Ink lines for the drawing: black where the plan shows, gone where materials have swept in. */
export function makeInkLineMaterial(): THREE.LineBasicMaterial {
  const mat = new THREE.LineBasicMaterial({ color: 0x161614, transparent: true, depthWrite: false, toneMapped: false });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uInkR = INK.uInkR;
    shader.uniforms.uInkSoft = INK.uInkSoft;
    shader.uniforms.uInkCenter = INK.uInkCenter;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vInkWorld;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvInkWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vInkWorld;\nuniform float uInkR;\nuniform float uInkSoft;\nuniform vec2 uInkCenter;"
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        gl_FragColor.a *= smoothstep(uInkR - uInkSoft, uInkR, distance(vInkWorld.xz, uInkCenter));`
      );
  };
  mat.customProgramCacheKey = () => "ink-line";
  return mat;
}

export type Slot =
  | "wall"
  | "wallThin"
  | "siding"
  | "sidingThin"
  | "shake"
  | "trimExt"
  | "skirting"
  | "roof"
  | "soffit"
  | "ceiling"
  | "floorMain"
  | "floorTile"
  | "trimInt"
  | "doorInt"
  | "doorFront"
  | "windowFrame"
  | "glass"
  | "cabinet"
  | "counter"
  | "backsplash"
  | "hardware"
  | "steel"
  | "blackGlass"
  | "ceramic"
  | "mirror"
  | "fabric"
  | "linen"
  | "wood"
  | "rug"
  | "stone"
  | "fire"
  | "lamp"
  | "led"
  | "deck"
  | "paving"
  | "plant"
  // Lot
  | "grass"
  | "gravel"
  | "asphalt"
  | "mulch"
  | "rockFace"
  // Below ground and inside walls (seen in the see-through and cutaway views)
  | "concrete"
  | "drainRock"
  | "pipeWater"
  | "pipeSewer"
  | "lid"
  | "steelPipe"
  | "stud"
  | "osb"
  | "wrap"
  | "insBatt"
  | "insFoam"
  | "insBoard"
  | "vapour";

export type Materials = Record<Slot, THREE.MeshStandardMaterial>;

const std = (params: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(params);

/** Interior surfaces get less of the outdoor sky light, which can't see into rooms. */
const INTERIOR_ENV = 0.42;

export function createMaterials(): Materials {
  const plaster = scanSet("wall-interior", 1.6, ["nor", "rough"]);
  const tile = scanSet("floor-vinyl-tile", 1.6);
  const concrete = scanSet("concrete", 2.4);
  const stone = scanSet("stone", 1.4);
  const shakes = scanSet("roof-shakes", 1.4);
  const subway = scanSet("floor-bath-tile", 0.9);
  const paving = scanSet("paving", 1.8);

  const m: Materials = {
    wall: std({ color: "#F5F2ED", roughness: 0.92, normalMap: plaster.normalMap, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: INTERIOR_ENV }),
    wallThin: std({}),
    siding: std({ color: "#F2EDE3", roughness: 0.62 }),
    sidingThin: std({}),
    shake: std({ ...shakes, color: "#d9cbb4", roughness: 0.95 }),
    trimExt: std({ color: "#f4f2ec", roughness: 0.5 }),
    skirting: std({ ...concrete, color: "#c9c6c0", roughness: 1 }),
    roof: std({ color: "#ffffff" }),
    soffit: std({ color: "#f1efe9", roughness: 0.6 }),
    // Ceilings face down, so the outdoor sky light reaching them is the lawn's
    // green. Real ceilings are lit by light bouncing off the floor and walls,
    // so they get a little neutral glow of their own instead.
    ceiling: std({ color: "#f7f6f2", roughness: 0.95, envMapIntensity: 0.3, emissive: "#f1eee8", emissiveIntensity: 0.06 }),
    floorMain: std({ roughness: 0.6, envMapIntensity: INTERIOR_ENV }),
    floorTile: std({ ...tile, color: "#e9e6e0", envMapIntensity: INTERIOR_ENV, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    trimInt: std({ color: "#f8f7f3", roughness: 0.38, envMapIntensity: INTERIOR_ENV }),
    doorInt: std({ color: "#f6f5f1", roughness: 0.42, envMapIntensity: INTERIOR_ENV }),
    doorFront: std({ color: "#2b2f33", roughness: 0.4 }),
    windowFrame: std({ color: "#f7f7f4", roughness: 0.35 }),
    glass: std({ color: "#9fb2bd", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 1.6 }),
    cabinet: std({ envMapIntensity: INTERIOR_ENV }),
    counter: std({ envMapIntensity: INTERIOR_ENV * 1.2 }),
    backsplash: std({ ...subway, color: "#f7f6f2", roughness: 0.2, envMapIntensity: INTERIOR_ENV }),
    hardware: std({ color: "#c0c0b8", metalness: 1, roughness: 0.35, envMapIntensity: 0.9 }),
    steel: std({ color: "#c9ccce", metalness: 1, roughness: 0.32, envMapIntensity: 0.8 }),
    blackGlass: std({ color: "#121314", metalness: 0.2, roughness: 0.12, envMapIntensity: 0.8 }),
    ceramic: std({ color: "#fbfbf9", roughness: 0.12, envMapIntensity: INTERIOR_ENV * 1.4 }),
    mirror: std({ color: "#dfe4e6", metalness: 1, roughness: 0.03, envMapIntensity: 1 }),
    fabric: std({ color: "#8a8378", roughness: 0.95, envMapIntensity: INTERIOR_ENV }),
    linen: std({ color: "#eeebe4", roughness: 0.92, envMapIntensity: INTERIOR_ENV }),
    wood: std({ ...scanSet("cabinet-wood", 1.0), color: "#c9a27a", roughness: 0.55, envMapIntensity: INTERIOR_ENV }),
    rug: std({ color: "#b9ab97", roughness: 1, envMapIntensity: INTERIOR_ENV }),
    stone: std({ ...stone, color: "#d4cec5", roughness: 0.9, envMapIntensity: INTERIOR_ENV }),
    fire: std({ color: "#000000", emissive: "#ff8a3a", emissiveIntensity: 2.6 }),
    lamp: std({ color: "#fffaf0", emissive: "#ffe2b8", emissiveIntensity: 0.4, roughness: 0.6 }),
    led: std({ color: "#fff6e6", emissive: "#ffe6c4", emissiveIntensity: 0, roughness: 0.5 }),
    deck: std({ ...scanSet("cabinet-wood", 1.4), color: "#a8805c", roughness: 0.8 }),
    paving: std({ ...paving, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }),
    plant: std({ color: "#4b6b3a", roughness: 0.9 }),
    grass: std({ ...scanSet("lawn", 2.0), roughness: 1 }),
    // Ground overlays sit just above the lawn; a depth offset keeps them from flickering against it.
    gravel: std({ ...scanSet("gravel", 2.0), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    asphalt: std({ ...scanSet("asphalt", 3.0), color: "#8d8d8d", roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    mulch: std({ ...scanSet("mulch", 1.6), color: "#8a7a6c", roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    rockFace: std({ ...stone, color: "#a9a49c", roughness: 1 }),
    concrete: std({ ...scanSet("concrete", 2.4), color: "#bdbab4", roughness: 1 }),
    drainRock: std({ ...scanSet("gravel", 1.2), color: "#a8a39a", roughness: 1 }),
    pipeWater: std({ color: "#2f6fb5", roughness: 0.45 }),
    pipeSewer: std({ color: "#3f7f3f", roughness: 0.5 }),
    lid: std({ color: "#3e6b3a", roughness: 0.7 }),
    steelPipe: std({ color: "#8f9396", metalness: 0.9, roughness: 0.45 }),
    stud: std({ color: "#e6cc9a", roughness: 0.85 }),
    osb: std({ color: "#cfa86c", roughness: 0.9 }),
    wrap: std({ color: "#f2f3f5", roughness: 0.7 }),
    insBatt: std({ ...scanSet("roof-shakes", 0.5, ["nor"]), color: "#f2a3b0", roughness: 1 }),
    insFoam: std({ ...scanSet("concrete", 0.6, ["nor"]), color: "#f1d27a", roughness: 0.9 }),
    insBoard: std({ color: "#8fb7de", roughness: 0.8 }),
    vapour: std({ color: "#eef3f6", roughness: 0.3, transparent: true, opacity: 0.55, depthWrite: false }),
  };

  // Drawing styles: cut walls are solid black, everything else is paper.
  const blackTop: InkStyle = { top: INK_BLACK, side: PAPER };
  const paper: InkStyle = { top: PAPER, side: PAPER };
  for (const [slot, mat] of Object.entries(m) as [Slot, THREE.MeshStandardMaterial][]) {
    if (slot === "wallThin" || slot === "sidingThin") continue;
    patchInk(mat, slot === "wall" || slot === "siding" ? blackTop : slot === "glass" ? { ...paper, alpha: 0 } : paper);
  }
  m.wallThin = m.wall.clone();
  m.sidingThin = m.siding.clone();
  patchInk(m.wallThin, paper);
  patchInk(m.sidingThin, paper);
  for (const mat of Object.values(m)) mat.shadowSide = THREE.FrontSide;
  return m;
}

const PAINT: Record<string, string> = {
  "builder-white": "#F3F0EA",
  "warm-neutral": "#D9C9B0",
  "premium-custom": "#9DAE9C",
};

const HARDWARE: Record<string, { color: string; metalness: number; roughness: number }> = {
  "brushed-nickel": { color: "#c4c3bc", metalness: 1, roughness: 0.32 },
  "matte-black": { color: "#202020", metalness: 0.35, roughness: 0.62 },
  "aged-bronze": { color: "#6e4b2a", metalness: 0.85, roughness: 0.42 },
};

function setMaps(mat: THREE.MeshStandardMaterial, maps: { map?: THREE.Texture | null; normalMap?: THREE.Texture | null; roughnessMap?: THREE.Texture | null }) {
  const before = `${!!mat.map}${!!mat.normalMap}${!!mat.roughnessMap}`;
  if ("map" in maps) mat.map = maps.map ?? null;
  if ("normalMap" in maps) mat.normalMap = maps.normalMap ?? null;
  if ("roughnessMap" in maps) mat.roughnessMap = maps.roughnessMap ?? null;
  if (`${!!mat.map}${!!mat.normalMap}${!!mat.roughnessMap}` !== before) mat.needsUpdate = true;
}

/** Point every material at the buyer's current selections. */
export function applySelections(m: Materials, state: ConfiguratorState) {
  // Siding: profile (direction) from the style, hue from the colour.
  const style = (["horizontal", "vertical", "board-batten"].includes(state.sidingStyleId) ? state.sidingStyleId : "horizontal") as SidingStyle;
  const siding = sidingMaps(style);
  const sidingHex = sidingColors.find((c) => c.id === state.sidingColorId)?.swatchHex ?? "#F2EDE3";
  for (const mat of [m.siding, m.sidingThin]) {
    setMaps(mat, { map: siding.map, normalMap: siding.normalMap });
    mat.color.set(sidingHex);
    mat.normalScale.set(1, 1);
    mat.roughness = 0.6;
  }

  // Roof
  if (state.roofTypeId === "metal") {
    const metal = metalRoofMaps();
    setMaps(m.roof, { map: metal.map, normalMap: metal.normalMap, roughnessMap: null });
    m.roof.color.set(metalRoofColors.find((c) => c.id === state.metalRoofColorId)?.swatchHex ?? "#3C434A");
    m.roof.metalness = 0.6;
    m.roof.roughness = 0.36;
    m.roof.envMapIntensity = 1.1;
  } else {
    const shingles = shingleMaps();
    setMaps(m.roof, { map: shingles.map, normalMap: shingles.normalMap, roughnessMap: shingles.roughnessMap });
    m.roof.color.set("#ffffff");
    m.roof.metalness = 0;
    m.roof.roughness = 1;
    m.roof.envMapIntensity = 0.9;
  }

  // Walls
  const paint = PAINT[state.paintPackageId] ?? PAINT["builder-white"];
  m.wall.color.set(paint);
  m.wallThin.color.set(paint);

  // Floors in the living areas, bedrooms and halls
  if (state.flooringId === "hardwood") {
    setMaps(m.floorMain, scanSet("floor-hardwood", 2.0));
    m.floorMain.color.set("#ffffff");
    m.floorMain.roughness = 1;
  } else {
    setMaps(m.floorMain, scanSet("floor-laminate", 2.0));
    m.floorMain.color.set("#f3efe8");
    m.floorMain.roughness = 1;
  }

  // Counters (kitchen and vanities)
  if (state.countertopsId === "quartz") {
    setMaps(m.counter, scanSet("counter-quartz", 1.6));
    m.counter.color.set("#ffffff");
    m.counter.roughness = 0.9;
    m.counter.metalness = 0;
  } else {
    setMaps(m.counter, { map: scan("counter-laminate", "diff", 0.7), normalMap: null, roughnessMap: null });
    m.counter.color.set("#b9b4ac");
    m.counter.roughness = 0.42;
  }

  // Cabinets: a painted colour on MDF or solid wood doors, or a stain that
  // shows the solid wood's grain.
  const solidWood = state.cabinetStyleId === "premium-shaker";
  const cabinetHex = cabinetColors.find((c) => c.id === state.cabinetColorId)?.swatchHex ?? "#F2F0EB";
  if (solidWood && CABINET_STAINS.includes(state.cabinetColorId)) {
    setMaps(m.cabinet, scanSet("cabinet-wood", 0.9));
    m.cabinet.normalScale.set(1, 1);
    m.cabinet.color.set(state.cabinetColorId === "espresso" ? "#6a4a36" : "#f0d4a8");
    m.cabinet.roughness = 1;
  } else {
    // Painted. Solid wood keeps a faint grain under the paint; MDF is smooth.
    setMaps(m.cabinet, { map: null, normalMap: solidWood ? scan("cabinet-wood", "nor", 0.9) : scan("cabinet-painted", "nor", 1.0), roughnessMap: null });
    m.cabinet.normalScale.set(solidWood ? 0.35 : 1, solidWood ? 0.35 : 1);
    m.cabinet.color.set(cabinetHex);
    m.cabinet.roughness = 0.45;
  }

  // Hardware: pulls, faucets and door handles
  const hw = HARDWARE[state.hardwareFinishId] ?? HARDWARE["brushed-nickel"];
  m.hardware.color.set(hw.color);
  m.hardware.metalness = hw.metalness;
  m.hardware.roughness = hw.roughness;

  // Lighting: the premium package adds under-cabinet LEDs.
  m.led.emissiveIntensity = state.lightingPackageId === "premium" ? 3.2 : 0;
}

/** Surfaces only ever seen indoors. They reflect a neutral room rather than the outdoor sky. */
export const INDOOR_SLOTS: Slot[] = [
  "wall",
  // The wall strips above and below windows: they must be lit like the rest of the wall.
  "wallThin",
  "ceiling",
  "floorMain",
  "floorTile",
  "trimInt",
  "doorInt",
  "cabinet",
  "counter",
  "backsplash",
  "steel",
  "blackGlass",
  "ceramic",
  "mirror",
  "fabric",
  "linen",
  "wood",
  "rug",
  "stone",
  "lamp",
  "led",
  "plant",
];

/** Ground cover for the lot: mown lawn, or leafy forest floor on a wooded lot. */
export function setGround(m: Materials, terrain: string) {
  if (terrain === "wooded") {
    setMaps(m.grass, scanSet("grass", 2.2));
    m.grass.color.set("#bfd09a");
  } else {
    setMaps(m.grass, scanSet("lawn", 2.0));
    m.grass.color.set(terrain === "coastal" ? "#e4e2c6" : "#ffffff");
  }
}

/** The paint package's palette, for anyone who wants to show it. */
export function paintPalette(id: string): string[] {
  return interiorGroups.find((g) => g.id === "paintPackage")?.options.find((o) => o.id === id)?.paletteHexes ?? [];
}

export function disposeMaterials(m: Materials) {
  for (const mat of Object.values(m)) mat.dispose();
}
