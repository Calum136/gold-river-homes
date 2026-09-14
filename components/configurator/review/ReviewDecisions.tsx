"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ConfiguratorState } from "@/lib/pricing";
import type { ChapterId } from "@/lib/screens";
import { DECISION_CHAPTERS, selectionsByChapter } from "@/lib/selections";
import type { SelectionDetail } from "@/lib/selections";
import type { StageExample } from "@/lib/stage";
import OptionExample from "@/components/configurator/OptionExample";
import DecisionChoices from "@/components/configurator/DecisionChoices";
import { Tag } from "@/components/configurator/ui/ChoiceRow";
import { SelectionPriceText } from "./Figures";

interface ReviewDecisionsProps {
  state: ConfiguratorState;
  onChange: (patch: Partial<ConfiguratorState>) => void;
  /** Screen id of the decision open for editing, or null. The page shows its stage photo. */
  openDecision: string | null;
  onOpenDecision: (screenId: string | null) => void;
  /** Example photo of the open decision's selected choice, from resolveStage. */
  example: StageExample | null;
}

const triggerId = (screenId: string) => `review-${screenId}-trigger`;
const panelId = (screenId: string) => `review-${screenId}-panel`;

// Wide screens start with every chapter open. Phones start with them closed,
// so the whole list, and the cost breakdown under it, is a short scroll.
// This screen only ever renders in the browser (the server renders the first
// screen), so reading the viewport here can't cause a hydration mismatch.
function chaptersOpenAtStart(): Set<ChapterId> {
  const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 64rem)").matches;
  return new Set(wide ? DECISION_CHAPTERS.map((c) => c.id) : []);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`shrink-0 text-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
    >
      <path d="M3.5 6l4.5 4.5L12.5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectionThumb({ selection }: { selection: SelectionDetail }) {
  const { thumb, swatchHex } = selection;
  return (
    <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
      {thumb ? (
        <Image src={thumb.src} width={thumb.width} height={thumb.height} alt="" className="h-full w-full object-cover" />
      ) : swatchHex ? (
        <span className="h-8 w-8 rounded-full border border-white/15" style={{ backgroundColor: swatchHex }} />
      ) : null}
    </span>
  );
}

// Every decision, grouped by chapter, each editable in place: a decision opens
// to the same choice rows its walkthrough screen shows, and while it's open the
// stage photo shows that decision. One decision is open at a time.
export default function ReviewDecisions({ state, onChange, openDecision, onOpenDecision, example }: ReviewDecisionsProps) {
  const chapters = selectionsByChapter(state);
  const [openChapters, setOpenChapters] = useState(chaptersOpenAtStart);

  // Opening a decision closes the one above it, which can move this one's
  // header out of view. Bring it back so its choices start under the buyer's eye.
  useEffect(() => {
    if (openDecision) document.getElementById(triggerId(openDecision))?.scrollIntoView({ block: "nearest" });
  }, [openDecision]);

  function toggleChapter(id: ChapterId, selections: SelectionDetail[]) {
    const next = new Set(openChapters);
    if (next.has(id)) {
      next.delete(id);
      if (selections.some((s) => s.screenId === openDecision)) onOpenDecision(null);
    } else {
      next.add(id);
    }
    setOpenChapters(next);
  }

  return (
    <section aria-labelledby="review-decisions-heading" className="@container">
      <h2 id="review-decisions-heading" className="font-display text-title text-text-primary">
        Your decisions
      </h2>
      <p className="mt-1 text-body-sm text-text-muted">Open any decision to change it here.</p>

      <ul className="mt-4 border-t border-border">
        {chapters.map(({ chapter, selections }) => {
          const chapterOpen = openChapters.has(chapter.id);
          const reserveThumb = selections.some((s) => s.thumb || s.swatchHex);
          return (
            <li key={chapter.id} className="border-b border-border">
              <h3>
                <button
                  type="button"
                  aria-expanded={chapterOpen}
                  aria-controls={`review-chapter-${chapter.id}`}
                  onClick={() => toggleChapter(chapter.id, selections)}
                  className="focus-ring flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-title text-text-primary">{chapter.title}</span>
                    {!chapterOpen && (
                      <span className="mt-0.5 block truncate text-caption text-text-muted">
                        {selections.map((s) => s.value).join(" · ")}
                      </span>
                    )}
                  </span>
                  <Chevron open={chapterOpen} />
                </button>
              </h3>

              <div id={`review-chapter-${chapter.id}`} hidden={!chapterOpen}>
                <ul className="flex flex-col gap-2 pb-5">
                  {selections.map((selection) => {
                    const open = openDecision === selection.screenId;
                    return (
                      <li key={selection.screenId}>
                        <button
                          id={triggerId(selection.screenId)}
                          type="button"
                          aria-expanded={open}
                          aria-controls={panelId(selection.screenId)}
                          onClick={() => onOpenDecision(open ? null : selection.screenId)}
                          className={`focus-ring flex w-full scroll-mb-28 scroll-mt-4 items-center gap-3 border px-3 py-3 text-left transition-colors duration-150 ${
                            open ? "border-gold bg-gold/[0.06]" : "border-border hover:border-white/25"
                          }`}
                        >
                          {reserveThumb && <SelectionThumb selection={selection} />}
                          <span className="min-w-0 flex-1">
                            <span className="block text-caption text-text-muted">{selection.label}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body font-medium text-text-primary">
                              {selection.thumb && selection.swatchHex && (
                                <span
                                  aria-hidden
                                  className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                                  style={{ backgroundColor: selection.swatchHex }}
                                />
                              )}
                              {selection.value}
                              {selection.tag && <Tag>{selection.tag}</Tag>}
                            </span>
                            {/* Narrow panels: the price sits under the choice. */}
                            <span className="mt-1 block @md:hidden">
                              <SelectionPriceText price={selection.price} />
                            </span>
                          </span>
                          <span className="hidden shrink-0 text-right @md:block">
                            <SelectionPriceText price={selection.price} />
                          </span>
                          <Chevron open={open} />
                        </button>

                        <div
                          id={panelId(selection.screenId)}
                          role="region"
                          aria-labelledby={triggerId(selection.screenId)}
                          hidden={!open}
                          className="pb-4 pt-4"
                        >
                          {open && (
                            <>
                              {example && <OptionExample example={example} className="mb-6 max-w-md" />}
                              <DecisionChoices
                                screenId={selection.screenId}
                                chapter={chapter.id}
                                state={state}
                                onChange={onChange}
                                inReview
                              />
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
