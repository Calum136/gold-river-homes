import type { FoundationType, WaterType, SewerType } from "./defaults";
import {
  homeModels,
  lotOptions,
  exteriorGroups,
  interiorGroups,
  waterCosts,
  sewerCosts,
  foundationCosts,
  siteEstimates,
  extensionOptions,
} from "./defaults";
import type { CostBreakdown } from "./calculator";

// ============================================
// Per-sqft pricing sheet.
// Replace placeholder rates with real Gold River numbers.
// ============================================

export interface PricingSheet {
  roof: {
    shingles: { perSqft: number };
    metal: { perSqft: number };
  };
  siding: {
    horizontal: { perSqft: number };
    vertical: { perSqft: number };
    "board-batten": { perSqft: number };
  };
  flooring: {
    lvp: { perSqft: number };
    laminate: { perSqft: number };
    hardwood: { perSqft: number };
  };
  extensions: {
    "front-porch": { flat: number; addedRoofSqft: number };
    garage: { flat: number; addedRoofSqft: number };
    "second-story": { flat: number; addedRoofSqft: number };
  };
}

export const PRICING_SHEET: PricingSheet = {
  roof: {
    shingles: { perSqft: 2.80 },
    metal: { perSqft: 5.50 },
  },
  siding: {
    horizontal: { perSqft: 2.20 },
    vertical: { perSqft: 2.80 },
    "board-batten": { perSqft: 3.60 },
  },
  flooring: {
    lvp: { perSqft: 4.50 },
    laminate: { perSqft: 6.50 },
    hardwood: { perSqft: 10.00 },
  },
  extensions: {
    "front-porch": { flat: 0, addedRoofSqft: 200 },
    garage: { flat: 35000, addedRoofSqft: 0 },
    "second-story": { flat: 85000, addedRoofSqft: 0 },
  },
};

// ============================================
// State types
// ============================================

export interface ConfiguratorState {
  step: number;

  // Step 1
  landSituation: "gold-river" | "own" | null;
  selectedLotId: string | null;
  uploadedLot: { widthFt: number; depthFt: number } | null;

  // Step 2
  modelId: string | null;

  // Step 3 — Exterior
  sidingStyleId: string;
  sidingColorId: string;
  roofTypeId: string;
  metalRoofColorId: string;
  hasFrontPorch: boolean;
  exteriorTrimId: string;

  // Step 4 — Interior
  flooringId: string;
  countertopsId: string;
  cabinetStyleId: string;
  paintPackageId: string;
  interiorTrimId: string;
  lightingPackageId: string;
  hardwareFinishId: string;
  insulationId: string;
  hasFireplace: boolean;

  // Step 5 — Site
  foundationType: FoundationType;
  waterType: Exclude<WaterType, null>;
  sewerType: Exclude<SewerType, null>;
  landPrice: number;

  // Step 6 — Mortgage
  mortgage: {
    downPaymentPercent: number;
    interestRate: number;
    amortizationYears: number;
  };
}

export function defaultState(): ConfiguratorState {
  return {
    step: 1,
    landSituation: null,
    selectedLotId: null,
    uploadedLot: null,
    modelId: null,
    sidingStyleId: "horizontal",
    sidingColorId: "white",
    roofTypeId: "shingles",
    metalRoofColorId: "charcoal",
    hasFrontPorch: false,
    exteriorTrimId: "standard",
    flooringId: "lvp",
    countertopsId: "laminate",
    cabinetStyleId: "standard",
    paintPackageId: "builder-white",
    interiorTrimId: "standard",
    lightingPackageId: "standard",
    hardwareFinishId: "brushed-nickel",
    insulationId: "standard",
    hasFireplace: false,
    foundationType: "crawlspace",
    waterType: "drilled",
    sewerType: "septic",
    landPrice: 75000,
    mortgage: {
      downPaymentPercent: 5,
      interestRate: 5.5,
      amortizationYears: 25,
    },
  };
}

// ============================================
// Displayed option deltas
// ============================================

