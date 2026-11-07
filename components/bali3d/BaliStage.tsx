"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ConfiguratorState } from "@/lib/pricing";
import { SCREENS } from "@/lib/screens";
import type { BaliEngine } from "./engine";
import { GUIDE } from "./guide";

// ============================================
// The Bali's 3D stage: the scene fills the stage box. On top of it: arrows to
// step back and forward (faint until hovered), a marker on what the current
// step changes, and view buttons (Google Maps style). three.js loads only when
// a buyer picks the Bali; without WebGL the photo stage shows instead.
// ============================================

// Ids match PRESETS in camera.ts (kept here so this file doesn't pull in three.js).
const VIEW_BUTTONS: { id: string; label: string }[] = [
  { id: "aerial", label: "Aerial" },
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "dollhouse", label: "Dollhouse" },
  { id: "top", label: "Top down" },
];

// In order along the house, from the main suite's end to Bedroom 3's, so
// going down the list walks the house once instead of back and forth.
const ROOMS: { id: string; label: string }[] = [
  { id: "ensuite", label: "Main bath" },
  { id: "bedroom", label: "Main bedroom" },
  { id: "laundry", label: "Laundry" },
  { id: "pantry", label: "Pantry" },
  { id: "kitchen", label: "Kitchen" },
  { id: "living", label: "Living room" },
  { id: "bedroom2", label: "Bedroom 2" },
  { id: "bath", label: "Bathroom" },
  { id: "bedroom3", label: "Bedroom 3" },
];

const ZOOMABLE = new Set(["dollhouse", "top"]);

interface BaliStageProps {
  state: ConfiguratorState;
  /** The screen (or, on the review page, the open decision) the camera frames. */
  focusId: string;
  /** Step arrows: undefined hides an arrow. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Shown if WebGL can't start. */
  fallback: ReactNode;
}

export default function BaliStage({ state, focusId, onPrev, onNext, fallback }: BaliStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BaliEngine | null>(null);
  const latest = useRef({ state, focusId });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState<string | null>(null);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const roomPreset = ROOMS.find((r) => r.id === preset);
  const guide = GUIDE[focusId];
  const anchor = guide?.anchor?.(state) ?? null;
  const anchorKey = anchor ? anchor.join(",") : "";
  const stepTitle = guide?.label ?? SCREENS.find((s) => s.id === focusId)?.title ?? "this step";

  useEffect(() => {
    latest.current = { state, focusId };
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
            onPresetChange: setPreset,
            onReady: () => setReady(true),
            callout: calloutRef.current,
          });
        } catch {
          setFailed(true);
          return;
        }
        engineRef.current = engine;
        if (process.env.NODE_ENV !== "production") (window as unknown as { __bali?: BaliEngine }).__bali = engine;
        const now = latest.current;
        engine.setState(now.state);
        engine.setFocus(now.focusId, { instant: true });
        engine.setCallout(GUIDE[now.focusId]?.anchor?.(now.state) ?? null);
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

  // The marker follows the decision in focus (and, for water and wastewater, the choice).
  useEffect(() => {
    engineRef.current?.setCallout(anchorKey ? (anchorKey.split(",").map(Number) as [number, number, number]) : null);
  }, [anchorKey]);

  if (failed) return <>{fallback}</>;

  const arrow =
    "focus-ring absolute top-1/2 z-10 flex h-16 w-11 -translate-y-1/2 items-center justify-center bg-black/40 text-3xl leading-none text-white opacity-25 backdrop-blur-sm transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100";

  return (
    <div className="group absolute inset-0 overflow-hidden bg-[#cfd8de]">
      <div ref={hostRef} className="absolute inset-0" aria-label="3D model of the Bali that changes with your choices" role="img" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
          <p className="text-caption uppercase tracking-eyebrow text-text-muted">Building your Bali…</p>
        </div>
      )}

      {/* What this screen is choosing, pinned to where it shows in the house. */}
      <div
        ref={calloutRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-300"
        style={{ willChange: "transform" }}
      >
        <span className="absolute -left-2 -top-2 block h-4 w-4 rounded-full border-2 border-white bg-gold shadow-[0_0_0_4px_rgba(196,136,42,0.35)]" />
        <span className="absolute -left-2 -top-2 block h-4 w-4 animate-ping rounded-full bg-gold/60 motion-reduce:hidden" />
        <span className="absolute left-4 top-[-0.85rem] whitespace-nowrap border border-gold bg-black/75 px-2 py-1 text-caption font-medium text-white backdrop-blur-sm">
          {guide?.label}
        </span>
      </div>

      {/* Step arrows: faint until hovered, so the home stays the focus. */}
      {onPrev && (
        <button type="button" onClick={onPrev} aria-label="Previous step" className={`${arrow} left-0`}>
          ‹
        </button>
      )}
      {onNext && (
        <button type="button" onClick={onNext} aria-label="Next step" className={`${arrow} right-0`}>
          ›
        </button>
      )}

      {preset && ZOOMABLE.has(preset) && (
        <p className="pointer-events-none absolute right-3 top-3 bg-black/60 px-2 py-1 text-caption text-white/85 backdrop-blur-sm">
          Scroll to zoom · drag to turn · Shift-drag to move
        </p>
      )}

      {/* Rooms menu, opening upward from its button */}
      {roomsOpen && (
        <div className="absolute bottom-12 left-2 z-20 flex flex-col border border-white/15 bg-black/80 py-1 backdrop-blur-sm" role="menu">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="menuitem"
              onClick={() => {
                engineRef.current?.setPreset(r.id);
                setRoomsOpen(false);
              }}
              className={`focus-ring px-3 py-1.5 text-left text-caption transition-colors ${
                r.id === preset ? "text-gold" : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Views. "Back to …" returns to the current step's own view. */}
      <div className="absolute inset-x-0 bottom-0 flex gap-1 overflow-x-auto p-2 [scrollbar-width:none]">
        {preset && (
          <button
            type="button"
            onClick={() => {
              engineRef.current?.setPreset(null);
              setRoomsOpen(false);
            }}
            className="focus-ring shrink-0 bg-gold px-2.5 py-1.5 text-caption font-semibold text-white"
          >
            ← Back to {stepTitle}
          </button>
        )}
        <button
          type="button"
          onClick={() => setRoomsOpen((o) => !o)}
          aria-expanded={roomsOpen}
          aria-haspopup="menu"
          className={`focus-ring shrink-0 px-2.5 py-1.5 text-caption font-medium backdrop-blur-sm transition-colors ${
            roomPreset ? "bg-white text-black" : "bg-black/55 text-white/85 hover:bg-black/75 hover:text-white"
          }`}
        >
          {roomPreset ? roomPreset.label : "Rooms"} ▴
        </button>
        {VIEW_BUTTONS.map((v) => {
          const active = v.id === preset;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                engineRef.current?.setPreset(v.id);
                setRoomsOpen(false);
              }}
              aria-pressed={active}
              className={`focus-ring shrink-0 px-2.5 py-1.5 text-caption font-medium backdrop-blur-sm transition-colors ${
                active ? "bg-white text-black" : "bg-black/55 text-white/85 hover:bg-black/75 hover:text-white"
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
