# Gold River Homes — Total Cost Calculator
# Last updated: Sep 13, 2026

@AGENTS.md

## Status: ACTIVE — Premium configurator handoff complete and live on `main` (5eda7d5, Sep 14, 2026): photo-first stage, named chapters, price + monthly payment + reason on every choice, example-lot and estimate labels, review-and-refine page, named saves, share link, printable spec sheet, enquiry email.
## Next: (1) Calum's manual pass on the live site (400 px, keyboard-only, print preview, share link in a private window); the final stage was verified by build and scripts, not in a browser. (2) Owner sends the Supreme data request, including written permission for Supreme's photos (`docs/visualization/03-asset-pipeline.md`). (3) Swap in real lots, model prices and the factory option price list when Gold River supplies them, and fill the 22 photo gaps (`npm run assets:report`).
## Completion: All premium handoff workstreams shipped; remaining items are blocked on owner data (lots, prices, options, photo permission)

- **Client:** Gold River Homes (Supreme Homes retailer)
- **Location:** 219 NS-12, Chester Basin, NS B0J 1K0
- **Contact:** info@goldriverhomes.ca / 902-273-3033
- **Service Area:** Lunenburg, Queens, Shelburne, Annapolis, Digby, Yarmouth (NS)
- **Repo:** https://github.com/Calum136/gold-river-homes

## Project Scope
POC modular/mini home total cost calculator. Owner's ask: "build a modular/mini home mortgage calculator that encompasses the servicing costs, well, septic, municipal hookup, land purchases and etc."

Full vision (from PDF brief) includes AI-generated home visuals, MLS land data integration, and a guided "Grandma-friendly" walkthrough — but POC comes first. (Sep 2026: visuals are real photography, not AI or drawings; see Session Notes.)

## Tech Stack
| Tech | Role |
|------|------|
| Next.js 16.2.3 (App Router) + React 19.2.4 | Framework |
| Tailwind CSS v4 (tokens in app/globals.css @theme inline, no tailwind.config.js) | Styling (custom dark theme matching supremehomes.ca) |
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
├── configure/page.tsx    # The configurator: chapters, stage photo, decision panel
├── calculator/page.tsx   # Legacy calculator (redirects to /configure; must keep building)
components/
├── configurator/         # HomeVisualizer, StageChrome, OptionExample, PhotoGallery, StepNav, SelectionsSummary, steps/*, ui/ChoiceRow
├── calculator/           # Legacy calculator components
├── layout/               # Navbar, Footer
lib/
├── defaults.ts           # Models (Supreme web sheet specs), options (Supreme 2026 standard specs), site costs with low/mid/high
├── pricing.ts            # Price engine, per-choice price and monthly deltas
├── calculator.ts         # Canadian mortgage math (semi-annual compounding, minimum down, CMHC)
├── copy.ts               # Approved chapter openers, estimate statement, stage note, land/porch/fireplace reasons
├── state.ts              # sanitizeState(): validates saved configurations
├── stage.ts              # Stage resolver: which real photo shows, and the option example beside it
├── visual-assets.json/.ts # Photo manifest with source, licence, credit, tier and caption for every image
├── renders.ts            # Phase 7 render-stack resolver (intentionally dormant until 3D renders exist)
public/models|options|lots/ # Approved WebP photos (see docs/visualization/asset-coverage.md)
scripts/asset-coverage.mjs  # `npm run assets:report`: photo coverage and gaps
docs/
├── MASTER.md             # Doc index
├── handoff-premium-experience.md # Sep 12, 2026 brief (Workstream A superseded by photo-first)
├── visualization/        # Master plan (with Sep 2026 amendments), asset pipeline + data request email, coverage report
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
6. Visuals are real photos only: no drawings, and photos are never tinted or edited. Every image goes in `lib/visual-assets.json` with source, licence and a caption that says exactly what it shows. Choices without an approved photo show just the choice.
7. Never present a price or lot as real: model and option prices are estimates and the lots are examples until Gold River supplies real data.
8. Calum reviews UI himself at the localhost link; don't send screenshots.

