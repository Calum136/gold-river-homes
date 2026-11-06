import { calculateConfiguratorPrice, defaultState } from "./pricing";
import type { ConfiguratorState } from "./pricing";
import { CHAPTERS, SCREENS } from "./screens";
import type { ChapterDef } from "./screens";
import {
  cabinetColorsFor,
  exteriorGroups,
  extensionOptions,
  foundationCosts,
  homeModels,
  interiorGroups,
  lotOptions,
  metalRoofColors,
  sewerCosts,
  sidingColors,
  vestibuleAvailable,
  waterCosts,
} from "./defaults";
import type { OptionItem } from "./defaults";
import { FIREPLACE_LABELS, PORCH_LABELS, VESTIBULE_LABELS } from "./stage";
import { getLotAsset, getModelHero, getOptionAsset } from "./visual-assets";
import type { VisualAsset } from "./visual-assets";

// ============================================
// The buyer's decisions, described once for every place that lists them: the
// review page, the shortcuts on earlier screens, the printed spec sheet and
// the enquiry email. Labels, descriptions and prices all come from the same
// data the total is calculated from.
// ============================================

export type SelectionPrice =
  /** A model's price: an estimate. */
  | { kind: "estimate"; amount: number }
  /** An example lot's price: an example, never a listing. */
  | { kind: "example"; amount: number }
  /** What this choice adds to the total over the standard choice, contingency included. 0 is "Included". */
  | { kind: "delta"; amount: number }
  /** A site cost's low to high range. */
  | { kind: "range"; low: number; high: number }
  /** No figure, with an optional short note. */
  | { kind: "none"; note: string };

export interface SelectionDetail {
  /** The decision's screen id in lib/screens.ts. */
  screenId: string;
  /** Short name of the decision, e.g. "Siding colour". */
  label: string;
  /** The current choice, e.g. "Brick Red". */
  value: string;
  swatchHex?: string;
  /** Approved photo of the current choice, if it has one. */
  thumb: VisualAsset | null;
  /** The choice's description as written in lib/defaults.ts. */
  description?: string;
  /** True for choices from Supreme's 2026 standard spec sheets. */
  supremeStandard: boolean;
  /** Quiet label beside the value, e.g. "Example lot". */
  tag?: string;
  price: SelectionPrice;
}

/** True for the options transcribed from Supreme's 2026 standard spec sheets. */
export function isSupremeStandard(option: Pick<OptionItem, "description">): boolean {
  return option.description?.endsWith("Supreme's standard.") ?? false;
}

const DECISION_LABELS: Record<string, string> = {
  land: "Land",
  model: "Model",
  sidingStyle: "Siding",
  sidingColor: "Siding colour",
  roofType: "Roof",
  porch: "Front porch",
  exteriorTrim: "Window and door trim",
  flooring: "Flooring",
  countertops: "Countertops",
  cabinetStyle: "Cabinets",
  paintPackage: "Wall colour",
  interiorTrim: "Interior trim",
  lightingPackage: "Lighting",
  hardwareFinish: "Hardware",
  insulation: "Insulation",
  fireplace: "Fireplace",
  foundation: "Foundation",
  water: "Water",
  sewer: "Wastewater",
};

type OptionField =
  | "sidingStyleId"
  | "sidingColorId"
  | "exteriorTrimId"
  | "flooringId"
  | "countertopsId"
  | "cabinetStyleId"
  | "paintPackageId"
  | "interiorTrimId"
  | "lightingPackageId"
  | "hardwareFinishId"
  | "insulationId";

const groupOptions = (groupId: string) =>
  [...exteriorGroups, ...interiorGroups].find((g) => g.id === groupId)?.options ?? [];

