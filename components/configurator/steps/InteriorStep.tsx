"use client";

import { CABINET_STAINS, cabinetColorsFor, interiorGroups } from "@/lib/defaults";
import { monthlyDeltaFor, priceDeltaFor } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { fireplaceCopy } from "@/lib/copy";
import { FIREPLACE_LABELS } from "@/lib/stage";
import { getOptionAsset } from "@/lib/visual-assets";
import ChoiceRow, { ChoiceGroup, PriceDelta } from "@/components/configurator/ui/ChoiceRow";
import OptionRows from "@/components/configurator/ui/OptionRows";
import type { OptionStateKey } from "@/components/configurator/ui/OptionRows";

interface InteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** The one interior decision this screen shows: a group id, or "fireplace". */
  only: string;
}

const STATE_KEY_MAP: Record<string, OptionStateKey> = {
  flooring: "flooringId",
  countertops: "countertopsId",
  cabinetStyle: "cabinetStyleId",
  paintPackage: "paintPackageId",
  interiorTrim: "interiorTrimId",
  lightingPackage: "lightingPackageId",
  hardwareFinish: "hardwareFinishId",
  insulation: "insulationId",
};

function FireplaceChoice({ state, onChange }: Pick<InteriorStepProps, "state" | "onChange">) {
  if (!state.modelId) {
    return <p className="text-text-muted">Select a home model first to see fireplace options.</p>;
  }
  const without = getOptionAsset("fireplace:without");
  const withInsert = getOptionAsset("fireplace:with");
  const reserveThumb = !!(without || withInsert);
  const monthlyDelta = monthlyDeltaFor(state);
  const priceDelta = priceDeltaFor(state);
  return (
    <ChoiceGroup legend="Fireplace">
      <ChoiceRow
        name="fireplace"
        value="without"
        label={FIREPLACE_LABELS.without}
        reason={fireplaceCopy.without}
        price={<PriceDelta amount={priceDelta({ hasFireplace: false })} />}
        monthlyDelta={monthlyDelta({ hasFireplace: false })}
        checked={!state.hasFireplace}
        onSelect={() => onChange({ hasFireplace: false })}
        thumb={without}
        reserveThumb={reserveThumb}
      />
      <ChoiceRow
        name="fireplace"
        value="with"
        label={FIREPLACE_LABELS.with}
        reason={fireplaceCopy.with}
        price={<PriceDelta amount={priceDelta({ hasFireplace: true })} />}
        monthlyDelta={monthlyDelta({ hasFireplace: true })}
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

  if (only === "cabinetStyle") {
    const styles = interiorGroups.find((g) => g.id === "cabinetStyle")?.options ?? [];
    // A stain needs solid wood doors: going back to painted MDF resets a stain to white.
    const onStyle = (patch: Partial<ConfiguratorState>) =>
      onChange(
        patch.cabinetStyleId && patch.cabinetStyleId !== "premium-shaker" && CABINET_STAINS.includes(state.cabinetColorId)
          ? { ...patch, cabinetColorId: "white" }
          : patch
      );
    return (
      <div className="space-y-8">
        <OptionRows groupId="cabinetStyle" legend="Cabinet style" options={styles} state={state} stateKey="cabinetStyleId" onChange={onStyle} />
        <OptionRows
          groupId="cabinetColor"
          legend="Cabinet colour"
          showLegend
          options={cabinetColorsFor(state.cabinetStyleId)}
          state={state}
          stateKey="cabinetColorId"
          onChange={onChange}
        />
      </div>
    );
  }

  const group = interiorGroups.find((g) => g.id === only);
  const stateKey = STATE_KEY_MAP[only];
  if (!group || !stateKey) return null;

  return (
    <OptionRows
      groupId={group.id}
      legend={group.label}
      options={group.options}
      state={state}
      stateKey={stateKey}
      onChange={onChange}
    />
  );
}
