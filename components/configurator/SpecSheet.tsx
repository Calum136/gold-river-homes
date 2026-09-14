"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { calculateMortgage, formatCurrency, formatMortgageAssumption } from "@/lib/calculator";
import { estimateStatement } from "@/lib/copy";
import { homeCategories, homeModels } from "@/lib/defaults";
import { GOLD_RIVER_CONTACT } from "@/lib/enquiry";
import { calculateConfiguratorPrice } from "@/lib/pricing";
import type { ConfiguratorState, PriceBreakdownItem } from "@/lib/pricing";
import { selectionsByChapter } from "@/lib/selections";
import type { SelectionDetail } from "@/lib/selections";
import { creditLine, getModelHero } from "@/lib/visual-assets";

interface SpecSheetProps {
  state: ConfiguratorState;
  shareLink: string;
  savedName: string | null;
}

const money = formatCurrency;
const range = (low: number, high: number) => `${money(low)} – ${money(high)}`;

function lineAmount(item: PriceBreakdownItem): string {
  if (item.low !== undefined && item.high !== undefined) return range(item.low, item.high);
  if (item.isExample) return `Example price ${money(item.amount)}`;
  return `${money(item.amount)} est.`;
}

/** A selection's price where it adds something: example lots, option upgrades, own land. Site ranges are in the breakdown. */
function selectionPrice({ price }: SelectionDetail): string | null {
  if (price.kind === "example") return `example price ${money(price.amount)}`;
  if (price.kind === "delta" && price.amount !== 0) {
    return `${price.amount > 0 ? "+" : "−"}${money(Math.abs(price.amount))} est.`;
  }
  if (price.kind === "none" && price.note) return price.note.toLowerCase();
  return null;
}

const LABEL = "text-[6.5pt] font-semibold uppercase tracking-wider text-[#555]";

