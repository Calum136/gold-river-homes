import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GroundedSkybox } from "three/examples/jsm/objects/GroundedSkybox.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ConfiguratorState } from "@/lib/pricing";
import { PRESETS, STOPS, Route, clonePose, isInside, makeRoute, planPose } from "./camera";
import type { Pose } from "./camera";
import { applySelections, createMaterials, disposeMaterials, inkify, INDOOR_SLOTS, INK, makeInkLineMaterial, PAPER, setGround } from "./materials";
import type { Materials, Slot } from "./materials";
import { PULSE_FOR } from "./guide";
import { buildCeiling, buildEntry, buildFeatureWall, buildFixtures, buildFloors, buildFurniture, buildKitchen, buildLabels, buildRoof, buildShell } from "./house";
import type { LightSpot } from "./house";
import { disposeGroup } from "./builder";
import { FURNITURE_PROPS, buildCutaway, buildFoundation, buildLot, buildUtilities, cutawayPlanes, lotProps, terrainFor, CUTAWAY } from "./site";
import type { PropPlacement } from "./site";
import { PLAN } from "./plan";
import { FLOOR_Y, P, wx, wz } from "./space";
import { configureTextures, disposeTextures } from "./textures";

// ============================================
// The Bali scene. One instance per stage. The React wrapper feeds it the
// configurator state and the screen in focus; the engine handles the camera
// tour, the plan-sheet reveal, live option changes and input.
// ============================================

export interface EngineOptions {
  /** Screen ids in flow order (lib/screens.ts). */
  screenIds: string[];
  /** The buyer scrolled the tour to another screen (0-based index). */
  onStepRequest: (index: number) => void;
  /** While scrolling: the screen the tour is passing, or null when it settles. */
  onScrollHint?: (index: number | null) => void;
  /** The view preset changed (null when back on the tour). */
  onPresetChange?: (id: string | null) => void;
  onReady?: () => void;
  /** A marker element the engine keeps pinned over the spot each decision changes. */
  callout?: HTMLElement | null;
}

const GOLD = new THREE.Color("#c4882a");
/** Lot models drawn as baked cut-outs rather than full meshes. */
const IMPOSTOR_MODELS = new Set(["pine", "shrub_b"]);
const PULSE_SECONDS = 1.1;

interface Flight {
  route: Route;
  t: number;
  duration: number;
  pFrom: number;
  pTo: number;
  toPreset: boolean;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const PROP_FILES: Record<string, string> = {
  pine: "/3d/models/pine/pine_sapling_small_1k.gltf",
  shrub_a: "/3d/models/shrub_a/shrub_04_1k.gltf",
  shrub_b: "/3d/models/shrub_b/shrub_02_1k.gltf",
  sofa: "/3d/models/sofa/sofa_02_1k.gltf",
  armchair: "/3d/models/armchair/mid_century_lounge_chair_1k.gltf",
  coffee_table: "/3d/models/coffee_table/coffee_table_round_01_1k.gltf",
  side_table: "/3d/models/side_table/side_table_01_1k.gltf",
  plant: "/3d/models/plant/potted_plant_04_1k.gltf",
  vase: "/3d/models/vase/ceramic_vase_01_1k.gltf",
  dining_table: "/3d/models/dining_table/dining_table_1k.gltf",
  dining_chair: "/3d/models/dining_chair/dining_chair_02_1k.gltf",
  stool: "/3d/models/stool/metal_stool_03_1k.gltf",
};

export class BaliEngine {
  private container: HTMLElement;
  private opts: EngineOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.05, 2000);
  private composer: EffectComposer | null = null;
  private gtao: GTAOPass | null = null;
  private highQuality: boolean;
  private reducedMotion: boolean;