// Per-sqft options (siding style, roof, flooring) are charged by area, so the
// price shown on their tiles must be computed from the selected model — a flat
// "+$1,500" label that doesn't match the charged amount destroys trust.
export function displayedOptionDelta(
  groupId: string,
  optionId: string,
  modelId: string | null,
  flatDelta: number
): number {
  const model = homeModels.find((m) => m.id === modelId);
  if (!model) return flatDelta;

  if (groupId === "sidingStyle") {
    const rate = PRICING_SHEET.siding[optionId as keyof PricingSheet["siding"]];
    if (!rate) return flatDelta;
    return Math.round(model.wallSqft * (rate.perSqft - PRICING_SHEET.siding.horizontal.perSqft));
  }
  if (groupId === "roofType") {
    if (optionId !== "metal") return 0;
    return Math.round(model.roofSqft * (PRICING_SHEET.roof.metal.perSqft - PRICING_SHEET.roof.shingles.perSqft));
  }
  if (groupId === "flooring") {
    const rate = PRICING_SHEET.flooring[optionId as keyof PricingSheet["flooring"]];
    if (!rate) return flatDelta;
    return Math.round(model.sqft * (rate.perSqft - PRICING_SHEET.flooring.lvp.perSqft));
  }
  return flatDelta;
}

/** Total added cost of the front porch: flat build cost + its added roof area. */
export function porchDelta(state: ConfiguratorState): number {
  const porchExt = extensionOptions.find((e) => e.id === "front-porch");
  const roofRate = state.roofTypeId === "metal"
    ? PRICING_SHEET.roof.metal.perSqft
    : PRICING_SHEET.roof.shingles.perSqft;
  return (porchExt?.mid ?? 18000) + Math.round(PRICING_SHEET.extensions["front-porch"].addedRoofSqft * roofRate);
}

// ============================================
// Price calculation
// ============================================

function getOptionDelta(groups: typeof exteriorGroups, groupId: string, selectedId: string): number {
  const group = groups.find((g) => g.id === groupId);
  if (!group) return 0;
  const option = group.options.find((o) => o.id === selectedId);
  return option?.priceDelta ?? 0;
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
  desc?: string;
}

export interface ConfiguratorPriceResult {
  items: PriceBreakdownItem[];
  totalCost: number;
  landIncluded: boolean;
  landPrice: number;
  isBundlePricing: boolean;
  costs: CostBreakdown;
}

