# Bali 3D walkthrough: build notes (Nov 6, 2026)

Branch `feat/bali-3d`. One working model, the Supreme Bali, as Calum asked. Every other model keeps the photo stage.

## What the buyer sees

1. Picking the Bali turns the stage into Supreme's floor plan, drawn as a printed sheet (black ink on paper, room names and sizes, title block).
2. Next, or the arrow at the right of the picture, raises the walls out of the drawing. Real materials sweep outward from the front door, and the camera swoops down to the front of the house on its lot.
3. Every screen after that has its own camera stop framing what that decision changes. Moving between stops is one eased flight that walks through doorways, not walls: out the front door, along the hall, through the laundry to Bedroom 1. The house stands on 20 ft of lawn against a plain light grey backdrop.
4. View buttons along the bottom of the stage work like Google Maps preset angles: Aerial, Front, Back, Dollhouse (roof off), Top down, and a Rooms menu listing nine rooms in order along the house. Dragging looks around (indoors it turns the head; outdoors it orbits the house).
5. Prices are off the screen until the final page. The per-choice price, the monthly change and the running total all wait for the review page, which shows every figure with its estimate label.

## Every choice changes the scene

| Screen | What changes, live |
|---|---|
| Land | The yard around the house: number of trees, lawn or leafy forest floor |
| Model | The plan sheet |
| Siding style | Siding profile: 7" horizontal lap, 8" vertical board, wide board and batten (drawn in code, so direction really changes) |
| Siding colour | Siding colour |
| Roof | Asphalt shingles or standing-seam metal, in the chosen metal colour |
| Porch | Open landing, covered porch (24' x 6', posts, rails, shed roof), and on the Bali an enclosed vestibule with a steep shake gable |
| Window and door trim | Exterior casing: flat, craftsman (wide, corner blocks, cap) or colonial (stepped, cap, apron) |
| Flooring | Living areas, kitchen and dining, bedrooms and halls: laminate or engineered hardwood (baths, laundry, pantry and entry stay vinyl tile) |
| Countertops | Kitchen island and run, bathroom vanities: laminate or quartz |
| Cabinets | Painted shaker or solid wood shaker with crown moulding |
| Wall colour | Wall paint |
| Interior trim | Baseboards and casings: flat, colonial (stepped, capped) or craftsman (corner and plinth blocks) |
| Lighting | The scene turns to evening; standard pendants and drum shade, or premium ring chandelier, entry fixture, pot lights and under-cabinet LEDs |
| Hardware | Pulls, faucet and door levers: brushed nickel, matte black, aged bronze |
| Fireplace | Stone feature wall with linear fireplace, mantel and TV, or a TV over a media console |
| Insulation | A cutaway in Bedroom 3's front wall: batts, batts plus rigid foam board, or spray foam plus batts |
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
| `components/bali3d/engine.ts` | Renderer, lighting from the outdoor light image, the plain backdrop, the reveal, camera flights, input, live updates |
| `components/bali3d/BaliStage.tsx` | React wrapper, view buttons, Rooms menu, step arrows, WebGL fallback to the photo stage |
| `components/bali3d/landscape.ts` | The front garden, drawn in code and instanced |
| `components/bali3d/details.ts` | Room detail shown only when the camera is in or beside the room |
| `components/configurator/ui/PriceVisibility.tsx` | Hides prices during the flow, shows them on the final page |

To put another model in 3D: trace its plan into a `plan.ts`-style file, add its id to `MODELS_IN_3D` in `app/configure/page.tsx`, and check the camera stops.

## Assets and licences

- Textures and the outdoor light image: CC0 from Poly Haven and ambientCG, listed in `public/3d/ASSETS.json`.
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

## Round 3 (Calum testing in his own browser)

| Feedback | Change |
|---|---|
| Crawlspace looked like a half basement | The foundation now sets the ground level: slab 1'-3" below the floor (low house), crawlspace 3'-3" (house lifted on a vented concrete wall, shallow footings with frost insulation), basement 2' (window wells, deep walls). Entry steps, lot, garden, services and the sky's ground all follow it. In the see-through view a crawlspace's front wall opens to show the space under the house |
| Remove the dining set | Table, chairs and vase removed (models deleted from `public/3d/models`) |
| Grass acts strangely on the water and septic screens | The dithered see-through lawn shimmered. It now fades smoothly over a soil backdrop |
| Nicer front landscaping, without free assets | `landscape.ts` draws the garden in code: curved mulch beds with paver edging, river rock at the drip line, rounded evergreens, white and blue hydrangeas, lavender, ornamental grasses, two small red maples, topiary planters at the steps, path lights (lit at evening). Instanced, so a few draw calls; it lays itself out around the landing, porch or vestibule |
| Door blocks the bedroom view; bathroom door covers the vanity | Doors can hinge at either end (`hinge` in `plan.ts`); both bathroom doors now swing clear of their vanities. The bedroom and bathroom views moved so open doors sit beside the camera |
| Kitchen floor is laminate or hardwood too | The flooring choice now covers the kitchen and dining room; tile stays in the baths, laundry, pantry and entry. Supreme's spec wording in `lib/defaults.ts` still says vinyl tile in the kitchen: to settle with Matt |
| Render detail based on what's in view | `details.ts`: bathrooms get a shower curtain, shower head and spout, toilet seat, lid and tank lid, paper roll, vanity light, soap, towel bar and towel, bath mat. Bedrooms get art and a throw, the kitchen a fruit bowl and utensil crock. Each room's detail shows only when the camera is in or beside it; Dollhouse and Top down keep the simple shapes |
| Zoom in Top down and Dollhouse | Wheel zooms toward the cursor; drag turns; Shift-drag or right-drag pans |
| Arrows instead of scroll | The wheel no longer moves steps. Faint arrows at the stage edges (full strength on hover) step back and forward |
| Three demo disclaimers | One line under the stage: "Illustrative 3D model of Supreme's Bali floor plan." |
| What does Tour do? | It returned to the current step's view from a preset. Replaced by "← Back to [step]", shown only while a preset view is open |

