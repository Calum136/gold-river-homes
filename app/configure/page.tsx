"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { defaultState, calculateConfiguratorPrice } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { sanitizeState } from "@/lib/state";
import { resolveStage } from "@/lib/stage";
import { formatCurrency } from "@/lib/calculator";
import {
  interiorGroups,
  exteriorGroups,
  sidingColors,
  metalRoofColors,
  lotOptions,
  homeModels,
  foundationCosts,
  waterCosts,
  sewerCosts,
} from "@/lib/defaults";

import HomeVisualizer from "@/components/configurator/HomeVisualizer";
import StageChrome from "@/components/configurator/StageChrome";
import OptionExample from "@/components/configurator/OptionExample";
import SelectionsSummary from "@/components/configurator/SelectionsSummary";
import type { SelectionItem } from "@/components/configurator/SelectionsSummary";
import StepNav from "@/components/configurator/StepNav";
import LotStep from "@/components/configurator/steps/LotStep";
import ModelStep from "@/components/configurator/steps/ModelStep";
import ExteriorStep from "@/components/configurator/steps/ExteriorStep";
import type { ExteriorSection } from "@/components/configurator/steps/ExteriorStep";
import InteriorStep from "@/components/configurator/steps/InteriorStep";
import SiteStep from "@/components/configurator/steps/SiteStep";
import type { SiteSection } from "@/components/configurator/steps/SiteStep";
import SummaryStep from "@/components/configurator/steps/SummaryStep";

const STEP_LABELS = ["Land", "Home", "Exterior", "Interior", "Site Setup", "Your Price"];

// state.step is now a SCREEN index (1-based) — one decision per screen.
// Bump the version whenever ConfiguratorState changes shape or screens reorder.
const STORAGE_KEY = "grh-configurator-v2";

interface ScreenDef {
  id: string;
  phase: number; // 1..6, indexes STEP_LABELS
  title: string;
  subtitle?: string;
}

const EXTERIOR_SCREENS: Array<ScreenDef & { id: ExteriorSection }> = [
  { id: "sidingStyle", phase: 3, title: "Siding Style", subtitle: "Choose the profile of your exterior cladding." },
  { id: "sidingColor", phase: 3, title: "Siding Color", subtitle: "Pick the color of your home's exterior." },
  { id: "roofType", phase: 3, title: "Roofing", subtitle: "Shingles are industry standard; metal adds decades of life." },
  { id: "porch", phase: 3, title: "Front Porch", subtitle: "Add a covered porch to the front of your home?" },
  { id: "exteriorTrim", phase: 3, title: "Window & Door Trim", subtitle: "The casing style around your windows and doors." },
];

const INTERIOR_SCREENS: ScreenDef[] = [
  ...interiorGroups.map((g) => ({ id: g.id, phase: 4, title: g.label, subtitle: g.subtitle })),
  { id: "fireplace", phase: 4, title: "Fireplace", subtitle: "Add a cozy electric fireplace insert?" },
];

const SITE_SCREENS: Array<ScreenDef & { id: SiteSection }> = [
  { id: "foundation", phase: 5, title: "Foundation Type", subtitle: "What your home sits on — affects cost, storage, and service access." },
  { id: "water", phase: 5, title: "Water Supply", subtitle: "How your home gets its water. We'll explain what each option costs." },
  { id: "sewer", phase: 5, title: "Waste & Sewer", subtitle: "How wastewater leaves your home — plus the site costs we estimate automatically." },
];

const SCREENS: ScreenDef[] = [
  { id: "land", phase: 1, title: "Your Land", subtitle: "Browse our available lots or use your own property." },
  {
    id: "model",
    phase: 2,
    title: "Choose Your Home",
    subtitle: "Select the model that fits your lifestyle. All prices are base — you'll customize finishes next.",
  },
  ...EXTERIOR_SCREENS,
  ...INTERIOR_SCREENS,
  ...SITE_SCREENS,
  {
    id: "summary",
    phase: 6,
    title: "Your Price Summary",
    subtitle: "All costs are estimates. A Gold River Homes rep will confirm final pricing.",
  },
];

const EXTERIOR_IDS = new Set<string>(EXTERIOR_SCREENS.map((s) => s.id));
const INTERIOR_IDS = new Set<string>(INTERIOR_SCREENS.map((s) => s.id));
const SITE_IDS = new Set<string>(SITE_SCREENS.map((s) => s.id));

