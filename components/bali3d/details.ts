import * as THREE from "three";
import { Builder } from "./builder";
import type { Materials } from "./materials";

// ============================================
// Finishing detail for each room: the things that make a bathroom read as a
// bathroom up close (shower curtain, towels, shower head, toilet seat and
// tank, vanity light, bath mat) and a lived-in touch in the bedrooms and the
// kitchen. Each room's detail is its own group, shown only while the camera
// is in or beside that room; the Dollhouse and Top down views keep the
// simpler shapes, which read better from above.
// ============================================

/** Which camera zones (see camera.ts) show each room's detail. */
export const DETAIL_ZONES: Record<string, string[]> = {
  "detail:bath1": ["bath1", "hall"],
  "detail:bath2": ["br1"],
  "detail:br1": ["br1"],
  "detail:br2": ["br2", "hall"],
  "detail:br3": ["br3", "hall"],
  "detail:kitchen": ["great"],
};

/** A hanging fabric panel with soft vertical folds, in the plane x = const. */
function curtain(x: number, y0: number, y1: number, h0: number, h1: number): THREE.BufferGeometry {
  const len = (y1 - y0) * 0.3048;
  const height = (h1 - h0) * 0.3048;
  const g = new THREE.PlaneGeometry(len, height, 48, 1);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / len + 0.5;
    pos.setZ(i, Math.sin(u * Math.PI * 14) * 0.035);
  }
  g.computeVertexNormals();
  // Face the room (toward lower x), not the inside of the tub.
  g.rotateY(-Math.PI / 2);
  // Back to plan feet around the panel's centre; Builder.shape places and scales it.
  g.scale(1 / 0.3048, 1 / 0.3048, 1 / 0.3048);
  g.userData.at = { x, y: (y0 + y1) / 2, h: (h0 + h1) / 2 };
  return g;
}

function towel(b: Builder, x0: number, x1: number, y0: number, y1: number, top: number, drop: number) {
  b.box(x0, x1, y0, y1, top - drop, top, "linen", { edges: true });
  b.box(x0, x1, y0, y1, top - drop - 0.02, top - drop + 0.1, "fabric");
}

function bathroom(b: Builder, opts: {
  toilet: { x: number; y: number; facing: "+y" | "+x" };
  vanity: { x0: number; x1: number; wallY: number };
  /** A bar on the wall face at x, the room lying toward `room` (+1 higher x, -1 lower). */
  towelBar: { x: number; y0: number; y1: number; room: 1 | -1 };
  mat: [number, number, number, number];
}) {
  // Toilet: seat, lid and tank lid on the drawn bowl, and a flush handle
  const t = opts.toilet;
  if (t.facing === "+y") {
    b.shape("ceramic", new THREE.CylinderGeometry(0.66, 0.58, 0.08, 28), { x: t.x, y: t.y + 1.45, h: 1.39 }, { scale: [1, 1, 1.28] });
    b.shape("ceramic", new THREE.CylinderGeometry(0.62, 0.55, 0.06, 28), { x: t.x, y: t.y + 1.45, h: 1.46 }, { scale: [1, 1, 1.25] });
    b.box(t.x - 0.66, t.x + 0.66, t.y - 0.02, t.y + 0.66, 2.6, 2.7, "ceramic", { edges: true });
    b.box(t.x - 0.5, t.x - 0.3, t.y + 0.6, t.y + 0.68, 2.3, 2.36, "hardware");
  } else {
    b.shape("ceramic", new THREE.CylinderGeometry(0.66, 0.58, 0.08, 28), { x: t.x + 1.45, y: t.y, h: 1.39 }, { scale: [1.28, 1, 1] });
    b.shape("ceramic", new THREE.CylinderGeometry(0.62, 0.55, 0.06, 28), { x: t.x + 1.45, y: t.y, h: 1.46 }, { scale: [1.25, 1, 1] });
    b.box(t.x - 0.02, t.x + 0.66, t.y - 0.66, t.y + 0.66, 2.6, 2.7, "ceramic", { edges: true });
    b.box(t.x + 0.6, t.x + 0.68, t.y - 0.5, t.y - 0.3, 2.3, 2.36, "hardware");
  }
  // Toilet paper on the wall beside it
  const tp = t.facing === "+y" ? { x: t.x + 1.3, y: t.y + 0.12 } : { x: t.x + 0.12, y: t.y + 1.3 };
  b.shape("linen", new THREE.CylinderGeometry(0.2, 0.2, 0.36, 16), { x: tp.x, y: tp.y, h: 2.3 }, { rotZ: t.facing === "+y" ? Math.PI / 2 : 0, rotX: t.facing === "+y" ? 0 : Math.PI / 2 });
  // Light bar over the mirror, and a soap pump and hand towel at the vanity
  const v = opts.vanity;
  const dir = v.wallY < 12 ? 1 : -1;
  b.box(v.x0 + 0.3, v.x1 - 0.3, v.wallY, v.wallY + dir * 0.25, 6.45, 6.62, "hardware", { edges: true });
  b.box(v.x0 + 0.4, v.x1 - 0.4, v.wallY + dir * 0.06, v.wallY + dir * 0.24, 6.38, 6.45, "lamp");
  b.shape("ceramic", new THREE.CylinderGeometry(0.11, 0.12, 0.42, 12), { x: v.x1 - 0.45, y: v.wallY + dir * 0.45, h: 3.1 });
  b.shape("hardware", new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8), { x: v.x1 - 0.45, y: v.wallY + dir * 0.45, h: 3.38 });
  // Towel bar with a bath towel
  const tb = opts.towelBar;
  const bx = (d: number) => tb.x + tb.room * d;
  b.box(Math.min(bx(0), bx(0.18)), Math.max(bx(0), bx(0.18)), tb.y0, tb.y1, 4.55, 4.62, "hardware");
  towel(b, Math.min(bx(0.08), bx(0.22)), Math.max(bx(0.08), bx(0.22)), tb.y0 + 0.15, tb.y1 - 0.15, 4.62, 2.3);
  // Bath mat
  const [mx0, mx1, my0, my1] = opts.mat;
  b.box(mx0, mx1, my0, my1, 0.02, 0.06, "rug");
}

