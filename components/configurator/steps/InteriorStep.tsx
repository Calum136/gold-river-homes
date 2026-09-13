"use client";

import { interiorGroups } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";
import { FIREPLACE_LABELS } from "@/lib/stage";
import { getOptionAsset } from "@/lib/visual-assets";
import ChoiceRow, { ChoiceGroup, PriceDelta } from "@/components/configurator/ui/ChoiceRow";
import OptionRows from "@/components/configurator/ui/OptionRows";

interface InteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** The one interior decision this screen shows: a group id, or "fireplace". */
  only: string;
}

const STATE_KEY_MAP: Record<string, keyof ConfiguratorState> = {
  flooring: "flooringId",
  countertops: "countertopsId",
  cabinetStyle: "cabinetStyleId",
  paintPackage: "paintPackageId",
  interiorTrim: "interiorTrimId",
  lightingPackage: "lightingPackageId",
  hardwareFinish: "hardwareFinishId",
  insulation: "insulationId",
};

// Matches the electric insert line item in calculateConfiguratorPrice().
const FIREPLACE_PRICE = 4500;

function FireplaceChoice({ state, onChange }: Pick<InteriorStepProps, "state" | "onChange">) {
  if (!state.modelId) {
    return <p className="text-text-muted">Select a home model first to see fireplace options.</p>;
  }
  const without = getOptionAsset("fireplace:without");
  const withInsert = getOptionAsset("fireplace:with");
  const reserveThumb = !!(without || withInsert);
  return (
    <ChoiceGroup legend="Fireplace">
      <ChoiceRow
        name="fireplace"
        value="without"
        label={FIREPLACE_LABELS.without}
        price={<PriceDelta amount={0} />}
        checked={!state.hasFireplace}
        onSelect={() => onChange({ hasFireplace: false })}
        thumb={without}
        reserveThumb={reserveThumb}
      />
      <ChoiceRow
        name="fireplace"
        value="with"
        label={FIREPLACE_LABELS.with}
        description="Wall-mounted electric insert, no venting required"
        price={<PriceDelta amount={FIREPLACE_PRICE} />}
        checked={state.hasFireplace}
        onSelect={() => onChange({ hasFireplace: true })}
        thumb={withInsert}
        reserveThumb={reserveThumb}
      />
    </ChoiceGroup>
  );
}

export default function InteriorStep({ state, onChange, only }: InteriorStepProps) {
  if (only === "fireplace") return <FireplaceChoice state={state} onChange={onChange} />;

  const group = interiorGroups.find((g) => g.id === only);
  const stateKey = STATE_KEY_MAP[only];
  if (!group || !stateKey) return null;

  return (
    <OptionRows
      groupId={group.id}
      legend={group.label}
      options={group.options}
      selectedId={String(state[stateKey])}
      modelId={state.modelId}
      onSelect={(id) => onChange({ [stateKey]: id })}
    />
  );
}
