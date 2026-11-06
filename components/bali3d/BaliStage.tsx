"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { ConfiguratorState } from "@/lib/pricing";
import { SCREENS } from "@/lib/screens";
import type { BaliEngine } from "./engine";

// ============================================
// The Bali's 3D stage: the scene fills the stage box, with the view buttons
// (Google Maps style) and the scroll hint on top. three.js loads only when a
// buyer picks the Bali, and if WebGL isn't available the photo stage shows
// instead.
// ============================================

const VIEW_BUTTONS: { id: string | null; label: string }[] = [
  { id: null, label: "Tour" },
  { id: "aerial", label: "Aerial" },
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "dollhouse", label: "Dollhouse" },
  { id: "top", label: "Top down" },
  { id: "kitchen", label: "Kitchen" },
  { id: "living", label: "Living" },
  { id: "bedroom", label: "Bedroom" },
  { id: "bath", label: "Bathroom" },
];

// The wheel drives the tour only in the desktop layout, where the page itself
// never scrolls. On narrower screens the stage sits above the panel and the
// wheel must keep scrolling the page.
const DESKTOP = "(min-width: 1024px)";
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getDesktop = () => window.matchMedia(DESKTOP).matches;
const getServerDesktop = () => false;

interface BaliStageProps {
  state: ConfiguratorState;
  /** The screen (or, on the review page, the open decision) the camera frames. */
  focusId: string;
  /** Scrolling the tour asks for another screen (1-based, like state.step). */
  onStepRequest: (screen: number) => void;
  /** Furthest screen scrolling may reach (1-based). */
  maxScreen: number;
  scrollEnabled: boolean;
  /** Shown if WebGL can't start. */
  fallback: ReactNode;
}

export default function BaliStage({ state, focusId, onStepRequest, maxScreen, scrollEnabled: allowScroll, fallback }: BaliStageProps) {
  const desktop = useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop);
  const scrollEnabled = allowScroll && desktop;
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BaliEngine | null>(null);
  const latest = useRef({ state, focusId, onStepRequest, maxScreen, scrollEnabled });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState<string | null>(null);
  const [hint, setHint] = useState<number | null>(null);
  const [scrolledOnce, setScrolledOnce] = useState(false);

  useEffect(() => {
    latest.current = { state, focusId, onStepRequest, maxScreen, scrollEnabled };
  });

  // Create the engine once; it lives as long as the stage does.
  useEffect(() => {
    let cancelled = false;
    let engine: BaliEngine | null = null;
    import("./engine")
      .then(({ BaliEngine }) => {
        if (cancelled || !hostRef.current) return;
        try {
          engine = new BaliEngine(hostRef.current, {
            screenIds: SCREENS.map((s) => s.id),
            onStepRequest: (index) => latest.current.onStepRequest(index + 1),
            onScrollHint: (index) => {
              setHint(index);
              if (index !== null) setScrolledOnce(true);
            },
            onPresetChange: setPreset,
            onReady: () => setReady(true),
          });
        } catch {
          setFailed(true);
          return;
        }
        engineRef.current = engine;
        if (process.env.NODE_ENV !== "production") (window as unknown as { __bali?: BaliEngine }).__bali = engine;
        const now = latest.current;
        engine.setState(now.state);
        engine.setScrollLimit(now.maxScreen - 1, now.scrollEnabled);
        engine.setFocus(now.focusId, { instant: true });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setState(state);
  }, [state]);

  useEffect(() => {
    engineRef.current?.setFocus(focusId);
  }, [focusId]);

  useEffect(() => {
    engineRef.current?.setScrollLimit(maxScreen - 1, scrollEnabled);
  }, [maxScreen, scrollEnabled]);

  if (failed) return <>{fallback}</>;

  const onPlan = focusId === "model" && !preset;
  const hintScreen = hint !== null ? SCREENS[hint] : null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#cfd8de]">
      <div ref={hostRef} className="absolute inset-0" aria-label="3D model of the Bali that changes with your choices" role="img" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
          <p className="text-caption uppercase tracking-eyebrow text-text-muted">Building your Bali…</p>
        </div>
      )}

      {/* Honest label: this is a model built from the published plan, not a photo. */}
      <p className="pointer-events-none absolute left-3 top-3 max-w-[70%] bg-black/55 px-2 py-1 text-caption text-white/85 backdrop-blur-sm">
        3D model from Supreme&apos;s Bali floor plan. Finishes are representative.
      </p>

      {onPlan && ready && !scrolledOnce && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
          <p className="bg-black/70 px-4 py-2 text-body-sm text-white backdrop-blur-sm">
            {scrollEnabled ? "Scroll on the plan to raise the walls" : "Press Next to raise the walls"}
          </p>
        </div>
      )}

      {hintScreen && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <p className="bg-black/70 px-5 py-3 font-display text-lg text-white backdrop-blur-sm">{hintScreen.title}</p>
        </div>
      )}

      {/* View buttons */}
      <div className="absolute inset-x-0 bottom-0 flex gap-1 overflow-x-auto p-2 [scrollbar-width:none]">
        {VIEW_BUTTONS.map((v) => {
          const active = (v.id ?? null) === preset;
          return (
            <button
              key={v.label}
              type="button"
              onClick={() => engineRef.current?.setPreset(v.id)}
              aria-pressed={active}
              className={`focus-ring shrink-0 px-2.5 py-1.5 text-caption font-medium backdrop-blur-sm transition-colors ${
                active ? "bg-gold text-white" : "bg-black/55 text-white/85 hover:bg-black/75 hover:text-white"
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
