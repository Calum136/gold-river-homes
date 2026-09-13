# Handoff: Make the configurator feel like a high end product

Written: Sep 12, 2026. Author: Calum (via Claude, after a full read of the repo).
Read this file, then `CLAUDE.md`, then `docs/visualization/00-master-plan.md`, then `AGENTS.md`.

---

## Mission

A buyer is making a $300,000 to $450,000 decision. Right now the configurator looks and
behaves like an internal tool: a numbered 20 step form beside a cartoon drawing, with
floating debug pills over it and a disclaimer apologising for the visual. It has to feel
like the most considered thing the buyer has seen in this purchase, because for most of
them it will be the only place the whole cost is ever shown honestly.

Two complaints drive this work, both correct:

1. The visual rendering of the chosen home does not work.
2. The walkthrough of choices feels very basic.

Fix both without faking anything. Read the diagnosis below before you form your own;
it was verified against the files and will save you an hour.

---

## Verified diagnosis, do not rediscover

### Why the visual does not work

The photoreal path was fully scaffolded and never fed. Specifically:

- `lib/renders-manifest.json` is `{"models":{}}`, so `getRenderStack()` in `lib/renders.ts`
  returns `null` for every model on every call. `components/configurator/PhotoStack.tsx` is
  unreachable dead code.
- `public/renders3d/` does not exist. Neither does `scripts/render_stack.py`, which
  `lib/renders.ts` names in its header comment as the thing that writes the manifest.
- `public/` contains exactly one real photograph: `public/models/bali/exterior.webp`.
  There are no lot photos, no room photos, no finish swatches, no elevations, no floor plans.
- Only the `bali` model has a `demoRender`. So in `HomeVisualizer.tsx` the fallback chain
  (renderStack, then demoRender, then ParametricHouse) lands on `ParametricHouse` for
  eleven of the twelve models. That component is a 301 line SVG that reads as a cartoon,
  which is the 2/10 Calum rated in June.
- Of the twelve models in `lib/defaults.ts`, nine carry `photoKind: "interior"`. Their model
  card image is an interior shot standing in for an exterior. Only `bali` and `zen-ct-2` have
  exterior photos at all.
- Every non Bali `photoUrl` is hotlinked to `supremehomes.ca/wp-content/uploads/...`.
  Fragile, slow, and outside our control.
- The single worst offender: the Siding Color screen in `ExteriorStep.tsx` overlays a CSS
  colour tint on the Bali photograph. Its own subtitle promises "watch it change live," and
  what the buyer sees is a tinted photo of a different house. That screen actively damages
  trust and should be the first thing you remove.
- The disclaimer under the visualizer says photorealistic renderings "are in production."
  Nothing is in production. That sentence is untrue and is shown to customers.

**Conclusion: there is no rendering bug to debug. There is an asset vacuum plus a fallback
that looks like a placeholder.** No amount of frontend work produces photorealism from
zero assets, and you must not pretend otherwise.

### Why the walkthrough feels basic

- Twenty linear screens, one choice each, navigated by Back, a "12 of 20" counter, and Next.
  The counter is the tell: it frames the experience as a chore with a known length.
- Screens are titled like form fields: "Siding Style", "Window & Door Trim", "Insulation".
  No narrative, no stakes, no reason given to care about the choice being made.
- The stage is locked to `aspectRatio: 16/8` inside a 60% column, with `text-[10px]`
  `bg-black/60` pills floating in three corners. That is developer chrome.
- Almost all type is 10px to 13px. `Playfair Display` and `Teko` are configured in
  `app/globals.css` and barely used. The page has tokens for a premium look and spends
  them on nothing.
- Price appears as a small pill reading "Estimated Total" and a number. A buyer decides in
  monthly payments, and nothing shows how a choice moves that number.
- `SelectionsSummary` is wrapped in `hidden lg:block`, so mobile buyers get no way to review
  or revise. On a phone the flow is twenty one way screens.
- All twelve entries in `sidingColors` have `priceDelta: 0` and no `imageUrl`, so material
  choice is presented as twelve flat hex circles.
- The flow terminates in a `mailto:` link with a hardcoded subject line. A $400k
  configuration ends by opening the buyer's email client with an empty body.

---

## Non goals, do not do these

