"use client";

import { useEffect, useState } from "react";
import { defaultState, calculateConfiguratorPrice } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { formatCurrency } from "@/lib/calculator";
import { interiorGroups } from "@/lib/defaults";

import HomeVisualizer from "@/components/configurator/HomeVisualizer";
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
  title?: string;
  subtitle?: string;
}

const EXTERIOR_SCREENS: Array<ScreenDef & { id: ExteriorSection }> = [
  { id: "sidingStyle", phase: 3, title: "Siding Style", subtitle: "Choose the profile of your exterior cladding." },
  { id: "sidingColor", phase: 3, title: "Siding Color", subtitle: "Pick the color of your home's exterior — watch it change live." },
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
  { id: "land", phase: 1 },
  { id: "model", phase: 2 },
  ...EXTERIOR_SCREENS,
  ...INTERIOR_SCREENS,
  ...SITE_SCREENS,
  { id: "summary", phase: 6 },
];

const EXTERIOR_IDS = new Set<string>(EXTERIOR_SCREENS.map((s) => s.id));
const INTERIOR_IDS = new Set<string>(INTERIOR_SCREENS.map((s) => s.id));
const SITE_IDS = new Set<string>(SITE_SCREENS.map((s) => s.id));

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

  // A refresh shouldn't cost the buyer their whole configuration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...defaultState(), ...JSON.parse(saved) };
        parsed.step = Math.min(Math.max(1, parsed.step), SCREENS.length);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const screenIndex = Math.min(Math.max(1, state.step), SCREENS.length);
  const screen = SCREENS[screenIndex - 1];
  const isLast = screenIndex === SCREENS.length;
  const ready = canAdvance(state, screen.id);

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
    <div className="min-h-screen bg-bg-primary">
      {/* Minimal header */}
      <header className="border-b border-border bg-bg-secondary sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <a href="/" className="font-display text-gold text-lg font-bold tracking-wide">
              Gold River Homes
            </a>
            <a href="tel:9022733033" className="text-text-muted text-sm hover:text-gold transition-colors hidden sm:block">
              902-273-3033
            </a>
          </div>
        </div>
      </header>

      {/* Phase nav */}
      <div className="border-b border-border bg-bg-secondary sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <StepNav
            currentStep={screen.phase}
            totalSteps={STEP_LABELS.length}
            labels={STEP_LABELS}
            onStepClick={onPhaseClick}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* The home is the hero: ~60% visual, ~40% one decision at a time */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Visualizer — sticky on desktop, inline on mobile */}
          <div className="w-full lg:w-[60%] lg:sticky lg:top-[112px]">
            <HomeVisualizer state={state} view={screen.phase === 4 ? "interior" : "exterior"} />
            <p className="text-text-muted/40 text-[11px] mt-2 leading-snug">
              Illustrative preview. Photorealistic renderings of each model and finish — built
              from Supreme Homes product files — are in production and will appear here.
            </p>

            {/* Running price pill */}
            {priceResult && (
              <div className="mt-3 flex items-center justify-between bg-bg-elevated border border-border px-4 py-3">
                <span className="text-text-muted text-sm">Estimated Total</span>
                <span className="text-gold font-bold text-lg tabular-nums">
                  {formatCurrency(priceResult.totalCost)}
                </span>
              </div>
            )}
          </div>

          {/* One decision per screen */}
          <div className="w-full lg:flex-1 min-w-0">
            {screen.title && (
              <div className="mb-4">
                <h2 className="font-display text-white text-2xl mb-1">{screen.title}</h2>
                {screen.subtitle && <p className="text-text-muted text-sm">{screen.subtitle}</p>}
              </div>
            )}
            {renderScreen()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={back}
                disabled={screenIndex === 1}
                className={`px-5 py-2.5 border text-sm font-medium transition-colors ${
                  screenIndex === 1
                    ? "border-border/30 text-text-muted/30 cursor-not-allowed"
                    : "border-border text-text-secondary hover:border-white/30 hover:text-white"
                }`}
              >
                ← Back
              </button>

              <span className="text-text-muted/40 text-xs tabular-nums">
                {screenIndex} of {SCREENS.length}
              </span>

              {!isLast ? (
                <button
                  onClick={advance}
                  disabled={!ready}
                  className={`px-8 py-2.5 text-sm font-semibold transition-colors ${
                    ready
                      ? "bg-gold text-white hover:bg-gold-bright"
                      : "bg-gold/30 text-white/40 cursor-not-allowed"
                  }`}
                >
                  Next →
                </button>
              ) : (
                <a
                  href="mailto:info@goldriverhomes.ca?subject=Home%20Quote%20Request"
                  className="px-6 py-2.5 text-sm font-semibold bg-gold text-white hover:bg-gold-bright transition-colors"
                >
                  Get a Quote
                </a>
              )}
            </div>

            {/* Screen 1 hint */}
            {screen.id === "land" && (
              <p className="text-text-muted/40 text-xs text-center mt-3">
                Don't have land yet? Browse our available lots above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
