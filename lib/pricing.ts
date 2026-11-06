import type { CostEstimate, FoundationType, WaterType, SewerType } from "./defaults";
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
  vestibuleAvailable,
} from "./defaults";
import { calculateMortgage, formatMortgageAssumption, monthlyPaymentFor } from "./calculator";
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
    standard: { perSqft: number };
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
    standard: { perSqft: 4.50 },
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
  /** Enclosed entry vestibule; offered only where vestibuleAvailable() says so. */
  hasVestibule: boolean;
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
    hasVestibule: false,
    exteriorTrimId: "standard",
    flooringId: "standard",
    countertopsId: "laminate",
    cabinetStyleId: "shaker",
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

/**
 * Returns a function giving the exact change in total cost if `patch` (exactly
 * what selecting a choice applies) were applied to the buyer's current
 * selections: calculateConfiguratorPrice on the patched state minus
 * calculateConfiguratorPrice on the current state, contingency included since
 * that's what the total charges. This is the only correct way to show an
 * option row's "+$X" — a flat or per-sqft-only figure computed independently
 * of the total (as this used to be) drifts from what the total actually
 * changes by, e.g. by omitting the 10% contingency on the added amount.
 *
 * 0 when the patch doesn't change the total, which includes the choice
 * already selected (its own patch reproduces the current state exactly), so
 * that row shows "Included" with no arithmetic to keep in sync.
 */
export function priceDeltaFor(state: ConfiguratorState): (patch: Partial<ConfiguratorState>) => number {
  const currentTotal = calculateConfiguratorPrice(state).totalCost;
  return (patch) => calculateConfiguratorPrice({ ...state, ...patch }).totalCost - currentTotal;
}

/** The electric fireplace insert: one flat line item in the total. */
export const FIREPLACE_PRICE = 4500;

// ============================================
// Monthly payment: the running figure and how each choice moves it
// ============================================

export interface RunningEstimate {
  totalCost: number;
  monthlyPayment: number;
  /** The mortgage terms behind monthlyPayment, e.g. "at 5% down, 5.5%, 25 years". */
  assumption: string;
}

/** The running figures for the buyer's current selections; null until a model is chosen. */
export function runningEstimate(state: ConfiguratorState): RunningEstimate | null {
  if (!state.modelId) return null;
  const { totalCost } = calculateConfiguratorPrice(state);
  const mortgage = calculateMortgage(totalCost, state.mortgage);
  return {
    totalCost,
    monthlyPayment: mortgage.monthlyPayment,
    assumption: formatMortgageAssumption(mortgage, state.mortgage),
  };
}

/**
 * Returns a function giving how the estimated monthly payment would change, in
 * whole dollars, if `patch` (exactly what selecting a choice applies) were
 * applied to the buyer's current selections: calculateConfiguratorPrice on the
 * patched state, then monthlyPaymentFor(that total) minus monthlyPaymentFor(the
 * current total), on the buyer's own mortgage terms.
 *
 * 0 when the total doesn't change, so the selected choice shows nothing. null
 * until a model is chosen: there's no running monthly figure yet for a change
 * to be relative to.
 */
export function monthlyDeltaFor(state: ConfiguratorState): (patch: Partial<ConfiguratorState>) => number | null {
  if (!state.modelId) return () => null;
  const currentTotal = calculateConfiguratorPrice(state).totalCost;
  const currentMonthly = monthlyPaymentFor(currentTotal, state.mortgage);
  return (patch) => {
    const total = calculateConfiguratorPrice({ ...state, ...patch }).totalCost;
    if (total === currentTotal) return 0;
    // `|| 0` turns a rounded -0 into 0.
    return Math.round(monthlyPaymentFor(total, state.mortgage) - currentMonthly) || 0;
  };
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
  /** What the total charges for this line: the mid estimate where the data has a range. */
  amount: number;
  /**
   * Low and high ends, set only on lines whose data has a range: the site costs,
   * and the contingency, which follows them. Model and option lines are single
   * estimate figures.
   */
  low?: number;
  high?: number;
  desc?: string;
  /** True for the example lot's price, shown as an example price, never as a listing. */
  isExample?: boolean;
}