// Decisions that pick one option from a data group. The screen id is also the
// group id, so photos are keyed "<screenId>:<optionId>" in the manifest.
const OPTION_DECISIONS: Partial<Record<string, { field: OptionField; options: OptionItem[] }>> = {
  sidingStyle: { field: "sidingStyleId", options: groupOptions("sidingStyle") },
  sidingColor: { field: "sidingColorId", options: sidingColors },
  exteriorTrim: { field: "exteriorTrimId", options: groupOptions("exteriorTrim") },
  flooring: { field: "flooringId", options: groupOptions("flooring") },
  countertops: { field: "countertopsId", options: groupOptions("countertops") },
  cabinetStyle: { field: "cabinetStyleId", options: groupOptions("cabinetStyle") },
  paintPackage: { field: "paintPackageId", options: groupOptions("paintPackage") },
  interiorTrim: { field: "interiorTrimId", options: groupOptions("interiorTrim") },
  lightingPackage: { field: "lightingPackageId", options: groupOptions("lightingPackage") },
  hardwareFinish: { field: "hardwareFinishId", options: groupOptions("hardwareFinish") },
  insulation: { field: "insulationId", options: groupOptions("insulation") },
};

const NOT_CHOSEN = "Not chosen";

/**
 * One decision, described for display. `currentTotal` is
 * calculateConfiguratorPrice(state).totalCost; pass it when describing several
 * decisions so it's calculated once. Null for a screen that isn't a decision.
 */