export function buildDetails(m: Materials, ink: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = "details";

  // ---- Bathroom 1: tub with shower, toilet, vanity ----
  const b1 = new Builder();
  const c = curtain(70.85, 10.25, 13.2, 1.8, 6.55);
  b1.shape("linen", c, c.userData.at as { x: number; y: number; h: number });
  b1.shape("hardware", new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), { x: 73.0, y: 12.8, h: 6.35 }, { rotZ: Math.PI / 2 });
  b1.shape("hardware", new THREE.CylinderGeometry(0.22, 0.12, 0.12, 20), { x: 72.6, y: 12.8, h: 6.25 }, { rotZ: Math.PI / 2.6 });
  b1.shape("hardware", new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10), { x: 73.2, y: 12.8, h: 2.15 }, { rotZ: Math.PI / 2 });
  b1.shape("hardware", new THREE.CylinderGeometry(0.2, 0.2, 0.06, 20), { x: 73.45, y: 12.8, h: 3.35 }, { rotZ: Math.PI / 2 });
  bathroom(b1, {
    toilet: { x: 69.3, y: 10.075, facing: "+y" },
    vanity: { x0: 65.4, x1: 68.0, wallY: 10.075 },
    towelBar: { x: 65.175, y0: 14.0, y1: 15.3, room: 1 },
    mat: [68.7, 70.7, 12.6, 14.6],
  });
  group.add(b1.build(m, ink, "detail:bath1"));

  // ---- Bathroom 2: corner shower, toilet, vanity ----
  const b2 = new Builder();
  b2.shape("hardware", new THREE.CylinderGeometry(0.2, 0.12, 0.12, 20), { x: 2.7, y: 15.1, h: 6.3 }, { rotX: -Math.PI / 2.6 });
  b2.shape("hardware", new THREE.CylinderGeometry(0.05, 0.05, 0.6, 10), { x: 2.7, y: 15.3, h: 6.4 }, { rotX: Math.PI / 2 });
  bathroom(b2, {
    toilet: { x: 0.5, y: 8.6, facing: "+x" },
    vanity: { x0: 3.4, x1: 7.0, wallY: 6.775 },
    towelBar: { x: 7.525, y0: 11.0, y1: 12.3, room: -1 },
    mat: [2.4, 4.6, 10.6, 12.4],
  });
  group.add(b2.build(m, ink, "detail:bath2"));

  // ---- Bedrooms: art over the bed, a throw at its foot ----
  const art = (b: Builder, x0: number, x1: number, y0: number, y1: number, h0: number, h1: number) => {
    b.box(x0, x1, y0, y1, h0, h1, "wood", { edges: true });
    const inset = 0.12;
    const thin = x1 - x0 < y1 - y0 ? "x" : "y";
    if (thin === "x") b.box(x0 - 0.01, x1 + 0.01, y0 + inset, y1 - inset, h0 + inset, h1 - inset, "linen");
    else b.box(x0 + inset, x1 - inset, y0 - 0.01, y1 + 0.01, h0 + inset, h1 - inset, "linen");
  };
  const br1 = new Builder();
  art(br1, 11.4, 15.9, 15.42, 15.5, 4.6, 6.6);
  br1.box(10.4, 16.9, 8.7, 10.1, 2.02, 2.16, "fabric", { edges: true });
  group.add(br1.build(m, ink, "detail:br1"));
  const br2 = new Builder();
  art(br2, 48.475, 48.55, 4.4, 7.9, 4.6, 6.2);
  group.add(br2.build(m, ink, "detail:br2"));
  const br3 = new Builder();
  art(br3, 73.42, 73.5, 3.2, 6.8, 4.6, 6.2);
  group.add(br3.build(m, ink, "detail:br3"));

  // ---- Kitchen: a bowl of green apples on the island, a utensil crock by the range ----
  const k = new Builder();
  k.shape("ceramic", new THREE.SphereGeometry(0.75, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), { x: 35.6, y: 8.2, h: 3.42 }, { scale: [1, 0.55, 1] });
  for (const [dx, dy] of [
    [0, 0],
    [0.3, 0.15],
    [-0.28, 0.12],
    [0.1, -0.3],
  ]) {
    k.shape("plant", new THREE.SphereGeometry(0.2, 14, 10), { x: 35.6 + dx, y: 8.2 + dy, h: 3.2 });
  }
  k.shape("ceramic", new THREE.CylinderGeometry(0.22, 0.2, 0.6, 16), { x: 35.4, y: 1.2, h: 3.3 });
  for (const dx of [-0.08, 0.06]) k.shape("wood", new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), { x: 35.4 + dx, y: 1.2, h: 3.8 }, { rotZ: dx });
  group.add(k.build(m, ink, "detail:kitchen"));

  group.traverse((o) => (o.castShadow = false));
  return group;
}