// One line per decision the buyer has already made — listed at the foot of the
// decision panel as buttons that jump back to that screen.
function selectionValue(state: ConfiguratorState, screenId: string): { label: string; value: string; swatchHex?: string } | null {
  const optLabel = (groupId: string, optId: string) =>
    [...exteriorGroups, ...interiorGroups].find((g) => g.id === groupId)?.options.find((o) => o.id === optId)?.label;

  switch (screenId) {
    case "land": {
      if (state.landSituation === "own") return { label: "Land", value: "Your own land" };
      const lot = lotOptions.find((l) => l.id === state.selectedLotId);
      return lot ? { label: "Land", value: lot.name } : null;
    }
    case "model": {
      const model = homeModels.find((m) => m.id === state.modelId);
      return model ? { label: "Model", value: model.name } : null;
    }
    case "sidingStyle":
      return { label: "Siding", value: optLabel("sidingStyle", state.sidingStyleId) ?? "—" };
    case "sidingColor": {
      const c = sidingColors.find((c) => c.id === state.sidingColorId);
      return c ? { label: "Siding Color", value: c.label, swatchHex: c.swatchHex } : null;
    }
    case "roofType": {
      if (state.roofTypeId !== "metal") return { label: "Roof", value: "Shingles" };
      const c = metalRoofColors.find((c) => c.id === state.metalRoofColorId);
      return { label: "Roof", value: `Metal — ${c?.label ?? ""}`, swatchHex: c?.swatchHex };
    }
    case "porch":
      return { label: "Front Porch", value: state.hasFrontPorch ? "Included" : "None" };
    case "exteriorTrim":
      return { label: "Ext. Trim", value: optLabel("exteriorTrim", state.exteriorTrimId) ?? "—" };
    case "flooring":
      return { label: "Flooring", value: optLabel("flooring", state.flooringId) ?? "—" };
    case "countertops":
      return { label: "Counters", value: optLabel("countertops", state.countertopsId) ?? "—" };
    case "cabinetStyle":
      return { label: "Cabinets", value: optLabel("cabinetStyle", state.cabinetStyleId) ?? "—" };
    case "paintPackage":
      return { label: "Paint", value: optLabel("paintPackage", state.paintPackageId) ?? "—" };
    case "interiorTrim":
      return { label: "Int. Trim", value: optLabel("interiorTrim", state.interiorTrimId) ?? "—" };
    case "lightingPackage":
      return { label: "Lighting", value: optLabel("lightingPackage", state.lightingPackageId) ?? "—" };
    case "hardwareFinish": {
      const opt = interiorGroups.find((g) => g.id === "hardwareFinish")?.options.find((o) => o.id === state.hardwareFinishId);
      return opt ? { label: "Hardware", value: opt.label, swatchHex: opt.swatchHex } : null;
    }
    case "insulation":
      return { label: "Insulation", value: optLabel("insulation", state.insulationId) ?? "—" };
    case "fireplace":
      return { label: "Fireplace", value: state.hasFireplace ? "Included" : "None" };
    case "foundation":
      return { label: "Foundation", value: foundationCosts[state.foundationType].label };
    case "water":
      return state.waterType ? { label: "Water", value: waterCosts[state.waterType].label } : null;
    case "sewer":
      return state.sewerType ? { label: "Sewer", value: sewerCosts[state.sewerType].label } : null;
    default:
      return null;
  }
}

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
  const [state, setState] = useState<ConfiguratorState>(defaultState);
  const panelRef = useRef<HTMLDivElement>(null);

  // A refresh shouldn't cost the buyer their whole configuration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = sanitizeState(JSON.parse(saved));
        parsed.step = Math.min(Math.max(1, parsed.step), SCREENS.length);
        // One-time hydration from localStorage on mount (empty dep array — this
        // doesn't cascade). localStorage isn't available during server rendering,
        // so this can't run during the initial render without a hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(parsed);
      }
    } catch {
      // Corrupt/blocked storage — start fresh.
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode) — configurator still works, just won't persist.
    }
  }, [state]);

  function patch(updates: Partial<ConfiguratorState>) {
    setState((prev) => ({ ...prev, ...updates }));
  }

  function goToScreen(screen: number) {
    setState((prev) => ({ ...prev, step: screen }));
    // Each new question starts at the top: the page on phones, the panel on desktop.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    panelRef.current?.scrollTo({ top: 0 });
  }

  const screenIndex = Math.min(Math.max(1, state.step), SCREENS.length);
  const screen = SCREENS[screenIndex - 1];
  const isLast = screenIndex === SCREENS.length;
  const ready = canAdvance(state, screen.id);
  const model = homeModels.find((m) => m.id === state.modelId) ?? null;
  const stage = resolveStage(state, screen.id);

  function advance() {
    if (!isLast && ready) goToScreen(screenIndex + 1);
  }
  function back() {
    if (screenIndex > 1) goToScreen(screenIndex - 1);
  }
  function onPhaseClick(phase: number) {
    const first = SCREENS.findIndex((s) => s.phase === phase);
    if (first >= 0) goToScreen(first + 1);
  }

  const priceResult = state.modelId ? calculateConfiguratorPrice(state) : null;

  // Decisions from screens the buyer has already completed (all of them on the summary).
  const decidedScreens = SCREENS.slice(0, screenIndex - 1);
  const selectionItems: SelectionItem[] = decidedScreens.flatMap((s, i) => {
    const v = selectionValue(state, s.id);
    return v ? [{ ...v, screenIndex: i + 1 }] : [];
  });

  const renderScreen = () => {
    if (screen.id === "land") return <LotStep state={state} onChange={patch} />;
    if (screen.id === "model") return <ModelStep state={state} onChange={patch} />;
    if (screen.id === "summary") return <SummaryStep state={state} onChange={patch} />;
    if (EXTERIOR_IDS.has(screen.id)) return <ExteriorStep state={state} onChange={patch} only={screen.id as ExteriorSection} />;
    if (INTERIOR_IDS.has(screen.id)) return <InteriorStep state={state} onChange={patch} only={screen.id} />;
    if (SITE_IDS.has(screen.id)) return <SiteStep state={state} onChange={patch} only={screen.id as SiteSection} />;
    return null;
  };

  return (
    // Desktop: the configurator is exactly one viewport tall. The stage photo
    // never scrolls; the decision panel scrolls on its own. Phone: one column
    // (photo, its caption bar, the panel) with navigation stuck to the bottom.
    <div className="flex min-h-dvh flex-col bg-bg-primary lg:h-dvh lg:overflow-hidden">
      {/* Slim header */}
      <header className="shrink-0 border-b border-border bg-bg-secondary">
        <div className="flex h-14 items-center gap-3 px-4 lg:gap-6 lg:px-6">
          <Link href="/" className="focus-ring shrink-0 font-display text-base font-bold tracking-wide text-gold sm:text-lg">
            Gold River Homes
          </Link>
          <div className="flex min-w-0 flex-1 justify-end lg:justify-center">
            <StepNav
              currentStep={screen.phase}
              totalSteps={STEP_LABELS.length}
              labels={STEP_LABELS}
              onStepClick={onPhaseClick}
            />
          </div>
          <a
            href="tel:9022733033"
            className="focus-ring hidden shrink-0 text-caption text-text-muted transition-colors hover:text-gold sm:block lg:hidden xl:block"
          >
            902-273-3033
          </a>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
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
            <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-8 sm:px-6 lg:px-10 lg:pt-10">
              <header className="mb-8">
                {/* Chapter slot: the phase name today; named chapters replace it in a later workstream. */}
                <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-text-muted">
                  {STEP_LABELS[screen.phase - 1]}
                </p>
                <h1 id="decision-question" className="mt-3 font-display text-display text-text-primary">
                  {screen.title}
                </h1>
                {screen.subtitle && <p className="mt-3 text-body text-text-secondary">{screen.subtitle}</p>}
              </header>

              {stage.example && <OptionExample example={stage.example} className="mb-8" />}

              {renderScreen()}

              {screen.id === "land" && (
                <p className="mt-4 text-caption text-text-muted">
                  Don&apos;t have land yet? Browse our available lots above.
                </p>
              )}

              <SelectionsSummary items={selectionItems} onJump={goToScreen} className="mt-12" />
            </div>
          </div>

          <nav
            aria-label="Step navigation"
            className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-bg-primary lg:static"
          >
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
              <button
                type="button"
                onClick={back}
                disabled={screenIndex === 1}
                className={`focus-ring shrink-0 border px-4 py-2.5 text-body-sm font-medium transition-colors ${
                  screenIndex === 1
                    ? "cursor-not-allowed border-border/40 text-text-muted/50"
                    : "border-border text-text-secondary hover:border-white/30 hover:text-white"
                }`}
              >
                ← Back
              </button>

              <div className="min-w-0 text-center">
                {priceResult && (
                  <p className="whitespace-nowrap">
                    <span className="text-caption text-text-muted">
                      <span className="sm:hidden">Est. total </span>
                      <span className="hidden sm:inline">Estimated total </span>
                    </span>
                    <span className="font-accent text-figure tabular-nums text-text-primary">
                      {formatCurrency(priceResult.totalCost)}
                    </span>
                  </p>
                )}
                <p className="text-caption tabular-nums text-text-muted">
                  {screenIndex} of {SCREENS.length}
                </p>
              </div>

              {!isLast ? (
                <button
                  type="button"
                  onClick={advance}
                  disabled={!ready}
                  className={`focus-ring shrink-0 px-5 py-2.5 text-body-sm font-semibold transition-colors sm:px-8 ${
                    ready ? "bg-gold text-white hover:bg-gold-bright" : "cursor-not-allowed bg-gold/30 text-white/50"
                  }`}
                >
                  Next →
                </button>
              ) : (
                <a
                  href="mailto:info@goldriverhomes.ca?subject=Home%20Quote%20Request"
                  className="focus-ring shrink-0 bg-gold px-5 py-2.5 text-body-sm font-semibold text-white transition-colors hover:bg-gold-bright sm:px-6"
                >
                  Get a Quote
                </a>
              )}
            </div>
          </nav>
        </section>
      </div>

      {/* Focus stays on Next so the buyer can keep going; screen readers hear the new question. */}
      <p aria-live="polite" className="sr-only">
        {screen.title}
      </p>
    </div>
  );
}
