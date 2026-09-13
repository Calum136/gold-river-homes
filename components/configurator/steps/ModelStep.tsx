"use client";

import Image from "next/image";
import { homeModels, homeCategories } from "@/lib/defaults";
import type { HomeModel } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import { monthlyDeltaFor } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { getModelHero, sourceLabel } from "@/lib/visual-assets";
import { MonthlyDelta, RadioMark, choiceRowClass } from "@/components/configurator/ui/ChoiceRow";

interface ModelStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

// Every model card shows that model's own hero photo from the approved photo
// manifest, labelled as a Supreme Homes photo or rendering, with its real size,
// its price, how it moves the monthly payment and its approved reason.
export default function ModelStep({ state, onChange }: ModelStepProps) {
  const monthlyDelta = monthlyDeltaFor(state);
  // A model without a fireplace option drops a fireplace chosen for another model.
  const patchFor = (model: HomeModel): Partial<ConfiguratorState> => ({
    modelId: model.id,
    hasFireplace: model.hasFireplace ? state.hasFireplace : false,
  });

  return (
    <fieldset className="min-w-0 space-y-10">
      <legend className="sr-only">Home model</legend>
      {homeCategories.map((cat) => {
        const modelsInCat = homeModels.filter((m) => m.category === cat.id);
        return (
          <div key={cat.id}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-title text-text-primary">{cat.label}</h2>
              <span className="shrink-0 font-accent text-figure-sm text-text-secondary">{cat.priceRange}</span>
            </div>
            <p className="mb-4 mt-1 text-body-sm text-text-muted">{cat.description}</p>

            <div className="flex flex-col gap-2">
              {modelsInCat.map((model) => {
                const selected = state.modelId === model.id;
                const hero = getModelHero(model.id);
                const patch = patchFor(model);
                return (
                  <label key={model.id} className={`flex gap-4 p-3 ${choiceRowClass(selected)}`}>
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={selected}
                      onChange={() => onChange(patch)}
                      className="sr-only"
                    />
                    <span className="relative aspect-[4/3] w-28 shrink-0 self-start overflow-hidden bg-bg-tertiary sm:w-40">
                      {hero && (
                        <Image
                          src={hero.src}
                          width={hero.width}
                          height={hero.height}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-body font-medium text-text-primary">{model.name}</span>
                        <RadioMark checked={selected} />
                      </span>
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-accent text-figure text-text-primary">{formatCurrency(model.price)}</span>
                        <MonthlyDelta amount={monthlyDelta(patch)} />
                      </span>
                      <span className="mt-1 font-accent text-figure-sm uppercase tracking-wide text-text-secondary">
                        {model.beds} bed · {model.baths} bath · {model.sqft.toLocaleString("en-CA")} sq ft
                      </span>
                      <span className="font-accent text-figure-sm uppercase tracking-wide text-text-secondary">
                        {model.lengthFt} × {model.widthFt} ft{model.storeys === 2 && " · two storeys"}
                      </span>
                      {model.hasFireplace && <span className="text-caption text-text-muted">Fireplace option</span>}
                      {model.whyItMatters && (
                        <span className="mt-2 text-body-sm text-text-muted">{model.whyItMatters}</span>
                      )}
                      {hero && <span className="mt-1 text-caption text-text-muted">{sourceLabel(hero)}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
