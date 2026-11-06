"use client";

import Image from "next/image";
import { lotOptions } from "@/lib/defaults";
import type { LotOption } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import { landSituationCopy } from "@/lib/copy";
import { monthlyDeltaFor } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { getLotAsset } from "@/lib/visual-assets";
import ChoiceRow, { ChoiceGroup, MonthlyDelta, RadioMark, Tag, choiceRowClass } from "@/components/configurator/ui/ChoiceRow";
import { usePricesShown } from "@/components/configurator/ui/PriceVisibility";

interface LotStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

const BROWSE_LOTS: Partial<ConfiguratorState> = { landSituation: "gold-river", uploadedLot: null };
const OWN_LAND: Partial<ConfiguratorState> = { landSituation: "own", selectedLotId: null };

/** Choosing a lot also pre-selects the water and sewer services it has. */
function lotPatch(lot: LotOption): Partial<ConfiguratorState> {
  return {
    landSituation: "gold-river",
    selectedLotId: lot.id,
    waterType: lot.preselectedWater ?? "drilled",
    sewerType: lot.preselectedSewer ?? "septic",
  };
}

export default function LotStep({ state, onChange }: LotStepProps) {
  // Until the buyer picks, the lots stay open so there's something to look at.
  const situation = state.landSituation === "own" ? "own" : "gold-river";
  // Lots show the approved example photo for their terrain. A terrain without
  // one shows no photo but keeps the column, so the rows stay aligned.
  const reservePhoto = lotOptions.some((lot) => getLotAsset(lot.terrain));
  const monthlyDelta = monthlyDeltaFor(state);
  const pricesShown = usePricesShown();

  return (
    <div className="space-y-8">
      <ChoiceGroup legend="Where you'll build">
        <ChoiceRow
          name="land-situation"
          value="gold-river"
          label="See example lots"
          reason={landSituationCopy["gold-river"]}
          monthlyDelta={monthlyDelta(BROWSE_LOTS)}
          checked={situation === "gold-river"}
          onSelect={() => onChange(BROWSE_LOTS)}
        />
        <ChoiceRow
          name="land-situation"
          value="own"
          label="Use my own land"
          reason={landSituationCopy.own}
          monthlyDelta={monthlyDelta(OWN_LAND)}
          checked={situation === "own"}
          onSelect={() => onChange(OWN_LAND)}
        />
      </ChoiceGroup>

      {situation === "gold-river" && (
        <fieldset className="min-w-0">
          <legend className="sr-only">Example lots</legend>
          <div className="flex flex-col gap-2">
            {lotOptions.map((lot) => {
              const selected = state.selectedLotId === lot.id;
              const photo = getLotAsset(lot.terrain);
              const patch = lotPatch(lot);
              return (
                <label key={lot.id} className={`flex gap-4 p-3 ${choiceRowClass(selected)}`}>
                  <input
                    type="radio"
                    name="lot"
                    value={lot.id}
                    checked={selected}
                    onChange={() => onChange(patch)}
                    className="sr-only"
                  />
                  {reservePhoto && (
                    <span className="relative aspect-[4/3] w-28 shrink-0 self-start overflow-hidden sm:w-40">
                      {photo && (
                        <Image
                          src={photo.src}
                          width={photo.width}
                          height={photo.height}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                  )}

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-body font-medium text-text-primary">{lot.name}</span>
                        <Tag>Example lot</Tag>
                      </span>
                      <RadioMark checked={selected} />
                    </span>
                    {pricesShown && (
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-caption text-text-muted">Example price</span>
                        <span className="font-accent text-figure text-text-primary">{formatCurrency(lot.price)}</span>
                        <MonthlyDelta amount={monthlyDelta(patch)} />
                      </span>
                    )}
                    <span className="text-body-sm text-text-secondary">{lot.location}</span>
                    <span className="mt-1 text-caption uppercase tracking-eyebrow text-text-muted">Example values</span>
                    <span className="font-accent text-figure-sm uppercase tracking-wide text-text-secondary">
                      {lot.acreage} acres · {lot.widthFt} × {lot.depthFt} ft
                    </span>
                    <span className="text-caption capitalize text-text-muted">
                      {lot.availableServices.map((s) => s.replace(/-/g, " ")).join(" · ")}
                    </span>
                    <span className="mt-2 line-clamp-2 text-body-sm text-text-muted">{lot.description}</span>
                    {photo && <span className="mt-1 text-caption text-text-muted">{photo.caption}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Own land: fit and pricing details only */}
      {situation === "own" && (
        <div className="space-y-4 border border-border p-5">
          <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-text-muted">Lot Dimensions</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="own-lot-width" className="mb-1.5 block text-body-sm text-text-secondary">
                Width (feet)
              </label>
              <input
                id="own-lot-width"
                type="number"
                value={state.uploadedLot?.widthFt ?? 150}
                onChange={(e) =>
                  onChange({
                    uploadedLot: {
                      widthFt: parseInt(e.target.value) || 0,
                      depthFt: state.uploadedLot?.depthFt ?? 300,
                    },
                  })
                }
                className="w-full border border-border bg-input-bg px-3 py-2 text-body text-white focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="own-lot-depth" className="mb-1.5 block text-body-sm text-text-secondary">
                Depth (feet)
              </label>
              <input
                id="own-lot-depth"
                type="number"
                value={state.uploadedLot?.depthFt ?? 300}
                onChange={(e) =>
                  onChange({
                    uploadedLot: {
                      widthFt: state.uploadedLot?.widthFt ?? 150,
                      depthFt: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full border border-border bg-input-bg px-3 py-2 text-body text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>
          <p className="text-body-sm text-text-muted">
            Rural lots in our service area typically range 1–3 acres. Most of our models require at least 100′ × 200′.
            We&apos;ll confirm fit, setbacks, and access during your site assessment.
          </p>
        </div>
      )}
    </div>
  );
}
