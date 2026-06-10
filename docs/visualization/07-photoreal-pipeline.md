# Phase 7 — Photoreal Render-Stack Pipeline (The Real Goal)

Status: 📋 Spec ready. **This is now the destination** (decided Jun 9, 2026, evening):
the buyer sees *exactly* what their configured house will look like, photoreal, reliable.
Phases 1–2 (parametric + backdrops) remain as the instant-feedback layer and the
universal fallback. Phase 4 (AI editing) is demoted to the stopgap track — see below.

## Why "reliable photoreal" means a 3D pipeline, not AI

Photos are fixed pixels; "exactly your combination" requires either an image for every
combination or layers that composite into one. AI image editing produces *plausible*
images with geometry drift between variants — fine for inspiration, not for "this is
your house." The way car configurators and serious home configurators do it:

> **Build a 3D model of each home once → assign real product materials → batch-render
> aligned image layers from a locked camera → the site composites layers client-side.**

Deterministic. Photoreal. A new color = one new material + an overnight re-render.
Still 100% static hosting, $0 runtime — all rendering happens on the dev machine.

## What must happen, in order

### 1. Asset acquisition (owner + Supreme Homes) — START HERE
Extends the Phase 3 request with the items that unlock everything:

- **Ask Supreme for their 3D files or render sources FIRST.** Several catalog images
  (e.g. the Zen series) look like archviz renders — if so, a marketing agency has
  3D models of these homes *right now*. Getting `.blend`/`.skp`/`.max`/`.fbx` files,
  or even just the agency's contact, collapses the biggest cost in this plan to ~zero.
- **The real options matrix with product codes.** Siding = actual vinyl product lines
  and color codes (Gentek/Kaycan/Mitten etc.), shingle = manufacturer color names,
  cabinet/counter/flooring = supplier SKUs. Two reasons: materials get built from the
  real product, and the configurator must only offer what Supreme actually builds.
- **Swatch/sample photos per option** — flat, well-lit, high-res (the user can supply
  these; that's the "assume I can get every image" premise).
- **Which options are valid on which models** — the compatibility matrix (see §6).

### 2. One 3D model per home
If Supreme can't provide them: commission from archviz freelancers (Upwork/Fiverr,
typical USD $300–1,500/model from floor plans + elevations + photos) or build in
Blender in-house. **Pilot with ONE flagship (Sauvignon CT-2 or Porto) before
committing to all ten.** Deliverable requirements to put in the freelancer brief:
- Blender-compatible format, real-world scale, front 3/4 view presentable.
- **Mesh separated and named by option surface**: `siding`, `roof`, `trim`,
  `door`, `windows`, `porch` (porch as a separable object), `foundation`.
- Neutral materials; we assign the real ones.

### 3. Material library (one-time, then per-new-option)
`assets3d/materials.blend` — one Blender material per option ID in `defaults.ts`,
built from the real swatch photos (albedo from photo; sensible roughness/normal for
vinyl lap vs board & batten vs metal vs asphalt). **Material names = option IDs**
(`siding/vertical/brick-red`, `roof/metal/forest-green`) — the render script keys on
this, exactly like the asset-naming rule in Phase 3.

### 4. Render automation — `scripts/render_stack.py` (Blender headless)
- Locked camera + locked lighting per model (saved in the .blend — never move them;
  alignment of layers depends on it).
- For each model, render **layers**, not full combinations:
  - `base.png` — everything except siding/roof/porch (windows, door, trim, shadows, ground contact)
  - `siding/<styleId>_<colorId>.png` — siding mesh only, per style×color (3×10 = 30)
  - `roof/<shingles|metal-colorId>.png` (6)
  - `porch/<on>.png` + `porch-roof/<roof-variant>.png` (porch shadows baked into its layer)
  - `trim/<trimId>.png` (3)
- ≈ 40–45 renders per model instead of 3,600 combinations. Transparent-background
  PNGs → convert to WebP, ~1280px. Output `public/renders3d/<modelId>/...` +
  `manifest.json` (same manifest pattern as Phase 4).
- Run: `blender -b assets3d/<model>.blend -P scripts/render_stack.py -- --model acadie-ct`.
  Re-runnable; skips existing files (same resumability rule as Phase 4's script).

### 5. Front-end — `PhotoStack.tsx`
- Absolutely-positioned stacked `<img>` layers in a fixed-aspect box; option click =
  swap one layer's `src`. Instant (preload sibling variants of the active option group
  on hover/step-entry).
- Fallback chain, per model: **photoreal stack (if in manifest) → ParametricHouse**.
  Phase 1 never gets deleted; it's the guarantee the visualizer always works.
- Disclaimer stays modest: "Rendering of actual product colors. Confirm final
  selections with Gold River Homes."

### 6. Reliability layer (what makes it trustworthy, not just pretty)
- **Compatibility data**: add `availableForModels?: string[]` /
  `incompatibleWith?: string[]` to `OptionItem`; steps grey-out invalid options with
  a "not available on this model" note. Reliability = never showing a house Supreme
  won't build.
- **QA gate**: owner reviews every model's layer set against real built-home photos
  before it ships. One signed-off contact sheet per model, logged in Session Notes.
- **Data reconciliation**: prices and option lists in `defaults.ts` updated from the
  factory sheet at the same time — the picture and the price must describe the same house.

### 7. Lots (scope simplified Jun 9, 2026)
- **Uploaded-lot visualization is dropped.** "Use my own land" remains for *pricing*
  only — no photo upload, no house-on-your-photo compositing (matching a render's
  camera/perspective/lighting to an arbitrary phone photo is the unreliable part;
  cutting it protects the "reliable" promise).
- Gold River lots: real road-frontage photo per lot (Phase 2 standards). The lot photo
  sets the scene (card + visualizer background); the photoreal house renders on its
  own ground plane. **Do not fake "this exact house on this exact lot"** unless a
  per-lot composite is manually produced and owner-approved (optional flagship-only
  nicety, never automated).

## Cost and decision summary (for the owner)

| Path | One-time cost | Fidelity | Reliability |
|---|---|---|---|
| Supreme already has 3D | ~$0 + dev time | Photoreal | High |
| Commission 3D, all 10 models | ~$3k–15k | Photoreal | High |
| Commission 3D, 2 flagships first (recommended pilot) | ~$600–3k | Photoreal | High |
| AI photo-editing (Phase 4 stopgap) | ~$20–50 API + review hours | Near-photoreal, geometry drift | Medium — human review required |

**Recommended sequence:** ask Supreme about 3D files (free, this week) → pilot one
commissioned model if they don't have them → AI stopgap (Phase 4) only if the owner
wants photoreal-ish visuals while the 3D pilot is in flight.

## Acceptance criteria

- [ ] Supreme asked about 3D/render source files; answer logged.
- [ ] Pilot model: layer stack renders, composites correctly, every exterior option switches instantly with no misalignment.
- [ ] Compatibility rules in data; invalid options visibly disabled.
- [ ] Owner sign-off recorded per model before its renders go live.
- [ ] Fallback to ParametricHouse verified for models without render stacks.
- [ ] Interior rooms follow the same pipeline (3D room scenes per model — extends Phase 5 Tier B with the same locked-camera layer approach).
