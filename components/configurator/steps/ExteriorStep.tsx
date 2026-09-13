"use client";

import { exteriorGroups, sidingColors, metalRoofColors } from "@/lib/defaults";
import { porchDelta } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { PORCH_LABELS } from "@/lib/stage";
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
          selectedId={state.sidingStyleId}
          modelId={state.modelId}
          onSelect={(id) => onChange({ sidingStyleId: id })}
        />
      );

    case "sidingColor":
      return (
        <OptionRows
          groupId="sidingColor"
          legend="Siding colour"
          options={sidingColors}
          selectedId={state.sidingColorId}
          modelId={state.modelId}
          onSelect={(id) => onChange({ sidingColorId: id })}
        />
      );

    case "roofType":
      return (
        <div className="space-y-8">
          <OptionRows
            groupId="roofType"
            legend="Roofing"
            options={groupOptions("roofType")}
            selectedId={state.roofTypeId}
            modelId={state.modelId}
            onSelect={(id) => onChange({ roofTypeId: id })}
          />
          {state.roofTypeId === "metal" && (
            <OptionRows
              groupId="metalRoofColor"
              legend="Metal roof colour"
              showLegend
              options={metalRoofColors}
              selectedId={state.metalRoofColorId}
              modelId={state.modelId}
              onSelect={(id) => onChange({ metalRoofColorId: id })}
            />
          )}
        </div>
      );

    case "porch": {
      const without = getOptionAsset("porch:without");
      const withPorch = getOptionAsset("porch:with");
      const reserveThumb = !!(without || withPorch);
      return (
        <ChoiceGroup legend="Front porch">
          <ChoiceRow
            name="porch"
            value="without"
            label={PORCH_LABELS.without}
            price={<PriceDelta amount={0} />}
            checked={!state.hasFrontPorch}
            onSelect={() => onChange({ hasFrontPorch: false })}
            thumb={without}
            reserveThumb={reserveThumb}
          />
          <ChoiceRow
            name="porch"
            value="with"
            label={PORCH_LABELS.with}
            description="Adds ~200 sq ft to your roof area · Increases curb appeal"
            price={<PriceDelta amount={porchDelta(state)} />}
            checked={state.hasFrontPorch}
            onSelect={() => onChange({ hasFrontPorch: true })}
            thumb={withPorch}
            reserveThumb={reserveThumb}
          />
        </ChoiceGroup>
      );
    }

    case "exteriorTrim":
      return (
        <OptionRows
          groupId="exteriorTrim"
          legend="Window and door trim"
          options={groupOptions("exteriorTrim")}
          selectedId={state.exteriorTrimId}
          modelId={state.modelId}
          onSelect={(id) => onChange({ exteriorTrimId: id })}
        />
      );
  }
}
