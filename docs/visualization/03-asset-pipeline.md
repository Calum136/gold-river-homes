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

Email for the owner to send to their Supreme Homes dealer rep — per model carried
(Zen CT-2, Zenith CT, FB-10, Fancy TR-2, Acadie CT, Sauvignon CT-2, Acadie CR, Porto,
Windsor CT, Bordeaux TR):

> We're building an online configurator for our customers and need dealer marketing
> assets for the models we carry. Could you send us, for each model:
> 1. **Floor plan drawing** (PDF or image, with room labels and dimensions)
> 2. **Front elevation drawing or rendering** (the straight-on exterior view)
> 3. **Exterior photos** — front-facing, full house in frame, highest resolution available
> 4. **Interior photos** — kitchen, living room, primary bath, primary bedroom
> 5. **Finish/options catalog** — available siding profiles & colors, roofing colors,
>    cabinet door styles & colors, countertop options, flooring options, with product
>    photos or swatches
> 6. Confirmation we're licensed to use these on our website
>
> Web resolution is fine (1600px+). PDFs welcome — we can extract what we need.

Also worth asking: do they have a **factory options/price list** for the option deltas
currently guessed in `lib/pricing.ts` `PRICING_SHEET`? Real numbers would fix pricing
accuracy in the same shipment.

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
- [ ] Assets stored under the layout above, named by ID, WebP-compressed.
- [ ] No more hotlinks to supremehomes.ca anywhere in `defaults.ts`.
- [ ] Option arrays reconciled against the real factory options catalog.
- [ ] `OptionItem.imageUrl` rendered by swatch/tile components where provided.
