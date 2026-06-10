# Home Visualization — Master Plan

> **Read this file first.** It is the entry point for every coding session working on the
> Gold River Homes visualization system. Each numbered doc in this folder is a
> self-contained build spec for one phase. Build them in order unless a phase's
> "Dependencies" section says otherwise.

Last updated: Jun 9, 2026
Owner decision record: Calum (Nine Roads), on behalf of Gold River Homes.

---

## The goal

A buyer clicking through the configurator should **see** their choices, not just read them:
pick vertical board & batten in brick red → the house preview shows vertical brick-red siding.
Pick quartz counters and shaker cabinets → see a kitchen with quartz and shaker.
This is a sales tool for a family business serving first-time buyers — clarity and trust
beat flashiness every time.

## Locked architecture decisions (Jun 9, 2026 — do not relitigate)

These were decided explicitly with Calum. Future sessions must follow them:

1. **Hybrid rendering: live 2D parametric + pre-generated AI hero renders.**
   - The *live* preview (updates on every click) is a deterministic, code-drawn
     parametric illustration (`ParametricHouse`). Instant, free, always consistent.
   - *Photorealistic* AI renders are generated **at build time by a local script**,
     committed as static files, and served from `/public`. The deployed site never
     calls an AI API.
2. **$0 runtime forever.** Static Netlify hosting. No serverless functions, no API keys
   in production, no per-use costs. Anything that costs money happens on the dev
   machine before deploy (AI generation costs cents, paid once during development).
3. **Manufacturer assets are coming.** Gold River is an authorized Supreme Homes
   retailer; the owner will request floor plans, elevations, and finish swatches
   (see [03-asset-pipeline.md](./03-asset-pipeline.md) for the exact request list).
   Every visual component must accept a real asset when it exists and fall back to
   the parametric/illustrated version when it doesn't. **Asset-first, illustration-fallback**
   is the universal pattern.
4. **Interior depth = room-level finish preview.** Not just a static floor plan:
   clicking a room (kitchen, living, bath, bedroom) shows that room with the buyer's
   chosen flooring/counters/cabinets/paint applied. See [05-interior-rooms.md](./05-interior-rooms.md).
5. **Data-driven, always.** New models, colors, or options = new objects in
   `lib/defaults.ts` arrays. Visual components read `swatchHex`, `paletteHexes`,
   style IDs, and asset paths from data. A new siding color must appear in the
   visualizer with **zero component changes**.

### Amendments — Jun 9, 2026 (evening), after Calum reviewed Phase 1 in browser

6. **Photoreal is the destination.** Calum can obtain images of every home, siding,
   finish, roof, and add-on. The end state is a **3D render-stack pipeline**
   ([07-photoreal-pipeline.md](./07-photoreal-pipeline.md)): one 3D model per home,
   real product materials, batch-rendered aligned layers, client-side compositing.
   The parametric house (Phase 1) stays as the instant-feedback layer and permanent
   fallback. AI editing (Phase 4) is now a *stopgap track*, not the goal.
7. **Uploaded-lot visualization is dropped.** "Use my own land" stays for pricing
   only. Lot visuals exist only for Gold River/Supreme lots, where we control photo
   quality and perspective. Reliability beats a gimmick that half-works.

## Standing constraints (from project CLAUDE.md — apply to all phases)

- Next.js 16.x App Router. **Read `AGENTS.md` and `node_modules/next/dist/docs/` before writing code** — this Next.js differs from training data.
- Tailwind v4: tokens live in `@theme inline` in `app/globals.css`. There is NO
  `tailwind.config.js`. Use existing token classes only (`bg-bg-primary`, `text-gold`,
  `border-border`, `bg-bg-elevated`, `text-text-muted`, etc.).
- `/calculator` must keep working (it redirects to `/configure`; the page still exists).
- Target user knows nothing about construction. Explain, don't ask. UX simplicity is priority #1.
- Dark/gold Supreme Homes aesthetic: bg `#111415`, gold `#97764E`, bright gold `#C4882A`,
  cream `#E8DCCC`. Playfair Display headings, Poppins body.

## Phase index

| # | Doc | What it delivers | Status | Depends on |
|---|-----|------------------|--------|------------|
| 1 | [01-parametric-exterior.md](./01-parametric-exterior.md) | Live SVG house reacting to every exterior option | ✅ Built Jun 9, 2026 | — |
| 2 | [02-lot-visuals.md](./02-lot-visuals.md) | Illustrated NS lot backdrops; real-photo standards | ✅ Backdrops built Jun 9, 2026 · real photos pending owner | — |
| 3 | [03-asset-pipeline.md](./03-asset-pipeline.md) | Supreme Homes asset request, naming conventions, directory layout | 📋 Spec ready — blocked on owner request to Supreme Homes | — |
| 4 | [04-ai-render-library.md](./04-ai-render-library.md) | Build-time photoreal exterior render library + runtime resolver | 📋 Spec ready | 1 (fallback), 3 (reference photos improve quality) |
| 5 | [05-interior-rooms.md](./05-interior-rooms.md) | Room-level interior finish preview | 📋 Spec ready | 3 or 7 (needs room imagery) |
| 6 | [06-floor-plans.md](./06-floor-plans.md) | Floor plan viewer with room hotspots | 📋 Spec ready | 3 (plan drawings), 5 (room views to link to) |
| 7 | [07-photoreal-pipeline.md](./07-photoreal-pipeline.md) | **The destination:** 3D render-stack → exact photoreal configurator | 📋 Spec ready — first action is asking Supreme for 3D files | 3 (product codes, swatches) |

**Build order rationale:** 1 and 2 make the live preview honest and responsive with zero
assets (done). 3 is a human task (email Supreme Homes) that should start immediately —
**the email should now include the Phase 7 ask: do they have 3D model files or archviz
render sources?** 7 is the destination; pilot it on one flagship model as soon as a 3D
source exists. 4 is a stopgap if photoreal-ish visuals are wanted before the 3D pilot
lands. 5 is the biggest differentiator and inherits 7's pipeline for interiors. 6 ties
interiors together.

## How a future session should work

1. Read this file, then the phase doc you're building.
2. Read `lib/defaults.ts` and `lib/pricing.ts` — the option IDs in the phase docs
   must match what's actually there (they were verified Jun 9, 2026; re-verify).
3. Check the phase doc's **Acceptance criteria** section. Build until all pass.
4. Verify in the browser (dev server config in `.claude/launch.json`, port 3001).
5. Update the Status column in this file's phase index, update `docs/MASTER.md`
   if you add docs, and note the session in project `CLAUDE.md` Session Notes.

## Out of scope (full project vision, not this system)

MLS land-data integration, guided "Grandma-friendly" walkthrough mode, and saved/shareable
configurations are separate roadmap items. Don't bundle them into visualization phases.
