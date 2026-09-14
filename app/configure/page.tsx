"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { calculateConfiguratorPrice, defaultState, runningEstimate } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { sanitizeState } from "@/lib/state";
import { resolveStage } from "@/lib/stage";
import { formatCurrency } from "@/lib/calculator";
import { stageNote } from "@/lib/copy";
import { SCREENS, chapterForScreen } from "@/lib/screens";
import { selectionFor } from "@/lib/selections";
import { homeModels } from "@/lib/defaults";
import { enquiryMailto } from "@/lib/enquiry";
import {
  getSavedConfigurations,
  getServerSavedConfigurations,
  subscribeSavedConfigurations,
} from "@/lib/saved-configs";
import type { SavedConfiguration } from "@/lib/saved-configs";
import { hasShareHash, readShareHash, sameConfiguration, shareUrl } from "@/lib/share";

import HomeVisualizer from "@/components/configurator/HomeVisualizer";
import StageChrome from "@/components/configurator/StageChrome";
import OptionExample from "@/components/configurator/OptionExample";
import SelectionsSummary from "@/components/configurator/SelectionsSummary";
import type { SelectionItem } from "@/components/configurator/SelectionsSummary";
import ChapterNav from "@/components/configurator/ChapterNav";
import DecisionChoices from "@/components/configurator/DecisionChoices";
import SummaryStep from "@/components/configurator/steps/SummaryStep";
import SpecSheet from "@/components/configurator/SpecSheet";

// state.step is a SCREEN index (1-based) into SCREENS (lib/screens.ts): one
// decision per screen. Bump the version whenever ConfiguratorState changes
// shape or screens reorder.
const STORAGE_KEY = "grh-configurator-v2";

/** A restored configuration, kept on a screen that exists. */
function withValidStep(state: ConfiguratorState): ConfiguratorState {
  return { ...state, step: Math.min(Math.max(1, state.step), SCREENS.length) };
}

// The configurator's own address, for share links. It doesn't change while the
// page is open, and the server has none.
const subscribeNever = () => () => {};
const getPageUrl = () => `${window.location.origin}${window.location.pathname}`;
const getServerPageUrl = () => "";

function canAdvance(state: ConfiguratorState, screenId: string): boolean {
  switch (screenId) {
    case "land":
      return (
        (state.landSituation === "gold-river" && !!state.selectedLotId) ||
        state.landSituation === "own"
      );
    case "model":
      return !!state.modelId;
    default:
      return true;
  }
}

