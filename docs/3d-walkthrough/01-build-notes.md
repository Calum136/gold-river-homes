# Bali 3D walkthrough: build notes (Nov 6, 2026)

Branch `feat/bali-3d`. One working model, the Supreme Bali, as Calum asked. Every other model keeps the photo stage.

## What the buyer sees

1. Picking the Bali turns the stage into Supreme's floor plan, drawn as a printed sheet (black ink on paper, room names and sizes, title block).
2. Next, or scrolling over the plan on desktop, raises the walls out of the drawing. Real materials sweep outward from the front door, and the camera swoops down to the front of the house on its lot.
3. Every screen after that has its own camera stop framing what that decision changes. Moving between stops walks through doorways, not walls: out the front door, along the hall, through the laundry to Bedroom 1.
4. View buttons along the bottom of the stage work like Google Maps preset angles: Tour, Aerial, Front, Back, Dollhouse (roof off), Top down, Kitchen, Living, Bedroom, Bathroom. Dragging looks around (indoors it turns the head; outdoors it orbits the house).
5. Prices are off the screen until the final page. The per-choice price, the monthly change and the running total all wait for the review page, which shows every figure with its estimate label.

## Every choice changes the scene

| Screen | What changes, live |
|---|---|
| Land | Lot around the house: tree count, lawn or leafy forest floor, boulders, gravel or paved drive |
| Model | The plan sheet |
| Siding style | Siding profile: 7" horizontal lap, 8" vertical board, wide board and batten (drawn in code, so direction really changes) |
| Siding colour | Siding colour |
| Roof | Asphalt shingles or standing-seam metal, in the chosen metal colour |
| Porch | Open landing, covered porch (24' x 6', posts, rails, shed roof), and on the Bali an enclosed vestibule with a steep shake gable |
| Window and door trim | Exterior casing: flat, craftsman (wide, corner blocks, cap) or colonial (stepped, cap, apron) |
| Flooring | Living areas, bedrooms and halls: laminate or engineered hardwood (kitchen, dining and baths stay vinyl tile, per Supreme's standard) |
| Countertops | Kitchen island and run, bathroom vanities: laminate or quartz |
| Cabinets | Painted shaker or solid wood shaker with crown moulding |
| Wall colour | Wall paint |
| Interior trim | Baseboards and casings: flat, colonial (stepped, capped) or craftsman (corner and plinth blocks) |
| Lighting | The scene turns to evening; standard pendants and drum shade, or premium ring chandelier, entry fixture, pot lights and under-cabinet LEDs |
| Hardware | Pulls, faucet and door levers: brushed nickel, matte black, aged bronze |
| Insulation | A cutaway in Bedroom 3's front wall: batts, batts plus rigid foam board, or spray foam plus batts |
| Fireplace | Stone feature wall with linear fireplace, mantel and TV, or a TV over a media console |
| Foundation | The lawn turns see-through: crawlspace walls and piers, slab with frost wings, or full basement with window wells |
| Water | See-through: drilled well casing, dug well crock, or a line from the street main |
| Wastewater | See-through: septic tank, distribution box and leach field (with its mound), or a sewer lateral to the street |
| Review | Hero view of the finished house; on the review page the camera follows the decision open for editing |

## Where the code is

| File | Job |
|---|---|
| `components/bali3d/plan.ts` | The Bali plan traced from Supreme's sheet, in feet: walls with every window and door, rooms, floor zones |
| `components/bali3d/house.ts` | Walls, trim, doors, roof, entry options, kitchen, furniture, fixtures, fireplace wall, plan labels |
| `components/bali3d/site.ts` | Lot, trees and furniture placements, foundation, utilities, insulation cutaway |
| `components/bali3d/materials.ts` | One material per surface; options change them in place; the ink (plan sheet) shader |
| `components/bali3d/textures.ts` | Scanned textures plus drawn siding, metal and shingle profiles |
| `components/bali3d/camera.ts` | Camera stops per screen, view presets, routes through doorways |
| `components/bali3d/engine.ts` | Renderer, lighting from the sky image, the reveal, input, live updates |
| `components/bali3d/BaliStage.tsx` | React wrapper, view buttons, scroll hint, WebGL fallback to the photo stage |
| `components/configurator/ui/PriceVisibility.tsx` | Hides prices during the flow, shows them on the final page |

To put another model in 3D: trace its plan into a `plan.ts`-style file, add its id to `MODELS_IN_3D` in `app/configure/page.tsx`, and check the camera stops.

## Assets and licences

- Textures and the sky image: CC0 from Poly Haven and ambientCG, listed in `public/3d/ASSETS.json`.
- Furniture, trees and shrubs: CC0 Poly Haven models, listed in `public/3d/models/MODELS.json`.
- The reference repo (`Sam1983Aing/casa-larga`) has no licence, so none of its code was copied. Only the ideas were reimplemented: plan and building as one model, walls rising, the ink-to-material sweep.
- The geometry is derived from Supreme's published Bali plan. Supreme's permission to show their plans and photos is still part of the owner's data request.

## New option: enclosed entry vestibule

- Offered on the porch screen, Bali only (`VESTIBULE_MODELS` in `lib/defaults.ts`).
- Estimate $14,000 (range $9,000 to $20,000), a placeholder until Gold River prices it.
- It flows through pricing, saves, share links (`vb`), the review page and the spec sheet.
- Its reason sentences in `lib/copy.ts` are not yet in the approved copy doc.

## Round 2 (after Calum's first review, 8/10)

| Feedback | Change |
|---|---|
| Laggy | Trees were 142,000 triangles each (about 1.9 million on a wooded lot). Lot trees are now baked once into cut-out textures and drawn as one instanced mesh: per-frame triangles went from about 1 million to under 200,000. Occlusion runs at half resolution, room lights cut from 7 to 3, shadow map 2048, lot plants and door leaves cast no shadows, pixel ratio steps down if frames run slow, and hidden option prices are no longer calculated |
| Flashing | Overlapping coplanar faces removed: walls are cut back where they meet another wall and butted ends get no end face; casings stand prouder than baseboards; floor tile, driveway, walk and beds carry a depth offset; railings are single beams; doubled porch, vestibule, tub and ridge pieces fixed; the depth range is tighter |
| Scrolling needs two goes and snaps | The camera follows the wheel continuously. One notch is enough: when the wheel rests, the camera glides on to the next stop in the direction you scrolled. The panel switches as the tour passes halfway |
| Panel and picture feel separate | A gold marker is pinned in the scene on what each screen changes (`components/bali3d/guide.ts`). A "Now choosing" chip sits on the stage, and a line in the panel says where to look. Changed surfaces glow gold for a second when a choice is made |
| Brown mounds | The rock shapes are removed. The septic field is a lower, wider rise in the lawn, and wooded lots use a greener leaf-litter tint |
| Cabinet colours | New `cabinetColorId`: White (standard), Dove Grey, Sage Green, Navy, Charcoal (est. +$800 each), plus Natural Oak and Espresso stains with Solid Wood Shaker. It flows through state, share link (`cc`), pricing, review and spec sheet |
| (found while testing) | Two cost lines both read "Premium". Upgrade lines now name their group, for example "Insulation: Premium" |

## Known gaps

- **Page weight.** About 70 MB loads the first time the Bali opens (textures about 33 MB, sky 7 MB, furniture 12 MB, and the pine model alone 22 MB). Compressing textures (KTX2) and meshes (Draco) would cut this a lot before a public launch.
- **Phones.** On phones it runs at a lower quality (no ambient occlusion, smaller shadows). Scrolling drives the tour only on desktop; phones use Next and Back.
- **Sky.** The sky image is a forest edge, so every lot reads as wooded at the horizon.
- **Finishes are representative.** Colours and materials are representative, not exact Supreme products; the stage says so.
- **Some furniture is vintage.** The dining table and stools are vintage-style CC0 models; beds and the TV are drawn in code.
- **Plan accuracy.** Traced at about 21.8 px per foot, so positions are within a few inches.