## Session Notes
- **Sep 14, 2026 (handoff finished, live on main 5eda7d5):** Each stage was pushed after lint, `tsc --noEmit`, build and grep checks, under Calum's standing OK.
  - **C2b labels (c5d93f1).**
    - Lots renamed to clearly labelled examples ("Example: wooded lot near Chester Basin", "Example price") with one neutral description.
    - Model prices read "Est.", and upgrades carry an "est." marker.
    - Category price ranges and marketing claims removed.
    - Row prices are now exact total differences (`priceDeltaFor`); porch plus metal roof had been about $540 low.
    - "Supreme standard" tag added; the estimate statement appears once.
    - Phone bottom padding added.
    - Focus ring fixed: `outline-color` was being transitioned, so the ring showed the text colour instead of gold.
  - **B4 review page (f997666).** The final screen is a review-and-refine page: decisions grouped by chapter, editable inline against the live stage, cost ranges, and the total shown as a range.
  - **B5 ending (5eda7d5).**
    - Named saves (`grh-saved-configs-v1`).
    - Share link `#c=v1.…` with a checksum (`lib/share.ts`); 2,000 random states round-tripped exactly and damaged links are rejected.
    - Print-stylesheet spec sheet.
    - Enquiry mailto kept under 1,800 characters (`lib/enquiry.ts`).
  - **Verification gap.** The dev server was stopped at Calum's request, so the final stage was verified by build and scripts, not in a browser. Calum will check the live site by hand.
  - **Unapproved wording.** Minor UI labels not in the approved copy doc: "Your decisions", "Keep it, share it", and the email greeting ("Hello Gold River Homes, I'd like to talk about this home configuration.").
- **Sep 12–13, 2026 (premium configurator overhaul, pushed to main b1f9432):** Worked from `docs/handoff-premium-experience.md`, with Calum deciding at each step through questions.
  - **Direction change.** Calum rejected the handoff's drawn-elevation plan ("the drawings look like a child's drawing"), so the main visual is now real photography, never tinted or edited.
  - **Photo system.** 81 approved photos with a provenance manifest (`lib/visual-assets.json`): Supreme exteriors and rooms, cropped from web sheets where needed, plus Unsplash examples for options and example lots. A resolver (`lib/stage.ts`) picks the stage photo and the captioned option example. Deleted ParametricHouse, RoomVisualizer, LotBackdrop, BaliPhotoConfigurator, option-thumbs and the siding tint.
  - **Layout and walkthrough.** Stage-as-page layout (home photo about 64% with nothing on it; decision panel beside it; phone: photo on top), display typography, named chapters with approved openers, plain question titles, and the "N of 20" counter retired. Every choice shows its price, monthly payment change and an approved Nova Scotia reason (`lib/copy.ts`, `whyItMatters`).
  - **Data truth.**
    - Model specs from Supreme web sheets: Zen CT-2 is 864 sq ft, 16×54; FB-10 and Fancy TR-2 are 3 bed, 1,184 sq ft; Bordeaux TR is single-storey 3/2, 1,724 sq ft plus garage.
    - Roof and wall areas derived from real dimensions.
    - Option menu matched to Supreme's 2026 standard spec sheets: shaker soft-close cabinets, flat trim, vinyl tile plus laminate, pendants and R-24/R-28 walls are standard. Duplicate "upgrades" removed.
    - Canadian mortgage math: semi-annual compounding, minimum down payment, CMHC.
  - **Housekeeping.** `.gitattributes` (LF), stray manifest removed, render-stack path marked dormant, project registered in project memory.
  - **Findings.**
    - Supreme's site reuses galleries: the FB-10 and Acadie pages show Bordeaux photos, and Bali's page shows a 2021 show-home gallery.
    - Supreme's images are "All rights reserved". Written permission is requested in the data-request email but not yet received.
    - Zenith CT's real photos are only 630 px, so its main photo is its spec-sheet rendering.
    - `npm run assets:report` lists 22 photo gaps.
  - **Not done.** Calum chose to push live before the final stage was built. Still outstanding: B4 (review-and-refine page), B5 (named save, share link, printable spec sheet, full mailto body) and C2b (example-lot and estimate labelling, exact porch plus metal-roof price delta). The lots still read like listings. Netlify deploy status couldn't be confirmed from here (no Netlify link on this machine and no GitHub status reported).
