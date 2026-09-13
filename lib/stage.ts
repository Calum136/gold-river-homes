import type { ConfiguratorState } from "./pricing";
import {
  homeModels,
  exteriorGroups,
  interiorGroups,
  sidingColors,
  metalRoofColors,
  foundationCosts,
  waterCosts,
  sewerCosts,
} from "./defaults";
import { getRenderStack } from "./renders";
import type { RenderStack } from "./renders";
import { getModelHero, getModelRoom, getShowHomeRoom, getOptionAsset } from "./visual-assets";
import type { RoomId, VisualAsset } from "./visual-assets";

// ============================================
// Stage resolver: which real photo fills the stage on a screen, and which
// example photo sits beside the decision being made.
//
// The stage photo is the first match of:
//   1. exact: a Phase 7 render stack of this exact configuration
//      (getRenderStack; dormant until renders-manifest.json is populated)
//   2. this-model: the chosen model's own photo, meaning its exterior hero, or
//      on interior screens the room that best shows the decision
//   3. other-supreme-home: the Supreme show home's photo of that room
//   4. nothing
//
// Only tier 1 shows the buyer's selections. Every other photo shows exactly
// what its manifest caption says, and that caption is what the page prints.
// ============================================

export type StageTier = "exact" | "this-model" | "other-supreme-home";

export interface StagePrimary {
  tier: StageTier;
  /** The manifest photo. Null only on the exact tier, which composites render layers. */
  asset: VisualAsset | null;
  stack: RenderStack | null;
  caption: string;
  alt: string;
}

export interface StageChoice {
  label: string;
  swatchHex?: string;
}

export interface StageExample {
  /** Approved example photo of the selected choice; null when it has none. */
  asset: VisualAsset | null;
  /** The selected choice itself, shown when there's no photo of it. */
  choice: StageChoice;
}

export interface StageResolution {
  view: "exterior" | "interior";
  /** Null only when no photo exists at any tier. */
  primary: StagePrimary | null;
  /** Set on decision screens where at least one choice has an approved photo. */
  example: StageExample | null;
}

export const PORCH_LABELS = { without: "No porch", with: "Covered front porch" } as const;
export const FIREPLACE_LABELS = { without: "No fireplace", with: "Electric fireplace insert" } as const;

// Interior decisions and the room whose photo best shows them.
const ROOM_FOR_DECISION: Partial<Record<string, RoomId>> = {
  countertops: "kitchen",
  cabinetStyle: "kitchen",
  lightingPackage: "kitchen",
  hardwareFinish: "kitchen",
  flooring: "living",
  paintPackage: "living",
  interiorTrim: "living",
  fireplace: "living",
  insulation: "living",
};

const INTERIOR_STATE_KEYS: Partial<Record<string, keyof ConfiguratorState>> = {
  flooring: "flooringId",
  countertops: "countertopsId",
  cabinetStyle: "cabinetStyleId",
  paintPackage: "paintPackageId",
  interiorTrim: "interiorTrimId",
  lightingPackage: "lightingPackageId",
  hardwareFinish: "hardwareFinishId",
  insulation: "insulationId",
};

function fromAsset(tier: StageTier, asset: VisualAsset): StagePrimary {
  return { tier, asset, stack: null, caption: asset.caption, alt: asset.alt };
}

// Before a model is chosen the stage still shows a real home: the sharpest
// real (not rendered) exterior photo in the catalogue. Its caption names the
// model, so it never reads as the buyer's choice.
const featuredHome = homeModels.reduce<VisualAsset | null>((best, model) => {
  const hero = getModelHero(model.id);
  if (!hero || hero.kind !== "photo") return best;
  return !best || hero.width * hero.height > best.width * best.height ? hero : best;
}, null);

function resolveExterior(state: ConfiguratorState): StagePrimary | null {
  const model = homeModels.find((m) => m.id === state.modelId);
  if (!model) return featuredHome ? fromAsset("other-supreme-home", featuredHome) : null;

  const stack = getRenderStack(state);
  if (stack) {
    return {
      tier: "exact",
      asset: null,
      stack,
      caption: `${model.name} with your selections`,
      alt: `${model.name} with your selected options`,
    };
  }

  const hero = getModelHero(model.id);
  return hero ? fromAsset("this-model", hero) : null;
}

