import { isOptionAvailable } from "@/lib/defaults";
import type { OptionItem } from "@/lib/defaults";
import { displayedOptionDelta } from "@/lib/pricing";
import { getOptionAsset } from "@/lib/visual-assets";
import ChoiceRow, { ChoiceGroup, PriceDelta } from "./ChoiceRow";

interface OptionRowsProps {
  groupId: string;
  legend: string;
  showLegend?: boolean;
  options: OptionItem[];
  selectedId: string;
  modelId: string | null;
  onSelect: (optionId: string) => void;
}

// One radio row per option in a data group. Thumbnails come from the approved
// photo manifest under "<groupId>:<optionId>"; an option without a photo shows
// its colour swatch if it has one, otherwise just the choice.
export default function OptionRows({ groupId, legend, showLegend, options, selectedId, modelId, onSelect }: OptionRowsProps) {
  const thumbs = options.map((opt) => getOptionAsset(`${groupId}:${opt.id}`));
  const reserveThumb = options.some((opt, i) => !!thumbs[i] || !!opt.swatchHex);

  return (
    <ChoiceGroup legend={legend} showLegend={showLegend}>
      {options.map((opt, i) => (
        <ChoiceRow
          key={opt.id}
          name={groupId}
          value={opt.id}
          label={opt.label}
          description={opt.description}
          price={<PriceDelta amount={displayedOptionDelta(groupId, opt.id, modelId, opt.priceDelta)} />}
          checked={selectedId === opt.id}
          onSelect={() => onSelect(opt.id)}
          disabled={!isOptionAvailable(opt, modelId)}
          thumb={thumbs[i]}
          swatchHex={opt.swatchHex}
          reserveThumb={reserveThumb}
          paletteHexes={opt.paletteHexes}
        />
      ))}
    </ChoiceGroup>
  );
}