export function selectionFor(
  state: ConfiguratorState,
  screenId: string,
  currentTotal: number = calculateConfiguratorPrice(state).totalCost
): SelectionDetail | null {
  const label = DECISION_LABELS[screenId];
  if (!label) return null;

  const standard = defaultState();
  const detail = (
    fields: Pick<SelectionDetail, "value" | "price"> & Partial<Omit<SelectionDetail, "screenId" | "label">>
  ): SelectionDetail => ({ screenId, label, thumb: null, supremeStandard: false, ...fields });
  // What the current choice adds over the standard one: the total now, minus
  // the total with this decision put back to its standard choice.
  const overStandard = (patch: Partial<ConfiguratorState>): SelectionPrice => ({
    kind: "delta",
    amount: currentTotal - calculateConfiguratorPrice({ ...state, ...patch }).totalCost,
  });

  // Cabinets: the door style and its colour, priced together.
  if (screenId === "cabinetStyle") {
    const style = groupOptions("cabinetStyle").find((o) => o.id === state.cabinetStyleId);
    const color = cabinetColorsFor(state.cabinetStyleId).find((c) => c.id === state.cabinetColorId);
    return detail({
      value: `${style?.label ?? NOT_CHOSEN}${color ? `, ${color.label}` : ""}`,
      swatchHex: color?.swatchHex,
      thumb: style ? getOptionAsset(`cabinetStyle:${style.id}`) : null,
      description: style?.description,
      supremeStandard: style ? isSupremeStandard(style) && state.cabinetColorId === standard.cabinetColorId : false,
      price: overStandard({ cabinetStyleId: standard.cabinetStyleId, cabinetColorId: standard.cabinetColorId }),
    });
  }

  const optionDecision = OPTION_DECISIONS[screenId];
  if (optionDecision) {
    const { field, options } = optionDecision;
    const selected = options.find((o) => o.id === state[field]);
    return detail({
      value: selected?.label ?? NOT_CHOSEN,
      swatchHex: selected?.swatchHex,
      thumb: selected ? getOptionAsset(`${screenId}:${selected.id}`) : null,
      description: selected?.description,
      supremeStandard: selected ? isSupremeStandard(selected) : false,
      price: overStandard({ [field]: standard[field] }),
    });
  }

  switch (screenId) {
    case "land": {
      if (state.landSituation === "own") {
        const lot = state.uploadedLot;
        return detail({
          value: "Your own land",
          description: lot ? `Your lot: ${lot.widthFt} × ${lot.depthFt} ft, as you entered it.` : undefined,
          price: { kind: "none", note: "Land not included" },
        });
      }
      const lot = state.landSituation === "gold-river" ? lotOptions.find((l) => l.id === state.selectedLotId) : undefined;
      if (!lot) return detail({ value: NOT_CHOSEN, price: { kind: "none", note: "" } });
      return detail({
        value: lot.name,
        tag: "Example lot",
        thumb: getLotAsset(lot.terrain),
        description: `${lot.location}, ${lot.acreage} acres, ${lot.widthFt} × ${lot.depthFt} ft (example values). ${lot.description}`,
        price: { kind: "example", amount: lot.price },
      });
    }

    case "model": {
      const model = homeModels.find((m) => m.id === state.modelId);
      if (!model) return detail({ value: NOT_CHOSEN, price: { kind: "none", note: "" } });
      return detail({
        value: model.name,
        thumb: getModelHero(model.id),
        description: model.description,
        price: { kind: "estimate", amount: model.price },
      });
    }

    case "roofType": {
      const roof = groupOptions("roofType").find((o) => o.id === state.roofTypeId);
      const metal = state.roofTypeId === "metal";
      const color = metal ? metalRoofColors.find((c) => c.id === state.metalRoofColorId) : undefined;
      return detail({
        value: metal ? `${roof?.label ?? "Metal Roof"}, ${color?.label ?? state.metalRoofColorId}` : roof?.label ?? NOT_CHOSEN,
        swatchHex: color?.swatchHex,
        // A metal roof shows its colour's own photo or just the swatch, never a
        // photo of a roof in another colour.
        thumb: getOptionAsset(metal ? `metalRoofColor:${state.metalRoofColorId}` : `roofType:${state.roofTypeId}`),
        description: roof?.description,
        supremeStandard: roof ? isSupremeStandard(roof) : false,
        price: overStandard({ roofTypeId: standard.roofTypeId, metalRoofColorId: standard.metalRoofColorId }),
      });
    }

    case "porch": {
      const vestibule = state.hasVestibule && vestibuleAvailable(state.modelId);
      const porchText = state.hasFrontPorch ? extensionOptions.find((e) => e.id === "front-porch")?.description : undefined;
      const vestibuleText = vestibule ? extensionOptions.find((e) => e.id === "entry-vestibule")?.description : undefined;
      return detail({
        value: `${state.hasFrontPorch ? PORCH_LABELS.with : PORCH_LABELS.without}${vestibule ? `, ${VESTIBULE_LABELS.with.toLowerCase()}` : ""}`,
        thumb: getOptionAsset(`porch:${state.hasFrontPorch ? "with" : "without"}`),
        description: [porchText, vestibuleText].filter(Boolean).join(" ") || undefined,
        price: overStandard({ hasFrontPorch: standard.hasFrontPorch, hasVestibule: standard.hasVestibule }),
      });
    }

    case "fireplace":
      return detail({
        value: state.hasFireplace ? FIREPLACE_LABELS.with : FIREPLACE_LABELS.without,
        thumb: getOptionAsset(`fireplace:${state.hasFireplace ? "with" : "without"}`),
        price: overStandard({ hasFireplace: standard.hasFireplace }),
      });

    case "foundation":
    case "water":
    case "sewer": {
      const [cost, id] =
        screenId === "foundation"
          ? [foundationCosts[state.foundationType], state.foundationType]
          : screenId === "water"
          ? [waterCosts[state.waterType], state.waterType]
          : [sewerCosts[state.sewerType], state.sewerType];
      return detail({
        value: cost.label,
        thumb: getOptionAsset(`${screenId}:${id}`),
        description: cost.description,
        price: { kind: "range", low: cost.low, high: cost.high },
      });
    }

    default:
      return null;
  }
}

/** The chapters that hold decisions: every chapter but the final review. */
export const DECISION_CHAPTERS: readonly ChapterDef[] = CHAPTERS.filter((c) => c.id !== "cost");

export interface ChapterSelections {
  chapter: ChapterDef;
  selections: SelectionDetail[];
}

/** Every decision, grouped by chapter in walkthrough order. */
export function selectionsByChapter(state: ConfiguratorState): ChapterSelections[] {
  const currentTotal = calculateConfiguratorPrice(state).totalCost;
  return DECISION_CHAPTERS.map((chapter) => ({
    chapter,
    selections: SCREENS.filter((s) => s.chapter === chapter.id).flatMap((s) => {
      const selection = selectionFor(state, s.id, currentTotal);
      return selection ? [selection] : [];
    }),
  }));
}

/** Every decision in walkthrough order. */
export function allSelections(state: ConfiguratorState): SelectionDetail[] {
  return selectionsByChapter(state).flatMap((c) => c.selections);
}
