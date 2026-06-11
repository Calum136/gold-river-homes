# Gold River Homes — Total Cost Calculator
# Last updated: Apr 13, 2026

@AGENTS.md

## Status: ACTIVE — POC complete, pushed to GitHub, ready for Netlify deploy. Awaiting owner feedback.
## Next: Deploy to Netlify, share with owner, iterate based on feedback.
## Completion: ~30% (POC phase — full vision includes AI images, MLS integration, guided walkthrough)

- **Client:** Gold River Homes (Supreme Homes retailer)
- **Location:** 219 NS-12, Chester Basin, NS B0J 1K0
- **Contact:** info@goldriverhomes.ca / 902-273-3033
- **Service Area:** Lunenburg, Queens, Shelburne, Annapolis, Digby, Yarmouth (NS)
- **Repo:** https://github.com/Calum136/gold-river-homes

## Project Scope
POC modular/mini home total cost calculator. Owner's ask: "build a modular/mini home mortgage calculator that encompasses the servicing costs, well, septic, municipal hookup, land purchases and etc."

Full vision (from PDF brief) includes AI-generated home visuals, MLS land data integration, and a guided "Grandma-friendly" walkthrough — but POC comes first.

## Tech Stack
| Tech | Role |
|------|------|
| Next.js 14 (App Router) | Framework |
| Tailwind CSS | Styling (custom dark theme matching supremehomes.ca) |
| Recharts | Donut chart for cost breakdown |
| Netlify | Deployment (netlify.toml configured) |

## Design Tokens (from supremehomes.ca)
- Dark bg: `#111415`, Gold accent: `#97764E`, Gold bright: `#C4882A`
- Fonts: Playfair Display (headings), Poppins (body), Teko (accents)
- Warm cream text: `#E8DCCC`

## Architecture
```
app/
├── page.tsx              # Landing page
├── calculator/page.tsx   # Main calculator (question-driven flow)
components/
├── calculator/           # ChoiceCard, QuestionCard, CostLineItem, MortgageInputs, ResultsPanel, CostBreakdownChart
├── layout/               # Navbar, Footer
lib/
├── calculator.ts         # Mortgage math
├── defaults.ts           # Cost estimates with low/mid/high ranges
docs/
├── MASTER.md             # Doc index
├── design-tokens.md      # Colors, fonts, spacing
├── architecture.md       # File structure, component hierarchy
├── calculator-logic.md   # Cost categories, formulas, defaults
├── decisions.md          # Key decisions and rationale
├── business-context.md   # Client info, models, service area
```

## Key Design Decision
**The site TELLS users what things cost** — not sliders where users guess. Target audience is first-time home buyers who don't know what a well or septic costs. Users answer simple questions (well vs municipal? own land or buying? foundation type?) and the site shows estimated costs with educational descriptions and typical ranges.

## Rules for Claude
1. Target user is a first-time home buyer who knows NOTHING about site servicing costs — explain, don't ask
2. All cost estimates should have low/mid/high ranges based on Nova Scotia market
3. Design must match supremehomes.ca dark/gold aesthetic
4. Keep POC scope tight — owner will steer direction for Phase 2+
5. Docs in `docs/` folder — update MASTER.md index when adding new docs

## Session Notes
- **Jun 11, 2026 (Bali render demo):** Added the **Bali** (Casita Series, 3BR/2BA, 1,440 sqft, 74'×16', $219k placeholder) as the photoreal showcase model. Source: owner-provided web sheet `C:\Users\Calum\OneDrive\Desktop\AI\BALI-NEW-TEMPLATE-WEB-SHEET-EN.pdf` — its hero image is Supreme Homes' own archviz render; extracted to `public/models/bali/exterior.webp` (1923×905). New `HomeModel.demoRender` field: visualizer shows the static photoreal render (with "Photorealistic render" badge + caption of depicted options, siding/roof chips hidden) when no option-reactive render stack exists. Fallback chain: renderStack > demoRender > ParametricHouse. This is the owner-demo contrast: Bali = photoreal destination, other models = live illustration. No image-gen API key on this machine — AI "photorealization" wasn't needed since the manufacturer render IS photoreal; future option-reactive renders still follow docs/visualization/07.
- **Jun 9, 2026 (MVP polish):** Built owner-demo MVP. Photoreal infra without assets: `lib/renders.ts` + `renders-manifest.json` + `PhotoStack.tsx` (Phase 7 runtime, falls back to ParametricHouse), `isOptionAvailable`/`availableForModels` compatibility mechanism, `roomFinishMap`, visualizer Exterior/Interior mode with interior selections board, "renders in production from Supreme Homes files" footnote under visualizer. Dropped uploaded-lot photo UI (own-land = pricing only). Full Chrome UX audit + fixes: removed double header on /configure (Navbar returns null there; nav now says "Design & Price" → /configure), **price-truth fix** (`displayedOptionDelta` — per-sqft options like vertical siding/metal roof/flooring now show the real charged delta, not fake flat labels; porch toggle shows its price), SiteStep auto-cost rows now read from `siteEstimates` (were contradicting totals), "Interior shown" tags on model cards (`photoKind` field; only Zen CT-2 has an exterior photo), landing contact form now composes a real mailto (was faking "Message Sent!"), configurator state persists in localStorage. Then restructured per Calum's feedback to **one decision per screen**: flow flattened to 20 single-choice screens (`SCREENS` array in `app/configure/page.tsx`; `only` prop on Exterior/Interior/Site step components renders one section standalone), visualizer widened to 60% of the page, Next/Back buttons + "N of 20" counter, StepNav shows the 6 macro phases derived from the current screen. `state.step` is now a screen index (storage key bumped to `grh-configurator-v2`).
- **Jun 9, 2026:** Visualization overhaul. Calum rated lot photos + home render 2/10; decided (via Q&A) on hybrid strategy: live 2D parametric preview + build-time AI hero renders, $0 runtime, owner to request Supreme Homes dealer assets, room-level interior previews as the end goal. Wrote phased build plan in `docs/visualization/` (00-master-plan is the entry point — READ IT before visualization work). Built Phase 1 (`ParametricHouse.tsx` — live SVG house reacting to siding color/style, roof type/color, trim, porch, fireplace chimney, per-category silhouettes) and Phase 2a (`LotBackdrop.tsx` illustrated NS scenes; deleted Unsplash stock; `LotOption.photoUrl` now optional with `terrain` field). Verified in browser. NOTE: the 5 listed lots are placeholder data — owner must verify/replace. Same evening: Calum confirmed photoreal is the destination (he can source images of every home/finish/option) → wrote `docs/visualization/07-photoreal-pipeline.md` (3D render-stack: model per home, real product materials, batch-rendered layers, client compositing; AI editing demoted to stopgap). Uploaded-lot visualization dropped from scope — own-land stays for pricing only. First action: owner asks Supreme Homes whether 3D model files / archviz render sources exist for their catalog.
- **Apr 13, 2026:** Built full POC from scratch. Inspected supremehomes.ca for design tokens (dark #111415, gold #97764E, Playfair Display + Poppins). Created Next.js 14 + Tailwind + Recharts project. Initial build had sliders for user-input costs — Calum corrected: target audience doesn't know costs, site should TELL them. Redesigned as 6-step question-driven flow (pick home model, own land?, foundation type, well/municipal, septic/municipal, mortgage terms) with educational cost cards showing prices + ranges + explanations. Pushed to GitHub: https://github.com/Calum136/gold-river-homes. Ready for Netlify deploy.
