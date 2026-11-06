import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Materials, Slot } from "./materials";
import { FT, wx, wy, wz } from "./space";

// ============================================
// Geometry builder. Pieces are added in plan feet (or world metres), each
// face lands in its material slot's bucket with UVs measured in world metres,
// and build() merges every bucket into one mesh. A few hundred boxes become a
// few dozen draw calls, and a texture's repeat means the same real-world size
// on every surface.
// ============================================

export type Face = "px" | "nx" | "py" | "ny" | "pz" | "nz";
export type FaceSlots = Partial<Record<Face, Slot | null>> & { all?: Slot };

const AXES: Record<Face, { n: THREE.Vector3; t1: THREE.Vector3; t2: THREE.Vector3 }> = {
  px: { n: new THREE.Vector3(1, 0, 0), t1: new THREE.Vector3(0, 0, -1), t2: new THREE.Vector3(0, 1, 0) },
  nx: { n: new THREE.Vector3(-1, 0, 0), t1: new THREE.Vector3(0, 0, 1), t2: new THREE.Vector3(0, 1, 0) },
  pz: { n: new THREE.Vector3(0, 0, 1), t1: new THREE.Vector3(1, 0, 0), t2: new THREE.Vector3(0, 1, 0) },
  nz: { n: new THREE.Vector3(0, 0, -1), t1: new THREE.Vector3(-1, 0, 0), t2: new THREE.Vector3(0, 1, 0) },
  py: { n: new THREE.Vector3(0, 1, 0), t1: new THREE.Vector3(1, 0, 0), t2: new THREE.Vector3(0, 0, -1) },
  ny: { n: new THREE.Vector3(0, -1, 0), t1: new THREE.Vector3(1, 0, 0), t2: new THREE.Vector3(0, 0, 1) },
};