- Do not rebuild from scratch, and do not restructure what is working. The cost engine,
  the option data model, the availability mechanism and the persistence all work.
- Do not relitigate the locked decisions in `docs/visualization/00-master-plan.md`.
  In particular, asset first with illustration fallback stays the universal pattern, and
  uploaded lot visualization stays out of scope.
- Do not generate AI images of specific Supreme Homes models as the primary visual.
  The combinations explode, the output will be subtly wrong about a real product a customer
  is being sold, and that is a misrepresentation risk on a six figure purchase. The master
  plan already demoted this to a stopgap. Leave it demoted.
- Do not add three.js or any realtime 3D engine. There are no 3D models to load.
- Do not add a backend, a database, serverless functions, or any API key. Static Netlify
  and $0 runtime are hard constraints.
- Do not invent prices, lots, or availability to fill a gap. See Workstream C.

---

## Hard constraints

- Next.js **16.2.3**, React **19.2.4**, Tailwind **v4**. Note that `CLAUDE.md` still says
  "Next.js 14"; `package.json` is authoritative. Fix that line while you are in there.
- Read `AGENTS.md` and `node_modules/next/dist/docs/` before writing framework code.
  This Next.js differs from your training data.
- Tailwind v4: tokens live in `@theme inline` in `app/globals.css`. There is no
  `tailwind.config.js`. Use existing token classes and add new tokens to that block.
- Existing palette: bg `#111415`, elevated `#171D23`, gold `#97764E`, bright gold `#C4882A`,
  cream `#E8DCCC`. Fonts: Playfair Display display, Poppins body, Teko accent.
- `/calculator` must keep working.
- Client side only. Configuration persists in `localStorage` under `grh-configurator-v2`;
  bump that key if `ConfiguratorState` changes shape.
- Full keyboard operability, visible focus states, and `prefers-reduced-motion` respected.
- Must work at 400px wide. Mobile is not a second class path here; rural buyers browse on phones.

---

## What "high end" means operationally

"Make it premium" is unactionable, so here is the rubric. Judge every change against it.

1. **Restraint over decoration.** One accent, used rarely. The buyer's chosen material is
   the most saturated thing on screen; everything else is near neutral. No gradients on
   cards, no glow, no shadow on everything.
2. **Space and scale.** Large type for the decision being made, generous whitespace,
   the home large. Premium products are mostly empty space around one important thing.
3. **Material specificity.** The drawing should know how homes are built. Lap siding drawn
   at real exposure, batten spacing correct, metal roof panel seams at real width. A buyer
   who knows houses should see that the tool knows houses. This is where credibility lives.
4. **Consequence always visible.** Never show a choice without showing what it changes,
   visually and financially, in the same frame.
5. **Reasoning offered, never demanded.** The target buyer knows nothing about construction.
   Explain in one plain sentence, specific to Nova Scotia, then get out of the way.
6. **Honesty as a feature.** An obviously deliberate drawing beats a fake photograph.
   No apologies, no tints, no invented numbers.
7. **No debug chrome.** Chrome lives in one quiet place, never floating over the home.

---

## Workstream A: make the visual work, without assets

The current drawing fails because it is a cartoon, not because it is a drawing. The fix is
craft and proportion, not photorealism. Rebuild `ParametricHouse` as a **deliberate
architectural elevation**: the kind of front elevation a builder would hand a client.
Done well this reads as more premium than a stock photograph, and it is the only option
that is honest, free, instant, and reactive to every click.

Requirements:

- **Drive geometry from real dimensions.** Each model has real width and length
  (16' x 74', 15' x 65', and so on) in the catalog and `docs/business-context.md`. Draw the
  elevation to scale. A 16 by 74 mini home is long and low; a generic steep gabled house is
  a lie about the product the buyer is buying. Derive roof pitch per category, not per whim.
- **Openings at real scale.** A 3'0" entry door, windows at plausible width and head height,
  correct count and rhythm per model where known. Get the sill and header lines consistent
  across the elevation.
- **Materials as texture, not flat fill.** Horizontal lap siding drawn as actual lap lines at
  4" or 5" exposure. Board and batten as battens at real spacing. Metal roofing with standing
  seams at real panel width. Shingles with a course line. Trim as a real casing width.
  This is the single highest leverage detail in this workstream.
