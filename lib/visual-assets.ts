import manifestJson from "./visual-assets.json";
import type { LotTerrain } from "./defaults";

// ============================================
// Approved photo set: the photo-first visual system (Sep 2026).
//
// lib/visual-assets.json lists every approved photo with its provenance. Each
// file sits under public/ and ships as a static file: nothing here fetches,
// resizes, tints or edits an image, and components print the manifest's own
// captions and alt text as written.
//
// After changing the manifest, run `npm run assets:report`. It checks every
// entry against the ids in lib/defaults.ts and rewrites
// docs/visualization/asset-coverage.md, the list of photos still to request.
// ============================================

export type AssetKind = "photo" | "render";

/**
 * this-model: the model it belongs to.
 * other-supreme-home: a different or unidentified Supreme home.
 * example: a stock photo of the option on another home.
 */
export type AssetTier = "this-model" | "other-supreme-home" | "example";

export type RoomId = "kitchen" | "living" | "bath" | "bedroom";

export interface VisualAsset {
  src: string;
  width: number;
  height: number;
  kind: AssetKind;
  tier: AssetTier;
  /** Plain language, says exactly what the photo shows. */
  caption: string;
  alt: string;
  /** "Supreme Homes" or "Photo: <name> on Unsplash". */
  credit: string;
  licence: string;
  sourceUrl: string;
  /** Set on Supreme photos reused as option examples: the model they were taken in. */
  model?: string;
}

export interface ModelVisualAssets {
  /** [0] is the hero. Every model has at least one exterior. */
  exterior: VisualAsset[];
  rooms: Partial<Record<RoomId, VisualAsset>>;
}

export interface VisualAssetManifest {
  version: 1;
  generated: string;
  models: Record<string, ModelVisualAssets>;
  /** A Supreme show home whose model isn't identified. */
  showHome: { rooms: Partial<Record<RoomId, VisualAsset>> };
  /** Keyed "<groupId>:<optionId>", e.g. "sidingColor:navy". */
  options: Record<string, VisualAsset>;
  lots: Partial<Record<LotTerrain, VisualAsset>>;
  gaps: string[];
}

// JSON imports widen string unions to `string`, so the cast goes through
// unknown. scripts/asset-coverage.mjs validates the manifest's shape instead.
export const visualAssets = manifestJson as unknown as VisualAssetManifest;

export const ROOM_ORDER: readonly RoomId[] = ["kitchen", "living", "bath", "bedroom"];

export function getModelHero(modelId: string | null): VisualAsset | null {
  if (!modelId) return null;
  return visualAssets.models[modelId]?.exterior[0] ?? null;
}

export function getModelRoom(modelId: string | null, room: RoomId): VisualAsset | null {
  if (!modelId) return null;
  return visualAssets.models[modelId]?.rooms[room] ?? null;
}

export function getShowHomeRoom(room: RoomId): VisualAsset | null {
  return visualAssets.showHome.rooms[room] ?? null;
}

/** Every photo of one model: its exteriors (hero first), then its rooms. */
export function getModelGallery(modelId: string | null): VisualAsset[] {
  const entry = modelId ? visualAssets.models[modelId] : undefined;
  if (!entry) return [];
  const rooms = ROOM_ORDER.flatMap((room) => {
    const asset = entry.rooms[room];
    return asset ? [asset] : [];
  });
  return [...entry.exterior, ...rooms];
}

/** Example photo for a manifest option key ("<groupId>:<optionId>"). */
export function getOptionAsset(key: string): VisualAsset | null {
  return visualAssets.options[key] ?? null;
}

export function getLotAsset(terrain: LotTerrain): VisualAsset | null {
  return visualAssets.lots[terrain] ?? null;
}

/** Provenance for a model card: "Supreme Homes photo" or "Supreme Homes rendering". */
export function sourceLabel(asset: VisualAsset): string {
  const noun = asset.kind === "render" ? "rendering" : "photo";
  return asset.credit === "Supreme Homes" ? `Supreme Homes ${noun}` : `Example ${noun}`;
}

/** The credit to print after a caption, or null when the caption already names it. */
export function creditLine(asset: VisualAsset): string | null {
  if (!asset.credit || asset.caption.includes(asset.credit)) return null;
  return asset.credit;
}