export function calculateConfiguratorPrice(state: ConfiguratorState): ConfiguratorPriceResult {
  const model = homeModels.find((m) => m.id === state.modelId);
  const basePrice = model?.price ?? 0;
  const roofSqft = model?.roofSqft ?? 0;
  const wallSqft = model?.wallSqft ?? 0;
  const homeSqft = model?.sqft ?? 0;

  const items: PriceBreakdownItem[] = [];

  // Base home price
  items.push({ label: "Home — " + (model?.name ?? "Selected Model"), amount: basePrice });

  // Roof cost (per sqft)
  const porchRoofAdded = state.hasFrontPorch ? (PRICING_SHEET.extensions["front-porch"].addedRoofSqft) : 0;
  const totalRoofSqft = roofSqft + porchRoofAdded;
  const roofRate = state.roofTypeId === "metal"
    ? PRICING_SHEET.roof.metal.perSqft
    : PRICING_SHEET.roof.shingles.perSqft;
  const roofCost = Math.round(totalRoofSqft * roofRate);
  items.push({
    label: state.roofTypeId === "metal" ? "Metal Roof" : "Architectural Shingles",
    amount: roofCost,
    desc: `${totalRoofSqft} sqft × $${roofRate.toFixed(2)}/sqft`,
  });

  // Siding cost (per sqft)
  const sidingRate = PRICING_SHEET.siding[state.sidingStyleId as keyof PricingSheet["siding"]] ?? { perSqft: PRICING_SHEET.siding.horizontal.perSqft };
  const sidingCost = Math.round(wallSqft * sidingRate.perSqft);
  const sidingGroup = exteriorGroups.find((g) => g.id === "sidingStyle");
  const sidingOption = sidingGroup?.options.find((o) => o.id === state.sidingStyleId);
  items.push({
    label: sidingOption?.label ?? "Siding",
    amount: sidingCost,
    desc: `${wallSqft} sqft × $${sidingRate.perSqft.toFixed(2)}/sqft`,
  });

  // Exterior trim upgrade
  const exteriorTrimDelta = getOptionDelta(exteriorGroups, "exteriorTrim", state.exteriorTrimId);
  if (exteriorTrimDelta > 0) {
    const trimOption = exteriorGroups.find((g) => g.id === "exteriorTrim")?.options.find((o) => o.id === state.exteriorTrimId);
    items.push({ label: trimOption?.label ?? "Exterior Trim", amount: exteriorTrimDelta });
  }

  // Front porch
  if (state.hasFrontPorch) {
    const porchExt = extensionOptions.find((e) => e.id === "front-porch");
    items.push({ label: "Covered Front Porch", amount: porchExt?.mid ?? 18000 });
  }

  // Interior: flooring (per sqft)
  const flooringRate = PRICING_SHEET.flooring[state.flooringId as keyof PricingSheet["flooring"]] ?? { perSqft: PRICING_SHEET.flooring.lvp.perSqft };
  const flooringCost = Math.round(homeSqft * flooringRate.perSqft);
  const flooringOption = interiorGroups.find((g) => g.id === "flooring")?.options.find((o) => o.id === state.flooringId);
  items.push({ label: flooringOption?.label ?? "Flooring", amount: flooringCost, desc: `${homeSqft} sqft × $${flooringRate.perSqft.toFixed(2)}/sqft` });

  // Interior flat upgrades
  const interiorFlatIds: Array<{ stateKey: keyof ConfiguratorState; groupId: string }> = [
    { stateKey: "countertopsId", groupId: "countertops" },
    { stateKey: "cabinetStyleId", groupId: "cabinetStyle" },
    { stateKey: "paintPackageId", groupId: "paintPackage" },
    { stateKey: "interiorTrimId", groupId: "interiorTrim" },
    { stateKey: "lightingPackageId", groupId: "lightingPackage" },
    { stateKey: "hardwareFinishId", groupId: "hardwareFinish" },
    { stateKey: "insulationId", groupId: "insulation" },
  ];

  for (const { stateKey, groupId } of interiorFlatIds) {
    const selectedId = state[stateKey] as string;
    const group = interiorGroups.find((g) => g.id === groupId);
    const option = group?.options.find((o) => o.id === selectedId);
    if (option && option.priceDelta > 0) {
      items.push({ label: option.label, amount: option.priceDelta });
    }
  }

  // Fireplace
  if (state.hasFireplace) {
    items.push({ label: "Fireplace (Electric Insert)", amount: 4500 });
  }

  // Land
  const lot = state.landSituation === "gold-river" ? lotOptions.find((l) => l.id === state.selectedLotId) : null;
  const landIncluded = state.landSituation !== null;
  const landPrice = lot ? lot.price : (state.landSituation === "own" ? 0 : state.landPrice);
  const isBundlePricing = state.landSituation === "gold-river" && !!lot;

  if (lot) {
    items.push({ label: `Land — ${lot.name}`, amount: lot.price, desc: lot.location });
  }

  // Site costs
  const waterCost = waterCosts[state.waterType].mid;
  const sewerCost = sewerCosts[state.sewerType].mid;
  const foundCost = foundationCosts[state.foundationType].mid;
  const clearingCost = siteEstimates.clearing.mid;
  const drivewayCost = siteEstimates.driveway.mid;
  const electricalCost = siteEstimates.electrical.mid;
  const deliveryCost = siteEstimates.delivery.mid;
  const permitsCost = siteEstimates.permits.mid;

  items.push({ label: foundationCosts[state.foundationType].label, amount: foundCost });
  items.push({ label: waterCosts[state.waterType].label, amount: waterCost });
  items.push({ label: sewerCosts[state.sewerType].label, amount: sewerCost });
  items.push({ label: "Land Clearing & Grading", amount: clearingCost });
  items.push({ label: "Driveway", amount: drivewayCost });
  items.push({ label: "Electrical Service", amount: electricalCost });
  items.push({ label: "Home Delivery & Setup", amount: deliveryCost });
  items.push({ label: "Permits & Inspections", amount: permitsCost });

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const contingency = Math.round(subtotal * 0.1);
  items.push({ label: "Contingency (10%)", amount: contingency, desc: "Buffer for unexpected costs" });

  const totalCost = subtotal + contingency;

  const upgrades = 0;
  const costs: CostBreakdown = {
    homePrice: basePrice + roofCost + sidingCost,
    landPrice: lot?.price ?? 0,
    sitePrep: foundCost + clearingCost + drivewayCost,
    waterService: waterCost,
    sewerService: sewerCost,
    electrical: electricalCost,
    delivery: deliveryCost,
    permits: permitsCost,
    contingency,
    upgrades,
  };

  return { items, totalCost, landIncluded, landPrice, isBundlePricing, costs };
}
