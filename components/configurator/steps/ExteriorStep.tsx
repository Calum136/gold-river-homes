"use client";

import { exteriorGroups, sidingColors, metalRoofColors, vestibuleAvailable } from "@/lib/defaults";
import { monthlyDeltaFor, priceDeltaFor } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { porchCopy, vestibuleCopy } from "@/lib/copy";
import { PORCH_LABELS, VESTIBULE_LABELS } from "@/lib/stage";
import { getOptionAsset } from "@/lib/visual-assets";
import ChoiceRow, { ChoiceGroup, PriceDelta } from "@/components/configurator/ui/ChoiceRow";
import OptionRows from "@/components/configurator/ui/OptionRows";

export type ExteriorSection = "sidingStyle" | "sidingColor" | "roofType" | "porch" | "exteriorTrim";

interface ExteriorStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** The one exterior decision this screen shows. */
  only: ExteriorSection;
}

const groupOptions = (groupId: string) => exteriorGroups.find((g) => g.id === groupId)?.options ?? [];

export default function ExteriorStep({ state, onChange, only }: ExteriorStepProps) {
  switch (only) {
    case "sidingStyle":
      return (
        <OptionRows
          groupId="sidingStyle"
          legend="Siding style"
          options={groupOptions("sidingStyle")}
          state={state}
          stateKey="sidingStyleId"
          onChange={onChange}
        />
      );

    case "sidingColor":
      return (
        <OptionRows
          groupId="sidingColor"
          legend="Siding colour"
          options={sidingColors}
          state={state}
          stateKey="sidingColorId"
          onChange={onChange}
        />
      );

    case "roofType":
      return (
        <div className="space-y-8">
          <OptionRows
            groupId="roofType"
            legend="Roofing"
            options={groupOptions("roofType")}
            state={state}
            stateKey="roofTypeId"
            onChange={onChange}
          />
          {state.roofTypeId === "metal" && (
            <OptionRows
              groupId="metalRoofColor"
              legend="Metal roof colour"
              showLegend
              options={metalRoofColors}
              state={state}
              stateKey="metalRoofColorId"
              onChange={onChange}
            />
          )}
        </div>
      );

    case "porch": {
      const without = getOptionAsset("porch:without");
      const withPorch = getOptionAsset("porch:with");
      const reserveThumb = !!(without || withPorch);
      const monthlyDelta = monthlyDeltaFor(state);
      const priceDelta = priceDeltaFor(state);
      const porchRows = (
        <ChoiceGroup legend="Front porch">
          <ChoiceRow
            name="porch"
            value="without"
            label={PORCH_LABELS.without}
            reason={porchCopy.without}
            price={<PriceDelta amount={priceDelta({ hasFrontPorch: false })} />}
            monthlyDelta={monthlyDelta({ hasFrontPorch: false })}
            checked={!state.hasFrontPorch}
            onSelect={() => onChange({ hasFrontPorch: false })}
            thumb={without}
            reserveThumb={reserveThumb}
          />
          <ChoiceRow
            name="porch"
            value="with"
            label={PORCH_LABELS.with}
            reason={porchCopy.with}
            price={<PriceDelta amount={priceDelta({ hasFrontPorch: true })} />}
            monthlyDelta={monthlyDelta({ hasFrontPorch: true })}
            checked={state.hasFrontPorch}
            onSelect={() => onChange({ hasFrontPorch: true })}
            thumb={withPorch}
            reserveThumb={reserveThumb}
          />
        </ChoiceGroup>
      );
      if (!vestibuleAvailable(state.modelId)) return porchRows;
      // Models drawn in 3D also offer an enclosed entry vestibule.
      return (
        <div className="space-y-8">
          {porchRows}
          <ChoiceGroup legend="Entry vestibule" showLegend>
            <ChoiceRow
              name="vestibule"
              value="without"
              label={VESTIBULE_LABELS.without}
              reason={vestibuleCopy.without}
              price={<PriceDelta amount={priceDelta({ hasVestibule: false })} />}
              monthlyDelta={monthlyDelta({ hasVestibule: false })}
              checked={!state.hasVestibule}
              onSelect={() => onChange({ hasVestibule: false })}
            />
            <ChoiceRow
              name="vestibule"
              value="with"
              label={VESTIBULE_LABELS.with}
              reason={vestibuleCopy.with}
              price={<PriceDelta amount={priceDelta({ hasVestibule: true })} />}
              monthlyDelta={monthlyDelta({ hasVestibule: true })}
              checked={state.hasVestibule}
              onSelect={() => onChange({ hasVestibule: true })}
            />
          </ChoiceGroup>
        </div>
      );
    }

    case "exteriorTrim":
      return (
        <OptionRows
          groupId="exteriorTrim"
          legend="Window and door trim"
          options={groupOptions("exteriorTrim")}
          state={state}
          stateKey="exteriorTrimId"
          onChange={onChange}
        />
      );
  }
}