/** One axis-aligned rectangle facing `face`, centred at c with half extents along t1 and t2. */
function quad(c: THREE.Vector3, face: Face, half1: number, half2: number): THREE.BufferGeometry {
  const { n, t1, t2 } = AXES[face];
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([a, b]) => c.clone().addScaledVector(t1, a * half1).addScaledVector(t2, b * half2));
  const pos = new Float32Array(12);
  const nor = new Float32Array(12);
  const uv = new Float32Array(8);
  corners.forEach((p, i) => {
    pos.set([p.x, p.y, p.z], i * 3);
    nor.set([n.x, n.y, n.z], i * 3);
    uv.set([p.dot(t1), p.dot(t2)], i * 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g.toNonIndexed();
}

/** Twelve edges of a box, as line segments. */
function boxEdges(min: THREE.Vector3, max: THREE.Vector3): THREE.BufferGeometry {
  const xs = [min.x, max.x];
  const ys = [min.y, max.y];
  const zs = [min.z, max.z];
  const pts: number[] = [];
  for (const y of ys) for (const z of zs) pts.push(xs[0], y, z, xs[1], y, z);
  for (const x of xs) for (const z of zs) pts.push(x, ys[0], z, x, ys[1], z);
  for (const x of xs) for (const y of ys) pts.push(x, y, zs[0], x, y, zs[1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

export interface BoxOptions {
  /** Draw this box's outline in the plan drawing. */
  edges?: boolean;
}

export class Builder {
  private buckets = new Map<Slot, THREE.BufferGeometry[]>();
  private edgeGeos: THREE.BufferGeometry[] = [];

  add(slot: Slot, geo: THREE.BufferGeometry) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.getAttribute("uv")) {
      g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((g.getAttribute("position").count) * 2), 2));
    }
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
    }
    const list = this.buckets.get(slot);
    if (list) list.push(g);
    else this.buckets.set(slot, [g]);
  }

  addEdges(geo: THREE.BufferGeometry) {
    this.edgeGeos.push(geo);
  }

  /** Box between two world points, with a material slot per face (null skips the face). */
  boxW(min: THREE.Vector3, max: THREE.Vector3, slots: Slot | FaceSlots, opts: BoxOptions = {}) {
    const map: FaceSlots = typeof slots === "string" ? { all: slots } : slots;
    const c = min.clone().add(max).multiplyScalar(0.5);
    const h = max.clone().sub(min).multiplyScalar(0.5);
    const faces: [Face, THREE.Vector3, number, number][] = [
      ["px", new THREE.Vector3(max.x, c.y, c.z), h.z, h.y],
      ["nx", new THREE.Vector3(min.x, c.y, c.z), h.z, h.y],
      ["pz", new THREE.Vector3(c.x, c.y, max.z), h.x, h.y],
      ["nz", new THREE.Vector3(c.x, c.y, min.z), h.x, h.y],
      ["py", new THREE.Vector3(c.x, max.y, c.z), h.x, h.z],
      ["ny", new THREE.Vector3(c.x, min.y, c.z), h.x, h.z],
    ];
    for (const [face, center, a, b] of faces) {
      const slot = face in map ? map[face] : map.all;
      if (!slot) continue;
      this.add(slot, quad(center, face, a, b));
    }
    if (opts.edges) this.addEdges(boxEdges(min, max));
  }

  /**
   * Box in plan feet: x0..x1 along the length, y0..y1 in depth (0 at the front),
   * h0..h1 above the finished floor. Face names are world faces: pz faces the
   * front of the house, nz the back.
   */
  box(x0: number, x1: number, y0: number, y1: number, h0: number, h1: number, slots: Slot | FaceSlots, opts: BoxOptions = {}) {
    const min = new THREE.Vector3(wx(Math.min(x0, x1)), wy(Math.min(h0, h1)), wz(Math.max(y0, y1)));
    const max = new THREE.Vector3(wx(Math.max(x0, x1)), wy(Math.max(h0, h1)), wz(Math.min(y0, y1)));
    this.boxW(min, max, slots, opts);
  }

  /** Any three.js geometry, built in feet around its own origin, placed at a plan point. */
  shape(
    slot: Slot,
    geo: THREE.BufferGeometry,
    at: { x: number; y: number; h: number },
    opts: { rotY?: number; rotX?: number; rotZ?: number; scale?: [number, number, number]; edges?: boolean; worldUV?: boolean } = {}
  ) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(wx(at.x), wy(at.h), wz(at.y)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(opts.rotX ?? 0, opts.rotY ?? 0, opts.rotZ ?? 0, "YXZ")),
      new THREE.Vector3(...(opts.scale ?? [1, 1, 1])).multiplyScalar(FT)
    );
    const g = geo.clone().applyMatrix4(m);
    if (opts.worldUV) {
      // Ground-like shapes: map textures from above in world metres, like the lawn.
      const pos = g.getAttribute("position");
      const uv = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = pos.getX(i);
        uv[i * 2 + 1] = -pos.getZ(i);
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    if (opts.edges) this.addEdges(new THREE.EdgesGeometry(g, 35));
    this.add(slot, g);
  }

  /** Merge every bucket into meshes. Returns an empty group when nothing was added. */
  build(materials: Materials, inkLines: THREE.Material | null, name: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name;
    for (const [slot, geos] of this.buckets) {
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, materials[slot]);
      mesh.name = `${name}:${slot}`;
      const emissive = slot === "lamp" || slot === "led" || slot === "fire";
      mesh.castShadow = slot !== "glass" && !emissive;
      mesh.receiveShadow = slot !== "glass";
      if (slot === "glass" || slot === "vapour") {
        mesh.renderOrder = 2;
        mesh.userData.noAO = true;
      }
      group.add(mesh);
      geos.forEach((g) => g.dispose());
    }
    if (inkLines && this.edgeGeos.length) {
      const merged = mergeGeometries(this.edgeGeos, false);
      if (merged) {
        const lines = new THREE.LineSegments(merged, inkLines);
        lines.name = `${name}:ink`;
        lines.userData.ink = true;
        group.add(lines);
      }
      this.edgeGeos.forEach((g) => g.dispose());
    }
    this.buckets.clear();
    this.edgeGeos = [];
    return group;
  }
}

/** Dispose every geometry under a group (materials, and geometries marked shared, live on). */
export function disposeGroup(group: THREE.Object3D) {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry && !mesh.geometry.userData.shared) mesh.geometry.dispose();
    // Frees an instanced mesh's per-instance buffers; its shared geometry is kept.
    if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
  });
}
