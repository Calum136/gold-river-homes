import manifest from "./renders-manifest.json";
import type { ConfiguratorState } from "./pricing";

// ============================================
// Phase 7 runtime resolver (docs/visualization/07-photoreal-pipeline.md).
// Maps the configurator state to pre-rendered photoreal layer URLs.
// Returns null whenever any required layer is missing → caller falls back
// to ParametricHouse. The manifest is written by scripts/render_stack.py.
// ============================================

export interface RenderStack {
  base: string;
  siding: string;
  roof: string;
  trim?: string;
  porch?: string;
}

interface ModelRenderEntry {
  siding: string[]; // "<sidingStyleId>_<sidingColorId>"
  roof: string[]; // "shingles" | "metal-<metalRoofColorId>"
  trim?: string[]; // "<exteriorTrimId>"
  hasPorch?: boolean;
}

const models = (manifest as { models: Record<string, ModelRenderEntry> }).models;

export function getRenderStack(state: ConfiguratorState): RenderStack | null {
  if (!state.modelId) return null;
  const entry = models[state.modelId];
  if (!entry) return null;

  const sidingKey = `${state.sidingStyleId}_${state.sidingColorId}`;
  if (!entry.siding.includes(sidingKey)) return null;

  const roofKey = state.roofTypeId === "metal" ? `metal-${state.metalRoofColorId}` : "shingles";
  if (!entry.roof.includes(roofKey)) return null;

  const dir = `/renders3d/${state.modelId}`;
  return {
    base: `${dir}/base.webp`,
    siding: `${dir}/siding/${sidingKey}.webp`,
    roof: `${dir}/roof/${roofKey}.webp`,
    trim: entry.trim?.includes(state.exteriorTrimId) ? `${dir}/trim/${state.exteriorTrimId}.webp` : undefined,
    porch: state.hasFrontPorch && entry.hasPorch ? `${dir}/porch/on.webp` : undefined,
  };
}
