# Phase 6 — Floor Plan Viewer with Room Hotspots

Status: 📋 Spec ready. Depends on Phase 3 (real plan drawings) and Phase 5 (room views
to link to). Without real plans this phase doesn't start — never draw fake floor plans
for real models.

## Concept

On the ModelStep (expandable "View floor plan" on each card) and in the Interior mode,
show the manufacturer's actual floor plan for the selected model with clickable room
hotspots that open Phase 5's room views.

## Data model

Add to `HomeModel` in `lib/defaults.ts` (all optional — plan features appear only when data exists):

```ts
planUrl?: string;            // "/models/<id>/plan.webp"  (Phase 3 asset)
planHotspots?: Array<{
  roomId: "kitchen" | "living" | "bath" | "bedroom";
  label: string;             // "Primary Bedroom", "Kitchen"
  // polygon as % of image dimensions, so it survives any display size
  points: Array<[number, number]>;
}>;
```

Hotspot authoring: open the plan image, note the room corner coordinates as percentages.
Tedious but one-time per model; a tiny dev-only helper page that logs click coordinates
(`/dev/hotspots`, excluded from prod nav) pays for itself by model #2.

## Component spec — `components/configurator/FloorPlanViewer.tsx`

- Renders `planUrl` image, max-width container, **pinch/scroll zoom + drag pan**
  (a ~50-line pointer-events implementation is fine; avoid heavy deps for a static site).
- SVG overlay (same aspect box) draws hotspot polygons: invisible by default,
  `fill gold/10 + stroke gold` on hover/focus, label tooltip.
- Click hotspot → if Phase 5 has imagery/swatch-board for that room, switch the
  visualizer to Interior mode + that room; else just highlight with the label.
- Beds/baths/sqft callout row under the plan (data already on `HomeModel`).
- Accessibility: hotspots are `<button>`s in the SVG (focusable, Enter activates);
  plan has alt text "{model name} floor plan".
- No plan asset → component renders nothing (cards simply don't show the link).

## Placement

1. **ModelStep cards:** "View floor plan ↗" link opening a lightweight modal
   (or expanding inline below the card on mobile). Helps buyers choose a model —
   the plan IS a major purchase factor.
2. **Interior mode (Phase 5):** small plan thumbnail beside the room tabs as a
   navigation map — the active room's hotspot stays highlighted.

## Acceptance criteria

- [ ] Plans display zoomable/pannable on desktop and mobile for every model that has a plan asset.
- [ ] Hotspots align with rooms at all zoom levels (percentage coordinates).
- [ ] Hotspot click drives Phase 5 room navigation when available.
- [ ] Models without plans degrade to exactly today's UI.
- [ ] Keyboard accessible.
