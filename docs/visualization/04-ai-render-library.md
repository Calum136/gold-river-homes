# Phase 4 — AI Hero Render Library (Build-Time, Photorealistic)

Status: 📋 Spec ready — **demoted to stopgap track (Jun 9, 2026 evening).** The
destination for photoreal is the 3D render-stack pipeline in
[07-photoreal-pipeline.md](./07-photoreal-pipeline.md). Build this phase only if the
owner wants photoreal-ish visuals while the 3D pilot is in flight; AI editing has
geometry drift between variants and can't honor the "exactly your house" promise.
Depends on Phase 1 (fallback exists ✅); quality jumps massively once Phase 3 delivers
real elevation drawings/photos to use as references.

## Concept

A "See your home" panel showing a **photorealistic** render of the configured exterior.
All images are generated **once, locally, by a script the developer runs**, committed
to `public/renders/`, and served statically. The live site never calls an AI API —
this is how we honor the hybrid decision *and* the $0-runtime decision.

## The combinatorics problem (do the math before generating)

Full exterior space: 10 models × 3 siding styles × 10 colors × 6 roofs (shingle + 5 metal)
× 2 porch = **3,600 images** (~$0.04–0.07 each ≈ $150–250, plus review time). Don't.

**Pruning strategy (the decided approach):**
- AI renders cover **siding style × siding color** only: 3 × 10 = 30 per model.
- Generate with the model's standard roof and no porch; the caption under the render
  says "Shown with architectural shingles" and roof/porch/trim stay visible in the
  live parametric preview, which sits beside (or toggles with) the hero render.
- **Pilot with ONE model first** (Sauvignon CT-2 — flagship, has a good source photo):
  30 images, ~$1–2. Evaluate consistency with human eyes. Only scale to all 10 models
  (300 images, ~$12–20) after the pilot passes.

## Consistency technique (the hard part)

Naive text-to-image gives a *different house* every render — unacceptable. Use
**image-conditioned editing**, not generation from scratch:

1. Input: the model's real front-facing photo or elevation drawing
   (`public/models/<id>/exterior.webp` from Phase 3; until then, the supremehomes.ca photo).
2. Prompt pattern: *"Edit this photo of a modular home: change the siding to
   {vertical board-and-batten} in {brick red / #8C3A2A}. Keep the house geometry,
   windows, doors, roof, landscaping, lighting and camera angle EXACTLY identical.
   Photorealistic, no people, no text."*
3. Same source image for all 30 variants of a model → the house stays the same house.
4. Models with editing strength: Gemini image API (`gemini-2.5-flash-image` family or
   newer — check current model names via the claude-api/docs at build time) or any
   image-edit-capable API. Choose whatever has the best edit fidelity at the time of
   building; the script isolates this behind one `generateVariant()` function.

## Script spec — `scripts/generate-renders.mjs`

- Node script, run manually: `GEMINI_API_KEY=... node scripts/generate-renders.mjs --model sauvignon-ct-2`
- Reads `homeModels`, `sidingColors`, and `exteriorGroups` from `lib/defaults.ts`
  (import the TS via `tsx`, or keep a tiny JSON mirror — prefer importing so data
  never forks).
- For each (style × color): skip if output file already exists (resumable; re-running
  only fills gaps — also how you regenerate one bad image: delete it and re-run).
- Output: `public/renders/<modelId>/<sidingStyleId>_<sidingColorId>.webp`, ≤ 1280px, q80.
- After generating, write `public/renders/manifest.json`:
  `{ "<modelId>": ["horizontal_white", "vertical_brick-red", ...] }`
  The client checks the manifest (statically imported) instead of probing for 404s.
- API key via env var only. **Never commit the key; never reference it in client code.**

## Runtime integration

- `lib/renders.ts` → `getHeroRenderUrl(state): string | null` — looks up
  `manifest.json` for `state.modelId` + `state.sidingStyleId` + `state.sidingColorId`.
- `HomeVisualizer` (or the Summary step): when a URL exists, show a toggle —
  **"Illustration | Photo render"** — defaulting to the photo render on the Summary
  step. When null, the parametric view shows alone, exactly as today. Graceful always.
- Disclaimer line under AI renders (legal honesty for a sales tool):
  *"AI-assisted visualization. Final home appearance may vary — confirm finishes with
  Gold River Homes."*

## Review gate (mandatory)

Every generated image gets human review before commit (a 30-image contact sheet is
10 minutes of looking). Reject anything with warped geometry, wrong color, artifacts,
or hallucinated features. This library carries the business's credibility.

## Acceptance criteria

- [ ] Pilot: 30 Sauvignon CT-2 renders generated, reviewed, committed with manifest.
- [ ] Same house geometry across all 30 (the consistency bar).
- [ ] Toggle appears only when a render exists; no 404s, no layout shift, no API calls from the browser.
- [ ] Disclaimer shown with every AI render.
- [ ] Decision logged: scale to all models or stop at flagship(s).
