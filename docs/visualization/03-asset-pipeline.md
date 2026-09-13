# Phase 3 — Manufacturer Asset Pipeline

Status: 📋 Spec ready. **Blocked on a human step: the owner emails Supreme Homes.**
Start this immediately — every later phase improves with real assets.

## Why

Gold River Homes is an **authorized Supreme Homes retailer**. Retailers can normally get
dealer marketing kits: floor plans, elevation drawings, spec sheets, finish/swatch
catalogs, and professional photography. These are the highest-quality, zero-cost,
fully-licensed visual foundation we can possibly have. Everything in Phases 4–6 gets
dramatically better with them.

## The request (ready to send)

Plain-language email for the owner to send to their Supreme Homes dealer rep — per
model carried (Zen CT-2, Zenith CT, FB-10, Fancy TR-2, Acadie CT, Sauvignon CT-2,
Acadie CR, Porto, Windsor CT, Bordeaux TR):

> Hi [rep name],
>
> We're building an online configurator for our customers and want to make sure we're
> using your materials properly and showing buyers accurate, up-to-date information. A
> few things would help a lot:
>
> 1. **Written permission to use your photos and renderings.** Your website marks
>    images "All rights reserved" — could you confirm in writing that we're allowed to
>    use Supreme's model photos and renderings in our website configurator?
>
> 2. **Current photos and floor plans for each model.** For each model we carry, could
>    you send a high-resolution front exterior photo or rendering, interior photos
>    (kitchen, living room, primary bath, primary bedroom), and the floor plan? A few of
>    your own model pages look out of date — the FB-10, Acadie CT and Acadie CR pages
>    currently show Bordeaux photos, and the Bali page shows an older 2021 gallery — so
>    if you have newer photos for those specific models, we'd love to use them instead.
>
> 3. **The factory options list with prices**, showing which siding profiles and
>    colours, roof options (including metal), and cabinet, countertop, flooring, trim,
>    lighting and insulation upgrades are offered on each model.
>
> 4. **Photos or swatches of each option**, so our buyers can see what they're picking
>    before they order.
>
> 5. **Confirmation of the current Bordeaux TR specs.** Your live page links a 2015
>    spec sheet showing a single-storey 3 bed / 2 bath home, 1,724 sq ft, plus a garage
>    — can you confirm that's still accurate, or send the current sheet if it's changed
>    since then?
>
> 6. **Whether 3D model files or architectural render sources exist** for any of these
>    models — that would help us build a more realistic configurator down the road.
>
> Web resolution is fine (1600px+) for photos, and PDFs are welcome for specs and
> options — we can extract what we need. Happy to hop on a call if that's easier.
>
> Thanks so much!

### From Gold River (not Supreme)

Information Gold River needs to gather itself — the dealer rep won't have this:

- Current lot inventory (the lots in `lib/defaults.ts` are placeholders pending
  Calum's real inventory).
- Retail base price for each model.
- Which upgrades Gold River itself sells on top of Supreme's factory options, and
  their prices.
- Whether Gold River paints modular home walls on site, or leaves that to the buyer
  (Supreme's 2026 spec sheets show modular home walls leave the factory primed only).
- A short two-sentence permission request template to send past customers, asking to
  use photos of their delivered homes:

  > We loved building your home and would love to feature a photo of it on our website
  > and in our configurator. Would you be comfortable with us using one or two photos,
  > with no personal details shown?

## Directory layout (create as assets arrive)

```
public/
├── lots/                  <lot-id>.webp                      (Phase 2)
├── models/
│   └── <model-id>/
│       ├── exterior.webp          front-facing hero photo
│       ├── elevation.webp         front elevation drawing (Phase 4 AI reference)
│       ├── plan.webp              floor plan (Phase 6)
│       └── rooms/
│           ├── kitchen.webp
│           ├── living.webp
│           ├── bath.webp
│           └── bedroom.webp       (Phase 5)
├── swatches/
│   ├── siding/<option-id>.webp    real product swatch per sidingColors id
│   ├── counters/<option-id>.webp
│   ├── cabinets/<option-id>.webp
│   └── flooring/<option-id>.webp
└── renders/                        (Phase 4 output — see 04-ai-render-library.md)
```

**Naming rule: file names are option/model IDs from `defaults.ts`, exactly.** That's
what lets components resolve assets by convention with zero mapping tables.

## Processing checklist (per incoming asset)

1. Convert to WebP, quality ~80 (`npx sharp-cli -i in.jpg -o out.webp -q 80` or squoosh).
2. Resize: hero/exterior ≤ 1920px wide; room photos ≤ 1600px; swatches 320px square;
   plans ≤ 2000px wide (text must stay legible).
3. Strip EXIF. Target < 250 KB per file (plans may exceed).
4. Place per the layout above; commit. Netlify serves `/public` statically — done.

## Data wiring as assets land

- Model exterior photos: replace the current `supremehomes.ca` hotlinked `photoUrl`s
  in `defaults.ts` with local `/models/<id>/exterior.webp`. **Hotlinking the
  manufacturer's WordPress uploads is fragile (they can rename/delete) and slow —
  migrating to local files is a required step of this phase.**
- Swatches: set `imageUrl: "/swatches/siding/<id>.webp"` on `OptionItem`s. The
  `ColorSwatch`/`OptionTile` components should prefer `imageUrl` over `swatchHex`
  when present (small component change, build it when the first real swatch lands).
- Real options from the catalog that we don't currently offer (e.g. specific Gentek
  siding colors): update the `sidingColors` array to match reality — the configurator
  must only offer combinations Supreme actually builds.

## Acceptance criteria

- [ ] Request email sent by owner (log the date in project CLAUDE.md Session Notes).
- [ ] Written permission to use Supreme's model photos/renderings received before any
      of their images are used in the live configurator.
- [ ] Assets stored under the layout above, named by ID, WebP-compressed.
- [ ] No more hotlinks to supremehomes.ca anywhere in `defaults.ts`.
- [ ] Option arrays reconciled against the real factory options catalog.
- [ ] `OptionItem.imageUrl` rendered by swatch/tile components where provided.
