import { defaultState } from "./pricing";
import type { ConfiguratorState } from "./pricing";
import {
  cabinetColors,
  homeModels,
  lotOptions,
  exteriorGroups,
  interiorGroups,
  sidingColors,
  metalRoofColors,
} from "./defaults";
import type { FoundationType, WaterType, SewerType } from "./defaults";

// ============================================
// Saved-state safety net.
//
// A saved configuration (localStorage today, share links later) can reference
// option ids that no longer exist — the buyer saved it before an option menu
// change, or a link was crafted by hand. sanitizeState() is the single place
// that turns arbitrary saved/incoming data into a ConfiguratorState we trust:
// known legacy ids are mapped forward, anything else unrecognized falls back
// to the current default, and numeric inputs are clamped to sane ranges.
// ============================================

const FOUNDATION_TYPES: readonly FoundationType[] = ["slab", "crawlspace", "basement"];
const WATER_TYPES: readonly Exclude<WaterType, null>[] = ["drilled", "dug", "municipal"];
const SEWER_TYPES: readonly Exclude<SewerType, null>[] = ["septic", "municipal"];

function groupOptionIds(groupId: string): string[] {
  const group = [...exteriorGroups, ...interiorGroups].find((g) => g.id === groupId);
  return group ? group.options.map((o) => o.id) : [];
}

/** Returns `value` if it's one of `allowed`, otherwise `fallback`. */
function validEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Returns `value` if it's one of `allowed`, otherwise null (for fields whose default is null). */
function validNullableId(value: unknown, allowed: readonly string[]): string | null {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

function validBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function validNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Legacy option-id renames from the Supreme 2026 standard-spec pass
 * (workstream C2a, Sep 2026). Applied before the generic existence check
 * below, so a saved "lvp" flooring choice becomes "standard" instead of
 * silently reverting to whatever the default happens to be.
 */
function applyLegacyIdMapping(raw: Record<string, unknown>): void {
  if (raw.flooringId === "lvp" || raw.flooringId === "laminate") raw.flooringId = "standard";
  if (raw.cabinetStyleId === "standard") raw.cabinetStyleId = "shaker";
  if (raw.lightingPackageId === "mid-range") raw.lightingPackageId = "standard";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validates and repairs an arbitrary saved/incoming value into a full
 * ConfiguratorState. Unknown keys are ignored; missing or invalid keys fall
 * back to defaultState(). Safe to call with anything, including malformed
 * JSON.parse output or a hand-edited share link.
 */
export function sanitizeState(raw: unknown): ConfiguratorState {
  const base = defaultState();
  if (!isPlainObject(raw)) return base;

  const src: Record<string, unknown> = { ...raw };
  applyLegacyIdMapping(src);

  const lotIds = lotOptions.map((l) => l.id);
  const modelIds = homeModels.map((m) => m.id);
  const sidingColorIds = sidingColors.map((c) => c.id);
  const metalRoofColorIds = metalRoofColors.map((c) => c.id);

  const landSituation = validEnum<"gold-river" | "own" | "__none__">(
    src.landSituation,
    ["gold-river", "own", "__none__"],
    base.landSituation ?? "__none__"
  );

  const uploadedLot =
    isPlainObject(src.uploadedLot) &&
    typeof src.uploadedLot.widthFt === "number" &&
    typeof src.uploadedLot.depthFt === "number"
      ? { widthFt: src.uploadedLot.widthFt, depthFt: src.uploadedLot.depthFt }
      : base.uploadedLot;

  const mortgageSrc = isPlainObject(src.mortgage) ? src.mortgage : {};

  const state: ConfiguratorState = {
    step: Math.max(1, Math.floor(validNumber(src.step, base.step))),

    landSituation: landSituation === "__none__" ? null : landSituation,
    selectedLotId: validNullableId(src.selectedLotId, lotIds),
    uploadedLot,

    modelId: validNullableId(src.modelId, modelIds),

    sidingStyleId: validEnum(src.sidingStyleId, groupOptionIds("sidingStyle"), base.sidingStyleId),
    sidingColorId: validEnum(src.sidingColorId, sidingColorIds, base.sidingColorId),
    roofTypeId: validEnum(src.roofTypeId, groupOptionIds("roofType"), base.roofTypeId),
    metalRoofColorId: validEnum(src.metalRoofColorId, metalRoofColorIds, base.metalRoofColorId),
    hasFrontPorch: validBoolean(src.hasFrontPorch, base.hasFrontPorch),
    hasVestibule: validBoolean(src.hasVestibule, base.hasVestibule),
    exteriorTrimId: validEnum(src.exteriorTrimId, groupOptionIds("exteriorTrim"), base.exteriorTrimId),

    flooringId: validEnum(src.flooringId, groupOptionIds("flooring"), base.flooringId),
    countertopsId: validEnum(src.countertopsId, groupOptionIds("countertops"), base.countertopsId),
    cabinetStyleId: validEnum(src.cabinetStyleId, groupOptionIds("cabinetStyle"), base.cabinetStyleId),
    cabinetColorId: validEnum(src.cabinetColorId, cabinetColors.map((c) => c.id), base.cabinetColorId),
    paintPackageId: validEnum(src.paintPackageId, groupOptionIds("paintPackage"), base.paintPackageId),
    interiorTrimId: validEnum(src.interiorTrimId, groupOptionIds("interiorTrim"), base.interiorTrimId),
    lightingPackageId: validEnum(src.lightingPackageId, groupOptionIds("lightingPackage"), base.lightingPackageId),
    hardwareFinishId: validEnum(src.hardwareFinishId, groupOptionIds("hardwareFinish"), base.hardwareFinishId),
    insulationId: validEnum(src.insulationId, groupOptionIds("insulation"), base.insulationId),
    hasFireplace: validBoolean(src.hasFireplace, base.hasFireplace),

    foundationType: validEnum<FoundationType>(src.foundationType, FOUNDATION_TYPES, base.foundationType),
    waterType: validEnum<Exclude<WaterType, null>>(src.waterType, WATER_TYPES, base.waterType),
    sewerType: validEnum<Exclude<SewerType, null>>(src.sewerType, SEWER_TYPES, base.sewerType),
    landPrice: validNumber(src.landPrice, base.landPrice),

    mortgage: {
      downPaymentPercent: clamp(validNumber(mortgageSrc.downPaymentPercent, base.mortgage.downPaymentPercent), 0, 100),
      interestRate: clamp(validNumber(mortgageSrc.interestRate, base.mortgage.interestRate), 0, 25),
      amortizationYears: clamp(validNumber(mortgageSrc.amortizationYears, base.mortgage.amortizationYears), 5, 30),
    },
  };

  return state;
}
