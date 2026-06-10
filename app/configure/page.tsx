"use client";

import { useEffect, useState } from "react";
import { defaultState, calculateConfiguratorPrice } from "@/lib/pricing";
import type { ConfiguratorState } from "@/lib/pricing";
import { formatCurrency } from "@/lib/calculator";

import HomeVisualizer from "@/components/configurator/HomeVisualizer";
import StepNav from "@/components/configurator/StepNav";
import LotStep from "@/components/configurator/steps/LotStep";
import ModelStep from "@/components/configurator/steps/ModelStep";
import ExteriorStep from "@/components/configurator/steps/ExteriorStep";
import InteriorStep from "@/components/configurator/steps/InteriorStep";
import SiteStep from "@/components/configurator/steps/SiteStep";
import SummaryStep from "@/components/configurator/steps/SummaryStep";

const STEP_LABELS = ["Land", "Home", "Exterior", "Interior", "Site Setup", "Your Price"];
const TOTAL_STEPS = 6;

function canAdvance(state: ConfiguratorState): boolean {
  switch (state.step) {
    case 1:
      return (
        (state.landSituation === "gold-river" && !!state.selectedLotId) ||
        state.landSituation === "own"
      );
    case 2:
      return !!state.modelId;
    default:
      return true;
  }
}

// Bump the version whenever ConfiguratorState changes shape — stale saves are discarded by key.
const STORAGE_KEY = "grh-configurator-v1";

export default function ConfigurePage() {
  const [state, setState] = useState<ConfiguratorState>(defaultState);

  // A refresh shouldn't cost the buyer their whole configuration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...defaultState(), ...JSON.parse(saved) });
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

  function goToStep(step: number) {
    setState((prev) => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function advance() {
    if (state.step < TOTAL_STEPS && canAdvance(state)) {
      goToStep(state.step + 1);
    }
  }

  function back() {
    if (state.step > 1) {
      goToStep(state.step - 1);
    }
  }

  const priceResult = state.modelId ? calculateConfiguratorPrice(state) : null;

  const renderStep = () => {
    switch (state.step) {
      case 1: return <LotStep state={state} onChange={patch} />;
      case 2: return <ModelStep state={state} onChange={patch} />;
      case 3: return <ExteriorStep state={state} onChange={patch} />;
      case 4: return <InteriorStep state={state} onChange={patch} />;
      case 5: return <SiteStep state={state} onChange={patch} />;
      case 6: return <SummaryStep state={state} onChange={patch} />;
      default: return null;
    }
  };

  const ready = canAdvance(state);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Minimal header */}
      <header className="border-b border-border bg-bg-secondary sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
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

      {/* Step nav */}
      <div className="border-b border-border bg-bg-secondary sticky top-14 z-20">
        <div className="max-w-6xl mx-auto px-4">
          <StepNav
            currentStep={state.step}
            totalSteps={TOTAL_STEPS}
            labels={STEP_LABELS}
            onStepClick={goToStep}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Two-column layout on large screens */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Visualizer — sticky on desktop, inline on mobile */}
          <div className="w-full lg:w-[45%] lg:sticky lg:top-[112px]">
            <HomeVisualizer state={state} />
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

          {/* Step content */}
          <div className="w-full lg:flex-1 min-w-0">
            {renderStep()}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={back}
                disabled={state.step === 1}
                className={`px-5 py-2.5 border text-sm font-medium transition-colors ${
                  state.step === 1
                    ? "border-border/30 text-text-muted/30 cursor-not-allowed"
                    : "border-border text-text-secondary hover:border-white/30 hover:text-white"
                }`}
              >
                ← Back
              </button>

              {state.step < TOTAL_STEPS ? (
                <button
                  onClick={advance}
                  disabled={!ready}
                  className={`px-6 py-2.5 text-sm font-semibold transition-colors ${
                    ready
                      ? "bg-gold text-white hover:bg-gold-bright"
                      : "bg-gold/30 text-white/40 cursor-not-allowed"
                  }`}
                >
                  Continue →
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

            {/* Step 1 skip hint */}
            {state.step === 1 && (
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
