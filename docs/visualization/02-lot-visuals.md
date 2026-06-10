# Phase 2 — Lot Visuals

Status: ✅ **Illustrated backdrops built Jun 9, 2026.** Real lot photography pending owner.

## The problem this solves

The original lot cards used random Unsplash stock — a tropical beach for Yarmouth, alpine
mountains for Bridgewater. For a trust-based family business selling real Nova Scotia
lots, fake scenery is worse than no photo. Rated 2/10 by Calum; correctly so.

## Current implementation (built)

1. `LotOption` gained `terrain: "wooded" | "meadow" | "coastal" | "town"` and
   `photoUrl` became **optional**. The Unsplash URLs were deleted.
2. `components/configurator/LotBackdrop.tsx` draws an illustrated Nova Scotia scene
   per terrain (SVG: soft maritime sky, spruce treelines, ground plane; coastal adds a
   water band, town adds distant rooflines). Same illustration style as `ParametricHouse`
   so house-on-backdrop looks intentional, not pasted.
3. `LotStep` cards and `HomeVisualizer` both render `LotBackdrop` when a lot has no
   `photoUrl`. **When `photoUrl` exists it wins** — that's the upgrade path.
4. ~~A buyer-uploaded photo of their own land always takes top priority in the visualizer.~~
   **Scope change Jun 9, 2026 (evening):** uploaded-lot visualization is dropped
   (master plan amendment #7). "Use my own land" stays for pricing only. A future
   session should remove the photo-upload UI from `LotStep` and the
   `uploadedLot.imageDataUrl` branch from `HomeVisualizer` (keep the width/depth
   inputs — they're pricing/fit inputs, not visuals).

## What the owner must provide (real photos — the actual Phase 2 finish line)

Ask Gold River Homes for, **per listed lot**:

- 1 landscape-orientation photo from the road frontage, shot horizontally
  (not aimed at the ground/sky), minimum 1600px wide, taken May–October.
- Optional: 1 photo toward the best feature (river view, treeline, ocean).
- Confirmation the lot is genuinely for sale by/through Gold River, plus the real
  price, acreage, dimensions, and which services exist at the lot line. **The current
  five lots in `defaults.ts` are placeholders — verify or replace every one.**

## When photos arrive (instructions for that session)

1. Save to `public/lots/<lot-id>.webp` (convert + compress: target < 200 KB, ~1600px wide;
   `npx sharp-cli` or squoosh).
2. Set `photoUrl: "/lots/<lot-id>.webp"` on the lot in `defaults.ts`. Components already
   prefer it — no component changes.
3. Delete any placeholder lots the owner doesn't confirm. An honest short list beats
   an impressive fake one.
4. Photo treatment for visualizer use: the house sits bottom-center, so prefer photos
   where the ground plane occupies the lower third. If a photo fights the overlaid
   house badly, keep the photo on the LotStep card and use `LotBackdrop` in the
   visualizer (add a `photoSuitsOverlay?: boolean` flag to `LotOption` if needed —
   only add it when actually needed).

## Acceptance criteria

- [x] No stock photography anywhere in the lot flow.
- [x] Each terrain type renders a visibly distinct, NS-plausible scene.
- [x] Lot cards and visualizer share the same backdrop component.
- [x] `photoUrl` upgrade path works (uploaded-photo branch proves the img path).
- [ ] Real photos in place for every listed lot (owner-blocked).
- [ ] Lot data (price/size/services) verified real by owner.