// The printed spec sheet: hidden on screen, and the only thing the
// configurator prints (the rest of the page is print:hidden). Sized for one
// Letter page inside the @page margins in globals.css: the home, its figures
// and cost breakdown on the left, every selection on the right, the share link
// across the foot. Dark on white for paper.
export default function SpecSheet({ state, shareLink, savedName }: SpecSheetProps) {
  // The date it was printed, stamped just before the print layout is taken,
  // whether printing starts from the button or the browser's own menu.
  const [printedOn, setPrintedOn] = useState<string | null>(null);
  useEffect(() => {
    const stamp = () =>
      flushSync(() => setPrintedOn(new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date())));
    window.addEventListener("beforeprint", stamp);
    return () => window.removeEventListener("beforeprint", stamp);
  }, []);

  const model = homeModels.find((m) => m.id === state.modelId) ?? null;
  const category = homeCategories.find((c) => c.id === model?.category);
  const hero = getModelHero(state.modelId);
  const heroCredit = hero ? creditLine(hero) : null;
  const { items, totalCost, totalLow, totalHigh } = calculateConfiguratorPrice(state);
  const mortgage = calculateMortgage(totalCost, state.mortgage);
  const chapters = selectionsByChapter(state).filter(({ chapter }) => chapter.id !== "home");

  return (
    <article className="hidden font-body text-[7.5pt] leading-[1.3] text-[#1a1a1a] print:block">
      <header className="flex items-start justify-between gap-6 border-b border-[#9a9a9a] pb-1.5">
        <div className="min-w-0">
          <p className="font-display text-[15pt] font-bold leading-tight text-[#5c4326]">Gold River Homes</p>
          <h2 className="text-[9pt] font-semibold leading-snug">
            Home specification{savedName ? `: ${savedName}` : ""}
          </h2>
          {printedOn && <p className="text-[7pt] text-[#555]">Prepared {printedOn}</p>}
        </div>
        <address className="shrink-0 text-right not-italic leading-snug">
          {GOLD_RIVER_CONTACT.address}
          <br />
          {GOLD_RIVER_CONTACT.phone}
          <br />
          {GOLD_RIVER_CONTACT.email}
        </address>
      </header>

      <div className="mt-2.5 grid grid-cols-2 items-start gap-x-5">
        <div>
          {/* The home */}
          <section>
            {hero && (
              <figure>
                <Image
                  src={hero.src}
                  width={hero.width}
                  height={hero.height}
                  alt={hero.alt}
                  loading="eager"
                  className="h-auto max-h-[1in] w-full object-contain object-left"
                />
                <figcaption className="mt-0.5 text-[6.5pt] leading-tight text-[#555]">
                  Photo: {hero.caption}
                  {heroCredit && ` · ${heroCredit}`}
                </figcaption>
              </figure>
            )}
            <p className="mt-1.5 font-display text-[13pt] font-bold leading-tight">{model?.name ?? "Model not chosen"}</p>
            {model && (
              <>
                <p className="font-semibold">
                  {[
                    category?.label,
                    `${model.beds} bed`,
                    `${model.baths} bath`,
                    `${model.sqft.toLocaleString("en-CA")} sq ft`,
                    `${model.lengthFt} × ${model.widthFt} ft${model.storeys === 2 ? ", two storeys" : ""}`,
                    model.garage && `attached garage ${model.garage.sqft.toLocaleString("en-CA")} sq ft`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {model.description && <p className="text-[7pt] text-[#333]">{model.description}</p>}
                <p>Model price {money(model.price)} est.</p>
              </>
            )}
          </section>

          {/* The figures, with the estimate statement beside the total */}
          <section className="mt-2 border-t border-[#9a9a9a] pt-1.5">
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <p className={LABEL}>Estimated total</p>
                <p className="text-[13pt] font-bold leading-tight tabular-nums">{money(totalCost)}</p>
                <p className="tabular-nums">
                  Mid estimate. Range {range(totalLow, totalHigh)}
                </p>
              </div>
              <div>
                <p className={LABEL}>Estimated monthly payment</p>
                <p className="text-[13pt] font-bold leading-tight tabular-nums">
                  {money(Math.round(mortgage.monthlyPayment))}/mo
                </p>
                <p>On the mid estimate</p>
              </div>
            </div>
            <p className="mt-1 text-[7pt]">
              Mortgage terms: {formatMortgageAssumption(mortgage, state.mortgage)}. {money(mortgage.downPayment)} down
              {mortgage.cmhcPremium > 0 &&
                `, ${money(mortgage.cmhcPremium)} CMHC premium (${(mortgage.cmhcPremiumRate * 100).toFixed(2)}%) added to the loan`}
              ; loan {money(mortgage.principal)}.
              {mortgage.downPaymentRaisedToMinimum && " Down payment raised to the legal minimum for this total."}
            </p>
            <p className="mt-1 text-[7pt] text-[#333]">{estimateStatement}</p>
          </section>

          {/* Every line of the total */}
          <section className="mt-2">
            <h3 className="border-b border-[#bbb] pb-0.5 text-[8.5pt] font-semibold">Cost breakdown</h3>
            <table className="w-full border-collapse text-[7pt] leading-[1.3]">
              <tbody>
                {items.map((item) => (
                  <tr key={item.label} className="border-b border-[#e2e2e2] align-baseline">
                    <td className="py-0 pr-3">{item.label}</td>
                    <td className="whitespace-nowrap py-0 text-right tabular-nums">{lineAmount(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* Every selection, with its description */}
        <section>
          <h3 className="text-[8.5pt] font-semibold">Your selections</h3>
          {chapters.map(({ chapter, selections }) => (
            <div key={chapter.id} className="mt-1.5">
              <h4 className="text-[7pt] font-semibold uppercase tracking-wider text-[#5c4326]">{chapter.title}</h4>
              <ul className="text-[7pt] leading-[1.3]">
                {selections.map((selection) => {
                  const price = selectionPrice(selection);
                  return (
                    <li key={selection.screenId} className="mb-[2px] break-inside-avoid">
                      <span className="font-semibold">{selection.label}:</span> {selection.value}
                      {selection.tag && ` (${selection.tag})`}
                      {price && <span className="whitespace-nowrap"> · {price}</span>}
                      {selection.description && <span className="text-[#444]"> — {selection.description}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      </div>

      <footer className="mt-2 border-t border-[#9a9a9a] pt-1.5 text-[6.5pt] leading-snug">
        <span className="font-semibold">Open this configuration online:</span>{" "}
        <span className="break-all font-mono">{shareLink}</span>
      </footer>
    </article>
  );
}