- **Jun 11, 2026 (Bali render demo):** Added the **Bali** (Casita Series, 3BR/2BA, 1,440 sqft, 74'×16', $219k placeholder) as the photoreal showcase model. Source: owner-provided web sheet `C:\Users\Calum\OneDrive\Desktop\AI\BALI-NEW-TEMPLATE-WEB-SHEET-EN.pdf` — its hero image is Supreme Homes' own archviz render; extracted to `public/models/bali/exterior.webp` (1923×905). New `HomeModel.demoRender` field: visualizer shows the static photoreal render (with "Photorealistic render" badge + caption of depicted options, siding/roof chips hidden) when no option-reactive render stack exists. Fallback chain: renderStack > demoRender > ParametricHouse. This is the owner-demo contrast: Bali = photoreal destination, other models = live illustration. No image-gen API key on this machine — AI "photorealization" wasn't needed since the manufacturer render IS photoreal; future option-reactive renders still follow docs/visualization/07. Same day (space/scroll pass per Calum's hint): visualizer 16/7→16/8, new `SelectionsSummary.tsx` under the price pill — clickable chips of every decision made so far, each jumps to its screen (`selectionValue()` in configure/page.tsx maps screen id → label/value/swatch; desktop only); model + lot cards compacted to horizontal list rows (thumb left, line-clamped description) so the Home and Land screens scroll far less.
- **Jun 9, 2026 (MVP polish):** Built owner-demo MVP. Photoreal infra without assets: `lib/renders.ts` + `renders-manifest.json` + `PhotoStack.tsx` (Phase 7 runtime, falls back to ParametricHouse), `isOptionAvailable`/`availableForModels` compatibility mechanism, `roomFinishMap`, visualizer Exterior/Interior mode with interior selections board, "renders in production from Supreme Homes files" footnote under visualizer. Dropped uploaded-lot photo UI (own-land = pricing only). Full Chrome UX audit + fixes: removed double header on /configure (Navbar returns null there; nav now says "Design & Price" → /configure), **price-truth fix** (`displayedOptionDelta` — per-sqft options like vertical siding/metal roof/flooring now show the real charged delta, not fake flat labels; porch toggle shows its price), SiteStep auto-cost rows now read from `siteEstimates` (were contradicting totals), "Interior shown" tags on model cards (`photoKind` field; only Zen CT-2 has an exterior photo), landing contact form now composes a real mailto (was faking "Message Sent!"), configurator state persists in localStorage. Then restructured per Calum's feedback to **one decision per screen**: flow flattened to 20 single-choice screens (`SCREENS` array in `app/configure/page.tsx`; `only` prop on Exterior/Interior/Site step components renders one section standalone), visualizer widened to 60% of the page, Next/Back buttons + "N of 20" counter, StepNav shows the 6 macro phases derived from the current screen. `state.step` is now a screen index (storage key bumped to `grh-configurator-v2`).
- **Jun 9, 2026:** Visualization overhaul. Calum rated lot photos + home render 2/10; decided (via Q&A) on hybrid strategy: live 2D parametric preview + build-time AI hero renders, $0 runtime, owner to request Supreme Homes dealer assets, room-level interior previews as the end goal. Wrote phased build plan in `docs/visualization/` (00-master-plan is the entry point — READ IT before visualization work). Built Phase 1 (`ParametricHouse.tsx` — live SVG house reacting to siding color/style, roof type/color, trim, porch, fireplace chimney, per-category silhouettes) and Phase 2a (`LotBackdrop.tsx` illustrated NS scenes; deleted Unsplash stock; `LotOption.photoUrl` now optional with `terrain` field). Verified in browser. NOTE: the 5 listed lots are placeholder data — owner must verify/replace. Same evening: Calum confirmed photoreal is the destination (he can source images of every home/finish/option) → wrote `docs/visualization/07-photoreal-pipeline.md` (3D render-stack: model per home, real product materials, batch-rendered layers, client compositing; AI editing demoted to stopgap). Uploaded-lot visualization dropped from scope — own-land stays for pricing only. First action: owner asks Supreme Homes whether 3D model files / archviz render sources exist for their catalog.
- **Apr 13, 2026:** Built full POC from scratch. Inspected supremehomes.ca for design tokens (dark #111415, gold #97764E, Playfair Display + Poppins). Created Next.js 14 + Tailwind + Recharts project. Initial build had sliders for user-input costs — Calum corrected: target audience doesn't know costs, site should TELL them. Redesigned as 6-step question-driven flow (pick home model, own land?, foundation type, well/municipal, septic/municipal, mortgage terms) with educational cost cards showing prices + ranges + explanations. Pushed to GitHub: https://github.com/Calum136/gold-river-homes. Ready for Netlify deploy.