- **One light source.** Consistent shade on the gable return and under the eave, a soft
  grounded contact shadow. No cartoon sky, no clip art trees. The ground plane is a quiet
  horizontal, not a scene.
- **Colour from the real swatch.** Pull `swatchHex` from the selected option. Keep everything
  else in the drawing near neutral so the buyer's choice is the only colour decision on screen.
- **Annotate like a drawing.** Overall width and height dimensions in the margin, set in Teko,
  and a discreet model designation. Borrowing the document convention of the trade is what
  makes it read as authoritative rather than decorative.
- **Transitions, not snaps.** Cross fade colour and material changes over roughly 200ms.
  Honour `prefers-reduced-motion`.

Also in this workstream:

- Delete the siding colour tint hack in `ExteriorStep.tsx` entirely. Replace it with the
  live elevation.
- Stop using interior photographs as model card images. Where `photoKind` is `"interior"`,
  label it plainly or use the elevation drawing instead of the photo. Do not show an interior
  and let the buyer believe it is the exterior.
- Replace the false "in production" disclaimer with an accurate, confident one line note
  that the drawing is a scaled elevation reflecting the buyer's selections.
- Leave the `getRenderStack` and `PhotoStack` path in place and working. It is the correct
  seam for real assets later. Add a short comment stating that it is intentionally dormant
  until `renders-manifest.json` is populated, so the next reader does not think it is broken.
- Do the same treatment for `RoomVisualizer`: a drawn interior elevation or a simple
  axonometric of the room with the chosen finishes applied beats a grey box.

---

## Workstream B: rebuild the walkthrough texture

Keep the guided, one decision at a time model. It was the right instinct for a first time
buyer and it is not what makes the experience feel cheap. What makes it cheap is that
"simple" was built as "linear and bare." The premium form of simple is one beautiful
decision at a time with its consequence visible, not twenty numbered form pages.

- **The stage is the page.** The home becomes the dominant element, close to full bleed, with
  the decision presented in a panel or rail beside or over it. Not two equal columns of
  chrome. Remove all three floating pill clusters from `HomeVisualizer`.
- **Chapters, not screens.** The six phases already exist in `STEP_LABELS`. Group the twenty
  decisions under them, name each chapter for the buyer ("Your land", "Your home",
  "The outside", "The inside", "Getting it ready", "What it costs"), and give each chapter
  opening a single deliberate moment rather than another identical screen.
- **Retire the counter.** Replace "12 of 20" with the chapter name and quiet progress inside
  the chapter. Never tell the buyer how much form is left.
- **Every option states its consequence.** Price delta is already computed correctly by
  `displayedOptionDelta`; surface it on every option, and add the change in **monthly
  payment**, which is what the buyer actually decides on. Small numbers feel survivable in a
  way that a $9,000 delta does not.
- **One sentence of Nova Scotia reasoning per option.** Ice damming and roof choice, wind
  exposure on the South Shore, heating cost at a given insulation level, frost depth and
  foundation, service access under a crawlspace. `CostEstimate` already has a `whyItMatters`
  field; extend that pattern to `OptionItem` and fill it in. Keep each to one plain sentence
  a person with no construction knowledge can act on.
- **A review and refine mode.** After the guided pass, one page where every decision is
  editable in place against the live stage. `SelectionsSummary` is the seed of this: promote
  it, and remove the `hidden lg:block` so mobile buyers get it too. This is where the tool
  stops being a form.
- **A real ending.** The buyer should leave with: a named saved configuration, a printable
  one page spec sheet of every selection with the full cost breakdown, and a shareable link.
  Serialize the configuration into the URL hash so sharing needs no backend and the $0
  runtime constraint holds. The enquiry can still go out by mail, but it must carry the full
  specification in the body, not an empty email with a subject line.
- **Typography carries this.** Playfair Display at genuine display sizes for the question
  being asked, Poppins at a readable 15px to 17px for body, Teko for dimensions and figures.
  Most current type is 10px to 13px; that alone reads as a dashboard rather than a showroom.

---

## Workstream C: truth and trust

A premium product that quotes invented numbers is a liability the first time a customer
repeats one back to a salesperson.