export default function ConfigurePage() {
  // The untouched first state is never persisted, so mounting (or React's
  // development double mount) can't overwrite a saved configuration before
  // it has been read.
  const [initialState] = useState<ConfiguratorState>(defaultState);
  const [state, setState] = useState<ConfiguratorState>(initialState);
  // Furthest screen reached this visit, so chapters the buyer has already been
  // through stay one click away after going back. A reload starts from the
  // saved screen.
  const [furthestScreen, setFurthestScreen] = useState(1);
  // On the review page, the decision open for editing. The stage shows it.
  const [openDecision, setOpenDecision] = useState<string | null>(null);
  // The named save the buyer last saved or loaded this visit.
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const saves = useSyncExternalStore(subscribeSavedConfigurations, getSavedConfigurations, getServerSavedConfigurations);
  const pageUrl = useSyncExternalStore(subscribeNever, getPageUrl, getServerPageUrl);
  const panelRef = useRef<HTMLDivElement>(null);

  // On load a share link in the URL takes precedence over the configuration
  // saved in this browser, and a link that can't be read is ignored. Either
  // way, a refresh shouldn't cost the buyer their whole configuration.
  useEffect(() => {
    let restored = readShareHash(window.location.hash);
    if (!restored) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) restored = sanitizeState(JSON.parse(saved));
      } catch {
        // Corrupt/blocked storage — start fresh.
      }
    }
    if (restored) {
      // One-time hydration on mount (empty dep array — this doesn't cascade).
      // Neither the URL hash nor localStorage is available during server
      // rendering, so this can't run during the initial render without a
      // hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(withValidStep(restored));
    }

    // A share link pasted into a tab that's already open changes only the hash.
    function onHashChange() {
      const fromLink = readShareHash(window.location.hash);
      if (!fromLink) return;
      setState(withValidStep(fromLink));
      setActiveSaveId(null);
      setOpenDecision(null);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    if (state === initialState) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode) — configurator still works, just won't persist.
    }
    // Once a share link's configuration is saved here, the link leaves the
    // address bar, so a reload keeps later changes instead of reapplying it.
    if (hasShareHash(window.location.hash)) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, [state, initialState]);

  function patch(updates: Partial<ConfiguratorState>) {
    setState((prev) => ({ ...prev, ...updates }));
  }

  const screenIndex = Math.min(Math.max(1, state.step), SCREENS.length);
  const screen = SCREENS[screenIndex - 1];
  const chapter = chapterForScreen(screenIndex);
  const isChapterOpening = screenIndex === chapter.firstScreen;
  const isLast = screenIndex === SCREENS.length;
  const ready = canAdvance(state, screen.id);
  // Chapters ahead stay out of reach until this screen's decision is made.
  const reachedScreen = ready ? Math.max(furthestScreen, screenIndex) : screenIndex;
  const model = homeModels.find((m) => m.id === state.modelId) ?? null;
  // The review page's stage follows the decision open for editing.
  const stage = resolveStage(state, isLast && openDecision ? openDecision : screen.id);

  function goToScreen(target: number) {
    setFurthestScreen((prev) => Math.max(prev, screenIndex, target));
    setOpenDecision(null);
    setState((prev) => ({ ...prev, step: target }));
    // Each new question starts at the top: the page on phones, the panel on desktop.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    panelRef.current?.scrollTo({ top: 0 });
  }
  function advance() {
    if (!isLast && ready) goToScreen(screenIndex + 1);
  }
  function back() {
    if (screenIndex > 1) goToScreen(screenIndex - 1);
  }

  const estimate = runningEstimate(state);

  // Decisions from screens the buyer has already completed, as shortcuts back.
  // The review page lists and edits every decision itself.
  const currentTotal = calculateConfiguratorPrice(state).totalCost;
  const selectionItems: SelectionItem[] = isLast
    ? []
    : SCREENS.slice(0, screenIndex - 1).flatMap((s, i) => {
        const selection = selectionFor(state, s.id, currentTotal);
        return selection
          ? [{ label: selection.label, value: selection.value, swatchHex: selection.swatchHex, screenIndex: i + 1 }]
          : [];
      });

  // The ending, on the review page. The configuration's name is the save last
  // saved or loaded this visit, or a save that matches it exactly (after a
  // reload, say).
  const activeSave = isLast
    ? saves.find((s) => s.id === activeSaveId) ?? saves.find((s) => sameConfiguration(s.state, state)) ?? null
    : null;
  const shareLink = isLast ? shareUrl(pageUrl, state) : "";
  const enquiryHref = isLast ? enquiryMailto(state, activeSave?.name, shareLink) : "";

  function loadSave(saved: SavedConfiguration) {
    setState({ ...saved.state, step: SCREENS.length });
    setActiveSaveId(saved.id);
    setOpenDecision(null);
  }

  const renderScreen = () =>
    screen.chapter === "cost" ? (
      <SummaryStep
        state={state}
        onChange={patch}
        openDecision={openDecision}
        onOpenDecision={setOpenDecision}
        example={openDecision ? stage.example : null}
        saves={saves}
        activeSaveId={activeSaveId}
        activeName={activeSave?.name ?? null}
        onSaved={(saved) => setActiveSaveId(saved.id)}
        onLoadSave={loadSave}
        onDeletedSave={(id) => setActiveSaveId((prev) => (prev === id ? null : prev))}
        shareLink={shareLink}
        enquiryHref={enquiryHref}
      />
    ) : (
      <DecisionChoices screenId={screen.id} chapter={screen.chapter} state={state} onChange={patch} />
    );

  return (
    // Desktop: the configurator is exactly one viewport tall. The stage photo
    // never scrolls; the decision panel scrolls on its own. Phone: one column
    // (photo, its caption bar, the panel) with navigation stuck to the bottom.
    // Print: the app is hidden and only the spec sheet prints.
    <div className="flex min-h-dvh flex-col bg-bg-primary lg:h-dvh lg:overflow-hidden print:block print:min-h-0 print:bg-white">
      {/* Slim header */}
      <header className="shrink-0 border-b border-border bg-bg-secondary print:hidden">
        <div className="flex h-14 items-center gap-3 px-4 lg:gap-6 lg:px-6">
          <Link href="/" className="focus-ring shrink-0 font-display text-base font-bold tracking-wide text-gold sm:text-lg">
            Gold River Homes
          </Link>
          <div className="flex min-w-0 flex-1 justify-end lg:justify-center">
            <ChapterNav screenIndex={screenIndex} reachedScreen={reachedScreen} onJump={goToScreen} />
          </div>
          <a
            href="tel:9022733033"
            className="focus-ring hidden shrink-0 text-caption text-text-muted transition-colors hover:text-gold sm:block lg:hidden xl:block"
          >
            902-273-3033
          </a>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row print:hidden">
        {/* The stage: the home photo with nothing on it, its chrome underneath */}
        <section aria-label="Home photo" className="flex shrink-0 flex-col lg:w-[64%]">
          <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-auto lg:min-h-0 lg:flex-1">
            <HomeVisualizer stage={stage} />
          </div>
          <StageChrome
            stage={stage}
            model={model}
            className="border-b border-border px-4 py-3 lg:border-b-0 lg:px-6"
          />
        </section>

        {/* The decision panel */}
        <section aria-labelledby="decision-question" className="flex flex-1 flex-col lg:min-h-0 lg:border-l lg:border-border">
          <div ref={panelRef} className="relative flex-1 lg:overflow-y-auto">
            {/* Below lg the step nav is sticky, not part of the flex layout, so it
                can cover the tail of this content unless padding reserves at least
                its own height (about 88px, up to about 105px when its mortgage terms
                wrap to a second line) plus the iOS home-indicator inset. */}
            <div className="mx-auto w-full max-w-2xl px-4 pb-[calc(112px+env(safe-area-inset-bottom)+1rem)] pt-8 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
              <header className="mb-8">
                {isChapterOpening ? (
                  // Where a chapter opens: its name large, its opener, then the question.
                  <>
                    <p className="font-display text-chapter text-text-primary">{chapter.title}</p>
                    <p className="mt-3 text-body text-text-secondary">{chapter.opener}</p>
                    <h1
                      id="decision-question"
                      className="mt-6 border-t border-border pt-6 font-display text-display text-text-primary sm:mt-8 sm:pt-8"
                    >
                      {screen.title}
                    </h1>
                  </>
                ) : (
                  <>
                    <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-text-muted">{chapter.title}</p>
                    <h1 id="decision-question" className="mt-3 font-display text-display text-text-primary">
                      {screen.title}
                    </h1>
                  </>
                )}
              </header>

              {/* The review page shows an open decision's example inside that decision. */}
              {!isLast && stage.example && <OptionExample example={stage.example} className="mb-8" />}

              {renderScreen()}

              <SelectionsSummary items={selectionItems} onJump={goToScreen} className="mt-12" />

              {/* Below xl the photo note lives here, once, instead of under the photo. */}
              <p className="mt-12 text-caption text-text-muted xl:hidden">{stageNote}</p>
            </div>
          </div>

          <nav
            aria-label="Step navigation"
            className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-bg-primary lg:static"
          >
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 xl:px-10">
              <button
                type="button"
                onClick={back}
                disabled={screenIndex === 1}
                className={`focus-ring shrink-0 border px-3 py-2.5 text-body-sm font-medium transition-colors sm:px-4 ${
                  screenIndex === 1
                    ? "cursor-not-allowed border-border/40 text-text-muted/50"
                    : "border-border text-text-secondary hover:border-white/30 hover:text-white"
                }`}
              >
                ← Back
              </button>

              {/* The running figures: the monthly payment leads, the total follows, and the
                  mortgage terms behind them are stated once, here, not on every choice. */}
              <div className="min-w-0 text-center">
                {estimate && (
                  <>
                    <p>
                      <span className="sr-only">Estimated monthly payment </span>
                      <span className="font-accent text-figure tabular-nums text-text-primary">
                        {formatCurrency(estimate.monthlyPayment)}
                      </span>
                      <span aria-hidden className="text-caption text-text-muted">
                        /mo
                      </span>
                    </p>
                    <p className="text-caption text-text-muted">
                      <span className="sm:hidden lg:inline">Est. total </span>
                      <span className="hidden sm:inline lg:hidden">Estimated total </span>
                      <span className="whitespace-nowrap tabular-nums text-text-secondary">
                        {formatCurrency(estimate.totalCost)}
                      </span>
                    </p>
                    <p className="text-eyebrow text-text-muted">{estimate.assumption}</p>
                  </>
                )}
              </div>

              {!isLast ? (
                <button
                  type="button"
                  onClick={advance}
                  disabled={!ready}
                  className={`focus-ring shrink-0 px-4 py-2.5 text-body-sm font-semibold transition-colors sm:px-8 lg:px-5 xl:px-8 ${
                    ready ? "bg-gold text-white hover:bg-gold-bright" : "cursor-not-allowed bg-gold/30 text-white/50"
                  }`}
                >
                  Next →
                </button>
              ) : (
                // The full enquiry email. Phones show "Email" to leave the running
                // figures room; the accessible name is always "Email Gold River".
                <a
                  href={enquiryHref}
                  className="focus-ring shrink-0 bg-gold px-5 py-2.5 text-body-sm font-semibold text-white transition-colors hover:bg-gold-bright sm:px-6"
                >
                  Email<span className="sr-only sm:not-sr-only"> Gold River</span>
                </a>
              )}
            </div>
          </nav>
        </section>
      </div>

      {isLast && <SpecSheet state={state} shareLink={shareLink} savedName={activeSave?.name ?? null} />}

      {/* Focus stays on Next so the buyer can keep going; screen readers hear the new question. */}
      <p aria-live="polite" className="sr-only">
        {isChapterOpening ? `${chapter.title}. ${screen.title}` : screen.title}
      </p>
    </div>
  );
}
