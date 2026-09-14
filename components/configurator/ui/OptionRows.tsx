import { isOptionAvailable } from "@/lib/defaults";
import type { OptionItem } from "@/lib/defaults";
import { priceDeltaFor, monthlyDeltaFor } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { getOptionAsset } from "@/lib/visual-assets";
import ChoiceRow, { ChoiceGroup, PriceDelta } from "./ChoiceRow";

/** True for the options transcribed from Supreme's 2026 standard spec sheets. */
const isSupremeStandard = (opt: OptionItem) => opt.description?.endsWith("Supreme's standard.") ?? false;

/** State fields that hold the id of one option from a data group. */
export type OptionStateKey =
  | "sidingStyleId"
  | "sidingColorId"
  | "roofTypeId"
  | "metalRoofColorId"
  | "exteriorTrimId"
  | "flooringId"
  | "countertopsId"
  | "cabinetStyleId"
  | "paintPackageId"
  | "interiorTrimId"
  | "lightingPackageId"
  | "hardwareFinishId"
  | "insulationId";

interface OptionRowsProps {
  groupId: string;
  legend: string;
  showLegend?: boolean;
  options: OptionItem[];
  state: ConfiguratorState;
  /** The state field this group's selection lives in. */
  stateKey: OptionStateKey;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

// One radio row per option in a data group, each with its price (the figure the
// total charges), its effect on the monthly payment and its approved reason.
// Thumbnails come from the approved photo manifest under "<groupId>:<optionId>";
// an option without a photo shows its colour swatch if it has one.
export default function OptionRows({ groupId, legend, showLegend, options, state, stateKey, onChange }: OptionRowsProps) {
  const thumbs = options.map((opt) => getOptionAsset(`${groupId}:${opt.id}`));
  const reserveThumb = options.some((opt, i) => !!thumbs[i] || !!opt.swatchHex);
  const priceDelta = priceDeltaFor(state);
  const monthlyDelta = monthlyDeltaFor(state);

  return (
    <ChoiceGroup legend={legend} showLegend={showLegend}>
      {options.map((opt, i) => {
        const patch: Partial<ConfiguratorState> = { [stateKey]: opt.id };
        return (
          <ChoiceRow
            key={opt.id}
            name={groupId}
            value={opt.id}
            label={opt.label}
            reason={opt.whyItMatters}
            tag={isSupremeStandard(opt) ? "Supreme standard" : undefined}
            price={<PriceDelta amount={priceDelta(patch)} />}
            monthlyDelta={monthlyDelta(patch)}
            checked={state[stateKey] === opt.id}
            onSelect={() => onChange(patch)}
            disabled={!isOptionAvailable(opt, state.modelId)}
            thumb={thumbs[i]}
            swatchHex={opt.swatchHex}
            reserveThumb={reserveThumb}
            paletteHexes={opt.paletteHexes}
          />
        );
      })}
    </ChoiceGroup>
  );
}