- The five lots in `lotOptions` are fabricated placeholder data with names, acreages and
  prices across Chester Basin, Liverpool, Bridgewater, Shelburne and Yarmouth. Either
  replace them with real inventory or mark them unmistakably as illustrative examples.
  Do not leave them looking like listings.
- The Bali price of $219,000 is a placeholder and is labelled as such only in `CLAUDE.md`.
  Either source the real number or show a range with an explicit "estimate" treatment.
- Every cost figure in `lib/defaults.ts` is an estimate with a low, mid and high range.
  Show the range, not just the mid, wherever a buyer could mistake it for a quote.
- Migrate the hotlinked `supremehomes.ca` images to local files under `public/models/<id>/`
  as soon as any real asset arrives, per `docs/visualization/03-asset-pipeline.md`.
- Add a single clear statement, once, that the total is an estimate and not a quote, and
  that site conditions change it. Then stop apologising anywhere else.

---

## Workstream D: housekeeping

- `git diff lib/defaults.ts` shows 988 insertions and 988 deletions on a 988 line file.
  That is a line ending rewrite (CRLF against LF), not pending work. Confirm with
  `git diff --stat --ignore-all-space`, normalise, add a `.gitattributes` if needed, and
  commit it separately so it never masks a real change again.
- `CLAUDE.md` says Next.js 14; `package.json` says 16.2.3. Fix.
- `lib/renders-manifest.json` and the root `renders-manifest.json` both exist. Confirm which
  one `lib/renders.ts` actually imports and delete the stray.
- `scripts/render_stack.py` is referenced in `lib/renders.ts` but does not exist. Either
  write the stub with a header explaining it is Phase 7 and unblocked only by 3D sources,
  or remove the reference. Do not leave a comment pointing at a file that is not there.
- The project has a `CLAUDE.md` but is not registered in the project memory root index, so
  it is invisible to the project memory tools. Register it.

---

## Acceptance criteria

Do not report done until all of these pass, checked in a browser at both 1440px and 400px.

- [ ] Selecting any model shows a scaled elevation whose proportions match that model's real
      dimensions, and changing siding style, siding colour, roof type, roof colour, trim or
      porch visibly changes the drawing within 200ms.
- [ ] No colour tint is applied over any photograph anywhere in the app.
- [ ] No interior photograph is presented as an exterior without a label.
- [ ] No text in the UI claims renderings are in production.
- [ ] No floating pill overlays the home. All chrome sits in one region.
- [ ] Every option shows its price delta and its effect on the monthly payment.
- [ ] Every option carries one sentence of plain, Nova Scotia specific reasoning.
- [ ] Progress is expressed as named chapters. The string "of 20" appears nowhere.
- [ ] The review and refine view is reachable and works on a 400px viewport.
- [ ] The flow ends with a printable spec sheet and a shareable URL that restores the exact
      configuration in a fresh browser with empty localStorage.
- [ ] No placeholder lot or price is presented without an explicit illustrative label.
- [ ] `npm run build` and `npm run lint` both pass clean.
- [ ] No new runtime dependency, API key, serverless function, or network call at runtime.
- [ ] Keyboard only operation completes a full configuration. Focus is always visible.
- [ ] `prefers-reduced-motion: reduce` removes all transitions.

---

## Order of work

1. Workstream D housekeeping first, so the line ending noise stops hiding real diffs.
2. Workstream A. The visual is the thing the buyer judges in the first two seconds, and it
   is currently the weakest part. Get one model right end to end before doing the rest.
3. Workstream B, starting with the stage and typography, then chapters, then consequence,
   then review mode, then the ending.
4. Workstream C last, but do not skip it.

Commit per workstream with a clear message. Verify in the browser (dev config in
`.claude/launch.json`, port 3001) rather than assuming.

## If you get blocked

Stop and say so rather than inventing a workaround. The likely blockers are all asset or
data questions that only the business can answer: real lot inventory, the factory option
price list, real model photography, and whether Supreme Homes holds 3D model files. The
asset request email is already written in `docs/visualization/03-asset-pipeline.md` and has
never been sent. Note in your summary if your work is waiting on it.

## When you finish

Update `CLAUDE.md` Session Notes with what changed and why, update the Status column in
`docs/visualization/00-master-plan.md`, and add this file to the `docs/MASTER.md` index.