export interface ConfiguratorPriceResult {
  items: PriceBreakdownItem[];
  /** The mid estimate: every ranged line at its mid. The monthly payment uses this. */
  totalCost: number;
  /** Every ranged line at its low end, contingency included. */
  totalLow: number;
  /** Every ranged line at its high end, contingency included. */
  totalHigh: number;
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
  const vestibule = state.hasVestibule && vestibuleAvailable(state.modelId)
    ? extensionOptions.find((e) => e.id === "entry-vestibule")
    : undefined;
  const totalRoofSqft = roofSqft + porchRoofAdded + (vestibule?.addedRoofSqft ?? 0);
  const roofRate = state.roofTypeId === "metal"
    ? PRICING_SHEET.roof.metal.perSqft
    : PRICING_SHEET.roof.shingles.perSqft;
  const roofCost = Math.round(totalRoofSqft * roofRate);
  const roofOption = exteriorGroups.find((g) => g.id === "roofType")?.options.find((o) => o.id === state.roofTypeId);
  items.push({
    label: roofOption?.label ?? "Roof",
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

  // Enclosed entry vestibule
  if (vestibule) {
    items.push({ label: vestibule.label, amount: vestibule.mid });
  }

  // Interior: flooring (per sqft)
  const flooringRate = PRICING_SHEET.flooring[state.flooringId as keyof PricingSheet["flooring"]] ?? { perSqft: PRICING_SHEET.flooring.standard.perSqft };
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
    items.push({ label: "Fireplace (Electric Insert)", amount: FIREPLACE_PRICE });
  }

  // Land
  const lot = state.landSituation === "gold-river" ? lotOptions.find((l) => l.id === state.selectedLotId) : null;
  const landIncluded = state.landSituation !== null;
  const landPrice = lot ? lot.price : (state.landSituation === "own" ? 0 : state.landPrice);
  const isBundlePricing = state.landSituation === "gold-river" && !!lot;

  if (lot) {
    items.push({ label: `Land — ${lot.name}`, amount: lot.price, desc: lot.location, isExample: true });
  }

  // Site costs: ranged estimates. The total charges each line's mid; the low
  // and high ends give the total's range.
  const siteLines: CostEstimate[] = [
    foundationCosts[state.foundationType],
    waterCosts[state.waterType],
    sewerCosts[state.sewerType],
    siteEstimates.clearing,
    siteEstimates.driveway,
    siteEstimates.electrical,
    siteEstimates.delivery,
    siteEstimates.permits,
  ];
  for (const line of siteLines) {
    items.push({ label: line.label, amount: line.mid, low: line.low, high: line.high });
  }
  const foundCost = foundationCosts[state.foundationType].mid;
  const waterCost = waterCosts[state.waterType].mid;
  const sewerCost = sewerCosts[state.sewerType].mid;
  const clearingCost = siteEstimates.clearing.mid;
  const drivewayCost = siteEstimates.driveway.mid;
  const electricalCost = siteEstimates.electrical.mid;
  const deliveryCost = siteEstimates.delivery.mid;
  const permitsCost = siteEstimates.permits.mid;

  const sum = (pick: (item: PriceBreakdownItem) => number) => items.reduce((s, i) => s + pick(i), 0);
  const subtotal = sum((i) => i.amount);
  const subtotalLow = sum((i) => i.low ?? i.amount);
  const subtotalHigh = sum((i) => i.high ?? i.amount);
  const contingency = Math.round(subtotal * 0.1);
  const contingencyLow = Math.round(subtotalLow * 0.1);
  const contingencyHigh = Math.round(subtotalHigh * 0.1);
  items.push({
    label: "Contingency (10%)",
    amount: contingency,
    low: contingencyLow,
    high: contingencyHigh,
    desc: "Buffer for unexpected costs",
  });

  const totalCost = subtotal + contingency;
  const totalLow = subtotalLow + contingencyLow;
  const totalHigh = subtotalHigh + contingencyHigh;

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

  return { items, totalCost, totalLow, totalHigh, landIncluded, landPrice, isBundlePricing, costs };
}