function resolveRoom(modelId: string | null, room: RoomId): StagePrimary | null {
  const own = getModelRoom(modelId, room);
  if (own) return fromAsset("this-model", own);
  const showHome = getShowHomeRoom(room);
  return showHome ? fromAsset("other-supreme-home", showHome) : null;
}

interface Decision {
  /** Manifest keys of every choice on the screen. */
  keys: string[];
  /** Manifest key of the selected choice. */
  selected: string;
  /** Photo to use when the selected key has none. */
  fallback?: string;
  choice: StageChoice;
}

const optionGroups = [...exteriorGroups, ...interiorGroups];

function groupDecision(groupId: string, optionId: string): Decision | null {
  const group = optionGroups.find((g) => g.id === groupId);
  if (!group) return null;
  const option = group.options.find((o) => o.id === optionId);
  return {
    keys: group.options.map((o) => `${groupId}:${o.id}`),
    selected: `${groupId}:${optionId}`,
    choice: { label: option?.label ?? optionId, swatchHex: option?.swatchHex },
  };
}

function yesNoDecision(
  groupId: string,
  included: boolean,
  labels: { without: string; with: string }
): Decision {
  return {
    keys: [`${groupId}:without`, `${groupId}:with`],
    selected: `${groupId}:${included ? "with" : "without"}`,
    choice: { label: included ? labels.with : labels.without },
  };
}

function costDecision<K extends string>(groupId: string, costs: Record<K, { label: string }>, selected: K): Decision {
  return {
    keys: Object.keys(costs).map((id) => `${groupId}:${id}`),
    selected: `${groupId}:${selected}`,
    choice: { label: costs[selected].label },
  };
}

function decisionFor(state: ConfiguratorState, screenId: string): Decision | null {
  switch (screenId) {
    case "sidingStyle":
      return groupDecision("sidingStyle", state.sidingStyleId);
    case "exteriorTrim":
      return groupDecision("exteriorTrim", state.exteriorTrimId);
    case "sidingColor": {
      const color = sidingColors.find((c) => c.id === state.sidingColorId);
      return {
        keys: sidingColors.map((c) => `sidingColor:${c.id}`),
        selected: `sidingColor:${state.sidingColorId}`,
        choice: { label: color?.label ?? state.sidingColorId, swatchHex: color?.swatchHex },
      };
    }
    case "roofType": {
      const roof = groupDecision("roofType", state.roofTypeId);
      if (!roof) return null;
      const keys = [...roof.keys, ...metalRoofColors.map((c) => `metalRoofColor:${c.id}`)];
      if (state.roofTypeId !== "metal") return { ...roof, keys };
      // The metal roof screen also picks a colour; without a photo of that
      // colour, show the metal roof example (its caption names only the roof type).
      const color = metalRoofColors.find((c) => c.id === state.metalRoofColorId);
      return {
        keys,
        selected: `metalRoofColor:${state.metalRoofColorId}`,
        fallback: roof.selected,
        choice: { label: `${roof.choice.label}, ${color?.label ?? state.metalRoofColorId}`, swatchHex: color?.swatchHex },
      };
    }
    case "porch":
      return yesNoDecision("porch", state.hasFrontPorch, PORCH_LABELS);
    case "fireplace":
      return yesNoDecision("fireplace", state.hasFireplace, FIREPLACE_LABELS);
    case "foundation":
      return costDecision("foundation", foundationCosts, state.foundationType);
    case "water":
      return costDecision("water", waterCosts, state.waterType);
    case "sewer":
      return costDecision("sewer", sewerCosts, state.sewerType);
    default: {
      const stateKey = INTERIOR_STATE_KEYS[screenId];
      return stateKey ? groupDecision(screenId, String(state[stateKey])) : null;
    }
  }
}

export function resolveStage(state: ConfiguratorState, screenId: string): StageResolution {
  const room = ROOM_FOR_DECISION[screenId];
  const primary = room ? resolveRoom(state.modelId, room) : resolveExterior(state);

  const decision = decisionFor(state, screenId);
  let example: StageExample | null = null;
  if (decision && decision.keys.some((key) => getOptionAsset(key))) {
    const asset =
      getOptionAsset(decision.selected) ?? (decision.fallback ? getOptionAsset(decision.fallback) : null);
    example = { asset, choice: decision.choice };
  }

  return { view: room ? "interior" : "exterior", primary, example };
}