## Round 4 (Calum testing in his own browser)

| Feedback | Change |
|---|---|
| White ring around the properties | The plan sheet's paper reveal stopped at 70 m, so distant ground still drew as paper. Once the reveal finishes, nothing draws as paper |
| Insulation view blocked | Lot trees and maples kept out of the cutaway's line of sight (`CUTAWAY_CLEAR` in `landscape.ts`) |
| Wall disconnected at the utility closet (flooring step) | The wall behind the coat closet now runs the full width of the HRV and water heater closet |
| Siding pokes through on the living room wall | Where an exterior wall ends inside the house, that end now carries drywall, not siding |
| Odd lighting above and below windows | Thin wall pieces (over and under openings) now take the same indoor lighting as full walls |
| Zig-zag "straight lines", looks low resolution | The post-processing chain had lost anti-aliasing. It now renders into a 4x multisampled buffer, so baseboards and floor edges are smooth |
| Big black ball | The premium entry light was drawn as a solid black sphere. It is now a frosted glass globe on a metal cap |
| Views of all major rooms | A Rooms menu beside the view buttons: Kitchen, Living room, Main bedroom, Main bath, Bedroom 2, Bedroom 3, Bathroom, Laundry, Pantry. The laundry, pantry and ensuite doors are pocket doors, so no open leaf blocks those views |
| Basement stairs | Left as is: the basement option draws stairs under the hall. To check with Matt whether the Bali offers a basement and where its stairs go |
| No fog; backdrop over-scaled; about 10 ft around the house, then a to-scale backdrop ring | No fog. The yard is an oval about 10 to 15 ft clear of the house (`LOT` in `site.ts`), with the well, septic and street lines brought inside it. At its edge a scenery ring carries the sky image, projected from eye height at the yard's centre so its trees stand in proportion to the house. The yard sits on a soil base like an architect's model: a thin plinth in normal views, deepening to 20 ft (inside faces only, so nothing hides the pipes) when the ground turns see-through. Lot trees stand off the ends and back corners, clear of the well, septic tank, leach field and the Back view, and step aside on the underground steps |

## Round 5 (before the demo to Matt, Nov 6, 2026)

Calum asked for every screen checked from every angle, the sky and scenery removed, 20 ft of grass, no dirt base, smoother camera moves, and the rooms in order.

| Feedback | Change |
|---|---|
| Remove both sky boxes, plain grey or white | The sky dome and the scenery ring are gone. The backdrop is a plain light grey on a sphere that follows the camera (tone mapped like the rest of the scene, so it reads the same with or without the occlusion pass, and dims for the evening lighting step). The outdoor light image still lights the house and sets the sun, but is never shown |
| Grass to 20 ft | The lawn is the house's outline grown by 20 ft all round, with rounded corners (`LOT_OUTLINE` and `LAWN_FT` in `site.ts`). The walk, street lines and trees follow it |
| Remove the dirt circle | The soil base is gone. Buried pieces are still cut away just under the lawn, so nothing hangs below its edge. On the three underground steps the backdrop below the horizon turns a darker neutral grey (no earth colour), so pipes and footings read under the see-through lawn |
| Every screen pretty | Eye-level cameras now stand on or just off the lawn so grass fills the bottom of the frame; the far views (land, roof, summary, Back) are high enough to show the whole yard. The trim step looks at Bedroom 3's window, which no porch post covers. The porch step stands back far enough to show the porch roof. Ceilings get a soft daytime glow (they read dark grey before). The garden beds step aside on the underground steps, so the foundation view sees under the house. A municipal sewer gets its own camera view (the street line is at the front), and the camera glides between the two when the choice changes |
| Smooth the transition zooms | Every move is one eased flight (a quintic curve: no jolt at either end, peak speed under twice the average), timed by distance and by how far the view turns. A click during a flight carries on at the camera's speed instead of stopping dead. Flights start from the view as shown, so a dragged view no longer snaps back first. A jump across several steps skips the effects of the steps in between (no flash of evening light or see-through ground on the way). The roof and ceilings fade off on the way to Dollhouse and Top down, and back on when leaving, instead of popping |
| Rooms from one end to the other | The Rooms menu runs along the house: Main bath, Main bedroom, Laundry, Pantry, Kitchen, Living room, Bedroom 2, Bathroom, Bedroom 3. Going down the list, each move is a few metres |
| Inside steps going out and back in | The insulation step now comes after the fireplace, so the inside chapter ends indoors and the camera walks out the front door once, to the insulation cutaway, then on to the foundation |

## Known gaps

- **Page weight.** About 70 MB loads the first time the Bali opens (textures about 33 MB, outdoor light image 7 MB, furniture 12 MB, and the pine model alone 22 MB). Compressing textures (KTX2) and meshes (Draco) would cut this a lot before a public launch.
- **Phones.** On phones it runs at a lower quality (no ambient occlusion, smaller shadows).
- **Basement.** Whether the Bali offers a basement, and where its stairs go, is to check with Matt.
- **Kitchen flooring.** Supreme's spec wording still says vinyl tile in the kitchen; the model follows Calum's call (the flooring choice covers it). To settle with Matt.
- **Finishes are representative.** Colours and materials are representative, not exact Supreme products; the stage says so.
- **Some furniture is vintage.** The stools are vintage-style CC0 models; beds and the TV are drawn in code.
- **Plan accuracy.** Traced at about 21.8 px per foot, so positions are within a few inches.