  private m: Materials;
  private inkLines: THREE.LineBasicMaterial;
  private clipPlanes = cutawayPlanes();
  private clipOff = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e5), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e5)];

  // Scene graph
  private riser = new THREE.Group(); // scales everything above the floor for the rising walls
  private riserInner = new THREE.Group();
  private groups: Record<string, THREE.Object3D | null> = {};
  private frontDoor: THREE.Group | null = null;
  private paper: THREE.Mesh;
  private labels: THREE.Group;
  private sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
  private hemi = new THREE.HemisphereLight(0xe4ebf2, 0xb3aa9c, 0.35);
  private roomLights: THREE.PointLight[] = [];
  private spots: LightSpot[] = [];
  private skybox: GroundedSkybox | null = null;
  private roomEnv: THREE.Texture;
  private props = new THREE.Group();
  private lotPropGroup = new THREE.Group();
  private propCache = new Map<string, Promise<THREE.Object3D | null>>();
  private loadedSets = new Set<string>();
  private terrain = "";

  // Selections
  private state: ConfiguratorState | null = null;

  // Tour
  private ids: string[];
  private stops: Pose[] = [];
  private segments: Route[] = [];
  private p = 0;
  private pTarget = 0;
  private flight: Flight | null = null;
  private preset: { id: string; pose: Pose; cutaway: boolean } | null = null;
  private maxIndex: number;
  private scrollEnabled = true;
  private snapTimer: number | null = null;
  private scrolling = false;
  private scrollDir = 1;
  /** The screen the page currently shows, as far as the tour knows. */
  private reportedIndex = -1;

  // Look-around from dragging
  private yaw = 0;
  private pitch = 0;
  private dragging: { x: number; y: number; id: number } | null = null;

  // Frame state
  private pose: Pose = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 45 };
  private lastKey = "";
  private renderFrames = 4;
  private raf = 0;
  private clock = new THREE.Clock();
  private exposure = 1;
  private disposed = false;
  private resizeObs: ResizeObserver;
  private readyFired = false;
  private shadowDirty = true;
  private lastRise = -1;
  private lastEvening = -1;
  private perfFrames = 0;
  private perfTime = 0;
  private calloutAnchor: THREE.Vector3 | null = null;
  private calloutShown = false;
  private pulses = new Map<Slot, number>();
  private impostors = new Map<string, { geometry: THREE.BufferGeometry; material: THREE.MeshBasicMaterial }>();
  private impostorTargets: THREE.WebGLRenderTarget[] = [];

  constructor(container: HTMLElement, opts: EngineOptions) {
    this.container = container;
    this.opts = opts;
    this.ids = opts.screenIds;
    this.maxIndex = this.ids.length - 1;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    this.highQuality = !coarse && window.devicePixelRatio <= 2.5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.highQuality ? 1.75 : 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.localClippingEnabled = true;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.touchAction = "none";
    container.appendChild(this.renderer.domElement);

    configureTextures(this.renderer.capabilities.getMaxAnisotropy(), () => this.invalidate(3));

    this.m = createMaterials();
    this.inkLines = makeInkLineMaterial();
    // Indoors, reflections and soft fill come from a neutral room, not the
    // outdoor sky (which would tint stainless steel and ceilings green).
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.roomEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    for (const slot of INDOOR_SLOTS) {
      this.m[slot].envMap = this.roomEnv;
      this.m[slot].userData.baseEnv = this.m[slot].envMapIntensity;
    }
    for (const mat of [this.m.siding, this.m.sidingThin, this.m.wall, this.m.wallThin, this.m.trimExt, this.m.trimInt, this.m.windowFrame, this.m.glass]) {
      mat.clippingPlanes = this.clipOff;
      mat.clipIntersection = true;
    }

    // Lights. The sun's direction is read from the sky image once it loads.
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -17;
    sc.right = 17;
    sc.top = 17;
    sc.bottom = -17;
    sc.near = 1;
    sc.far = 120;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    this.sun.position.set(30, 40, 25);
    this.sun.target.position.set(0, 0, -2);
    this.scene.add(this.sun, this.sun.target, this.hemi);
    // Three pooled room lights: every light costs every material on every pixel.
    for (let i = 0; i < 3; i++) {
      const l = new THREE.PointLight(0xffd6a0, 0, 9, 2);
      this.roomLights.push(l);
      this.scene.add(l);
    }

    // Rising walls: everything above the floor scales about the floor line.
    this.riser.position.y = FLOOR_Y;
    this.riserInner.position.y = -FLOOR_Y;
    this.riser.add(this.riserInner);
    this.scene.add(this.riser);

    // The plan sheet's paper, just under the floor.
    const paperMat = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false });
    paperMat.color.setRGB(PAPER[0], PAPER[1], PAPER[2], THREE.SRGBColorSpace);
    this.paper = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), paperMat);
    this.paper.rotation.x = -Math.PI / 2;
    this.paper.position.y = FLOOR_Y - 0.03;
    this.paper.renderOrder = 1;
    this.scene.add(this.paper);
    this.labels = buildLabels();
    this.scene.add(this.labels);

    INK.uInkCenter.value.set(wx(PLAN.frontDoor.x), wz(0));
    this.scene.add(this.props, this.lotPropGroup);
    this.scene.background = new THREE.Color("#cfd8de");

    // Static parts of the house.
    this.setGroup("floors", buildFloors(this.m, this.inkLines), this.scene);
    this.setGroup("ceiling", buildCeiling(this.m), this.riserInner);
    this.setGroup("roof", buildRoof(this.m, this.inkLines), this.riserInner);
    this.setGroup("furniture", buildFurniture(this.m, this.inkLines), this.riserInner);

    this.buildStops();
    this.loadSky();
    this.loadFurnitureProps();

    if (this.highQuality) this.setupComposer();

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.resize();
    this.bindInput();
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------- Public API ----------

  /** Apply the buyer's selections. Only what changed is rebuilt. */
  setState(next: ConfiguratorState) {
    const prev = this.state;
    this.state = next;
    const changed = (...keys: (keyof ConfiguratorState)[]) => !prev || keys.some((k) => prev[k] !== next[k]);

    applySelections(this.m, next);
    // Make the change easy to spot: what changed glows gold for a moment.
    if (prev) {
      const now = performance.now() / 1000;
      for (const [key, slots] of Object.entries(PULSE_FOR) as [keyof ConfiguratorState, Slot[]][]) {
        if (prev[key] !== next[key]) for (const slot of slots) this.pulses.set(slot, now);
      }
    }
    if (changed("exteriorTrimId", "interiorTrimId")) {
      const { shell, frontDoor } = buildShell(next, this.m, this.inkLines);
      this.setGroup("shell", shell, this.riserInner);
      if (this.frontDoor) {
        this.riserInner.remove(this.frontDoor);
        disposeGroup(this.frontDoor);
      }
      this.frontDoor = frontDoor;
      frontDoor.traverse((o) => (o.castShadow = false));
      this.riserInner.add(frontDoor);
    }
    if (changed("hasFrontPorch", "hasVestibule")) {
      const entry = buildEntry(next, this.m, this.inkLines);
      entry.getObjectByName("vestibule-door")?.traverse((o) => (o.castShadow = false));
      this.setGroup("entry", entry, this.riserInner);
    }
    if (changed("cabinetStyleId")) this.setGroup("kitchen", buildKitchen(next, this.m, this.inkLines), this.riserInner);
    if (changed("lightingPackageId")) {
      const { group, spots } = buildFixtures(next, this.m, this.inkLines);
      this.setGroup("fixtures", group, this.riserInner);
      this.spots = spots;
    }
    if (changed("hasFireplace")) this.setGroup("feature", buildFeatureWall(next, this.m, this.inkLines), this.riserInner);
    if (changed("foundationType")) this.setGroup("foundation", buildFoundation(next, this.m, this.inkLines), this.scene);
    if (changed("waterType", "sewerType")) this.setGroup("utilities", buildUtilities(next, this.m, this.inkLines), this.scene);
    if (changed("insulationId", "sidingStyleId")) this.setGroup("cutaway", buildCutaway(next, this.m), this.scene);
    const terrain = terrainFor(next);
    if (terrain !== this.terrain) {
      this.terrain = terrain;
      setGround(this.m, terrain);
      this.setGroup("lot", buildLot(next, this.m), this.scene);
      this.placeLotProps(lotProps(next));
    }
    this.applyReplacements();
    this.shadowDirty = true;
    this.invalidate(4);
  }

  /** Fly (or scroll) to the stop for a screen. */
  setFocus(screenId: string, opts: { instant?: boolean } = {}) {
    const idx = this.ids.indexOf(screenId);
    if (idx < 0) return;
    // The page following the wheel: the tour is already on its way there.
    if (idx === this.reportedIndex && (this.scrolling || this.pTarget === idx) && !opts.instant && !this.preset) return;
    this.reportedIndex = idx;
    const leavingPreset = !!this.preset;
    if (this.preset) {
      this.preset = null;
      this.opts.onPresetChange?.(null);
    }
    this.yaw = 0;
    this.pitch = 0;
    if (opts.instant || this.reducedMotion) {
      this.flight = null;
      this.p = this.pTarget = idx;
      this.invalidate(4);
      return;
    }
    if (!leavingPreset && !this.flight && Math.abs(idx - this.p) <= 1.01) {
      this.pTarget = idx; // a neighbouring stop: glide along the tour
    } else {
      this.startFlight(this.currentPose(), this.stops[idx], this.p, idx, false);
      this.pTarget = idx;
    }
    this.invalidate(4);
  }

  /** Jump to a Google Maps style view without changing the decision. */
  setPreset(id: string | null) {
    if (!id) {
      const idx = Math.round(this.pTarget);
      if (this.preset) {
        this.preset = null;
        this.startFlight(this.currentPose(), this.stops[idx], idx, idx, false);
      }
      this.opts.onPresetChange?.(null);
      return;
    }
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const from = this.currentPose();
    this.preset = { id, pose: clonePose(preset.pose), cutaway: !!preset.cutaway };
    this.yaw = 0;
    this.pitch = 0;
    // Presets show the finished house: take the tour off the plan sheet first.
    const modelIdx = this.ids.indexOf("model");
    if (Math.abs(this.p - modelIdx) < 0.9) this.p = this.pTarget = modelIdx + 1;
    if (this.reducedMotion) {
      this.flight = null;
    } else {
      this.startFlight(from, this.preset.pose, this.p, this.p, true);
    }
    this.opts.onPresetChange?.(id);
    this.invalidate(4);
  }

  /** Pin the marker over a plan point (feet), or hide it. */
  setCallout(anchor: [number, number, number] | null) {
    this.calloutAnchor = anchor ? P(...anchor) : null;
    this.invalidate(2);
  }

  /** Furthest screen the tour may scroll to (0-based), and whether scrolling drives the tour at all. */
  setScrollLimit(maxIndex: number, enabled: boolean) {
    this.maxIndex = Math.max(0, Math.min(maxIndex, this.ids.length - 1));
    this.scrollEnabled = enabled;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    if (this.snapTimer) window.clearTimeout(this.snapTimer);
    this.resizeObs.disconnect();
    this.unbindInput();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    for (const child of this.labels.children) {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.dispose();
    }
    disposeMaterials(this.m);
    for (const { geometry, material } of this.impostors.values()) {
      geometry.dispose();
      material.dispose();
    }
    for (const rt of this.impostorTargets) rt.dispose();
    this.roomEnv.dispose();
    this.inkLines.dispose();
    disposeTextures();
    (this.scene.environment as THREE.Texture | null)?.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ---------- Building ----------

  private setGroup(name: string, group: THREE.Object3D, parent: THREE.Object3D) {
    const old = this.groups[name];
    if (old) {
      old.parent?.remove(old);
      disposeGroup(old);
    }
    this.groups[name] = group;
    parent.add(group);
  }

  private buildStops() {
    const aspect = this.camera.aspect || 1.6;
    this.stops = this.ids.map((id) => clonePose(id === "model" ? planPose(aspect) : STOPS[id] ?? STOPS.summary));
    this.segments = [];
    for (let i = 0; i < this.stops.length - 1; i++) this.segments.push(makeRoute(this.stops[i], this.stops[i + 1]));
  }

  private async loadSky() {
    try {
      const tex = await new HDRLoader().loadAsync("/3d/hdri/lilienstein_2k.hdr");
      if (this.disposed) {
        tex.dispose();
        return;
      }
      tex.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = tex;
      this.skybox = new GroundedSkybox(tex, 6, 160, 64);
      this.skybox.position.y = 6 - 0.02;
      this.skybox.userData.noAO = true;
      // Drawn first and never writing depth, so anything below ground (footings,
      // pipes, the septic tank) shows through when the lawn turns see-through.
      this.skybox.renderOrder = -10;
      this.scene.add(this.skybox);
      this.aimSunAtBrightestPixel(tex);
    } catch {
      // No sky image: the flat background and fill lights still show the house.
    }
    this.invalidate(4);
  }

  /** Point the sun light where the sun is in the sky image, so shadows agree with the sky. */
  private aimSunAtBrightestPixel(tex: THREE.DataTexture) {
    const { data, width, height } = tex.image as { data: Uint16Array | Float32Array; width: number; height: number };
    if (!data) return;
    const half = data instanceof Uint16Array;
    let best = -1;
    let bx = 0;
    let by = 0;
    for (let y = 0; y < height / 2; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const r = half ? THREE.DataUtils.fromHalfFloat(data[i]) : data[i];
        const g = half ? THREE.DataUtils.fromHalfFloat(data[i + 1]) : data[i + 1];
        const l = r + g;
        if (l > best) {
          best = l;
          bx = x;
          by = y;
        }
      }
    }
    const u = (bx + 0.5) / width;
    const v = 1 - (by + 0.5) / height;
    const lat = (v - 0.5) * Math.PI;
    const lon = (u - 0.5) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(lon) * Math.cos(lat), Math.sin(lat), Math.sin(lon) * Math.cos(lat));
    // Keep the sun high enough to light the front of the house in the afternoon.
    if (dir.y < 0.35) dir.y = 0.35;
    dir.normalize();
    this.sun.position.copy(dir.multiplyScalar(60));
    this.shadowDirty = true;
  }

  private setupComposer() {
    try {
      const size = this.renderer.getSize(new THREE.Vector2());
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      const gtao = new GTAOPass(this.scene, this.camera, size.x / 2, size.y / 2);
      gtao.blendIntensity = 0.85;
      gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 8 });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 8 });
      // Occlusion is soft, so it's worked out at half resolution: a quarter of the cost.
      const fullSetSize = gtao.setSize.bind(gtao);
      gtao.setSize = (w: number, h: number) => fullSetSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
      // Leave the sky dome and window glass out of the occlusion pass: the
      // inside of a huge sphere would read as fully occluded and go black.
      const pass = gtao as unknown as { _overrideVisibility: () => void; _visibilityCache: THREE.Object3D[] };
      const base = pass._overrideVisibility.bind(gtao);
      pass._overrideVisibility = () => {
        base();
        this.scene.traverse((o) => {
          if (o.userData.noAO && o.visible) {
            o.visible = false;
            pass._visibilityCache.push(o);
          }
        });
      };
      composer.addPass(gtao);
      composer.addPass(new OutputPass());
      this.composer = composer;
      this.gtao = gtao;
    } catch {
      this.composer = null;
      this.gtao = null;
    }
  }

  private loadProp(name: string): Promise<THREE.Object3D | null> {
    const hit = this.propCache.get(name);
    if (hit) return hit;
    const file = PROP_FILES[name];
    const promise = file
      ? new GLTFLoader()
          .loadAsync(file)
          .then((gltf) => {
            if (name === "pine") {
              // The file holds three saplings set apart; scaled up to tree size
              // they would spread over 15 m, so keep only the first.
              const extras: THREE.Object3D[] = [];
              gltf.scene.traverse((o) => {
                if (/_b$|_c$/.test(o.name)) extras.push(o);
              });
              for (const o of extras) o.parent?.remove(o);
            }
            gltf.scene.traverse((o) => {
              const mesh = o as THREE.Mesh;
              if (!mesh.isMesh) return;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              const indoor = name !== "pine" && !name.startsWith("shrub") && name !== "rock";
              for (const mat of mats) {
                const std = mat as THREE.MeshStandardMaterial;
                if (std.isMeshStandardMaterial && indoor) {
                  std.envMap = this.roomEnv;
                  std.envMapIntensity = 0.45;
                }
                inkify(mat, true);
              }
            });
            return gltf.scene as THREE.Object3D;
          })
          .catch(() => null)
      : Promise.resolve(null);
    this.propCache.set(name, promise);
    return promise;
  }

  private place(source: THREE.Object3D, p: PropPlacement): THREE.Object3D {
    const o = source.clone(true);
    o.position.copy(P(p.x, p.y, p.h));
    o.rotation.y = p.rotY ?? 0;
    if (Array.isArray(p.scale)) o.scale.set(...p.scale);
    else o.scale.setScalar(p.scale);
    return o;
  }

  private loadFurnitureProps() {
    for (const p of FURNITURE_PROPS) {
      this.loadProp(p.model).then((src) => {
        if (!src || this.disposed) return;
        // Furniture stands on the floor, so it rides on the rising walls.
        this.riserInner.add(this.place(src, p));
        if (p.replaces) this.loadedSets.add(p.replaces);
        this.applyReplacements();
        this.shadowDirty = true;
        this.invalidate(3);
      });
    }
  }

  private placeLotProps(list: PropPlacement[]) {
    for (const child of [...this.lotPropGroup.children]) {
      this.lotPropGroup.remove(child);
      if ((child as THREE.InstancedMesh).isInstancedMesh) (child as THREE.InstancedMesh).dispose();
    }
    const terrain = this.terrain;
    const byModel = new Map<string, PropPlacement[]>();
    for (const p of list) byModel.set(p.model, [...(byModel.get(p.model) ?? []), p]);
    for (const [model, placements] of byModel) {
      this.loadProp(model).then((src) => {
        if (!src || this.disposed || this.terrain !== terrain) return;
        if (IMPOSTOR_MODELS.has(model)) {
          // Background trees: one instanced cut-out for all of them.
          this.lotPropGroup.add(this.impostorInstances(model, src, placements));
        } else {
          for (const p of placements) {
            const placed = this.place(src, p);
            // Shrubs on the lot don't cast shadows: far cheaper, barely missed.
            placed.traverse((o) => (o.castShadow = false));
            this.lotPropGroup.add(placed);
          }
        }
        this.invalidate(3);
      });
    }
  }

  /**
   * A tree model is about 140,000 triangles. Seen across a lawn it reads just
   * as well as a picture of itself, so each tree type is rendered once into a
   * texture and drawn as two crossed cut-outs (four triangles), all of them in
   * one instanced draw call.
   */
  private impostorInstances(model: string, src: THREE.Object3D, placements: PropPlacement[]): THREE.InstancedMesh {
    let tmpl = this.impostors.get(model);
    if (!tmpl) {
      tmpl = this.bakeImpostor(src);
      this.impostors.set(model, tmpl);
    }
    const mesh = new THREE.InstancedMesh(tmpl.geometry, tmpl.material, placements.length);
    const m4 = new THREE.Matrix4();
    placements.forEach((p, i) => {
      const s = Array.isArray(p.scale) ? p.scale[1] : p.scale;
      m4.compose(P(p.x, p.y, p.h), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rotY ?? 0), new THREE.Vector3(s, s, s));
      mesh.setMatrixAt(i, m4);
    });
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.noAO = true;
    mesh.frustumCulled = false;
    return mesh;
  }

  private bakeImpostor(src: THREE.Object3D): { geometry: THREE.BufferGeometry; material: THREE.MeshBasicMaterial } {
    const box = new THREE.Box3().setFromObject(src);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const w = Math.max(size.x, size.z) * 1.05;
    const h = size.y * 1.03;
    const texW = 384;
    const texH = Math.min(1024, Math.round((texW * h) / w));
    const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.01, 200);
    cam.position.set(center.x, center.y, center.z + 50);
    cam.lookAt(center);
    const stage = new THREE.Scene();
    stage.add(new THREE.HemisphereLight(0xeef3ff, 0x55603f, 1.7));
    const key = new THREE.DirectionalLight(0xfff0d8, 2.4);
    key.position.set(4, 10, 8);
    stage.add(key);
    stage.add(src.clone(true));
    const rt = new THREE.WebGLRenderTarget(texW, texH, { samples: 4 });
    // Draw the real model, not its plan-sheet version, and on a clear background.
    const ink = INK.uInkR.value;
    INK.uInkR.value = 1e6;
    const prevTarget = this.renderer.getRenderTarget();
    const prevClear = this.renderer.getClearAlpha();
    const prevColor = this.renderer.getClearColor(new THREE.Color());
    this.renderer.setRenderTarget(rt);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(stage, cam);
    this.renderer.setRenderTarget(prevTarget);
    this.renderer.setClearColor(prevColor, prevClear);
    INK.uInkR.value = ink;
    rt.texture.generateMipmaps = true;

    const material = new THREE.MeshBasicMaterial({ map: rt.texture, alphaTest: 0.45, side: THREE.DoubleSide });
    const a = new THREE.PlaneGeometry(w, h).translate(center.x, h / 2 + box.min.y, 0);
    const b = a.clone().rotateY(Math.PI / 2);
    const geometry = mergeGeometries([a, b], false)!;
    this.impostorTargets.push(rt);
    return { geometry, material };
  }

  /** Hide drawn stand-ins whose loaded models have arrived, keeping their plan outlines. */
  private applyReplacements() {
    for (const name of this.loadedSets) {
      this.scene.traverse((o) => {
        if (o.name !== name) return;
        for (const child of o.children) if (!child.userData.ink) child.visible = false;
      });
    }
  }

  // ---------- Input ----------

  // The wheel drives the tour continuously: the camera follows the wheel, the
  // decision panel switches as the tour passes halfway to the next stop, and
  // when the wheel rests the camera glides on to the next stop in the
  // direction it was going. One notch is enough to move on.
  private onWheel = (e: WheelEvent) => {
    if (!this.scrollEnabled) return;
    e.preventDefault();
    if (this.preset) {
      this.setPreset(null);
      return;
    }
    if (this.flight) {
      // Take over from a flight wherever it has got to.
      this.flight = null;
      this.pTarget = this.p;
    }
    const delta = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    if (delta === 0) return;
    this.scrolling = true;
    this.scrollDir = Math.sign(delta);
    this.pTarget = THREE.MathUtils.clamp(this.pTarget + delta * 0.0032, 0, this.maxIndex);
    this.report(Math.round(this.pTarget));
    if (this.snapTimer) window.clearTimeout(this.snapTimer);
    this.snapTimer = window.setTimeout(() => {
      const settled =
        this.scrollDir > 0 ? Math.ceil(this.pTarget - 0.08) : Math.floor(this.pTarget + 0.08);
      this.pTarget = THREE.MathUtils.clamp(settled, 0, this.maxIndex);
      this.report(this.pTarget);
      this.scrolling = false;
      this.opts.onScrollHint?.(null);
    }, 180);
    this.invalidate(2);
  };

  /** Tell the page which screen the tour is on, once per change. */
  private report(index: number) {
    if (index === this.reportedIndex) return;
    this.reportedIndex = index;
    this.opts.onScrollHint?.(index);
    this.opts.onStepRequest(index);
  }

  private onPointerDown = (e: PointerEvent) => {
    this.dragging = { x: e.clientX, y: e.clientY, id: e.pointerId };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging || e.pointerId !== this.dragging.id) return;
    const dx = e.clientX - this.dragging.x;
    const dy = e.clientY - this.dragging.y;
    this.dragging.x = e.clientX;
    this.dragging.y = e.clientY;
    this.yaw = THREE.MathUtils.clamp(this.yaw - dx * 0.005, -Math.PI * 0.9, Math.PI * 0.9);
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.004, -0.6, 0.5);
    this.invalidate(2);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.dragging?.id === e.pointerId) this.dragging = null;
  };

  private bindInput() {
    const el = this.renderer.domElement;
    el.addEventListener("wheel", this.onWheel, { passive: false });
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointercancel", this.onPointerUp);
  }

  private unbindInput() {
    const el = this.renderer.domElement;
    el.removeEventListener("wheel", this.onWheel);
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointercancel", this.onPointerUp);
  }

  // ---------- Frame ----------

  private invalidate(frames = 2) {
    this.renderFrames = Math.max(this.renderFrames, frames);
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.buildStops();
    this.invalidate(3);
  }

  private startFlight(from: Pose, to: Pose, pFrom: number, pTo: number, toPreset: boolean) {
    const route = makeRoute(from, to);
    const duration = THREE.MathUtils.clamp(1.1 + route.length * 0.022, 1.2, 3.2);
    this.flight = { route, t: 0, duration, pFrom, pTo, toPreset };
  }

  /** Where the camera is right now, before drag offsets. */
  private currentPose(): Pose {
    return clonePose(this.pose);
  }

  private tourPose(p: number, out: Pose): Pose {
    const i = Math.min(Math.floor(p), this.segments.length);
    const f = p - i;
    if (f < 1e-4 || i >= this.segments.length) {
      const s = this.stops[Math.min(i, this.stops.length - 1)];
      out.pos.copy(s.pos);
      out.target.copy(s.target);
      out.fov = s.fov;
      return out;
    }
    // Half eased, half linear: the camera still settles gently at a stop but
    // doesn't stall at each one when the wheel carries it past several.
    return this.segments[i].at(0.5 * f + 0.5 * easeInOut(f), out);
  }

  private frame = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    let moving = false;

    // 1. Camera pose
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / f.duration);
      const e = easeInOut(f.t);
      f.route.at(e, this.pose);
      this.p = THREE.MathUtils.lerp(f.pFrom, f.pTo, e);
      moving = true;
      if (f.t >= 1) {
        this.flight = null;
        if (!f.toPreset) this.p = this.pTarget = f.pTo;
      }
    } else if (this.preset) {
      this.pose.pos.copy(this.preset.pose.pos);
      this.pose.target.copy(this.preset.pose.target);
      this.pose.fov = this.preset.pose.fov;
    } else {
      const k = 1 - Math.exp(-dt * 5.5);
      const before = this.p;
      this.p += (this.pTarget - this.p) * k;
      if (Math.abs(this.pTarget - this.p) < 1e-4) this.p = this.pTarget;
      if (this.p !== before) moving = true;
      this.tourPose(this.p, this.pose);
    }

    // 2. Look-around offsets
    const pos = this.pose.pos.clone();
    const target = this.pose.target.clone();
    if (this.yaw !== 0 || this.pitch !== 0) {
      const inside = isInside(pos);
      if (inside) {
        // Turn the head: rotate the look direction around the camera.
        const dir = target.clone().sub(pos);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        dir.applyAxisAngle(side, this.pitch);
        target.copy(pos).add(dir);
      } else {
        // Walk around the house: orbit the camera around what it looks at.
        const off = pos.clone().sub(target);
        off.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const side = new THREE.Vector3().crossVectors(off, new THREE.Vector3(0, 1, 0)).normalize();
        off.applyAxisAngle(side, -this.pitch);
        pos.copy(target).add(off);
        pos.y = Math.max(pos.y, 0.6);
      }
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(target);
    if (Math.abs(this.camera.fov - this.pose.fov) > 1e-3) {
      this.camera.fov = this.pose.fov;
      this.camera.updateProjectionMatrix();
    }
    // Keep near/far tight for depth precision (too loose and distant surfaces
    // flicker): very far on the plan sheet, a little closer outdoors than in.
    const camH = pos.y;
    const indoors = isInside(pos);
    const near = camH > 40 ? camH * 0.5 : indoors ? 0.08 : 0.25;
    const far = camH > 40 ? camH * 2.5 : 450;
    if (this.camera.near !== near || this.camera.far !== far) {
      this.camera.near = near;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();
    }

    // 3. Story effects driven by tour progress
    const atPreset = !!this.preset && !this.flight;
    const idx = (id: string) => this.ids.indexOf(id);
    const near1 = (id: string, a: number, b: number) => (idx(id) < 0 ? 0 : 1 - smooth(a, b, Math.abs(this.p - idx(id))));
    const dModel = Math.abs(this.p - idx("model"));
    const rise = this.preset ? 1 : smooth(0.08, 0.7, dModel);
    const reveal = this.preset ? 1 : smooth(0.05, 0.9, dModel);
    INK.uInkR.value = THREE.MathUtils.lerp(-8, 70, reveal);
    const inkActive = reveal < 0.999;
    this.riser.scale.y = THREE.MathUtils.lerp(0.035, 1, rise);
    if (Math.abs(rise - this.lastRise) > 1e-4) {
      this.lastRise = rise;
      this.shadowDirty = true;
    }
    (this.paper.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(0.25, 0.85, dModel);
    this.paper.visible = (this.paper.material as THREE.MeshBasicMaterial).opacity > 0.001;
    const labelAlpha = 1 - smooth(0.02, 0.22, dModel);
    this.labels.visible = labelAlpha > 0.001 && !this.preset;
    for (const c of this.labels.children) ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = labelAlpha;
    this.inkLines.visible = inkActive;

    // Roof and ceilings drop on once the walls are up; lifted off for cutaway views.
    const cut = !!this.preset?.cutaway;
    const roofIn = smooth(0.86, 1, rise);
    const roof = this.groups.roof;
    if (roof) {
      roof.visible = roofIn > 0.001 && !cut;
      roof.position.y = (1 - roofIn) * 4;
    }
    if (this.groups.ceiling) this.groups.ceiling.visible = rise > 0.999 && !cut;
    // Porch and vestibule roofs arrive with the main roof, not ahead of it.
    for (const part of ["entry:roof", "entry:soffit"]) {
      const o = this.groups.entry?.getObjectByName(part);
      if (o) o.visible = roofIn > 0.001 && !cut;
    }

    // Evening light for the lighting decision
    const evening = near1("lightingPackage", 0.35, 0.9) * (atPreset ? 0 : 1);
    this.sun.intensity = 3.2 * (1 - 0.88 * evening);
    this.hemi.intensity = 0.35 * (1 - 0.7 * evening);
    this.scene.environmentIntensity = 1 - 0.85 * evening;
    this.scene.backgroundIntensity = 1 - 0.75 * evening;
    if (this.skybox) ((this.skybox.material as THREE.MeshBasicMaterial).color ?? new THREE.Color()).setScalar(1 - 0.72 * evening);
    this.m.lamp.emissiveIntensity = 0.35 + 2.8 * evening;
    if (Math.abs(evening - this.lastEvening) > 1e-3) {
      this.lastEvening = evening;
      for (const slot of INDOOR_SLOTS) {
        const mat = this.m[slot];
        mat.envMapIntensity = (mat.userData.baseEnv as number) * (1 - 0.75 * evening);
      }
    }
    const premium = this.state?.lightingPackageId === "premium";
    this.m.led.emissiveIntensity = premium ? 0.8 + 3.0 * evening : 0;
    this.updateRoomLights(evening, premium);
    // Baked tree cut-outs carry their own light, so dim them by hand at evening;
    // and keep the lot's trees off the plan sheet.
    for (const { material } of this.impostors.values()) material.color.setScalar(1 - 0.72 * evening);
    this.lotPropGroup.visible = reveal > 0.6;

    // See-through ground for the foundation, water and wastewater decisions
    const xray = atPreset ? 0 : Math.max(near1("foundation", 0.3, 0.85), near1("water", 0.3, 0.85), near1("sewer", 0.3, 0.85));
    this.m.grass.opacity = 1 - 0.88 * xray;
    this.m.mulch.opacity = 1 - 0.88 * xray;
    this.m.gravel.opacity = 1 - 0.88 * xray;
    if (this.groups.utilities) this.groups.utilities.visible = xray > 0.01 || reveal > 0.99;
    if (this.groups.foundation) this.groups.foundation.visible = rise > 0.5;

    // Insulation cutaway beside the front door
    const insulation = atPreset ? 0 : near1("insulation", 0.3, 0.7);
    const cutOn = insulation > 0.5;
    for (const mat of [this.m.siding, this.m.sidingThin, this.m.wall, this.m.wallThin, this.m.trimExt, this.m.trimInt, this.m.windowFrame, this.m.glass]) {
      mat.clippingPlanes = cutOn ? this.clipPlanes : this.clipOff;
    }
    if (this.groups.cutaway) this.groups.cutaway.visible = cutOn;

    // Changed surfaces glow gold and fade back
    if (this.pulses.size) {
      moving = true;
      const now = performance.now() / 1000;
      for (const [slot, start] of this.pulses) {
        const mat = this.m[slot];
        if (mat.userData.baseEmissive === undefined) {
          mat.userData.baseEmissive = mat.emissive.clone();
          mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
        }
        const t = (now - start) / PULSE_SECONDS;
        const base = mat.userData.baseEmissive as THREE.Color;
        const baseI = mat.userData.baseEmissiveIntensity as number;
        if (t >= 1) {
          mat.emissive.copy(base);
          mat.emissiveIntensity = baseI;
          this.pulses.delete(slot);
          continue;
        }
        const amp = Math.sin(Math.PI * t);
        mat.emissive.copy(base).lerp(GOLD, amp);
        mat.emissiveIntensity = THREE.MathUtils.lerp(baseI, 0.5, amp);
      }
    }

    // The marker over what this decision changes, once the camera has settled.
    this.placeCallout(rise);

    // Doors swing open as the camera walks through them
    this.swingDoor(this.frontDoor, P(PLAN.frontDoor.x, 0.25, 3.4), pos);
    const vest = this.groups.entry?.getObjectByName("vestibule-door") as THREE.Group | undefined;
    if (vest) this.swingDoor(vest, P(PLAN.frontDoor.x, -5.75, 3.4), pos);

    // Exposure: interiors are darker than the outdoors, as an eye adapts.
    const inside = isInside(pos);
    const targetExposure = inkActive ? 1 : inside ? 0.92 + 0.1 * evening : 0.95 + 0.35 * evening;
    this.exposure += (targetExposure - this.exposure) * (1 - Math.exp(-dt * 3));
    this.renderer.toneMappingExposure = this.exposure;
    if (Math.abs(this.exposure - targetExposure) > 0.002) moving = true;

    // 4. Render only when something changed
    const key = `${pos.x.toFixed(4)},${pos.y.toFixed(4)},${pos.z.toFixed(4)},${target.x.toFixed(4)},${target.y.toFixed(4)},${target.z.toFixed(4)},${this.pose.fov.toFixed(3)}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      moving = true;
    }
    if (moving) this.invalidate(2);
    if (this.renderFrames <= 0) return;
    this.renderFrames--;

    if (this.shadowDirty) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowDirty = false;
    }
    if (this.composer && this.gtao && !inkActive) {
      this.composer.render(dt);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    this.adaptResolution(dt);
    if (!this.readyFired) {
      this.readyFired = true;
      this.opts.onReady?.();
    }
  };

  private placeCallout(rise: number) {
    const el = this.opts.callout;
    if (!el) return;
    const settled =
      !!this.calloutAnchor &&
      !this.flight &&
      !this.preset &&
      rise > 0.999 &&
      Math.abs(this.p - this.pTarget) < 0.03 &&
      Math.abs(this.p - Math.round(this.p)) < 0.03;
    let show = false;
    if (settled && this.calloutAnchor) {
      this.camera.updateMatrixWorld();
      const v = this.calloutAnchor.clone().project(this.camera);
      if (v.z > -1 && v.z < 1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.9) {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        el.style.transform = `translate3d(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px, 0)`;
        show = true;
      }
    }
    if (show !== this.calloutShown) {
      this.calloutShown = show;
      el.style.opacity = show ? "1" : "0";
    }
  }

  /**
   * While the camera is moving, watch the frame time. If frames run slow
   * (under about 40 per second), drop the pixel ratio a step, down to 1.
   */
  private adaptResolution(dt: number) {
    this.perfFrames++;
    this.perfTime += dt;
    if (this.perfFrames < 40) return;
    const avg = this.perfTime / this.perfFrames;
    this.perfFrames = 0;
    this.perfTime = 0;
    const pr = this.renderer.getPixelRatio();
    if (avg > 0.025 && pr > 1) {
      this.renderer.setPixelRatio(Math.max(1, pr - 0.25));
      this.resize();
    }
  }

  private swingDoor(door: THREE.Object3D | null | undefined, hinge: THREE.Vector3, cam: THREE.Vector3) {
    if (!door) return;
    const d = cam.distanceTo(hinge);
    const open = 1 - smooth(1.6, 5.5, d);
    // Door leaves cast no shadow, so swinging them never re-renders the shadow map.
    door.rotation.y = open * 1.7;
  }

  private updateRoomLights(evening: number, premium: boolean) {
    // Pool the fixtures into a few lights: kitchen, dining, foyer, living, hall,
    // and under-cabinet strips with the premium package.
    const pick = (room: string) => this.spots.find((s) => s.room === room);
    const plan: { x: number; y: number; h: number; power: number }[] = [];
    // Kitchen (brighter with the premium package's under-cabinet strips), dining, living.
    plan.push({ x: 33.6, y: 6.0, h: 5.0, power: premium ? 1.9 : 1.4 });
    for (const room of ["dining", "living"]) {
      const s = pick(room);
      if (s) plan.push(s);
    }
    // Lights stay in the scene with zero intensity when unused: changing how
    // many lights are visible would recompile every material.
    this.roomLights.forEach((light, i) => {
      const s = plan[i];
      if (!s) {
        light.intensity = 0;
        return;
      }
      light.position.copy(P(s.x, s.y, s.h));
      // Candela. About 6 cd from a pendant lights a counter 1.5 m below to
      // roughly the brightness the afternoon sun gives a wall.
      light.intensity = s.power * 4.5 * evening;
    });
  }
}

export { CUTAWAY };
