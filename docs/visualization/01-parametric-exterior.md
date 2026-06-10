# Phase 1 — Parametric Exterior House (Live 2D Preview)

Status: ✅ **Built Jun 9, 2026** — this doc now serves as the spec of record and the
extension guide for future changes.

## What it is

`components/configurator/ParametricHouse.tsx` — a pure-SVG front elevation of the
buyer's home, drawn entirely from `ConfiguratorState` + `lib/defaults.ts` data.
Every exterior click updates it instantly:

| State field | Visual effect |
|---|---|
| `modelId` → model `category` | Silhouette: `mini` compact gable · `modular` wide low-pitch contemporary · `traditional` steeper craftsman gable · `multistory` two storeys, two window rows |
| `sidingColorId` | Wall fill = `sidingColors[].swatchHex` |
| `sidingStyleId` | `horizontal` lap lines · `vertical` board lines · `board-batten` wide boards + battens |
| `roofTypeId` | `shingles` dark asphalt with course lines · `metal` standing-seam verticals |
| `metalRoofColorId` | Metal roof fill = `metalRoofColors[].swatchHex` (only when metal) |
| `exteriorTrimId` | `standard` thin casing · `craftsman` wide casing + corner blocks · `colonial` stepped double casing |
| `hasFrontPorch` | Porch roof, posts, and deck appear |

## Design rules (keep these when extending)

1. **Stateless and pure.** Props in → SVG out. No fetches, no effects, no internal state.
2. **All colors from data.** Wall/roof hexes come from `swatchHex` lookups. The only
   hardcoded colors are neutrals (trim white, window glass, door, shadow) — keep those
   in the `PALETTE` const at the top of the file.
3. **Texture via line overlays, not SVG `<pattern>`.** Siding texture is a clipped group
   of stroke lines at `rgba(0,0,0,0.14)` over the wall fill — this works at any size and
   recolors for free. Patterns with hardcoded fills break when colors change.
4. **Silhouette is category-level, not model-level.** Ten bespoke house drawings is a
   maintenance trap. Four category silhouettes + the model name badge is the right
   fidelity for an illustration; per-model accuracy is Phase 4's job (AI renders).
5. **Trim contrast guard:** trim is warm white `#F2EDE3`; when siding is `white` or
   `cream` the walls get a 1px `rgba(0,0,0,0.25)` outline so the house doesn't vanish
   into the trim.

## Integration

`HomeVisualizer.tsx` composes the scene:

```
background  = uploaded lot photo | lot.photoUrl | <LotBackdrop terrain={lot.terrain}> | default backdrop
house       = <ParametricHouse state={state}/>  (bottom-center, when modelId set)
overlays    = selection badges (lot name, model·sqft, siding chip, metal roof, porch)
```

The real Supreme Homes model photo is **not** the live preview background (tried it —
the photo contradicts the chosen colors and confuses buyers). Model photos belong on
the ModelStep cards and, later, the Phase 4 AI render panel.

## Extension points

- **New siding color / metal color:** add to the array in `defaults.ts`. Done — renders automatically.
- **New siding style:** add option in `exteriorGroups`, then add a case to
  `SidingTexture` in `ParametricHouse.tsx` (one small SVG group).
- **Garage / second-storey extensions:** when extensions move into the configurator,
  add conditional geometry the same way `hasFrontPorch` works. Garage = attached
  rectangle with door panel lines; second storey = reuse the multistory wall block.
- **Window/door color options (Supreme offers black windows):** add an OptionGroup
  in defaults, map its `swatchHex` to the window frame stroke.

## Acceptance criteria (all verified Jun 9, 2026)

- [x] Clicking each of the 10 siding colors recolors the walls with no other change.
- [x] Horizontal ↔ vertical ↔ board & batten visibly changes siding line direction/weight.
- [x] Shingle ↔ metal changes roof texture; each of the 5 metal colors recolors the roof.
- [x] Porch toggle adds/removes porch without layout shift.
- [x] Each category renders a distinct silhouette; multistory shows two storeys.
- [x] White siding remains visible against white trim.
- [x] No console errors; works at mobile width (visualizer is inline above steps).
