# Gold River Homes: context brief for the 3D walkthrough (Nov 6, 2026)

Sources: five Gold River sessions (Jun 7 research, Jun 9-22 visualizer and /loop, Sep 12-18 premium configurator, Nov 6 current), repo docs, CLAUDE.md. Obsidian has no Gold River page and Brain\Corrections never mentions it. "Interest saved box formula" and the Fraser Pharmacy sessions are unrelated. Quotes are Calum's words as written.

## (a) Timeline
- **Apr 12-13.** POC cost and mortgage calculator, Next.js + Tailwind v4 + Recharts, dark/gold theme from supremehomes.ca (043b20b, d87fffe). Calum corrected sliders: the site must tell buyers what a well or septic costs.
- **Jun 7-9.** Research pass, then real Supreme catalog and visual configurator (4f8b6ac). Calum: options "working great", visuals "2/10".
- **Jun 9-10.** Visualization plan in docs/visualization (00 to 07). Parametric SVG house and illustrated lots (044802f), owner-demo MVP (05764c9), one decision per screen with a 60% visual (9f7c80b).
- **Jun 10-22.** Bali photoreal demo (d1ad11d). /loop goal: two real examples per decision. Calum: "Not quite what i wanted. I want that bali home photo, to then have vertical siding, red siding, metal roof, etc.".
- **Sep 12-13.** Premium handoff. Drawings and compositing deleted; 81 approved photos with a provenance manifest (304979b); photo-first system (2e2ed7b); stage layout (68d4f01); named chapters (d89ef0e); price, monthly delta and reason on every choice (13fecb0); real specs and Canadian mortgage math (d639835); option menu matched to Supreme 2026 spec (de6aa87). Pushed to main b1f9432 on Sep 13 ("Looks a million percent better").
- **Sep 14.** Example and estimate labels (c5d93f1), review-and-refine page (f997666), named saves, share link, print spec sheet, enquiry email (5eda7d5). Live on main; notes in 6091ec1.
- **Sep 15.** The owner (Matt) "loves it"; his biggest concern is accurate pricing. Calum drafted an email with ten pricing and data questions.
- **Nov 6.** New 3D walkthrough direction, built on branch `feat/bali-3d` (see `01-build-notes.md`).

## (b) Standing decisions and rules
- **Target user.** First-time buyer who knows nothing about site costs, making a $300k to $450k decision. Explain, do not ask (Apr 13). When Calum must decide, explain options plainly (Sep 12: "Explain those options so i can decide").
- **Drawings out (Sep 12).** "The drawings (cartoons) look like a childs drawing, if the image we show isnt photo real then it will never show someone 'hey this is what you coul be buying'."
- **Photos only (Sep 12-13).** Never edited, tinted or overlaid. Gaps filled with free-licence stock, captioned as examples. A choice with no honest photo shows just the choice.
- **Photoreal is the destination (Jun 10).** "i want this to be photo real". Docs 07 plans a 3D render stack: one 3D model per home, real product materials, locked camera, Blender batch layers, client compositing, $0 runtime. Mesh surfaces and materials are named by option ID. First action was to ask Supreme for 3D or archviz sources.
- **Pricing display.** Every choice shows price, monthly payment change and an approved Nova Scotia reason, with exact total deltas (`priceDeltaFor`). Model and option prices are "Est."; lots are "Example"; totals are ranges; one estimate statement. Never present a price or lot as real (CLAUDE.md rule 7). Low/mid/high NS ranges.
- **Layout.** One decision per screen; home big with nothing on it, panel beside; named chapters.
- **Process.** Dark/gold supremehomes.ca look, Sleek, executive, trustworthy. Calum reviews by link himself: "skip screenshots, just give me the link" (Sep 13). Use subagents and ask questions before launching them. Push each stage after lint, tsc and build pass (Sep 14).

## (c) Rejected approaches
- **Sliders for costs** (Apr 13): buyers cannot guess costs.
- **Parametric SVG house and illustrated lots** (built Jun 9, retired Sep 12): read as a child's drawing.
- **Recolour, groove and porch overlays on the Bali photo** (Jun 22, retired Sep 12): fail the no-tint rule and are not exact renders.
- **AI image editing as the main route** (docs 04): geometry drift; stopgap only.
- **Trusting Supreme galleries:** the FB-10 and Acadie pages show Bordeaux photos, and Bali's page a 2021 show home.

## (d) Owner and Supreme data status
Nothing real has arrived. On Sep 12 Calum answered "None of these soon" about lots, prices and the option list. Still waiting:
- **Matt:** base price per model, what it includes, site cost ranges by county, HST and rebates, delivery pricing, Supreme option price list and markup, real lots, who keeps prices current.
- **Supreme (via Matt):** written photo permission (images are "All rights reserved"), 3D or render sources, factory option list with prices, swatches. 22 photo gaps (`npm run assets:report`).
- **Calum:** manual pass on the live site (400 px, keyboard only, print, share link). Photo permission must be confirmed before a real launch.

## (e) Open questions
- Did the Sep 16 owner meeting settle pricing ownership or Phase 2 scope? Not recorded anywhere.
- Does Matt know the walkthrough departs from the photo-first version he approved?
- Which Bali plan source is used: the web sheet PDF (`C:\Users\Calum\OneDrive\Desktop\AI\BALI-NEW-TEMPLATE-WEB-SHEET-EN.pdf`) or a plan Calum attaches? Merlot is the alternate (MERLOT-EN.pdf on supremehomes.ca).
- May derived 3D geometry of Supreme's plans and its product finishes be shown without Supreme's permission?
- Generic materials or real product SKUs? Which options react in the scene (countertop, siding, roof, vestibule)?

## (f) What bears on the new direction
- **The Sep "real photos only" rule is superseded for the Bali** by Calum's Nov 6 direction: scroll-driven 3D floor-plan walkthrough (plan sheet, walls rise, camera walks through), options changing the scene live, a small amount of property around the house for exterior changes, pricing moved to the final page. His words: "zoomed into the balis kitchen and selecting a new counter top changes the counter top showing in the render"; "Prices are all shown at the end rather than right away"; one working model only; Q3 "scroll based tour as shown, or google maps style preset view angles". References: the tripo3d scroll-driven floor-plan walkthrough page, and the casa-larga GitHub repo to parse.
- **Still binding elsewhere:** photo-first stage, manifest and approved copy for the other ten models.
- **Rules that carry over.** Nothing presented as real that is not: label the scene an illustrative model of Supreme's plan, not an exact render, until Supreme confirms. Docs 06 says never draw fake floor plans, so derive geometry from the real Bali sheet. Estimates and example lots stay labelled.
- **Pricing at the end** drops the per-row price and monthly delta shown during choices (each choice keeps its one-sentence reason). Keep the review page, share link, saves, print sheet and enquiry email, and keep the total computed in the background. The owner's top concern is price accuracy, so the final page must keep every estimate label.
- **Reuse.** `lib/pricing.ts`, `lib/state.ts`, `lib/share.ts`, `lib/enquiry.ts`, `lib/copy.ts` and defaults are model-agnostic. Doc 07's rule that material name equals option ID fits a three.js scene. Live WebGL replaces doc 07's pre-rendered layers, so $0 runtime holds, but assets ship in the static bundle.
- **Risk.** Calum rejects anything amateur; scene fidelity must clearly beat the drawings or it repeats the Sep 12 rejection. Verify by link with Calum, since the last Sep stage was never browser-checked.
