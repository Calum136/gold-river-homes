# Phase 5 — Room-Level Interior Finish Preview

Status: 📋 Spec ready. The biggest lift and the biggest differentiator. Needs room
imagery from Phase 3 (real photos) — Phase 4's technique then applies to interiors.

## Concept

The buyer clicks a room — Kitchen, Living, Bath, Bedroom — and sees **that room with
their chosen finishes applied**: flooring, countertops, cabinet style, paint palette,
hardware finish, fireplace. This is what makes finishes feel real instead of being a
line item with a price.

## Which selections affect which rooms (the finish map)

Keep this as data in `lib/defaults.ts` (e.g. `roomFinishMap`), not hardcoded in components:

| Room | Affected by |
|---|---|
| Kitchen | flooring, countertops, cabinetStyle, hardwareFinish, lightingPackage |
| Living | flooring, paintPackage, interiorTrim, lightingPackage, hasFireplace |
| Bath | flooring, countertops, cabinetStyle, hardwareFinish |
| Bedroom | flooring, paintPackage, interiorTrim |

UI use: when the buyer is inside an InteriorStep section, auto-switch the visualizer
to the most relevant room (countertops → Kitchen, paint → Living). Buyer can still
click any room tab manually.

## Rendering approach — two tiers, build A first

### Tier A (deterministic, $0, build first): masked photo compositing
Recolor *real room photos* client-side using region masks — the technique paint-company
visualizers use:

1. For each model's room photo (`/models/<id>/rooms/kitchen.webp`), create grayscale
   **region masks** (same dimensions): `kitchen-floor-mask.png`, `kitchen-cabinets-mask.png`,
   `kitchen-counters-mask.png`, `kitchen-walls-mask.png`. White = region, black = not.
   Made once per photo in any editor (Photopea is free; AI segmentation like SAM can
   draft them). This is the main manual cost: ~4 masks × 4 rooms × N models —
   **start with one model** (same pilot logic as Phase 4).
2. Client renders photo to `<canvas>`, then per region: draw a `swatchHex`/texture-tinted
   layer through the mask using `multiply`/`color` composite ops so lighting and shadows
   survive recoloring.
3. Component: `components/configurator/RoomVisualizer.tsx` — props `(modelId, roomId, state)`;
   resolves photo+masks by naming convention; regions and their state-field mapping come
   from `roomFinishMap`.
4. Limitations to accept: cabinet *style* (flat vs shaker) and trim *profile* can't be
   shown by recoloring — show those as a labeled swatch/inset card next to the room view,
   recolor what can be recolored (floor tone, counter tone, cabinet color, wall color).

### Tier B (photoreal upgrade, later): pre-generated AI room matrix
Phase 4's build-time pipeline pointed at interiors. Kitchen matrix per model:
flooring (3) × countertops (2) × cabinetStyle (3) = 18 images; living: flooring (3) ×
paint (3) × fireplace (2) = 18; bath 18; bedroom 9. ≈ 63/model — generate only for
flagship models, same manifest + resolver + review-gate pattern as Phase 4. Tier B
*replaces* Tier A per room when its images exist (asset-first, illustration-fallback).

## UI spec

- `HomeVisualizer` gains mode tabs: **Exterior | Interior** (interior enabled once a
  model is chosen; auto-switches as described above).
- Interior mode: room tabs (Kitchen · Living · Bath · Bedroom) above the room view,
  active finishes listed as small chips under it (reuse the badge style).
- Until any room imagery exists for the selected model, interior mode shows the finish
  selections as large labeled swatch cards (paletteHexes for paint, swatchHex for
  hardware, etc.) — an honest "your selections" board, never a fake room.
- Mobile: tabs stay; visualizer is already inline above the steps.

## Build order within this phase

1. `roomFinishMap` data + visualizer mode/room tabs + swatch-board fallback (no imagery needed — ship immediately).
2. Tier A masks + canvas compositing for ONE model's kitchen. Evaluate with Calum.
3. Extend to remaining rooms/models per evaluation.
4. Tier B for flagships when Phase 4's pipeline is proven.

## Acceptance criteria

- [ ] Room tabs + auto-switch wired to InteriorStep sections.
- [ ] Swatch-board fallback for models with no room imagery (no fake rooms, ever).
- [ ] Pilot kitchen recolors floor/counter/cabinet/wall correctly with lighting preserved.
- [ ] Selections that can't be visualized are shown as labeled insets, not silently ignored.
- [ ] Zero runtime API calls; all imagery static.
