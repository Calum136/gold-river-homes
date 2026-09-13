"use client";

import Image from "next/image";
import { homeModels, homeCategories } from "@/lib/defaults";
import { formatCurrency } from "@/lib/calculator";
import type { ConfiguratorState } from "@/lib/pricing";
import { getModelHero, sourceLabel } from "@/lib/visual-assets";
import { RadioMark, choiceRowClass } from "@/components/configurator/ui/ChoiceRow";

interface ModelStepProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
}

// Every model card shows that model's own hero photo from the approved photo
// manifest, labelled as a Supreme Homes photo or rendering, with its real size.
export default function ModelStep({ state, onChange }: ModelStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-white text-2xl mb-1">Choose Your Home</h2>
        <p className="text-text-muted text-sm">
          Select the model that fits your lifestyle. All prices are base — you&apos;ll customize finishes next.
        </p>
      </div>

      <fieldset className="min-w-0 space-y-8">
        <legend className="sr-only">Home model</legend>
        {homeCategories.map((cat) => {
          const modelsInCat = homeModels.filter((m) => m.category === cat.id);
          return (
            <div key={cat.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl text-text-primary">{cat.label}</h3>
                <span className="shrink-0 text-sm tabular-nums text-text-muted">{cat.priceRange}</span>
              </div>
              <p className="mb-3 mt-1 text-sm leading-snug text-text-muted">{cat.description}</p>

              <div className="flex flex-col gap-2">
                {modelsInCat.map((model) => {
                  const selected = state.modelId === model.id;
                  const hero = getModelHero(model.id);
                  return (
                    <label key={model.id} className={`flex gap-4 p-3 ${choiceRowClass(selected)}`}>
                      <input
                        type="radio"
                        name="model"
                        value={model.id}
                        checked={selected}
                        onChange={() =>
                          onChange({
                            modelId: model.id,
                            hasFireplace: model.hasFireplace ? state.hasFireplace : false,
                          })
                        }
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
                          <span className="font-medium text-text-primary">{model.name}</span>
                          <span className="flex shrink-0 items-center gap-3">
                            <span className="tabular-nums text-text-secondary">{formatCurrency(model.price)}</span>
                            <RadioMark checked={selected} />
                          </span>
                        </span>
                        <span className="mt-1 text-sm tabular-nums text-text-secondary">
                          {model.beds} bed · {model.baths} bath · {model.sqft.toLocaleString("en-CA")} sq ft
                        </span>
                        <span className="text-sm tabular-nums text-text-secondary">
                          {model.lengthFt}′ × {model.widthFt}′{model.storeys === 2 && " · two storeys"}
                          {model.hasFireplace && " · fireplace option"}
                        </span>
                        {model.description && (
                          <span className="mt-1 line-clamp-2 text-sm leading-snug text-text-muted">{model.description}</span>
                        )}
                        {hero && <span className="mt-1 text-sm text-text-muted">{sourceLabel(hero)}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}
